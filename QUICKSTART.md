# Quick Start Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB 6+
- IPFS node (or use Infura IPFS)
- Ethereum node (Ganache or Hardhat for development)
- Docker and Docker Compose (optional)

## Installation Steps

### 1. Clone and Setup

```bash
cd project
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

**Required .env variables:**
```
MONGODB_URI=mongodb://localhost:27017/university_blockchain
JWT_SECRET=your-secret-key
BLOCKCHAIN_RPC_URL=http://localhost:8545
IPFS_API_URL=/ip4/127.0.0.1/tcp/5001

# Contract addresses (from deployment)
STUDENT_RECORD_CONTRACT_ADDRESS=0x0165878A594ca255338adfa4d48449f69242Eb8F
FACULTY_RECORD_CONTRACT_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
TRANSCRIPT_MANAGER_CONTRACT_ADDRESS=0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
CERTIFICATE_CONTRACT_ADDRESS=0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
CREDENTIAL_MANAGER_CONTRACT_ADDRESS=0x610178dA211FEF7D417bC0e6FeD39F05609AD788
ACCESS_CONTROL_ABE_CONTRACT_ADDRESS=0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e

# Private key (optional - only needed for write operations)
# Get from Hardhat: Use the first account's private key from 'npx hardhat node'
# For localhost, you can use: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
PRIVATE_KEY=your-private-key-here
```

**Note:** The `PRIVATE_KEY` is optional. If not provided, the backend will start in read-only mode (can read from blockchain but cannot write transactions). For local development with Hardhat, you can use the first account's private key from the Hardhat node output.

### 3. Smart Contracts Setup

```bash
cd ../contracts
npm install
npx hardhat compile
```

### 4. Deploy Contracts

```bash
# Start local blockchain node
npx hardhat node

# In another terminal, deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

**Copy contract addresses to backend/.env:**
After deployment, copy the addresses from `contracts/deployments/localhost.json` to your `backend/.env` file.

**Get Private Key for Write Operations:**
If you're using Hardhat local node, the private key for the first account (deployer) is:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```
Add this to your `backend/.env` as `PRIVATE_KEY`. Without it, the backend will work in read-only mode.

### 5. Frontend Setup

```bash
cd ../frontend
npm install
```

### 6. Start Services

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - IPFS:**
```bash
ipfs daemon
```

**Terminal 3 - Backend:**
```bash
cd backend
npm start
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm run dev
```

### 7. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

## Docker Deployment (Alternative)

```bash
# Start all services
cd docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## First Steps

1. **Register a Student:**
   - Go to http://localhost:3000/register
   - Fill in student details
   - Login with credentials

2. **Register Faculty/Admin:**
   - Register with role "faculty" or "admin"
   - Login to respective portal

3. **Test Workflow:**
   - Student requests transcript
   - Faculty/Admin approves
   - Admin issues transcript
   - Student downloads with QR code
   - Verify using Public Verifier Portal

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in .env

### IPFS Connection Error
- Start IPFS daemon: `ipfs daemon`
- Check IPFS_API_URL in .env

### Blockchain Connection Error
- Start Hardhat node: `npx hardhat node`
- Check BLOCKCHAIN_RPC_URL in .env
- Ensure contracts are deployed

### Frontend Build Error
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## Development Mode

For development with hot reload:

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## Testing

```bash
# Backend tests
cd backend
npm test

# Contract tests
cd contracts
npx hardhat test
```

## Production Deployment

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Set production environment variables

3. Use Docker Compose for production:
```bash
docker-compose -f docker-compose.yml up -d
```

## Support

For issues or questions, refer to:
- [API Documentation](./docs/api/README.md)
- [Architecture Guide](./docs/architecture/README.md)
- [User Guide](./docs/user-guide/README.md)

