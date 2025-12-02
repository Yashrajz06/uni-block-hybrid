
require('dotenv').config({ path: '../.env' });
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const transcriptId = process.argv[2];

if (!transcriptId) {
  console.error('Please provide a transcript ID.');
  process.exit(1);
}

const loadABI = (contractName) => {
  const abiPath = path.join(__dirname, '../../contracts/artifacts/contracts', `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(abiPath)) {
    console.error(`ABI file not found for contract ${contractName} at path: ${abiPath}`);
    process.exit(1);
  }
  const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  return artifact.abi;
};

const getTranscriptData = async () => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const transcriptManagerAddress = process.env.TRANSCRIPT_MANAGER_CONTRACT_ADDRESS;
    const transcriptManagerABI = loadABI('TranscriptManager');

    const contract = new ethers.Contract(transcriptManagerAddress, transcriptManagerABI, provider);

    console.log(`Querying for transcript ID: ${transcriptId}`);
    const transcriptData = await contract.getRequest(transcriptId);

    console.log('Transcript data from blockchain:');
    
    // The contract returns a struct, which ethers.js represents as an array-like object
    // with both indexed and named properties. We can destructure it to make it more readable.
    const {
      requestId,
      studentId,
      transcriptHash,
      ipfsHash,
      requestDate,
      approvalDate,
      requestedBy,
      approvedBy,
      status,
      exists
    } = transcriptData;

    // Convert BigInts to strings for better readability
    const formattedData = {
      requestId,
      studentId,
      transcriptHash,
      ipfsHash,
      requestDate: new Date(Number(requestDate) * 1000).toLocaleString(),
      approvalDate: new Date(Number(approvalDate) * 1000).toLocaleString(),
      requestedBy,
      approvedBy,
      status: status.toString(), // Convert enum to string
      exists
    };

    console.log(JSON.stringify(formattedData, null, 2));

  } catch (error) {
    console.error('Error fetching transcript data:', error.message);
    if (error.data) {
        const decodedError = contract.interface.parseError(error.data);
        console.error('Decoded error:', decodedError);
    }
  }
};

getTranscriptData();
