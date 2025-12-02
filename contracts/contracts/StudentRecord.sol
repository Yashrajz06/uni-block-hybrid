// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title StudentRecord
 * @dev Smart contract for managing student records on the Student Chain
 */
contract StudentRecord {
    struct Student {
        string studentId;
        string firstName;
        string lastName;
        uint256 enrollmentDate;
        string department;
        string program;
        uint256 currentSemester;
        uint256 cgpa;
        bytes32 recordHash;
        bool exists;
    }

    struct Transcript {
        string transcriptId;
        string studentId;
        bytes32 transcriptHash;
        bytes32 ipfsHash;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => Student) public students;
    mapping(string => Transcript) public transcripts;
    mapping(string => bool) public accessPermissions; // studentId => hasAccess

    address public admin;
    uint256 public totalStudents;
    uint256 public totalTranscripts;

    event StudentRegistered(
        string indexed studentId,
        bytes32 recordHash,
        uint256 timestamp
    );

    event TranscriptStored(
        string indexed transcriptId,
        string indexed studentId,
        bytes32 transcriptHash,
        bytes32 ipfsHash,
        uint256 timestamp
    );

    event AccessGranted(string indexed studentId, address indexed grantee, uint256 timestamp);
    event AccessRevoked(string indexed studentId, address indexed grantee, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Register a new student record
     */
    function registerStudent(
        string memory studentId,
        string memory firstName,
        string memory lastName,
        uint256 enrollmentDate,
        string memory department,
        string memory program,
        bytes32 recordHash
    ) public onlyAdmin {
        require(!students[studentId].exists, "Student already exists");

        students[studentId] = Student({
            studentId: studentId,
            firstName: firstName,
            lastName: lastName,
            enrollmentDate: enrollmentDate,
            department: department,
            program: program,
            currentSemester: 1,
            cgpa: 0,
            recordHash: recordHash,
            exists: true
        });

        totalStudents++;
        emit StudentRegistered(studentId, recordHash, block.timestamp);
    }

    /**
     * @dev Update student CGPA
     */
    function updateCGPA(string memory studentId, uint256 cgpa) public onlyAdmin {
        require(students[studentId].exists, "Student does not exist");
        students[studentId].cgpa = cgpa;
    }

    /**
     * @dev Update student semester
     */
    function updateSemester(string memory studentId, uint256 semester) public onlyAdmin {
        require(students[studentId].exists, "Student does not exist");
        students[studentId].currentSemester = semester;
    }

    /**
     * @dev Store transcript hash
     */
    function storeTranscript(
        string memory transcriptId,
        string memory studentId,
        bytes32 transcriptHash,
        bytes32 ipfsHash
    ) public onlyAdmin {
        require(students[studentId].exists, "Student does not exist");
        require(!transcripts[transcriptId].exists, "Transcript already exists");

        transcripts[transcriptId] = Transcript({
            transcriptId: transcriptId,
            studentId: studentId,
            transcriptHash: transcriptHash,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            exists: true
        });

        totalTranscripts++;
        emit TranscriptStored(transcriptId, studentId, transcriptHash, ipfsHash, block.timestamp);
    }

    /**
     * @dev Get student record
     */
    function getStudent(string memory studentId) public view returns (Student memory) {
        require(students[studentId].exists, "Student does not exist");
        return students[studentId];
    }

    /**
     * @dev Get transcript hash
     */
    function getTranscript(string memory transcriptId) public view returns (Transcript memory) {
        require(transcripts[transcriptId].exists, "Transcript does not exist");
        return transcripts[transcriptId];
    }

    /**
     * @dev Verify transcript hash
     */
    function verifyTranscriptHash(string memory transcriptId, bytes32 hash) public view returns (bool) {
        require(transcripts[transcriptId].exists, "Transcript does not exist");
        return transcripts[transcriptId].transcriptHash == hash;
    }

    /**
     * @dev Grant access to student records
     */
    function grantAccess(string memory studentId) public {
        require(students[studentId].exists, "Student does not exist");
        accessPermissions[studentId] = true;
        emit AccessGranted(studentId, msg.sender, block.timestamp);
    }

    /**
     * @dev Revoke access to student records
     */
    function revokeAccess(string memory studentId) public {
        require(students[studentId].exists, "Student does not exist");
        accessPermissions[studentId] = false;
        emit AccessRevoked(studentId, msg.sender, block.timestamp);
    }
}


