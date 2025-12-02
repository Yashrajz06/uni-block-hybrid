# Smart Contracts Documentation

## Overview

This directory contains all Solidity smart contracts for the Hybrid Blockchain University Data Management System.

## Contracts

### 1. StudentRecord.sol

Manages student records on the Student Chain.

**Functions:**
- `registerStudent()`: Register a new student
- `updateCGPA()`: Update student CGPA
- `updateSemester()`: Update current semester
- `storeTranscript()`: Store transcript hash
- `getStudent()`: Retrieve student record
- `getTranscript()`: Retrieve transcript
- `verifyTranscriptHash()`: Verify transcript hash
- `grantAccess()`: Grant access to records
- `revokeAccess()`: Revoke access

**Events:**
- `StudentRegistered`
- `TranscriptStored`
- `AccessGranted`
- `AccessRevoked`

### 2. FacultyRecord.sol

Manages faculty records and grades on Faculty/Admin Chain.

**Functions:**
- `registerFaculty()`: Register faculty member
- `uploadGrade()`: Upload student grade
- `uploadCourse()`: Upload course data
- `getFaculty()`: Get faculty record
- `getGrade()`: Get grade by ID
- `getStudentGrades()`: Get all grades for student
- `verifyGradeHash()`: Verify grade hash

**Events:**
- `FacultyRegistered`
- `GradeUploaded`
- `CourseUploaded`

### 3. TranscriptManager.sol

Manages transcript requests and approvals.

**Functions:**
- `requestTranscript()`: Request a transcript
- `approveTranscript()`: Approve request
- `rejectTranscript()`: Reject request
- `issueTranscript()`: Issue transcript with hash
- `getRequest()`: Get request details
- `getStudentRequests()`: Get all requests for student
- `verifyTranscriptHash()`: Verify transcript hash

**Events:**
- `TranscriptRequested`
- `TranscriptApproved`
- `TranscriptRejected`
- `TranscriptIssued`

### 4. Certificate.sol

Manages certificates and degrees on Institutional Chain.

**Functions:**
- `issueCertificate()`: Issue a certificate
- `getCertificate()`: Get certificate details
- `getStudentCertificates()`: Get all certificates for student
- `verifyCertificateHash()`: Verify certificate hash
- `revokeCertificate()`: Revoke a certificate
- `isCertificateValid()`: Check if certificate is valid

**Events:**
- `CertificateIssued`
- `CertificateRevoked`

### 5. CredentialManager.sol

Manages verifiable credentials and verification.

**Functions:**
- `issueCredential()`: Issue a credential
- `verifyCredential()`: Verify a credential
- `getCredential()`: Get credential details
- `getVerificationHistory()`: Get verification history
- `revokeCredential()`: Revoke a credential
- `isCredentialValid()`: Check if credential is valid

**Events:**
- `CredentialIssued`
- `CredentialVerified`
- `CredentialRevoked`

### 6. AccessControlABE.sol

Implements Attribute-Based Encryption (ABE) access control.

**Functions:**
- `assignAttribute()`: Assign attribute to user
- `createPolicy()`: Create access policy
- `checkAttributes()`: Check if user meets policy
- `grantAccess()`: Grant access to resource
- `revokeAccess()`: Revoke access
- `hasAccess()`: Check if user has access
- `getUserAttribute()`: Get user attribute
- `getUserAttributeKeys()`: Get all attribute keys

**Events:**
- `AttributeAssigned`
- `PolicyCreated`
- `AccessGranted`
- `AccessRevoked`

## Deployment

### Prerequisites
- Node.js 18+
- Hardhat
- Ethereum node (Ganache/Hardhat for development)

### Steps

1. **Install dependencies:**
```bash
cd contracts
npm install
```

2. **Compile contracts:**
```bash
npx hardhat compile
```

3. **Run tests:**
```bash
npx hardhat test
```

4. **Deploy contracts:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Configuration

Update `hardhat.config.js` with your network configuration:

```javascript
networks: {
  localhost: {
    url: "http://127.0.0.1:8545"
  },
  sepolia: {
    url: process.env.SEPOLIA_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

## Contract Addresses

After deployment, contract addresses are saved to:
```
contracts/deployments/{network}.json
```

## ABI Files

Compiled ABI files are available in:
```
contracts/artifacts/contracts/{ContractName}.sol/{ContractName}.json
```

## Security Considerations

1. **Access Control**: All contracts use `onlyAdmin` modifier for sensitive operations
2. **Input Validation**: Validate all inputs before processing
3. **Gas Optimization**: Contracts are optimized for gas efficiency
4. **Upgradeability**: Consider proxy patterns for future upgrades

## Testing

Run tests with:
```bash
npx hardhat test
```

Test files are located in `contracts/test/`

## Network Configuration

### Development
- Network: Hardhat local node
- Chain ID: 1337
- RPC URL: http://localhost:8545

### Production
- Network: Ethereum Mainnet / Sepolia Testnet
- Configure in `hardhat.config.js`
- Use environment variables for sensitive data


