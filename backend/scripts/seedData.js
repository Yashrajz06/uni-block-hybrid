const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Faculty = require('../src/models/Faculty');
const Admin = require('../src/models/Admin');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (optional)
    // await User.deleteMany({});
    // await Student.deleteMany({});
    // await Faculty.deleteMany({});
    // await Admin.deleteMany({});

    // Create Sample Student
    const studentUser = new User({
      email: 'student@university.edu',
      password: 'password123',
      role: 'student',
      walletAddress: '0x1234567890123456789012345678901234567890'
    });
    await studentUser.save();

    const student = new Student({
      userId: studentUser._id,
      studentId: 'STU001',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('2000-01-15'),
      enrollmentDate: new Date('2020-09-01'),
      department: 'Computer Science',
      program: 'B.Tech',
      currentSemester: 4,
      cgpa: 8.5
    });
    await student.save();

    // Create Sample Faculty
    const facultyUser = new User({
      email: 'faculty@university.edu',
      password: 'password123',
      role: 'faculty',
      walletAddress: '0x2345678901234567890123456789012345678901'
    });
    await facultyUser.save();

    const faculty = new Faculty({
      userId: facultyUser._id,
      facultyId: 'FAC001',
      firstName: 'Jane',
      lastName: 'Smith',
      department: 'Computer Science',
      designation: 'Professor',
      courses: [
        {
          courseCode: 'CS101',
          courseName: 'Introduction to Computer Science',
          semester: 1,
          year: 2024
        }
      ]
    });
    await faculty.save();

    // Create Sample Admin
    const adminUser = new User({
      email: 'admin@university.edu',
      password: 'password123',
      role: 'admin',
      walletAddress: '0x3456789012345678901234567890123456789012'
    });
    await adminUser.save();

    const admin = new Admin({
      userId: adminUser._id,
      adminId: 'ADM001',
      firstName: 'Admin',
      lastName: 'User',
      department: 'Administration',
      permissions: [
        'issue_certificate',
        'approve_transcript',
        'manage_users',
        'view_audit',
        'manage_research'
      ]
    });
    await admin.save();

    console.log('Sample data seeded successfully!');
    console.log('\nTest Accounts:');
    console.log('Student: student@university.edu / password123');
    console.log('Faculty: faculty@university.edu / password123');
    console.log('Admin: admin@university.edu / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();


