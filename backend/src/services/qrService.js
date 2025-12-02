const QRCode = require('qrcode');
const crypto = require('crypto');

class QRService {
  /**
   * Generate QR code for credential
   */
  async generateQRCode(data) {
    try {
      // Create QR code data structure
      const qrData = {
        type: data.type || 'credential',
        id: data.id,
        hash: data.hash,
        timestamp: new Date().toISOString(),
        verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${data.id}`
      };

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        qrCode: qrCodeDataURL,
        data: qrData
      };
    } catch (error) {
      console.error('QR code generation error:', error);
      throw error;
    }
  }

  /**
   * Generate QR code for transcript
   */
  async generateTranscriptQR(transcriptId, hash, ipfsHash) {
    return this.generateQRCode({
      type: 'transcript',
      id: transcriptId,
      hash: hash,
      ipfsHash: ipfsHash
    });
  }

  /**
   * Generate QR code for certificate
   */
  async generateCertificateQR(certificateId, hash, ipfsHash) {
    return this.generateQRCode({
      type: 'certificate',
      id: certificateId,
      hash: hash,
      ipfsHash: ipfsHash
    });
  }

  /**
   * Parse QR code data
   */
  parseQRData(qrDataString) {
    try {
      return JSON.parse(qrDataString);
    } catch (error) {
      throw new Error('Invalid QR code data format');
    }
  }

  /**
   * Verify QR code data integrity
   */
  verifyQRData(qrData, expectedHash) {
    if (!qrData.hash) {
      return false;
    }
    return qrData.hash === expectedHash;
  }
}

module.exports = new QRService();


