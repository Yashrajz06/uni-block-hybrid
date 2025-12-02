const fs = require('fs');
const axios = require('axios');

class IPFSService {
  constructor() {
    this.ipfs = null;
    this.ipfsUrl = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';
    this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/';
    
    // Try to initialize IPFS client (optional - will use HTTP API if fails)
    try {
      // Dynamic import for ESM compatibility check
      const ipfsClient = require('ipfs-http-client');
      if (ipfsClient && typeof ipfsClient.create === 'function') {
        this.ipfs = ipfsClient.create({
          url: this.ipfsUrl
        });
        console.log('IPFS client initialized');
      }
    } catch (error) {
      console.warn('IPFS client library not available, using HTTP API fallback');
      console.warn('Error:', error.message);
      this.ipfs = null;
    }
  }

  /**
   * Upload file to IPFS
   */
  async uploadFile(filePath, options = {}) {
    const file = fs.readFileSync(filePath);
    return this.uploadBuffer(file, options);
  }

  /**
   * Upload buffer to IPFS
   */
  async uploadBuffer(buffer, options = {}) {
    // Try using IPFS client if available
    if (this.ipfs) {
      try {
        const result = await this.ipfs.add(buffer, options);
        return {
          hash: result.cid.toString(),
          path: result.path,
          size: result.size
        };
      } catch (error) {
        console.warn('IPFS client upload failed, trying HTTP API:', error.message);
      }
    }

    // Fallback to HTTP API
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', buffer, { filename: 'file' });

      const response = await axios.post(`${this.ipfsUrl}/api/v0/add`, form, {
        headers: form.getHeaders()
      });

      return {
        hash: response.data.Hash,
        path: response.data.Name || response.data.Hash,
        size: response.data.Size || buffer.length
      };
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data, options = {}) {
    const jsonString = JSON.stringify(data);
    const buffer = Buffer.from(jsonString);

    // Try using IPFS client if available
    if (this.ipfs) {
      try {
        const result = await this.ipfs.add(buffer, options);
        return {
          hash: result.cid.toString(),
          path: result.path,
          size: result.size
        };
      } catch (error) {
        console.warn('IPFS client upload failed, trying HTTP API:', error.message);
      }
    }

    // Fallback to HTTP API
    try {
      const formData = new (require('form-data'))();
      formData.append('file', buffer, { filename: 'data.json' });
      
      const response = await axios.post(`${this.ipfsUrl}/api/v0/add`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });
      
      if (response.data && response.data.Hash) {
        return {
          hash: response.data.Hash,
          path: response.data.Name || 'data.json',
          size: response.data.Size
        };
      }
      throw new Error('Invalid response from IPFS HTTP API');
    } catch (error) {
      console.error('IPFS HTTP API upload error:', error.message);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Retrieve file from IPFS
   */
  async retrieveFile(ipfsHash) {
    // Try using IPFS client if available
    if (this.ipfs) {
      try {
        const chunks = [];
        for await (const chunk of this.ipfs.cat(ipfsHash)) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      } catch (error) {
        console.warn('IPFS client retrieve failed, trying HTTP API:', error.message);
      }
    }

    // Fallback to HTTP API or Gateway
    try {
      // Try local IPFS API first
      const response = await axios.get(`${this.ipfsUrl}/api/v0/cat?arg=${ipfsHash}`, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      return Buffer.from(response.data);
    } catch (error) {
      // Fallback to public gateway
      try {
        const response = await axios.get(`${this.gatewayUrl}${ipfsHash}`, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        return Buffer.from(response.data);
      } catch (gatewayError) {
        console.error('IPFS retrieve error:', gatewayError);
        throw new Error(`IPFS retrieve failed: ${gatewayError.message}`);
      }
    }
  }

  /**
   * Retrieve JSON from IPFS
   */
  async retrieveJSON(ipfsHash) {
    try {
      const buffer = await this.retrieveFile(ipfsHash);
      return JSON.parse(buffer.toString());
    } catch (error) {
      console.error('IPFS JSON retrieve error:', error);
      throw error;
    }
  }

  /**
   * Get IPFS gateway URL
   */
  getGatewayURL(ipfsHash) {
    return `${this.gatewayUrl}${ipfsHash}`;
  }

  /**
   * Verify file hash matches IPFS content
   */
  async verifyHash(ipfsHash, expectedHash) {
    try {
      const buffer = await this.retrieveFile(ipfsHash);
      const crypto = require('crypto');
      const actualHash = crypto.createHash('sha256').update(buffer).digest('hex');
      return actualHash === expectedHash;
    } catch (error) {
      console.error('IPFS hash verification error:', error);
      return false;
    }
  }
}

module.exports = new IPFSService();

