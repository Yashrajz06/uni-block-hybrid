const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load contract ABIs
const loadABI = (contractName) => {
  console.log('[ABI Loader] __dirname:', __dirname);
  const abiPath = path.join(__dirname, '../../../contracts/artifacts/contracts', `${contractName}.sol`, `${contractName}.json`); 
  // console.log('[ABI Loader] Calculated ABI Path:', abiPath);
  console.log("[ABI Loader] Checking:", abiPath);
  console.log("[ABI Loader] Exists:", fs.existsSync(abiPath));

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

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');

// Initialize wallet only if private key is provided and valid
let wallet = null;
if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.trim() !== '') {
  try {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log('Blockchain wallet initialized:', wallet.address);
  } catch (error) {
    console.warn('Invalid private key provided. Blockchain write operations will be disabled.');
    console.warn('Error:', error.message);
  }
} else {
  console.warn('No private key provided. Blockchain write operations will be disabled.');
}

// Contract instances
const contracts = {
  studentRecord: null,
  facultyRecord: null,
  transcriptManager: null,
  certificate: null,
  credentialManager: null,
  accessControlABE: null
};

// Initialize contracts
const initializeContracts = () => {
  // Use wallet if available, otherwise use provider for read-only operations
  const signerOrProvider = wallet || provider;

  if (process.env.STUDENT_RECORD_CONTRACT_ADDRESS) {
    contracts.studentRecord = new ethers.Contract(
      process.env.STUDENT_RECORD_CONTRACT_ADDRESS,
      loadABI('StudentRecord'),
      signerOrProvider
    );
  }

  if (process.env.FACULTY_RECORD_CONTRACT_ADDRESS) {
    contracts.facultyRecord = new ethers.Contract(
      process.env.FACULTY_RECORD_CONTRACT_ADDRESS,
      loadABI('FacultyRecord'),
      signerOrProvider
    );
  }

  if (process.env.TRANSCRIPT_MANAGER_CONTRACT_ADDRESS) {
    contracts.transcriptManager = new ethers.Contract(
      process.env.TRANSCRIPT_MANAGER_CONTRACT_ADDRESS,
      loadABI('TranscriptManager'),
      signerOrProvider,
      console.log("TranscriptManager ABI length:", loadABI('TranscriptManager').length),
      console.log("TranscriptManager address:", process.env.TRANSCRIPT_MANAGER_CONTRACT_ADDRESS)

    );
  }

  if (process.env.CERTIFICATE_CONTRACT_ADDRESS) {
    contracts.certificate = new ethers.Contract(
      process.env.CERTIFICATE_CONTRACT_ADDRESS,
      loadABI('Certificate'),
      signerOrProvider
    );
  }

  if (process.env.CREDENTIAL_MANAGER_CONTRACT_ADDRESS) {
    contracts.credentialManager = new ethers.Contract(
      process.env.CREDENTIAL_MANAGER_CONTRACT_ADDRESS,
      loadABI('CredentialManager'),
      signerOrProvider
    );
  }

  if (process.env.ACCESS_CONTROL_ABE_CONTRACT_ADDRESS) {
    contracts.accessControlABE = new ethers.Contract(
      process.env.ACCESS_CONTROL_ABE_CONTRACT_ADDRESS,
      loadABI('AccessControlABE'),
      signerOrProvider
    );
  }
};

// Hash function using SHA-256
const hashData = (data) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

// Convert hex string to bytes32
const toBytes32 = (value) => {
  if (!value) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
  
  // If it's already a hex string starting with 0x, use it directly
  if (typeof value === 'string' && value.startsWith('0x')) {
    const hexStr = value.slice(2); // Remove 0x prefix
    if (hexStr.length > 64) {
      // If too long, take first 64 characters (32 bytes)
      return '0x' + hexStr.slice(0, 64);
    }
    return ethers.zeroPadValue(value, 32);
  }
  
  // If it's an IPFS hash or other string, convert to hex first
  if (typeof value === 'string') {
    const hexString = ethers.hexlify(ethers.toUtf8Bytes(value));
    const hexStr = hexString.slice(2); // Remove 0x prefix
    if (hexStr.length > 64) {
      // If too long, take first 64 characters (32 bytes) - this hashes the IPFS hash
      return '0x' + hexStr.slice(0, 64);
    }
    return ethers.zeroPadValue(hexString, 32);
  }
  
  // Otherwise try to hexlify it
  const hexStr = ethers.hexlify(value);
  const cleanHex = hexStr.slice(2); // Remove 0x prefix
  if (cleanHex.length > 64) {
    return '0x' + cleanHex.slice(0, 64);
  }
  return ethers.zeroPadValue(hexStr, 32);
};

module.exports = {
  provider,
  wallet,
  contracts,
  initializeContracts,
  hashData,
  toBytes32,
  getWallet: () => wallet
};

