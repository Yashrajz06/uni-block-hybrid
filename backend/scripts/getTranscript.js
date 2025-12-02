const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });


// Load contract ABIs
const loadABI = (contractName) => {
  const abiPath = path.join(__dirname, '../../contracts/artifacts/contracts', `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(abiPath)) {
    console.warn(`[ABI Loader] ABI file not found for contract ${contractName} at path: ${abiPath}`);
    return [];
  }
  try {
    const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    if (!artifact.abi) {
        console.warn(`[ABI Loader] ABI field not found in artifact for contract ${contractName}.`);
        return [];
    }
    return artifact.abi;
  } catch (error) {
    console.error(`[ABI Loader] Error parsing ABI for ${contractName}:`, error);
    return [];
  }
};

const getTranscript = async (transcriptId) => {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');

        const transcriptManager = new ethers.Contract(
            process.env.TRANSCRIPT_MANAGER_CONTRACT_ADDRESS,
            loadABI('TranscriptManager'),
            provider
        );

        const transcript = await transcriptManager.getRequest(transcriptId);

        const statusMap = {
            0: 'Pending',
            1: 'Approved',
            2: 'Rejected',
            3: 'Issued'
        };


        console.log("Transcript details from the blockchain:");
        console.log("  Request ID: ", transcript.requestId);
        console.log("  Student ID: ", transcript.studentId);
        console.log("  Transcript Hash: ", transcript.transcriptHash);
        console.log("  IPFS Hash: ", transcript.ipfsHash);
        console.log("  Status: ", statusMap[transcript.status]);
        console.log("  Requested By: ", transcript.requestedBy);
        console.log("  Approved By: ", transcript.approvedBy);
        console.log("  Request Date: ", new Date(Number(transcript.requestDate) * 1000).toLocaleString());
        console.log("  Approval Date: ", new Date(Number(transcript.approvalDate) * 1000).toLocaleString());

    } catch(e) {
        console.error(e)
    }
}

const transcriptId = process.argv[2];
if (!transcriptId) {
    console.error("Please provide a transcript ID.");
    process.exit(1);
}

getTranscript(transcriptId);