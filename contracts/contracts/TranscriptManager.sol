// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TranscriptManager
 * @dev Manages transcript requests and approvals on Student Chain
 */
contract TranscriptManager {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FACULTY_ROLE = keccak256("FACULTY_ROLE");

    mapping(bytes32 => mapping(address => bool)) public roles;

    struct TranscriptRequest {
        string requestId;
        string studentId;
        bytes32 transcriptHash;
        bytes32 ipfsHash;
        uint256 requestDate;
        uint256 approvalDate;
        address requestedBy;
        address approvedBy;
        RequestStatus status;
        bool exists;
    }

    enum RequestStatus {
        Pending,
        Approved,
        Rejected,
        Issued
    }

    mapping(string => TranscriptRequest) public requests;
    mapping(string => string[]) public studentRequests; // studentId => requestIds[]

    uint256 public totalRequests;

    event TranscriptRequested(
        string indexed requestId,
        string indexed studentId,
        address indexed requester,
        uint256 timestamp
    );

    event TranscriptApproved(
        string indexed requestId,
        string indexed studentId,
        address indexed approver,
        uint256 timestamp
    );

    event TranscriptRejected(
        string indexed requestId,
        string indexed studentId,
        address indexed approver,
        uint256 timestamp
    );

    event TranscriptIssued(
        string indexed requestId,
        string indexed studentId,
        bytes32 transcriptHash,
        bytes32 ipfsHash,
        uint256 timestamp
    );

    modifier hasRole(bytes32 _role) {
        require(roles[_role][msg.sender], "Caller does not have the required role");
        _;
    }

    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function _grantRole(bytes32 _role, address _account) internal {
        roles[_role][_account] = true;
    }

    function grantRole(bytes32 _role, address _account) public hasRole(ADMIN_ROLE) {
        _grantRole(_role, _account);
    }

    function revokeRole(bytes32 _role, address _account) public hasRole(ADMIN_ROLE) {
        roles[_role][_account] = false;
    }

    /**
     * @dev Request a transcript
     */
    function requestTranscript(
        string memory requestId,
        string memory studentId
    ) public {
        require(!requests[requestId].exists, "Request already exists");

        requests[requestId] = TranscriptRequest({
            requestId: requestId,
            studentId: studentId,
            transcriptHash: bytes32(0),
            ipfsHash: bytes32(0),
            requestDate: block.timestamp,
            approvalDate: 0,
            requestedBy: msg.sender,
            approvedBy: address(0),
            status: RequestStatus.Pending,
            exists: true
        });

        studentRequests[studentId].push(requestId);
        totalRequests++;
        emit TranscriptRequested(requestId, studentId, msg.sender, block.timestamp);
    }

    /**
     * @dev Approve a transcript request
     */
    function approveTranscript(string memory requestId) public hasRole(FACULTY_ROLE) {
        require(requests[requestId].exists, "Request does not exist");
        require(
            requests[requestId].status == RequestStatus.Pending,
            "Request is not pending"
        );

        requests[requestId].status = RequestStatus.Approved;
        requests[requestId].approvedBy = msg.sender;
        requests[requestId].approvalDate = block.timestamp;

        emit TranscriptApproved(requestId, requests[requestId].studentId, msg.sender, block.timestamp);
    }

    /**
     * @dev Reject a transcript request
     */
    function rejectTranscript(string memory requestId) public hasRole(FACULTY_ROLE) {
        require(requests[requestId].exists, "Request does not exist");
        require(
            requests[requestId].status == RequestStatus.Pending,
            "Request is not pending"
        );

        requests[requestId].status = RequestStatus.Rejected;
        requests[requestId].approvedBy = msg.sender;
        requests[requestId].approvalDate = block.timestamp;

        emit TranscriptRejected(requestId, requests[requestId].studentId, msg.sender, block.timestamp);
    }

    /**
     * @dev Issue a transcript (store hash)
     */
    function issueTranscript(
        string memory requestId,
        bytes32 transcriptHash,
        bytes32 ipfsHash
    ) public hasRole(ADMIN_ROLE) {
        require(requests[requestId].exists, "Request does not exist");
        require(
            requests[requestId].status == RequestStatus.Approved,
            "Request must be approved first"
        );

        requests[requestId].transcriptHash = transcriptHash;
        requests[requestId].ipfsHash = ipfsHash;
        requests[requestId].status = RequestStatus.Issued;

        emit TranscriptIssued(
            requestId,
            requests[requestId].studentId,
            transcriptHash,
            ipfsHash,
            block.timestamp
        );
    }

    /**
     * @dev Get transcript request details
     */
    function getRequest(string memory requestId) public view returns (TranscriptRequest memory) {
        require(requests[requestId].exists, "Request does not exist");
        return requests[requestId];
    }

    /**
     * @dev Get all requests for a student
     */
    function getStudentRequests(string memory studentId) public view returns (string[] memory) {
        return studentRequests[studentId];
    }

    /**
     * @dev Verify transcript hash
     */
    function verifyTranscriptHash(string memory requestId, bytes32 hash) public view returns (bool) {
        require(requests[requestId].exists, "Request does not exist");
        require(
            requests[requestId].status == RequestStatus.Issued,
            "Transcript not issued"
        );
        return requests[requestId].transcriptHash == hash;
    }
}


