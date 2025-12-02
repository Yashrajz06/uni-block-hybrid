#!/usr/bin/env node

/**
 * Test script to simulate complete transcript workflow:
 * 1. Create user and student
 * 2. Student requests transcript
 * 3. Faculty approves
 * 4. Admin issues
 * 5. Verify
 */

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Faculty = require('../src/models/Faculty');
const Admin = require('../src/models/Admin');
const Transcript = require('../src/models/Transcript');

mongoose.connect('mongodb://localhost:27017/StudentChain');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function () {
  try {
    console.log('Creating test data...\n');

    // 1. Create users
    console.log('1. Creating users...');
    const studentUser = await User.create({
      email: 'student@test.com',
      password: 'hashed_password',
      role: 'student',
      isVerified: true
    });
    console.log(`   ✓ Student user: ${studentUser._id}`);

    const facultyUser = await User.create({
      email: 'faculty@test.com',
      password: 'hashed_password',
      role: 'faculty',
      isVerified: true
    });
    console.log(`   ✓ Faculty user: ${facultyUser._id}`);

    const adminUser = await User.create({
      email: 'admin@test.com',
      password: 'hashed_password',
      role: 'admin',
      isVerified: true
    });
    console.log(`   ✓ Admin user: ${adminUser._id}`);

    // 2. Create student profile
    console.log('\n2. Creating student profile...');
    const student = await Student.create({
      userId: studentUser._id,
      studentId: 'STU-0001',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('2002-05-15'),
      department: 'Computer Science',
      program: 'BS Computer Science',
      cgpa: 3.8,
      enrollmentDate: new Date('2021-09-01')
    });
    console.log(`   ✓ Student created: ${student._id}`);

    // 3. Create faculty profile
    console.log('\n3. Creating faculty profile...');
    const faculty = await Faculty.create({
      userId: facultyUser._id,
      facultyId: 'FAC-0001',
      firstName: 'Dr.',
      lastName: 'Smith',
      department: 'Computer Science',
      designation: 'Associate Professor'
    });
    console.log(`   ✓ Faculty created: ${faculty._id}`);

    // 4. Create admin profile
    console.log('\n4. Creating admin profile...');
    const admin = await Admin.create({
      userId: adminUser._id,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      department: 'Administration'
    });
    console.log(`   ✓ Admin created: ${admin._id}`);

    // 5. Student requests transcript
    console.log('\n5. Student requesting transcript...');
    const requestId = `TRX-${Date.now()}-${student.studentId}`;
    const transcript = await Transcript.create({
      studentId: student._id,
      requestId: requestId,
      status: 'pending',
      requestedBy: studentUser._id,
      cgpa: student.cgpa
    });
    console.log(`   ✓ Transcript request created: ${requestId}`);
    console.log(`   Status: ${transcript.status}`);

    // 6. Faculty approves
    console.log('\n6. Faculty approving transcript...');
    transcript.status = 'approved';
    transcript.approvedBy = facultyUser._id;
    transcript.approvalDate = new Date();
    await transcript.save();
    console.log(`   ✓ Transcript approved`);
    console.log(`   Status: ${transcript.status}`);

    // 7. Admin issues
    console.log('\n7. Admin issuing transcript...');
    transcript.status = 'issued';
    transcript.issuedAt = new Date();
    transcript.courses = [
      { code: 'CS101', title: 'Intro to CS', grade: 'A', credits: 3 },
      { code: 'CS201', title: 'Data Structures', grade: 'A+', credits: 3 },
      { code: 'CS301', title: 'Algorithms', grade: 'A', credits: 3 }
    ];
    transcript.blockchainHash = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
    transcript.ipfsHash = 'QmZqmckk6LypgnJi2wA618zt6y2HbLyVm2C6VcZmFCXDQ8';
    transcript.qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANS...';
    await transcript.save();
    console.log(`   ✓ Transcript issued`);
    console.log(`   Status: ${transcript.status}`);

    console.log('\n✅ Complete workflow test data created successfully!\n');
    console.log('Test IDs:');
    console.log(`  Student User ID: ${studentUser._id}`);
    console.log(`  Student ID: ${student.studentId}`);
    console.log(`  Transcript Request ID: ${requestId}`);
    console.log('\nYou can now:');
    console.log('  1. Log in as student@test.com (password: test) to see the transcript');
    console.log('  2. Use the verify portal to verify transcript by ID');
    console.log(`  3. Search for: transcript-${requestId}`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
});
