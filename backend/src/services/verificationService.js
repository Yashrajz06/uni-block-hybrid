// backend/src/services/verificationService.js

const { contracts } = require('../config/blockchain');
const ipfsService = require('./ipfsService');
const securityService = require('./securityService');

// ---- SAFE CJS COMPATIBLE IMPORTS ---- //
const CID = require("cids");
const multihash = require("multihashes");

class VerificationService {

  //---------------------------------------------------------------------------
  // 🔥 Convert bytes32 (Solidity) → CIDv0 (Qm...)
  //---------------------------------------------------------------------------
  bytes32ToCID(bytes32) {
    try {
      if (!bytes32 || !bytes32.startsWith("0x") || bytes32.length !== 66) {
        console.log("[bytes32ToCID] Invalid bytes32:", bytes32);
        return null;
      }

      const hex = bytes32.slice(2);
      const raw = Buffer.from(hex, "hex");

      // CIDv0 = sha2-256 multihash + raw32
      const mh = multihash.encode(raw, "sha2-256");

      const cid = new CID(0, "dag-pb", mh);
      return cid.toString(); // Qm...
    } catch (err) {
      console.error("[bytes32ToCID] Failed:", err);
      return null;
    }
  }

  //---------------------------------------------------------------------------
  // 🔥 Convert CIDv0 (Qm...) → bytes32 (Solidity)
  //---------------------------------------------------------------------------
  cidToBytes32(cidStr) {
    try {
      const cid = new CID(cidStr);
      const mh = multihash.decode(cid.multihash);

      if (mh.code !== multihash.names["sha2-256"])
        throw new Error("CID must be sha2-256 multihash");

      const raw32 = mh.digest;

      if (raw32.length !== 32)
        throw new Error("CID digest must be 32 bytes");

      return "0x" + Buffer.from(raw32).toString("hex");
    } catch (err) {
      console.error("[cidToBytes32] Failed:", err.message);
      return "0x" + "00".repeat(32);
    }
  }

  //---------------------------------------------------------------------------
  // Score formula
  //---------------------------------------------------------------------------
  calculateVerificationScore(hashMatch, signatureValid, timestampFreshness, w = { w1: 0.4, w2: 0.4, w3: 0.2 }) {
    const score =
      hashMatch * w.w1 +
      signatureValid * w.w2 +
      timestampFreshness * w.w3;
    return Math.round(score * 100);
  }

  //---------------------------------------------------------------------------
  // 🔍 VERIFY TRANSCRIPT
  //---------------------------------------------------------------------------
  async verifyTranscript(transcriptId) {
    try {
      // DB fetch
      const Transcript = require('../models/Transcript');
      const t = await Transcript.findOne({ requestId: transcriptId });

      if (!t) throw new Error(`Transcript ${transcriptId} not found in DB.`);

      const providedHash = t.blockchainHash;
      const storedIPFS = t.ipfsHash;

      console.log("[Verification] Looking for transcript on blockchain:", transcriptId);
      
      const bc = await contracts.transcriptManager.getRequest(transcriptId);

      console.log("[Verification] Blockchain response:", bc);

      if (!bc.exists) throw new Error("Not found on blockchain.");

      // If blockchain hash is zero → not issued yet
      if (/^0x0+$/.test(bc.transcriptHash))
        throw new Error("Transcript issued but missing hash.");

      // convert bytes32 → CID
      const cid = this.bytes32ToCID(bc.ipfsHash);
      console.log("[Verification] CID:", cid);

      // hash match
      const hashMatch = bc.transcriptHash === providedHash ? 1 : 0;

      // IPFS check
      let ipfsValid = 0;
      if (cid) {
        try {
          const json = await ipfsService.retrieveFile(cid);
          const computed = securityService.hashSHA256(json);
          ipfsValid = computed === providedHash ? 1 : 0;
        } catch (err) {
          console.error("IPFS verification error:", err);
          ipfsValid = storedIPFS ? 0.5 : 0;
        }
      }

      const signatureValid = 1;
      const timestampFreshness = 1;

      const score = this.calculateVerificationScore(
        hashMatch,
        signatureValid,
        timestampFreshness
      );

      return {
        verified: score >= 70,
        score,
        details: {
          hashMatch,
          ipfsValid,
          signatureValid,
          timestampFreshness,
        },
        cid,
      };

    } catch (err) {
      console.error("Verification error:", err);
      return { verified: false, score: 0, error: err.message };
    }
  }
}

module.exports = new VerificationService();
