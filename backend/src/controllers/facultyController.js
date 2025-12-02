const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Transcript = require('../models/Transcript');
const Notification = require('../models/Notification');
const { contracts, hashData, toBytes32 } = require('../config/blockchain');
const AccessLog = require('../models/AccessLog');

const getProfile = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.userId });
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty profile not found' });
    }
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPendingTranscripts = async (req, res) => {
  try {
    const transcripts = await Transcript.find({ status: 'pending' })
      .populate('studentId', 'studentId firstName lastName department program')
      .populate('requestedBy', 'email')
      .sort({ createdAt: -1 });

    res.json(transcripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadGrade = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.userId });
    if (!faculty) {
      const User = require('../models/User');
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(404).json({ 
        error: 'Faculty profile not found. Please complete your profile registration.',
        details: 'Your user account exists but faculty profile is missing. Please contact administrator.'
      });
    }

    const { studentId, courseCode, courseName, letterGrade, credits, semester, year } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ 
        error: `Student with ID "${studentId}" not found`,
        details: 'Please verify the student ID is correct. The student must be registered in the system.'
      });
    }

    // Create grade data
    const gradeData = {
      studentId,
      courseCode,
      courseName,
      letterGrade,
      credits,
      semester,
      year
    };

    const gradeHash = hashData(gradeData);
    const gradeId = `GRD-${Date.now()}-${studentId}-${courseCode}`;

    // Store on blockchain
    if (contracts.facultyRecord) {
      try {
        await contracts.facultyRecord.uploadGrade(
          gradeId,
          studentId,
          courseCode,
          courseName,
          letterGrade,
          credits,
          semester,
          year,
          toBytes32(gradeHash)
        );
      } catch (error) {
        console.error('Blockchain transaction error:', error);
      }
    }

    // Log access
    await AccessLog.create({
      resourceType: 'record',
      resourceId: student._id,
      accessedBy: req.userId,
      accessType: 'view',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      message: 'Grade uploaded successfully',
      gradeId,
      gradeHash
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadCourse = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.userId });
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    const { courseCode, courseName, semester, year } = req.body;

    const courseData = {
      courseCode,
      courseName,
      facultyId: faculty.facultyId,
      semester,
      year
    };

    const courseHash = hashData(courseData);

    // Store on blockchain
    if (contracts.facultyRecord) {
      try {
        await contracts.facultyRecord.uploadCourse(
          courseCode,
          courseName,
          faculty.facultyId,
          semester,
          year,
          toBytes32(courseHash)
        );
      } catch (error) {
        console.error('Blockchain transaction error:', error);
      }
    }

    // Update faculty courses
    faculty.courses.push({ courseCode, courseName, semester, year });
    await faculty.save();

    res.status(201).json({
      message: 'Course uploaded successfully',
      courseCode,
      courseHash
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const approveTranscript = async (req, res) => {
  try {
    const { requestId } = req.params;

    const transcript = await Transcript.findOne({ requestId });
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript request not found' });
    }

    if (transcript.status !== 'pending') {
      return res.status(400).json({ error: 'Transcript request is not pending' });
    }

    transcript.status = 'approved';
    transcript.approvedBy = req.userId;
    transcript.approvedAt = new Date();
    await transcript.save();

    // Notify requesting student user
    if (transcript.requestedBy) {
      await Notification.create({
        userId: transcript.requestedBy,
        title: 'Transcript request approved',
        message: `Your transcript request ${requestId} has been approved by faculty.`,
        type: 'transcript',
        metadata: { requestId }
      });
    }

    // Update on blockchain
    if (contracts.transcriptManager) {
      try {
        const tx = await contracts.transcriptManager.approveTranscript(requestId);
        // Wait for transaction to be mined
        await tx.wait();
        console.log('Transcript approved on blockchain:', requestId);
      } catch (error) {
        console.error('Blockchain transaction error:', error);
      }
    }

    res.json({ message: 'Transcript approved successfully', transcript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectTranscript = async (req, res) => {
  try {
    const { requestId } = req.params;

    const transcript = await Transcript.findOne({ requestId });
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript request not found' });
    }

    if (transcript.status !== 'pending') {
      return res.status(400).json({ error: 'Transcript request is not pending' });
    }

    transcript.status = 'rejected';
    transcript.approvedBy = req.userId;
    transcript.approvedAt = new Date();
    await transcript.save();

    res.json({ message: 'Transcript rejected successfully', transcript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AccessLog.find()
      .populate('accessedBy', 'email role')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  getPendingTranscripts,
  uploadGrade,
  uploadCourse,
  approveTranscript,
  rejectTranscript,
  getAuditLogs
};
