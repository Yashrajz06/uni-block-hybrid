const mongoose = require('mongoose');
const Transcript = require('./src/models/Transcript');

mongoose.connect('mongodb://localhost:27017/university_blockchain');

const db = mongoose.connection;
db.once('open', async function () {
  try {
    const count = await Transcript.countDocuments();
    console.log(`Transcripts in university_blockchain: ${count}`);
    
    if (count > 0) {
      const transcript = await Transcript.findOne({}).sort({ createdAt: -1 });
      console.log('\nLatest transcript:');
      console.log(`  Request ID: ${transcript.requestId}`);
      console.log(`  Status: ${transcript.status}`);
      console.log(`  Blockchain Hash: ${transcript.blockchainHash || 'N/A'}`);
      console.log(`  IPFS Hash: ${transcript.ipfsHash || 'N/A'}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
});
