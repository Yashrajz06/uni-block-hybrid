const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Faculty = require('../src/models/Faculty');
const Admin = require('../src/models/Admin');
const Transcript = require('../src/models/Transcript');
const Certificate = require('../src/models/Certificate');
const AccessLog = require('../src/models/AccessLog');

const NUM_STUDENTS = 50;
const NUM_FACULTY = 10;
const NUM_ADMINS = 3;

const DEPARTMENTS = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'];
const PROGRAMS = ['B.Tech', 'B.Sc', 'M.Tech', 'M.Sc'];
const CERT_TYPES = ['degree', 'diploma', 'certificate', 'achievement'];
const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'F'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateInLastMonths(monthsBack = 6) {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - monthsBack);
  const time = randomInt(past.getTime(), now.getTime());
  return new Date(time);
}

async function clearDemoData() {
  console.log('Clearing existing demo data (users, profiles, credentials, logs)...');

  // Only remove accounts we know are demo/test based on email pattern
  const demoEmails = [/^demo\./i, /@university\.edu$/i];

  const demoUsers = await User.find({
    email: { $in: [
      'student@university.edu',
      'faculty@university.edu',
      'admin@university.edu',
      'demo.student@university.edu',
      'demo.faculty@university.edu',
      'demo.admin@university.edu'
    ] }
  });

  const demoUserIds = demoUsers.map(u => u._id);

  await Promise.all([
    Student.deleteMany({ userId: { $in: demoUserIds } }),
    Faculty.deleteMany({ userId: { $in: demoUserIds } }),
    Admin.deleteMany({ userId: { $in: demoUserIds } }),
    Transcript.deleteMany({ requestedBy: { $in: demoUserIds } }),
    Certificate.deleteMany({ issuedBy: { $in: demoUserIds } }),
    AccessLog.deleteMany({ accessedBy: { $in: demoUserIds } })
  ]);

  await User.deleteMany({ _id: { $in: demoUserIds } });

  console.log('Existing demo data cleared.');
}

async function createDemoAdmins() {
  const admins = [];

  for (let i = 0; i < NUM_ADMINS; i++) {
    const email = i === 0 ? 'demo.admin@university.edu' : `demo.admin${i + 1}@university.edu`;
    const user = new User({
      email,
      password: 'Demo@2024',
      role: 'admin',
      walletAddress: `0xADMIN${(i + 1).toString().padStart(4, '0')}`
    });
    await user.save();

    const admin = new Admin({
      userId: user._id,
      adminId: `ADM-${i + 1}`.padStart(7, '0'),
      firstName: 'Demo',
      lastName: `Admin${i + 1}`,
      department: 'Administration',
      permissions: ['issue_certificate', 'approve_transcript', 'manage_users', 'view_audit']
    });
    await admin.save();

    admins.push({ user, admin });
  }

  console.log(`Created ${admins.length} demo admins.`);
  return admins;
}

async function createDemoFaculty() {
  const facultyMembers = [];

  for (let i = 0; i < NUM_FACULTY; i++) {
    const email = i === 0 ? 'demo.faculty@university.edu' : `demo.faculty${i + 1}@university.edu`;
    const user = new User({
      email,
      password: 'Demo@2024',
      role: 'faculty',
      walletAddress: `0xFACULTY${(i + 1).toString().padStart(4, '0')}`
    });
    await user.save();

    const department = randomItem(DEPARTMENTS);
    const faculty = new Faculty({
      userId: user._id,
      facultyId: `FAC-${i + 1}`.padStart(7, '0'),
      firstName: 'Demo',
      lastName: `Faculty${i + 1}`,
      department,
      designation: 'Professor',
      courses: [
        {
          courseCode: `CS10${(i % 5) + 1}`,
          courseName: `Course ${(i % 5) + 1}`,
          semester: (i % 8) + 1,
          year: 2024
        }
      ]
    });
    await faculty.save();

    facultyMembers.push({ user, faculty });
  }

  console.log(`Created ${facultyMembers.length} demo faculty.`);
  return facultyMembers;
}

async function createDemoStudents() {
  const students = [];

  for (let i = 0; i < NUM_STUDENTS; i++) {
    const email = i === 0 ? 'demo.student@university.edu' : `demo.student${i + 1}@university.edu`;
    const user = new User({
      email,
      password: 'Demo@2024',
      role: 'student',
      walletAddress: `0xSTUDENT${(i + 1).toString().padStart(4, '0')}`
    });
    await user.save();

    const department = randomItem(DEPARTMENTS);
    const program = randomItem(PROGRAMS);
    const enrollmentYear = randomInt(2019, 2024);
    const currentSemester = randomInt(1, 8);
    const cgpa = parseFloat((6 + Math.random() * 3.5).toFixed(2));

    const student = new Student({
      userId: user._id,
      studentId: `STU-${(i + 1).toString().padStart(4, '0')}`,
      firstName: 'Demo',
      lastName: `Student${i + 1}`,
      dateOfBirth: new Date(`${randomInt(1997, 2004)}-${randomInt(1, 12)}-${randomInt(1, 28)}`),
      enrollmentDate: new Date(`${enrollmentYear}-09-01`),
      department,
      program,
      currentSemester,
      cgpa
    });
    await student.save();

    students.push({ user, student });
  }

  console.log(`Created ${students.length} demo students.`);
  return students;
}

