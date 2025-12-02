const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class SecurityService {
  /**
   * Generate JWT token
   */
  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Hash data using SHA-256
   */
  hashSHA256(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Generate BLS signature (simplified - in production use actual BLS library)
   * Note: This is a placeholder. Real BLS signatures require specialized libraries
   */
  generateBLSSignature(data, privateKey) {
    // In production, use a proper BLS library like @noble/bls12-381
    // This is a simplified version for demonstration
    const hash = this.hashSHA256(data);
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(hash);
    return sign.sign(privateKey, 'hex');
  }

  /**
   * Verify BLS signature (simplified)
   */
  verifyBLSSignature(data, signature, publicKey) {
    // In production, use a proper BLS library
    const hash = this.hashSHA256(data);
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(hash);
    return verify.verify(publicKey, signature, 'hex');
  }

  /**
   * Aggregate BLS signatures (simplified)
   */
  aggregateBLSSignatures(signatures) {
    // In production, use proper BLS aggregation
    // This is a placeholder that combines signatures
    return signatures.join('|');
  }

  /**
   * Attribute-Based Encryption (ABE) - Policy Evaluation
   * Implements CP-ABE (Ciphertext-Policy Attribute-Based Encryption) logic
   */
  evaluateABEPolicy(userAttributes, policy) {
    // Policy format: { requiredAttributes: [{ key: 'role', value: 'student' }, ...] }
    const { requiredAttributes } = policy;

    if (!requiredAttributes || requiredAttributes.length === 0) {
      return true; // No policy restrictions
    }

    // Check if user has all required attributes with matching values
    for (const requiredAttr of requiredAttributes) {
      const userAttr = userAttributes[requiredAttr.key];
      
      if (!userAttr || userAttr !== requiredAttr.value) {
        return false; // User doesn't meet policy requirement
      }
    }

    return true; // User meets all policy requirements
  }

  /**
   * Generate random encryption key
   */
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt data (AES-256-GCM)
   */
  encryptData(data, key) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt data (AES-256-GCM)
   */
  decryptData(encryptedData, key) {
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(key, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}

module.exports = new SecurityService();


