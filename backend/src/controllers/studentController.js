const Student = require('../models/Student');
const Transcript = require('../models/Transcript');
const Certificate = require('../models/Certificate');
const AccessLog = require('../models/AccessLog');
const Notification = require('../models/Notification');
const { contracts, hashData, toBytes32 } = require('../config/blockchain');
const ipfsService = require('../services/ipfsService');
const qrService = require('../services/qrService');
const securityService = require('../services/securityService');

const getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) {
      const User = require('../models/User');
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(404).json({ 
        error: 'Student profile not found',
        details: 'Your user account exists but student profile is missing. Please contact administrator.'
      });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAcademicHistory = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get transcripts
    const transcripts = await Transcript.find({ studentId: student._id });

    // Get certificates
    const certificates = await Certificate.find({ studentId: student._id });

    res.json({
      student,
      transcripts,
      certificates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const requestTranscript = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) {
      // Try to get user to provide better error
      const User = require('../models/User');
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(404).json({ 
        error: 'Student profile not found. Please complete your profile registration.',
        details: 'Your user account exists but student profile is missing. Please contact administrator.'
      });
    }

    const requestId = `TRX-${Date.now()}-${student.studentId}`;

    // Create transcript request
    const transcriptRequest = new Transcript({
      studentId: student._id,
      requestId,
      status: 'pending',
      requestedBy: req.userId,
      cgpa: student.cgpa
    });
    await transcriptRequest.save();

    // Store on blockchain
    if (contracts.transcriptManager) {
      try {
        console.log(`[Student Request] Creating request on blockchain with ID: "${requestId}"`);
        const tx = await contracts.transcriptManager.requestTranscript(requestId, student.studentId);
        await tx.wait();
        console.log(`[Student Request] Request created on blockchain: ${requestId}`);
      } catch (error) {
        console.error('Blockchain transaction error:', error);
      }
    }

    // Log access
    await AccessLog.create({
      resourceType: 'transcript',
      resourceId: transcriptRequest._id,
      accessedBy: req.userId,
      accessType: 'view',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Notification for student
    await Notification.create({
      userId: req.userId,
      title: 'Transcript request submitted',
      message: `Your transcript request ${requestId} has been created and is pending approval.`,
      type: 'transcript',
      metadata: { requestId }
    });

    res.status(201).json({
      message: 'Transcript request created',
      transcriptRequest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTranscripts = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const transcripts = await Transcript.find({ studentId: student._id })
      .sort({ createdAt: -1 });

    res.json(transcripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCertificates = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const certificates = await Certificate.find({ studentId: student._id })
      .sort({ issuedDate: -1 });

    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const downloadCredential = async (req, res) => {
  try {
    const { type, id } = req.params;
    const student = await Student.findOne({ userId: req.userId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    let credential;
    if (type === 'transcript') {
      credential = await Transcript.findOne({ requestId: id, studentId: student._id });
    } else if (type === 'certificate') {
      credential = await Certificate.findOne({ certificateId: id, studentId: student._id });
    } else {
      return res.status(400).json({ error: 'Invalid credential type' });
    }

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Generate QR code if not exists
    if (!credential.qrCode) {
      const qrData = await qrService.generateQRCode({
        type,
        id: credential.requestId || credential.certificateId,
        hash: credential.blockchainHash
      });
      credential.qrCode = qrData.qrCode;
      await credential.save();
    }

    // Retrieve from IPFS
    let document = null;
    if (credential.ipfsHash) {
      try {
        document = await ipfsService.retrieveFile(credential.ipfsHash);
      } catch (error) {
        console.error('IPFS retrieval error:', error);
      }
    }

    res.json({
      credential,
      document: document ? document.toString('base64') : null,
      qrCode: credential.qrCode
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const grantAccess = async (req, res) => {
  try {
    const { resourceType, resourceId, verifierId } = req.body;
    const student = await Student.findOne({ userId: req.userId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    let resource;
    if (resourceType === 'transcript') {
      resource = await Transcript.findOne({ _id: resourceId, studentId: student._id });
    } else if (resourceType === 'certificate') {
      resource = await Certificate.findOne({ _id: resourceId, studentId: student._id });
    } else {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Add to access list
    resource.accessList.push({
      verifierId,
      grantedAt: new Date(),
      isActive: true
    });
    await resource.save();

    res.json({ message: 'Access granted successfully', resource });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const revokeAccess = async (req, res) => {
  try {
    const { resourceType, resourceId, verifierId } = req.body;
    const student = await Student.findOne({ userId: req.userId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    let resource;
    if (resourceType === 'transcript') {
      resource = await Transcript.findOne({ _id: resourceId, studentId: student._id });
    } else if (resourceType === 'certificate') {
      resource = await Certificate.findOne({ _id: resourceId, studentId: student._id });
    } else {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Revoke access
    const accessEntry = resource.accessList.find(
      access => access.verifierId === verifierId && access.isActive
    );
    if (accessEntry) {
      accessEntry.isActive = false;
      accessEntry.revokedAt = new Date();
      await resource.save();
    }

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  getAcademicHistory,
  requestTranscript,
  getTranscripts,
  getCertificates,
  downloadCredential,
  grantAccess,
  revokeAccess
};
