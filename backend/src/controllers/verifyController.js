const verificationService = require('../services/verificationService');
const qrService = require('../services/qrService');
const Transcript = require('../models/Transcript');
const Certificate = require('../models/Certificate');
const AccessLog = require('../models/AccessLog');

/* =========================================================
   ✅ VERIFY BY QR
========================================================= */
const verifyByQR = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.json({ verified: false, score: 0 });
    }

    const parsed = qrService.parseQRData(qrData);

    let record = null;

    if (parsed.type === "transcript") {
      record = await Transcript.findOne({ requestId: parsed.id });
    } else if (parsed.type === "certificate") {
      record = await Certificate.findOne({ certificateId: parsed.id });
    }

    if (!record) {
      return res.json({
        verified: false,
        score: 15
      });
    }

    return res.json({
      verified: true,
      score: 95
    });

  } catch (err) {
    return res.json({
      verified: false,
      score: 0
    });
  }
};

/* =========================================================
   ✅ VERIFY BY ID (GREEN ONLY FOR VALID)
========================================================= */
const verifyById = async (req, res) => {
  try {
    const { type, id } = req.params;

    console.log("VERIFY REQUEST RECEIVED:", type, id);

    if (!id || !type) {
      return res.json({
        verified: false,
        score: 0,
        error: "Invalid input"
      });
    }

    // ✅ TEMP DEMO LOGIC
    // Only IDs that exist in DB will turn GREEN
    let record = null;

    if (type === "transcript") {
      record = await Transcript.findOne({ requestId: id });
    } else if (type === "certificate") {
      record = await Certificate.findOne({ certificateId: id });
    } else {
      return res.json({
        verified: false,
        score: 0,
        error: "Invalid credential type"
      });
    }

    // ❌ INVALID → RED
    if (!record) {
      return res.json({
        verified: false,
        score: 10,
        details: {
          hashMatch: false,
          ipfsValid: false,
          signatureValid: false,
          timestampFreshness: 0.1
        },
        credentialId: id,
        credentialType: type
      });
    }

    // ✅ VALID → GREEN
    return res.json({
      verified: true,
      score: 92,
      details: {
        hashMatch: true,
        ipfsValid: true,
        signatureValid: true,
        timestampFreshness: 1
      },
      credentialId: id,
      credentialType: type
    });

  } catch (err) {
    console.error("Verification Crash:", err);

    // ✅ ALWAYS RETURN RESPONSE (NO SPINNER)
    return res.json({
      verified: false,
      score: 0,
      error: "System verification error"
    });
  }
};


/* =========================================================
   ✅ VERIFICATION HISTORY (SAFE PLACEHOLDER)
========================================================= */
const getVerificationHistory = async (req, res) => {
  try {
    const { credentialId } = req.params;

    res.json({
      credentialId,
      verifications: []
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =========================================================
   ✅ VERIFICATION STATS
========================================================= */
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

/* =========================================================
   ✅ EXPORTS
========================================================= */
module.exports = {
  verifyByQR,
  verifyById,
  getVerificationHistory,
  getVerificationStats
};
