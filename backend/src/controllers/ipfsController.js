const ipfsService = require('../services/ipfsService');
const IPFSReference = require('../models/IPFSReference');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const result = await ipfsService.uploadBuffer(req.file.buffer, {
      pin: true
    });

    // Save reference
    const reference = new IPFSReference({
      resourceType: req.body.resourceType || 'document',
      resourceId: req.body.resourceId,
      ipfsHash: result.hash,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.userId
    });
    await reference.save();

    res.status(201).json({
      message: 'File uploaded to IPFS successfully',
      ipfsHash: result.hash,
      gatewayUrl: ipfsService.getGatewayURL(result.hash),
      reference
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const retrieveFile = async (req, res) => {
  try {
    const { ipfsHash } = req.params;

    const file = await ipfsService.retrieveFile(ipfsHash);

    // Update access count
    const reference = await IPFSReference.findOne({ ipfsHash });
    if (reference) {
      reference.accessCount += 1;
      reference.lastAccessed = new Date();
      await reference.save();
    }

    res.setHeader('Content-Type', reference?.mimeType || 'application/octet-stream');
    res.send(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getIPFSReference = async (req, res) => {
  try {
    const { ipfsHash } = req.params;

    const reference = await IPFSReference.findOne({ ipfsHash });
    if (!reference) {
      return res.status(404).json({ error: 'IPFS reference not found' });
    }

    res.json({
      ...reference.toObject(),
      gatewayUrl: ipfsService.getGatewayURL(ipfsHash)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyHash = async (req, res) => {
  try {
    const { ipfsHash, expectedHash } = req.body;

    const isValid = await ipfsService.verifyHash(ipfsHash, expectedHash);
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadFile: [authenticate, upload.single('file'), uploadFile],
  retrieveFile,
  getIPFSReference,
  verifyHash
};


