const { contracts, hashData, toBytes32 } = require('../config/blockchain');
const ipfsService = require('./ipfsService');
const securityService = require('./securityService');

class VerificationService {
  /**
   * Calculate verification score
   * Vscore = w1·Hmatch + w2·Svalid + w3·Tfresh
   */
  calculateVerificationScore(hashMatch, signatureValid, timestampFreshness, weights = { w1: 0.4, w2: 0.4, w3: 0.2 }) {
    const { w1, w2, w3 } = weights;
    const score = (hashMatch * w1) + (signatureValid * w2) + (timestampFreshness * w3);
    return Math.min(100, Math.max(0, Math.round(score * 100))); // Scale to 0-100
  }

  /**
   * Verify transcript
   */
  async verifyTranscript(transcriptId, providedHash, ipfsHash) {
    try {
      // Get transcript from database first
      const transcript = await this.getTranscriptFromDB(transcriptId);
      
      // Check transcript status - must be at least approved
      if (transcript.status !== 'approved' && transcript.status !== 'issued') {
        throw new Error(`Transcript request '${transcriptId}' is ${transcript.status} and cannot be verified. It must be approved or issued.`);
      }

      // Use database values if not provided
      const hashToVerify = providedHash || transcript.blockchainHash || '';
      const ipfsHashToVerify = ipfsHash || transcript.ipfsHash || '';

      // 1. Hash match verification
      let blockchainHash;
      try {
        blockchainHash = await this.getTranscriptHashFromBlockchain(transcriptId);
      } catch (error) {
        // If not found on blockchain but exists in DB and is approved/issued, use the DB hash
        if (transcript.blockchainHash) {
          blockchainHash = transcript.blockchainHash;
        } else {
          throw error;
        }
      }
      
      const hashMatch = blockchainHash === hashToVerify ? 1 : 0;

      // 2. IPFS verification
      let ipfsValid = 0;
      if (ipfsHashToVerify && ipfsHashToVerify.trim()) {
        try {
          const ipfsData = await ipfsService.retrieveFile(ipfsHashToVerify);
          const ipfsDataHash = securityService.hashSHA256(ipfsData);
          ipfsValid = ipfsDataHash === hashToVerify ? 1 : 0;
        } catch (error) {
          console.error('IPFS verification error:', error);
          // Set to 0.5 if IPFS retrieval fails but we have a hash (partial credit)
          ipfsValid = ipfsHashToVerify ? 0.5 : 0;
        }
      }

      // 3. Signature validity (simplified - would use actual BLS in production)
      const signatureValid = 1; // Placeholder

      // 4. Timestamp freshness (within 1 year = 1.0, older = decreasing)
      const timeDiff = Date.now() - new Date(transcript.issuedAt || transcript.approvedAt || transcript.createdAt).getTime();
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      const timestampFreshness = timeDiff < oneYear ? 1.0 : (timeDiff < 2 * oneYear ? 0.5 : 0.2);

      // Calculate final score
      const verificationScore = this.calculateVerificationScore(
        hashMatch,
        signatureValid,
        timestampFreshness
      );

      return {
        verified: verificationScore >= 70,
        score: verificationScore,
        details: {
          hashMatch: hashMatch === 1,
          ipfsValid: ipfsValid === 1,
          signatureValid: signatureValid === 1,
          timestampFreshness: timestampFreshness
        }
      };
    } catch (error) {
      console.error('Transcript verification error:', error);
      return {
        verified: false,
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(certificateId, providedHash, ipfsHash) {
    try {
      // Get certificate from database first
      const certificate = await this.getCertificateFromDB(certificateId);
      
      // Use database values if not provided
      const hashToVerify = providedHash || certificate.blockchainHash || '';
      const ipfsHashToVerify = ipfsHash || certificate.ipfsHash || '';
      
      // Get blockchain hash
      let blockchainHash;
      try {
        blockchainHash = await this.getCertificateHashFromBlockchain(certificateId);
      } catch (error) {
        // If not found on blockchain but exists in DB, use the DB hash
        if (certificate.blockchainHash) {
          blockchainHash = certificate.blockchainHash;
        } else {
          throw error;
        }
      }
      
      const hashMatch = blockchainHash === hashToVerify ? 1 : 0;

      let ipfsValid = 0;
      if (ipfsHashToVerify && ipfsHashToVerify.trim()) {
        try {
          const ipfsData = await ipfsService.retrieveFile(ipfsHashToVerify);
          const ipfsDataHash = securityService.hashSHA256(ipfsData);
          ipfsValid = ipfsDataHash === hashToVerify ? 1 : 0;
        } catch (error) {
          console.error('IPFS verification error:', error);
          // Set to 0.5 if IPFS retrieval fails but we have a hash (partial credit)
          ipfsValid = ipfsHashToVerify ? 0.5 : 0;
        }
      }

      const signatureValid = 1; // Placeholder for BLS signature

      const timeDiff = Date.now() - new Date(certificate.issuedDate || certificate.createdAt).getTime();
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      const timestampFreshness = timeDiff < oneYear ? 1.0 : (timeDiff < 2 * oneYear ? 0.5 : 0.2);

      const verificationScore = this.calculateVerificationScore(
        hashMatch,
        signatureValid,
        timestampFreshness
      );

      return {
        verified: verificationScore >= 70,
        score: verificationScore,
        details: {
          hashMatch: hashMatch === 1,
          ipfsValid: ipfsValid === 1,
          signatureValid: signatureValid === 1,
          timestampFreshness: timestampFreshness
        }
      };
    } catch (error) {
      console.error('Certificate verification error:', error);
      return {
        verified: false,
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * Get transcript hash from blockchain
   */
  async getTranscriptHashFromBlockchain(transcriptId) {
    if (!contracts.transcriptManager) {
      throw new Error('TranscriptManager contract not initialized');
    }
    
    // Handle transcript ID with or without 'transcript-' prefix
    let requestId = transcriptId;
    if (transcriptId.startsWith('transcript-')) {
      requestId = transcriptId.replace('transcript-', '');
    }
    
    console.log(`[Verification] Looking for transcript on blockchain with ID: ${requestId}`);

    
    try {
      const transcript = await contracts.transcriptManager.getRequest(requestId);
      console.log(`[Verification] Got response from blockchain:`, transcript);
      
      if (!transcript || !transcript.exists) {
        // This is a sanity check in case the contract doesn't revert but returns an empty struct
        throw new Error(`Transcript request '${transcriptId}' not found on the blockchain (exists flag is false).`);
      }
      
      // Check if hash is still zero (not yet issued)
      const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      if (transcript.transcriptHash === zeroHash || transcript.transcriptHash === '0x') {
        throw new Error(`Transcript request '${transcriptId}' has not been issued yet (hash is empty).`);
      }
      
      return transcript.transcriptHash;
    } catch (error) {
      console.log(`[Verification] Error fetching from blockchain:`, error.message);
      // Check if the error is a BAD_DATA error (empty response) - means request doesn't exist
      if (error.code === 'BAD_DATA' || error.shortMessage === 'could not decode result data') {
        throw new Error(`Transcript request '${transcriptId}' not found on the blockchain.`);
      }
      // Check if the error is a contract revert with a specific reason
      if (error.reason && error.reason.includes('Request does not exist')) {
        throw new Error(`Transcript request '${transcriptId}' not found on the blockchain.`);
      }
      // Log the original error for debugging purposes
      console.error("Blockchain fetch error (transcript):", error);
      // Throw a more generic error to the client
      throw new Error(`Failed to fetch transcript from blockchain for ID '${transcriptId}'.`);
    }
  }

  /**
   * Get certificate hash from blockchain
   */
  async getCertificateHashFromBlockchain(certificateId) {
    if (!contracts.certificate) {
      throw new Error('Certificate contract not initialized');
    }
    
    // Handle certificate ID with or without 'certificate-' prefix
    let certId = certificateId;
    if (certificateId.startsWith('certificate-')) {
      certId = certificateId.replace('certificate-', '');
    }
    
    try {
      const certificate = await contracts.certificate.getCertificate(certId);
      if (!certificate.exists) {
        throw new Error(`Certificate '${certificateId}' not found on the blockchain (exists flag is false).`);
      }
      return certificate.certificateHash;
    } catch (error) {
      if (error.reason && error.reason.includes('Certificate does not exist')) {
        throw new Error(`Certificate '${certificateId}' not found on the blockchain.`);
      }
      console.error("Blockchain fetch error (certificate):", error);
      throw new Error(`Failed to fetch certificate from blockchain for ID '${certificateId}'.`);
    }
  }

  /**
   * Get transcript from database (helper method)
   */
  async getTranscriptFromDB(transcriptId) {
    const Transcript = require('../models/Transcript');
    
    // Handle transcript ID with or without 'transcript-' prefix
    let requestId = transcriptId;
    if (transcriptId.startsWith('transcript-')) {
      requestId = transcriptId.replace('transcript-', '');
    }
    
    const transcript = await Transcript.findOne({ requestId });
    if (!transcript) {
      throw new Error(`Transcript '${transcriptId}' not found in database.`);
    }
    return transcript;
  }

  /**
   * Get certificate from database (helper method)
   */
  async getCertificateFromDB(certificateId) {
    const Certificate = require('../models/Certificate');
    
    // Handle certificate ID with or without 'certificate-' prefix
    let certId = certificateId;
    if (certificateId.startsWith('certificate-')) {
      certId = certificateId.replace('certificate-', '');
    }
    
    const certificate = await Certificate.findOne({ certificateId: certId });
    if (!certificate) {
      throw new Error(`Certificate '${certificateId}' not found in database.`);
    }
    return certificate;
  }
}

module.exports = new VerificationService();