function generateCoursesForTranscript() {
  const numCourses = randomInt(4, 8);
  const courses = [];
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < numCourses; i++) {
    const semester = randomInt(1, 8);
    courses.push({
      courseCode: `CS${randomInt(100, 499)}`,
      courseName: `Course ${i + 1}`,
      credits: randomInt(2, 4),
      grade: randomItem(GRADES),
      semester,
      year: currentYear - randomInt(0, 3)
    });
  }

  return courses;
}

async function createDemoTranscripts(students, admins) {
  const statuses = ['approved', 'pending', 'rejected', 'issued'];
  const transcripts = [];

  for (const { user, student } of students) {
    const numTranscripts = randomInt(1, 3);

    for (let i = 0; i < numTranscripts; i++) {
      const status = randomItem(statuses);
      const createdAt = randomDateInLastMonths(6);
      const issuedAt = ['approved', 'issued'].includes(status) ? randomDateInLastMonths(6) : null;
      const courses = generateCoursesForTranscript();
      const cgpa = student.cgpa;
      const approvedByUser = randomItem(admins).user;

      const transcript = new Transcript({
        studentId: student._id,
        requestId: `TRX-${student.studentId}-${i + 1}`,
        status,
        requestedBy: user._id,
        approvedBy: ['approved', 'issued'].includes(status) ? approvedByUser._id : null,
        courses,
        cgpa,
        ipfsHash: null,
        blockchainHash: null,
        blockchainTxHash: null,
        qrCode: null,
        accessList: [],
        createdAt,
        updatedAt: createdAt,
        issuedAt
      });

      await transcript.save();
      transcripts.push(transcript);
    }
  }

  console.log(`Created ${transcripts.length} demo transcripts.`);
  return transcripts;
}

async function createDemoCertificates(students, admins) {
  const certificates = [];

  for (const { student } of students) {
    const numCertificates = randomInt(0, 2);
    for (let i = 0; i < numCertificates; i++) {
      const type = randomItem(CERT_TYPES);
      const issuedByUser = randomItem(admins).user;
      const issuedDate = randomDateInLastMonths(6);

      const cert = new Certificate({
        studentId: student._id,
        certificateId: `CERT-${student.studentId}-${i + 1}`,
        type,
        title: `${type.toUpperCase()} in ${student.program}`,
        description: `Demo ${type} credential for ${student.firstName} ${student.lastName}`,
        issuedBy: issuedByUser._id,
        issuedDate,
        ipfsHash: null,
        blockchainHash: null,
        blockchainTxHash: null,
        qrCode: null,
        accessList: [],
        isRevoked: false,
        revokedAt: null
      });

      await cert.save();
      certificates.push(cert);
    }
  }

  console.log(`Created ${certificates.length} demo certificates.`);
  return certificates;
}

async function createDemoAccessLogs(transcripts, certificates, verifiers) {
  const logs = [];
  const allResources = [
    ...transcripts.map(t => ({ type: 'transcript', id: t._id })),
    ...certificates.map(c => ({ type: 'certificate', id: c._id }))
  ];

  const accessTypes = ['view', 'download', 'verify', 'grant'];

  if (allResources.length === 0) {
    console.log('No resources to create access logs for.');
    return logs;
  }

  const numLogs = Math.min(200, allResources.length * 4);

  for (let i = 0; i < numLogs; i++) {
    const resource = randomItem(allResources);
    const accessedByUser = randomItem(verifiers).user;

    const log = new AccessLog({
      resourceType: resource.type,
      resourceId: resource.id,
      accessedBy: accessedByUser._id,
      accessType: randomItem(accessTypes),
      ipAddress: `192.168.0.${randomInt(1, 254)}`,
      userAgent: 'DemoVerifier/1.0',
      timestamp: randomDateInLastMonths(6),
      success: true,
      reason: null
    });

    await log.save();
    logs.push(log);
  }

  console.log(`Created ${logs.length} demo access logs.`);
  return logs;
}

async function createDemoVerifiers() {
  const verifiers = [];

  for (let i = 0; i < 5; i++) {
    const email = i === 0 ? 'demo.verifier@university.edu' : `demo.verifier${i + 1}@university.edu`;
    const user = new User({
      email,
      password: 'Demo@2024',
      role: 'verifier',
      walletAddress: null
    });
    await user.save();
    verifiers.push({ user });
  }

  console.log(`Created ${verifiers.length} demo verifiers.`);
  return verifiers;
}

async function generateDemoData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await clearDemoData();

    const admins = await createDemoAdmins();
    const faculty = await createDemoFaculty();
    const students = await createDemoStudents();
    const verifiers = await createDemoVerifiers();

    const transcripts = await createDemoTranscripts(students, admins);
    const certificates = await createDemoCertificates(students, admins);
    await createDemoAccessLogs(transcripts, certificates, verifiers);

    console.log('\n✅ Demo data generated successfully.');
    console.log('\nDemo Accounts:');
    console.log('Student: demo.student@university.edu / Demo@2024');
    console.log('Faculty: demo.faculty@university.edu / Demo@2024');
    console.log('Admin:   demo.admin@university.edu / Demo@2024');
    console.log('Verifier: demo.verifier@university.edu / Demo@2024');

    process.exit(0);
  } catch (err) {
    console.error('Error generating demo data:', err);
    process.exit(1);
  }
}

generateDemoData();
