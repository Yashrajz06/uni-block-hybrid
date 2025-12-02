# Hybrid Blockchain University Data Management System

## 📌 Project Overview

A comprehensive hybrid blockchain architecture for secure, scalable university data management with:
- Multi-chain blockchain layer (Student, Faculty/Admin, Institutional)
- IPFS distributed storage
- Attribute-Based Encryption (ABE)
- BLS aggregate signatures
- Verifiable credential system with QR codes
- Role-based access control

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Student  │  │ Faculty  │  │  Admin   │  │ Verifier │   │
│  │  Portal  │  │  Portal  │  │  Portal  │  │  Portal  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Node.js + Express)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │  Access  │  │   IPFS   │  │Blockchain│   │
│  │ Service  │  │ Control  │  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MongoDB    │  │   IPFS       │  │  Blockchain  │  │   Security   │
│  (Metadata)  │  │  (Storage)   │  │  (Ethereum)  │  │  (ABE/BLS)   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Blockchain Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Hybrid Blockchain Network                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Student Chain│  │ Faculty Chain │  │Institutional│     │
│  │              │  │               │  │    Chain    │     │
│  │ - Records    │  │ - Grades      │  │ - Degrees   │     │
│  │ - Transcripts│  │ - Courses     │  │ - Credentials│    │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
project/
├── contracts/              # Solidity smart contracts
│   ├── StudentRecord.sol
│   ├── FacultyRecord.sol
│   ├── CredentialManager.sol
│   ├── Certificate.sol
│   ├── TranscriptManager.sol
│   └── AccessControlABE.sol
├── backend/                # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── config/
│   ├── tests/
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
├── docs/                   # Documentation
│   ├── api/
│   ├── architecture/
│   └── user-guide/
├── docker/                 # Docker configurations
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- IPFS node (or Infura IPFS)
- Ethereum node (Ganache/Hardhat for development)
- MetaMask or Web3 wallet

### Installation

1. **Clone and install dependencies:**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Smart Contracts
cd ../contracts
npm install
```

2. **Configure environment variables:**

```bash
# Backend .env
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend .env
cp frontend/.env.example frontend/.env
```

3. **Start services:**

```bash
# Start MongoDB
mongod

# Start IPFS (if local)
ipfs daemon

# Start blockchain (Ganache/Hardhat)
npx hardhat node

# Deploy contracts
cd contracts
npx hardhat run scripts/deploy.js

# Start backend
cd backend
npm start

# Start frontend
cd frontend
npm start
```

## 🔐 Security Features

- **Attribute-Based Encryption (ABE)**: Policy-based access control
- **BLS Aggregate Signatures**: Efficient multi-party verification
- **JWT Authentication**: Secure session management
- **Role-Based Access Control (RBAC)**: Granular permissions
- **IPFS Hash Verification**: Document integrity checks
- **Blockchain Immutability**: Tamper-proof records

## 📊 Verification Score Formula

```
Vscore = w1·Hmatch + w2·Svalid + w3·Tfresh

Where:
- Hmatch: Hash match score (0-1)
- Svalid: Signature validity (0-1)
- Tfresh: Timestamp freshness (0-1)
- w1, w2, w3: Weight factors (default: 0.4, 0.4, 0.2)
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Contract tests
cd contracts
npx hardhat test
```

## 📚 Documentation

- [API Documentation](./docs/api/README.md)
- [Architecture Details](./docs/architecture/README.md)
- [User Guide](./docs/user-guide/README.md)
- [Smart Contract Documentation](./contracts/README.md)

## 🤝 Contributing

This is a production-ready system for university data management. Follow security best practices when deploying.

## 📄 License

MIT License


