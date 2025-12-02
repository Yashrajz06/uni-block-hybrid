const ethers = require('ethers');

const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const CONTRACT_ADDRESS = '0x59b670e9fA9D0A427751Af201D676719a970857b';

const ABI = [
  "function getRequest(string memory requestId) public view returns (tuple(string requestId, string studentId, bytes32 transcriptHash, bytes32 ipfsHash, uint256 requestDate, uint256 approvalDate, address requestedBy, address approvedBy, uint8 status, bool exists))"
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

async function test() {
  try {
    const requestId = 'TRX-1764676021161-STU-0001';
    console.log(`Querying contract at ${CONTRACT_ADDRESS}`);
    console.log(`Looking for request ID: ${requestId}`);
    
    const result = await contract.getRequest(requestId);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
