# System Architecture

## Overview

The Hybrid Blockchain University Data Management System is a comprehensive solution for secure, scalable university data management using blockchain technology, IPFS distributed storage, and advanced cryptographic techniques.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Student    │  │   Faculty    │  │    Admin     │         │
│  │    Portal    │  │    Portal    │  │    Portal    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Public Verifier Portal                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth       │  │   Access     │  │   IPFS       │         │
│  │   Service    │  │   Control    │  │   Service   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Blockchain   │  │ Verification │  │   Security   │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MongoDB    │  │   IPFS       │  │  Blockchain  │  │   Security   │
│  (Metadata)  │  │  (Storage)   │  │  (Ethereum)  │  │  (ABE/BLS)   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

## Blockchain Architecture

### Multi-Chain Structure

```
┌─────────────────────────────────────────────────────────────┐
│              Hybrid Blockchain Network                       │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐│
│  │ Student Chain  │  │ Faculty Chain  │  │Institutional ││
│  │                │  │               │  │    Chain    ││
│  │ - Records      │  │ - Grades       │  │ - Degrees   ││
│  │ - Transcripts  │  │ - Courses      │  │ - Credentials││
│  └────────────────┘  └────────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Smart Contracts

1. **StudentRecord.sol**
   - Manages student records on Student Chain
   - Stores student information and transcript hashes
   - Handles access permissions

2. **FacultyRecord.sol**
   - Manages faculty records and grades on Faculty/Admin Chain
   - Stores grade and course data
   - Handles grade uploads

3. **TranscriptManager.sol**
   - Manages transcript requests and approvals
   - Stores transcript hashes
   - Handles request workflow

4. **Certificate.sol**
   - Manages certificates and degrees on Institutional Chain
   - Stores certificate hashes and BLS signatures
   - Handles certificate issuance and revocation

5. **CredentialManager.sol**
   - Manages verifiable credentials
   - Handles credential verification
   - Calculates authenticity scores

6. **AccessControlABE.sol**
   - Implements Attribute-Based Encryption (ABE)
   - Manages access policies
   - Handles attribute assignment and policy evaluation

## Data Flow

### Transcript Request Flow

```
Student → Request Transcript → Backend API
                                    │
                                    ▼
                            Store in MongoDB
                                    │
                                    ▼
                            Create Blockchain Transaction
                                    │
                                    ▼
                            Faculty/Admin Approval
                                    │
                                    ▼
                            Generate Transcript
                                    │
                                    ▼
                            Upload to IPFS
                                    │
                                    ▼
                            Store Hash on Blockchain
                                    │
                                    ▼
                            Generate QR Code
                                    │
                                    ▼
                            Issue to Student
```

### Certificate Issuance Flow

```
Admin → Issue Certificate → Backend API
                                │
                                ▼
                        Create Certificate Data
                                │
                                ▼
                        Upload to IPFS
                                │
                                ▼
                        Generate Hash (SHA-256)
                                │
                                ▼
                        Generate BLS Signature
                                │
                                ▼
                        Store on Blockchain
                                │
                                ▼
                        Generate QR Code
                                │
                                ▼
                        Issue to Student
```

### Verification Flow

```
Verifier → Scan QR / Enter ID → Backend API
                                        │
                                        ▼
                                Fetch from Blockchain
                                        │
                                        ▼
                                Retrieve from IPFS
                                        │
                                        ▼
                                Verify Hash Match
                                        │
                                        ▼
                                Verify BLS Signature
                                        │
                                        ▼
                                Calculate Freshness
                                        │
                                        ▼
                                Calculate Score
                                        │
                                        ▼
                                Return Result
```

## Security Architecture

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication
- **Role-Based Access Control (RBAC)**: Student, Faculty, Admin, Verifier
- **Attribute-Based Encryption (ABE)**: Policy-based access control

### Cryptographic Components

1. **SHA-256 Hashing**: Document integrity verification
2. **BLS Aggregate Signatures**: Multi-party signature verification
3. **AES-256-GCM Encryption**: Data encryption at rest
4. **JWT Tokens**: Secure session management

### Access Control Model

```
User Attributes → Policy Evaluation → Access Decision
     │                  │                    │
     │                  │                    │
  ABE Logic      Required Attributes    Grant/Deny
```

## Storage Architecture

### MongoDB (Metadata)
- User profiles
- Transaction records
- Access logs
- IPFS references
- Blockchain hash mappings

### IPFS (Distributed Storage)
- Transcript documents
- Certificate documents
- Large files
- Immutable content

### Blockchain (Hash Storage)
- Student record hashes
- Transcript hashes
- Certificate hashes
- Access permissions
- Verification history

## Verification Score Calculation

```
Vscore = w1·Hmatch + w2·Svalid + w3·Tfresh

Where:
- Hmatch: Hash match score (0-1)
- Svalid: Signature validity (0-1)
- Tfresh: Timestamp freshness (0-1)
- w1, w2, w3: Weight factors (default: 0.4, 0.4, 0.2)
```

## Scalability Considerations

1. **Horizontal Scaling**: Backend API can be scaled using load balancers
2. **Database Sharding**: MongoDB can be sharded by department or resource type
3. **IPFS Clustering**: Multiple IPFS nodes for redundancy
4. **Blockchain Layer 2**: Consider Layer 2 solutions for high throughput

## Deployment Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│  MongoDB    │
│  (Nginx)    │     │  (Node.js)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ├────▶ IPFS Node
                            │
                            └────▶ Blockchain Node
```

## Technology Stack

- **Frontend**: React, Material-UI, Vite
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Blockchain**: Ethereum (Solidity), Web3.js/Ethers.js
- **Storage**: IPFS
- **Security**: JWT, ABE, BLS, SHA-256
- **Containerization**: Docker, Docker Compose
- **Deployment**: Kubernetes (optional)


