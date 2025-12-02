// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Certificate
 * @dev Smart contract for managing certificates and degrees on Institutional Chain
 */
contract Certificate {
    struct CertificateRecord {
        string certificateId;
        string studentId;
        string certificateType; // "degree", "diploma", "achievement"
        string title;
        string description;
        bytes32 certificateHash;
        bytes32 ipfsHash;
        bytes blsSignature;
        uint256 issuedDate;
        address issuedBy;
        bool isRevoked;
        bool exists;
    }

    mapping(string => CertificateRecord) public certificates;
    mapping(string => string[]) public studentCertificates; // studentId => certificateIds[]

    address public admin;
    uint256 public totalCertificates;

    event CertificateIssued(
        string indexed certificateId,
        string indexed studentId,
        string certificateType,
        bytes32 certificateHash,
        bytes32 ipfsHash,
        uint256 timestamp
    );

    event CertificateRevoked(string indexed certificateId, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Issue a new certificate
     */
    function issueCertificate(
        string memory certificateId,
        string memory studentId,
        string memory certificateType,
        string memory title,
        string memory description,
        bytes32 certificateHash,
        bytes32 ipfsHash,
        bytes memory blsSignature
    ) public onlyAdmin {
        require(!certificates[certificateId].exists, "Certificate already exists");

        certificates[certificateId] = CertificateRecord({
            certificateId: certificateId,
            studentId: studentId,
            certificateType: certificateType,
            title: title,
            description: description,
            certificateHash: certificateHash,
            ipfsHash: ipfsHash,
            blsSignature: blsSignature,
            issuedDate: block.timestamp,
            issuedBy: msg.sender,
            isRevoked: false,
            exists: true
        });

        studentCertificates[studentId].push(certificateId);
        totalCertificates++;
        emit CertificateIssued(
            certificateId,
            studentId,
            certificateType,
            certificateHash,
            ipfsHash,
            block.timestamp
        );
    }

    /**
     * @dev Get certificate details
     */
    function getCertificate(string memory certificateId) public view returns (CertificateRecord memory) {
        require(certificates[certificateId].exists, "Certificate does not exist");
        return certificates[certificateId];
    }

    /**
     * @dev Get all certificates for a student
     */
    function getStudentCertificates(string memory studentId) public view returns (string[] memory) {
        return studentCertificates[studentId];
    }

    /**
     * @dev Verify certificate hash
     */
    function verifyCertificateHash(string memory certificateId, bytes32 hash) public view returns (bool) {
        require(certificates[certificateId].exists, "Certificate does not exist");
        require(!certificates[certificateId].isRevoked, "Certificate has been revoked");
        return certificates[certificateId].certificateHash == hash;
    }

    /**
     * @dev Revoke a certificate
     */
    function revokeCertificate(string memory certificateId) public onlyAdmin {
        require(certificates[certificateId].exists, "Certificate does not exist");
        require(!certificates[certificateId].isRevoked, "Certificate already revoked");
        certificates[certificateId].isRevoked = true;
        emit CertificateRevoked(certificateId, block.timestamp);
    }

    /**
     * @dev Check if certificate is valid
     */
    function isCertificateValid(string memory certificateId) public view returns (bool) {
        require(certificates[certificateId].exists, "Certificate does not exist");
        return !certificates[certificateId].isRevoked;
    }
}


