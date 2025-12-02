const { contracts } = require('../config/blockchain');
const securityService = require('../services/securityService');
const AccessLog = require('../models/AccessLog');

const checkAccess = async (req, res) => {
  try {
    const { resourceId, resourceType } = req.body;
    const userAddress = req.user?.walletAddress;

    if (!userAddress && contracts.accessControlABE) {
      return res.json({ hasAccess: false, reason: 'No wallet address' });
    }

    let hasAccess = false;

    // Check blockchain access control
    if (contracts.accessControlABE && userAddress) {
      try {
        hasAccess = await contracts.accessControlABE.hasAccess(resourceId, userAddress);
      } catch (error) {
        console.error('Blockchain access check error:', error);
      }
    }

    // Log access attempt
    await AccessLog.create({
      resourceType,
      resourceId,
      accessedBy: req.userId,
      accessType: 'view',
      success: hasAccess,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ hasAccess });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const evaluatePolicy = async (req, res) => {
  try {
    const { policy, userAttributes } = req.body;

    const hasAccess = securityService.evaluateABEPolicy(userAttributes, policy);

    res.json({
      hasAccess,
      policy,
      userAttributes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAccessLogs = async (req, res) => {
  try {
    const { resourceId, resourceType } = req.query;

    const query = {};
    if (resourceId) query.resourceId = resourceId;
    if (resourceType) query.resourceType = resourceType;

    const logs = await AccessLog.find(query)
      .populate('accessedBy', 'email role')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  checkAccess,
  evaluatePolicy,
  getAccessLogs
};


