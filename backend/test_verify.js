const axios = require('axios');

const transcriptId = 'TRX-1764676021161-STU-0001';

async function testVerify() {
  try {
    console.log('Testing verification API...\n');
    console.log(`Verifying transcript: transcript-${transcriptId}\n`);
    
    const response = await axios.post(
      'http://localhost:5000/api/verify/transcript',
      {
        type: 'transcript',
        id: `transcript-${transcriptId}`,
        hash: 'a24da0b363d9339d9d4197c43abb27284fc25142e2e3e16acd14839a3a2328a4',
        ipfsHash: 'QmUFwPQDE2u5hzLpfntuSpcUnbyCf9iMwscafiXou5BQXv'
      }
    );
    
    console.log('Verification Result:');
    console.log(JSON.stringify(response.data, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testVerify();
