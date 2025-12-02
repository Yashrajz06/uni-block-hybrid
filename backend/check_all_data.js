const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/StudentChain');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function () {
  console.log('Connected to MongoDB');
  
  const Transcript = require('./src/models/Transcript');
  const Student = require('./src/models/Student');
  const User = require('./src/models/User');
  
  const transcriptCount = await Transcript.countDocuments();
  const studentCount = await Student.countDocuments();
  const userCount = await User.countDocuments();
  
  console.log(`\nDatabase counts:`);
  console.log(`  Users: ${userCount}`);
  console.log(`  Students: ${studentCount}`);
  console.log(`  Transcripts: ${transcriptCount}`);
  
  if (transcriptCount > 0) {
    const transcripts = await Transcript.find().sort({ createdAt: -1 }).limit(5);
    console.log('\nRecent transcripts:');
    transcripts.forEach(t => {
      console.log(`  ID: ${t.requestId}, Status: ${t.status}, StudentID: ${t.studentId}`);
    });
  } else {
    console.log('\nNo transcripts found');
  }
  
  process.exit(0);
});
