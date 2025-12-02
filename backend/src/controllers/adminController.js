const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Certificate = require('../models/Certificate');
const Transcript = require('../models/Transcript');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { contracts, hashData, toBytes32 } = require('../config/blockchain');
const ipfsService = require('../services/ipfsService');
const qrService = require('../services/qrService');
const securityService = require('../services/securityService');
const AccessLog = require('../models/AccessLog');

const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.userId });
    if (!admin) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPendingTranscripts = async (req, res) => {
  try {
    const transcripts = await Transcript.find({ status: { $in: ['pending', 'approved'] } })
      .populate('studentId', 'studentId firstName lastName department program cgpa')
      .populate('requestedBy', 'email')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 });

    res.json(transcripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStudentCourses = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({ studentId });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // In a real system, you'd fetch courses from the database
    // For now, return sample course structure
    res.json({
      studentId: student.studentId,
      courses: [] // This would be populated from a Course/Grade model
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const issueCertificate = async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.userId });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const { studentId, type, title, description } = req.body;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const certificateId = `CERT-${Date.now()}-${studentId}`;

    // Create certificate data
    const certificateData = {
      certificateId,
      studentId: student.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      type,
      title,
      description,
      issuedDate: new Date().toISOString(),
      department: student.department,
      program: student.program
    };

    // Upload to IPFS
    let ipfsHash = null;
    try {
      const ipfsResult = await ipfsService.uploadJSON(certificateData);
      ipfsHash = ipfsResult.hash;
    } catch (error) {
      console.error('IPFS upload error:', error);
      // Continue even if IPFS fails
    }

    // Generate hash
    const certificateHash = securityService.hashSHA256(certificateData);
    let blsSignature = '';
    try {
      blsSignature = securityService.generateBLSSignature(certificateData, process.env.PRIVATE_KEY || '');
    } catch (error) {
      console.warn('BLS signature generation failed:', error.message);
    }

    // Generate QR code
    const qrData = await qrService.generateCertificateQR(certificateId, certificateHash, ipfsHash || '');

    // Create certificate record
    const certificate = new Certificate({
      studentId: student._id,
      certificateId,
      type,
      title,
      description,
      issuedBy: req.userId,
      ipfsHash,
      blockchainHash: certificateHash,
      qrCode: qrData.qrCode,
      blsSignature: blsSignature.toString ? blsSignature.toString('hex') : ''
    });
    await certificate.save();

    // Notify student user
    if (student.userId) {
      await Notification.create({
        userId: student.userId,
        title: 'New certificate issued',
        message: `A new ${type} certificate (${certificateId}) has been issued to you.`,
        type: 'certificate',
        metadata: { certificateId }
      });
    }

    // Store on blockchain
    const { wallet } = require('../config/blockchain');
    if (contracts.certificate && wallet) {
      try {
        const ipfsBytes32 = ipfsHash ? toBytes32(ipfsHash) : '0x0000000000000000000000000000000000000000000000000000000000000000';
        const sigBytes = blsSignature ? Buffer.from(blsSignature, 'hex') : Buffer.from('');
        await contracts.certificate.issueCertificate(
          certificateId,
          student.studentId,
          type,
          title,
          description || '',
          toBytes32(certificateHash),
          ipfsBytes32,
          sigBytes
        );
      } catch (error) {
        console.error('Blockchain transaction error:', error);
      }
    }

    // Also store in CredentialManager
    if (contracts.credentialManager && wallet) {
      try {
        const ipfsBytes32 = ipfsHash ? toBytes32(ipfsHash) : '0x0000000000000000000000000000000000000000000000000000000000000000';
        const sigBytes = blsSignature ? Buffer.from(blsSignature, 'hex') : Buffer.from('');
        await contracts.credentialManager.issueCredential(
          certificateId,
          student.studentId,
          type,
          toBytes32(certificateHash),
          ipfsBytes32,
          sigBytes
        );
      } catch (error) {
        console.error('CredentialManager transaction error:', error);
      }
    }

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const issueTranscript = async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.userId });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const { requestId, courses } = req.body;

    const transcript = await Transcript.findOne({ requestId });
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript request not found' });
    }

    if (transcript.status !== 'approved') {
      return res.status(400).json({ error: 'Transcript must be approved first' });
    }

    const student = await Student.findById(transcript.studentId);

    // Update transcript with courses
    transcript.courses = courses || [];
    transcript.status = 'issued';
    transcript.issuedAt = new Date();

    // Create transcript data
    const transcriptData = {
      requestId,
      studentId: student.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      department: student.department,
      program: student.program,
      courses: courses || [],
      cgpa: transcript.cgpa || student.cgpa,
      issuedAt: transcript.issuedAt.toISOString()
    };

    // Upload to IPFS
    let ipfsHash = null;
    try {
      const ipfsResult = await ipfsService.uploadJSON(transcriptData);
      ipfsHash = ipfsResult.hash;
      console.log('Transcript uploaded to IPFS:', ipfsHash);
    } catch (error) {
      console.warn('IPFS upload failed (optional):', error.message);
      // Continue without IPFS - the system still works with just blockchain storage
      // In production, you'd want IPFS running for complete decentralization
    }

    // Generate hash
    const transcriptHash = securityService.hashSHA256(transcriptData);

    // Generate QR code
    const qrData = await qrService.generateTranscriptQR(requestId, transcriptHash, ipfsHash || '');

    transcript.ipfsHash = ipfsHash;
    transcript.blockchainHash = transcriptHash;
    transcript.qrCode = qrData.qrCode;
    await transcript.save();

    // Notify requesting user
    if (transcript.requestedBy) {
      await Notification.create({
        userId: transcript.requestedBy,
        title: 'Transcript issued',
        message: `Your transcript request ${requestId} has been issued.`,
        type: 'transcript',
        metadata: { requestId }
      });
    }

    // Store on blockchain
    const { wallet, provider } = require('../config/blockchain');
    if (contracts.transcriptManager && wallet) {
      try {
        const ipfsBytes32 = ipfsHash ? toBytes32(ipfsHash) : '0x0000000000000000000000000000000000000000000000000000000000000000';
        console.log(`[Admin Issue] About to issue transcript with ID: "${requestId}"`);
        console.log(`[Admin Issue] Transcript hash: ${toBytes32(transcriptHash)}`);
        console.log(`[Admin Issue] IPFS hash: ${ipfsBytes32}`);
        
        const tx = await contracts.transcriptManager.issueTranscript(
          requestId,
          toBytes32(transcriptHash),
          ipfsBytes32
        );
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log('Transcript issued on blockchain:', requestId);
      } catch (error) {
        console.error('Blockchain transaction error:', error);
      }
    }

    res.json({
      message: 'Transcript issued successfully',
      transcript
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AccessLog.find()
      .populate('accessedBy', 'email role')
      .sort({ timestamp: -1 })
      .limit(500);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const manageUsers = async (req, res) => {
  try {
    const { action, userId } = req.body;

    // Implementation for user management
    res.json({ message: 'User management action completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAnalyticsOverview = async (req, res) => {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalAdmins,
      totalTranscripts,
      totalCertificates,
      transcriptStatusAgg,
      userGrowthAgg
    ] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Admin.countDocuments(),
      Transcript.countDocuments(),
      Certificate.countDocuments(),
      Transcript.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      (async () => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        return User.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
      })()
    ]);

    const transcriptStatus = transcriptStatusAgg.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const userGrowth = userGrowthAgg.map(item => ({
      year: item._id.year,
      month: item._id.month,
      count: item.count
    }));

    res.json({
      totalStudents,
      totalFaculty,
      totalAdmins,
      totalTranscripts,
      totalCertificates,
      transcriptStatus,
      userGrowth
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVerificationStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 29);

    const [todayCount, dailyAgg] = await Promise.all([
      AccessLog.countDocuments({
        accessType: 'verify',
        timestamp: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      }),
      AccessLog.aggregate([
        {
          $match: {
            accessType: 'verify',
            timestamp: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])
    ]);

    const daily = dailyAgg.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      count: item.count
    }));

    res.json({
      today: todayCount,
      last30Days: daily
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  getPendingTranscripts,
  getStudentCourses,
  issueCertificate,
  issueTranscript,
  getAuditLogs,
  manageUsers,
  getAnalyticsOverview,
  getVerificationStats
};
