const mongoose = require('mongoose');
const Transcript = require('./src/models/Transcript');

mongoose.connect('mongodb://localhost:27017/StudentChain');

const db = mongoose.connection;
db.once('open', async function () {
  try {
    const transcript = await Transcript.findOne({}).sort({ createdAt: -1 });
    if (transcript) {
      console.log('Latest transcript:');
      console.log(`  Request ID: ${transcript.requestId}`);
      console.log(`  Status: ${transcript.status}`);
      console.log(`  Blockchain Hash: ${transcript.blockchainHash || 'N/A'}`);
      console.log(`  IPFS Hash: ${transcript.ipfsHash || 'N/A'}`);
      console.log(`  Blockchain TX Hash: ${transcript.blockchainTxHash || 'N/A'}`);
    } else {
      console.log('No transcripts found');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
});
