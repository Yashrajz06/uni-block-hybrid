# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "password123",
  "role": "student",
  "firstName": "John",
  "lastName": "Doe",
  "studentId": "STU001",
  "department": "Computer Science",
  "program": "B.Tech"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "student@university.edu",
    "role": "student"
  }
}
```

### POST /auth/login
Login user.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "student@university.edu",
    "role": "student"
  }
}
```

### GET /auth/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "student@university.edu",
    "role": "student"
  },
  "profile": {
    "studentId": "STU001",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

## Student Endpoints

### GET /student/profile
Get student profile.

### GET /student/academic-history
Get academic history (transcripts, certificates).

### POST /student/transcript/request
Request a transcript.

**Response:**
```json
{
  "message": "Transcript request created",
  "transcriptRequest": {
    "requestId": "TRX-1234567890-STU001",
    "status": "pending"
  }
}
```

### GET /student/transcripts
Get all transcripts for student.

### GET /student/certificates
Get all certificates for student.

### GET /student/credential/:type/:id
Download credential (transcript or certificate).

**Parameters:**
- `type`: `transcript` or `certificate`
- `id`: Request ID or Certificate ID

### POST /student/access/grant
Grant access to a resource.

**Request Body:**
```json
{
  "resourceType": "transcript",
  "resourceId": "resource_id",
  "verifierId": "verifier_id"
}
```

### POST /student/access/revoke
Revoke access to a resource.

---

## Faculty Endpoints

### GET /faculty/profile
Get faculty profile.

### POST /faculty/grade/upload
Upload a grade.

**Request Body:**
```json
{
  "studentId": "STU001",
  "courseCode": "CS101",
  "courseName": "Introduction to Computer Science",
  "letterGrade": "A",
  "credits": 3,
  "semester": 1,
  "year": 2024
}
```

### POST /faculty/course/upload
Upload course data.

### POST /faculty/transcript/approve/:requestId
Approve a transcript request.

### GET /faculty/audit-logs
Get audit logs.

---

## Admin Endpoints

### GET /admin/profile
Get admin profile.

### POST /admin/certificate/issue
Issue a certificate.

**Request Body:**
```json
{
  "studentId": "STU001",
  "type": "degree",
  "title": "Bachelor of Technology",
  "description": "Computer Science"
}
```

### POST /admin/transcript/issue
Issue a transcript.

**Request Body:**
```json
{
  "requestId": "TRX-1234567890-STU001",
  "courses": [
    {
      "courseCode": "CS101",
      "courseName": "Introduction to Computer Science",
      "credits": 3,
      "grade": "A",
      "semester": 1,
      "year": 2024
    }
  ]
}
```

### GET /admin/audit-logs
Get comprehensive audit logs.

---

## Verification Endpoints

### POST /verify/qr
Verify credential using QR code.

**Request Body:**
```json
{
  "qrData": "{\"type\":\"transcript\",\"id\":\"TRX-123\",\"hash\":\"...\"}"
}
```

**Response:**
```json
{
  "verified": true,
  "score": 95,
  "details": {
    "hashMatch": true,
    "ipfsValid": true,
    "signatureValid": true,
    "timestampFreshness": 1.0
  }
}
```

### POST /verify/:type/:id
Verify credential by ID.

**Parameters:**
- `type`: `transcript` or `certificate`
- `id`: Credential ID

**Request Body:**
```json
{
  "hash": "hash_value",
  "ipfsHash": "ipfs_hash"
}
```

### GET /verify/history/:credentialId
Get verification history for a credential.

---

## Blockchain Endpoints

### GET /blockchain/student/:studentId
Get student record from blockchain.

### GET /blockchain/transcript/:transcriptId
Get transcript hash from blockchain.

### GET /blockchain/certificate/:certificateId
Get certificate hash from blockchain.

### GET /blockchain/hashes
Get blockchain hash records.

**Query Parameters:**
- `resourceType`: Filter by resource type
- `resourceId`: Filter by resource ID

---

## IPFS Endpoints

### POST /ipfs/upload
Upload file to IPFS.

**Headers:** `Authorization: Bearer <token>`

**Request:** Multipart form data with `file` field.

**Response:**
```json
{
  "message": "File uploaded to IPFS successfully",
  "ipfsHash": "QmHash...",
  "gatewayUrl": "https://ipfs.io/ipfs/QmHash..."
}
```

### GET /ipfs/:ipfsHash
Retrieve file from IPFS.

### GET /ipfs/reference/:ipfsHash
Get IPFS reference metadata.

### POST /ipfs/verify
Verify IPFS hash.

**Request Body:**
```json
{
  "ipfsHash": "QmHash...",
  "expectedHash": "sha256_hash"
}
```

---

## Access Control Endpoints

### POST /access/check
Check access to a resource.

**Request Body:**
```json
{
  "resourceId": "resource_id",
  "resourceType": "transcript"
}
```

### POST /access/policy/evaluate
Evaluate ABE policy.

**Request Body:**
```json
{
  "policy": {
    "requiredAttributes": [
      { "key": "role", "value": "student" }
    ]
  },
  "userAttributes": {
    "role": "student",
    "department": "CS"
  }
}
```

### GET /access/logs
Get access logs.

**Query Parameters:**
- `resourceId`: Filter by resource ID
- `resourceType`: Filter by resource type

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable


