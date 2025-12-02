const verificationService = require('../services/verificationService');
const qrService = require('../services/qrService');
const Transcript = require('../models/Transcript');
const Certificate = require('../models/Certificate');
const AccessLog = require('../models/AccessLog');

const verifyByQR = async (req, res) => {
  try {
    const { qrData } = req.body;

    // Parse QR data
    const parsedData = qrService.parseQRData(qrData);

    let verificationResult;

    if (parsedData.type === 'transcript') {
      verificationResult = await verificationService.verifyTranscript(
        parsedData.id,
        parsedData.hash,
        parsedData.ipfsHash
      );
    } else if (parsedData.type === 'certificate') {
      verificationResult = await verificationService.verifyCertificate(
        parsedData.id,
        parsedData.hash,
        parsedData.ipfsHash
      );
    } else {
      return res.status(400).json({ error: 'Invalid credential type' });
    }

    res.json({
      verified: verificationResult.verified,
      score: verificationResult.score,
      details: verificationResult.details,
      credentialType: parsedData.type,
      credentialId: parsedData.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyById = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { hash, ipfsHash } = req.body;

    let verificationResult;

    if (type === 'transcript') {
      verificationResult = await verificationService.verifyTranscript(id, hash, ipfsHash);
    } else if (type === 'certificate') {
      verificationResult = await verificationService.verifyCertificate(id, hash, ipfsHash);
    } else {
      return res.status(400).json({ error: 'Invalid credential type' });
    }

    res.json({
      verified: verificationResult.verified,
      score: verificationResult.score,
      details: verificationResult.details
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVerificationHistory = async (req, res) => {
  try {
    const { credentialId } = req.params;

    // Get verification history from blockchain if available
    // For now, return basic info
    res.json({
      credentialId,
      verifications: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVerificationStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);

    const [todayCount, totalCount, dailyAgg] = await Promise.all([
      AccessLog.countDocuments({
        accessType: 'verify',
        timestamp: { $gte: startOfToday }
      }),
      AccessLog.countDocuments({ accessType: 'verify' }),
      AccessLog.aggregate([
        {
          $match: {
            accessType: 'verify',
            timestamp: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])
    ]);

    const last7Days = dailyAgg.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      count: item.count
    }));

    res.json({
      today: todayCount,
      total: totalCount,
      last7Days
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  verifyByQR,
  verifyById,
  getVerificationHistory,
  getVerificationStats
};


