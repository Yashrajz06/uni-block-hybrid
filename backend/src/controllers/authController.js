const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const securityService = require('../services/securityService');

const register = async (req, res) => {
  try {
    const { email, password, role, ...profileData } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = new User({ email, password, role });
    await user.save();

    // Create role-specific profile
    let profile;
    if (role === 'student') {
      // Validate required fields for student
      if (!profileData.studentId || !profileData.firstName || !profileData.lastName || !profileData.department || !profileData.program) {
        // Delete user if profile creation fails
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ 
          error: 'Missing required fields: studentId, firstName, lastName, department, program' 
        });
      }
      profile = new Student({ 
        userId: user._id, 
        studentId: profileData.studentId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : new Date('2000-01-01'),
        enrollmentDate: profileData.enrollmentDate ? new Date(profileData.enrollmentDate) : new Date(),
        department: profileData.department,
        program: profileData.program,
        currentSemester: profileData.currentSemester || 1,
        cgpa: profileData.cgpa || 0
      });
      await profile.save();
    } else if (role === 'faculty') {
      // Validate required fields for faculty
      if (!profileData.facultyId || !profileData.firstName || !profileData.lastName || !profileData.department) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ 
          error: 'Missing required fields: facultyId, firstName, lastName, department' 
        });
      }
      profile = new Faculty({ 
        userId: user._id,
        facultyId: profileData.facultyId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        department: profileData.department,
        designation: profileData.designation || 'Professor',
        courses: []
      });
      await profile.save();
    } else if (role === 'admin') {
      // Validate required fields for admin
      if (!profileData.adminId || !profileData.firstName || !profileData.lastName) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ 
          error: 'Missing required fields: adminId, firstName, lastName' 
        });
      }
      profile = new Admin({ 
        userId: user._id,
        adminId: profileData.adminId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        department: profileData.department || 'Administration',
        permissions: profileData.permissions || [
          'issue_certificate',
          'approve_transcript',
          'manage_users',
          'view_audit',
          'manage_research'
        ]
      });
      await profile.save();
    }

    // Generate token
    const token = securityService.generateToken({ userId: user._id, role: user.role });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const token = securityService.generateToken({ userId: user._id, role: user.role });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id });
    } else if (user.role === 'faculty') {
      profile = await Faculty.findOne({ userId: user._id });
    } else if (user.role === 'admin') {
      profile = await Admin.findOne({ userId: user._id });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress
      },
      profile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile
};

