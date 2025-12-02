const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/StudentChain');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function () {
  console.log('Connected to MongoDB');
  
  const Transcript = require('./src/models/Transcript');
  
  const transcripts = await Transcript.find().limit(5);
  console.log('Recent transcripts:');
  transcripts.forEach(t => {
    console.log(`  ID: ${t.requestId}, Status: ${t.status}, StudentID: ${t.studentId}`);
  });
  
  process.exit(0);
});
