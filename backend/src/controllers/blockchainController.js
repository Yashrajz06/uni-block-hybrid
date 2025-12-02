const { contracts } = require('../config/blockchain');
const BlockchainHash = require('../models/BlockchainHash');

const getStudentRecord = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!contracts.studentRecord) {
      return res.status(503).json({ error: 'Blockchain service unavailable' });
    }

    const student = await contracts.studentRecord.getStudent(studentId);
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTranscriptHash = async (req, res) => {
  try {
    const { transcriptId } = req.params;

    if (!contracts.transcriptManager) {
      return res.status(503).json({ error: 'Blockchain service unavailable' });
    }

    const transcript = await contracts.transcriptManager.getRequest(transcriptId);
    res.json({
      transcriptId,
      hash: transcript.transcriptHash,
      ipfsHash: transcript.ipfsHash,
      status: transcript.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCertificateHash = async (req, res) => {
  try {
    const { certificateId } = req.params;

    if (!contracts.certificate) {
      return res.status(503).json({ error: 'Blockchain service unavailable' });
    }

    const certificate = await contracts.certificate.getCertificate(certificateId);
    res.json({
      certificateId,
      hash: certificate.certificateHash,
      ipfsHash: certificate.ipfsHash,
      isValid: !certificate.isRevoked
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBlockchainHashes = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.query;

    const query = {};
    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;

    const hashes = await BlockchainHash.find(query).sort({ timestamp: -1 });
    res.json(hashes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStudentRecord,
  getTranscriptHash,
  getCertificateHash,
  getBlockchainHashes
};


