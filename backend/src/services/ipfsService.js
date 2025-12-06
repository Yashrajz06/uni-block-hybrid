const fs = require('fs');
const axios = require('axios');

class IPFSService {
  constructor() {
    this.ipfs = null;
    this.ipfsUrl = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';

    // Multi-gateway fallback (fastest → slowest)
    this.gateways = [
      "https://gateway.pinata.cloud/ipfs/",
      "https://cloudflare-ipfs.com/ipfs/",
      "https://dweb.link/ipfs/",
      "https://ipfs.runfission.com/ipfs/",
      "https://cf-ipfs.com/ipfs/",
      "https://ipfs.io/ipfs/" // last fallback (slow)
    ];

    try {
      const ipfsClient = require('ipfs-http-client');
      if (ipfsClient && typeof ipfsClient.create === 'function') {
        this.ipfs = ipfsClient.create({ url: this.ipfsUrl });
        console.log('IPFS client initialized');
      }
    } catch (error) {
      console.warn('IPFS client library unavailable, using HTTP fallback');
      console.warn('Error:', error.message);
      this.ipfs = null;
    }
  }

  /** -------- UPLOAD METHODS (unchanged) ---------- */

  async uploadFile(filePath, options = {}) {
    const file = fs.readFileSync(filePath);
    return this.uploadBuffer(file, options);
  }

  async uploadBuffer(buffer, options = {}) {
    if (this.ipfs) {
      try {
        const result = await this.ipfs.add(buffer, options);
        return {
          hash: result.cid.toString(),
          path: result.path,
          size: result.size
        };
      } catch (err) {
        console.warn("IPFS client upload failed → HTTP fallback:", err.message);
      }
    }

    try {
      const FormData = require("form-data");
      const form = new FormData();
      form.append("file", buffer);

      const res = await axios.post(`${this.ipfsUrl}/api/v0/add`, form, {
        headers: form.getHeaders()
      });

      return {
        hash: res.data.Hash,
        path: res.data.Name || res.data.Hash,
        size: res.data.Size || buffer.length
      };
    } catch (error) {
      console.error("IPFS upload error:", error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  async uploadJSON(data, options = {}) {
    const buffer = Buffer.from(JSON.stringify(data));

    if (this.ipfs) {
      try {
        const result = await this.ipfs.add(buffer, options);
        return {
          hash: result.cid.toString(),
          path: result.path,
          size: result.size
        };
      } catch (err) {
        console.warn("IPFS client upload failed → HTTP fallback:", err.message);
      }
    }

    try {
      const FormData = require("form-data");
      const form = new FormData();
      form.append("file", buffer, { filename: "data.json" });

      const res = await axios.post(`${this.ipfsUrl}/api/v0/add`, form, {
        headers: form.getHeaders()
      });

      return {
        hash: res.data.Hash,
        path: res.data.Name || "data.json",
        size: res.data.Size
      };
    } catch (error) {
      console.error("IPFS JSON upload error:", error.message);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /** -------- RETRIEVE (FULLY PATCHED) ---------- */

  async retrieveFile(cid) {
    if (!cid) throw new Error("No CID provided");

    // Try local IPFS client
    if (this.ipfs) {
      try {
        const chunks = [];
        for await (const chunk of this.ipfs.cat(cid)) chunks.push(chunk);
        return Buffer.concat(chunks);
      } catch (err) {
        console.warn("Local IPFS client failed → trying gateways:", err.message);
      }
    }

    // Try local HTTP API
    try {
      const res = await axios.get(`${this.ipfsUrl}/api/v0/cat?arg=${cid}`, {
        timeout: 2000,
        responseType: "arraybuffer"
      });
      return Buffer.from(res.data);
    } catch (err) {
      console.warn("Local IPFS API failed → trying public gateways");
    }

    // Multi-gateway fallback (fast)
    for (const gw of this.gateways) {
      const url = gw + cid;
      try {
        const res = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 2500
        });

        console.log(`[IPFS] Success via ${gw}`);
        return Buffer.from(res.data);
      } catch (err) {
        console.warn(`[IPFS] Gateway failed (${gw}) → ${err.response?.status || err.code}`);
      }
    }

    throw new Error("IPFS retrieve failed from all sources");
  }

  /** -------- JSON RETRIEVE ---------- */

  async retrieveJSON(cid) {
    try {
      const data = await this.retrieveFile(cid);
      return JSON.parse(data.toString());
    } catch (err) {
      console.error("IPFS JSON retrieve error:", err.message);
      throw err;
    }
  }

  getGatewayURL(cid) {
    return this.gateways[0] + cid;
  }

  /** -------- HASH VERIFY ---------- */

  async verifyHash(cid, expectedHash) {
    try {
      const buffer = await this.retrieveFile(cid);
      const crypto = require("crypto");
      const actualHash = crypto.createHash("sha256").update(buffer).digest("hex");
      return actualHash === expectedHash;
    } catch (err) {
      console.error("IPFS hash verification failed:", err.message);
      return false;
    }
  }
}

module.exports = new IPFSService();
