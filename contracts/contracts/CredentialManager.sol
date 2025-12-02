// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CredentialManager
 * @dev Manages verifiable credentials and QR code verification on Institutional Chain
 */
contract CredentialManager {
    struct Credential {
        string credentialId;
        string studentId;
        string credentialType; // "degree", "diploma", "certificate"
        bytes32 credentialHash;
        bytes32 ipfsHash;
        bytes blsSignature;
        uint256 issuedDate;
        address issuedBy;
        bool isValid;
        bool exists;
    }

    struct Verification {
        string credentialId;
        address verifier;
        uint256 timestamp;
        bool verified;
        uint256 authenticityScore; // 0-100
    }

    mapping(string => Credential) public credentials;
    mapping(string => Verification[]) public verifications;
    mapping(bytes32 => bool) public usedHashes; // Prevent duplicate credentials

    address public admin;
    uint256 public totalCredentials;
    uint256 public totalVerifications;

    event CredentialIssued(
        string indexed credentialId,
        string indexed studentId,
        string credentialType,
        bytes32 credentialHash,
        bytes32 ipfsHash,
        uint256 timestamp
    );

    event CredentialVerified(
        string indexed credentialId,
        address indexed verifier,
        uint256 authenticityScore,
        uint256 timestamp
    );

    event CredentialRevoked(string indexed credentialId, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Issue a new credential
     */
    function issueCredential(
        string memory credentialId,
        string memory studentId,
        string memory credentialType,
        bytes32 credentialHash,
        bytes32 ipfsHash,
        bytes memory blsSignature
    ) public onlyAdmin {
        require(!credentials[credentialId].exists, "Credential already exists");
        require(!usedHashes[credentialHash], "Hash already used");

        credentials[credentialId] = Credential({
            credentialId: credentialId,
            studentId: studentId,
            credentialType: credentialType,
            credentialHash: credentialHash,
            ipfsHash: ipfsHash,
            blsSignature: blsSignature,
            issuedDate: block.timestamp,
            issuedBy: msg.sender,
            isValid: true,
            exists: true
        });

        usedHashes[credentialHash] = true;
        totalCredentials++;
        emit CredentialIssued(
            credentialId,
            studentId,
            credentialType,
            credentialHash,
            ipfsHash,
            block.timestamp
        );
    }

    /**
     * @dev Verify a credential
     */
    function verifyCredential(
        string memory credentialId,
        bytes32 providedHash,
        bytes memory providedSignature
    ) public returns (uint256) {
        require(credentials[credentialId].exists, "Credential does not exist");
        require(credentials[credentialId].isValid, "Credential has been revoked");

        Credential memory cred = credentials[credentialId];

        // Calculate authenticity score
        uint256 hashMatch = (cred.credentialHash == providedHash) ? 100 : 0;
        uint256 signatureValid = (keccak256(cred.blsSignature) == keccak256(providedSignature)) ? 100 : 0;
        
        // Timestamp freshness (within 1 year = 100, older = decreasing)
        uint256 timeDiff = block.timestamp - cred.issuedDate;
        uint256 freshness = timeDiff < 31536000 ? 100 : (timeDiff < 63072000 ? 50 : 0);

        // Weighted score: w1=0.4, w2=0.4, w3=0.2
        uint256 authenticityScore = (hashMatch * 40 + signatureValid * 40 + freshness * 20) / 100;

        verifications[credentialId].push(Verification({
            credentialId: credentialId,
            verifier: msg.sender,
            timestamp: block.timestamp,
            verified: authenticityScore >= 70,
            authenticityScore: authenticityScore
        }));

        totalVerifications++;
        emit CredentialVerified(credentialId, msg.sender, authenticityScore, block.timestamp);

        return authenticityScore;
    }

    /**
     * @dev Get credential details
     */
    function getCredential(string memory credentialId) public view returns (Credential memory) {
        require(credentials[credentialId].exists, "Credential does not exist");
        return credentials[credentialId];
    }

    /**
     * @dev Get verification history
     */
    function getVerificationHistory(string memory credentialId) public view returns (Verification[] memory) {
        require(credentials[credentialId].exists, "Credential does not exist");
        return verifications[credentialId];
    }

    /**
     * @dev Revoke a credential
     */
    function revokeCredential(string memory credentialId) public onlyAdmin {
        require(credentials[credentialId].exists, "Credential does not exist");
        credentials[credentialId].isValid = false;
        emit CredentialRevoked(credentialId, block.timestamp);
    }

    /**
     * @dev Check if credential is valid
     */
    function isCredentialValid(string memory credentialId) public view returns (bool) {
        require(credentials[credentialId].exists, "Credential does not exist");
        return credentials[credentialId].isValid;
    }
}


