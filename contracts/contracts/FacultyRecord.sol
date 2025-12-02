// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FacultyRecord
 * @dev Smart contract for managing faculty records and grades on Faculty/Admin Chain
 */
contract FacultyRecord {
    struct Faculty {
        string facultyId;
        string firstName;
        string lastName;
        string department;
        string designation;
        bytes32 recordHash;
        bool exists;
    }

    struct Grade {
        string gradeId;
        string studentId;
        string courseCode;
        string courseName;
        string letterGrade;
        uint256 credits;
        uint256 semester;
        uint256 year;
        bytes32 gradeHash;
        uint256 timestamp;
        bool exists;
    }

    struct Course {
        string courseCode;
        string courseName;
        string facultyId;
        uint256 semester;
        uint256 year;
        bytes32 courseHash;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => Faculty) public faculty;
    mapping(string => Grade) public grades;
    mapping(string => Course) public courses;
    mapping(string => string[]) public studentGrades; // studentId => gradeIds[]

    address public admin;
    uint256 public totalFaculty;
    uint256 public totalGrades;
    uint256 public totalCourses;

    event FacultyRegistered(
        string indexed facultyId,
        bytes32 recordHash,
        uint256 timestamp
    );

    event GradeUploaded(
        string indexed gradeId,
        string indexed studentId,
        string courseCode,
        bytes32 gradeHash,
        uint256 timestamp
    );

    event CourseUploaded(
        string indexed courseCode,
        string indexed facultyId,
        bytes32 courseHash,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyFaculty(string memory facultyId) {
        require(faculty[facultyId].exists, "Faculty does not exist");
        require(
            keccak256(bytes(faculty[facultyId].facultyId)) == keccak256(bytes(facultyId)),
            "Unauthorized faculty"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Register a new faculty member
     */
    function registerFaculty(
        string memory facultyId,
        string memory firstName,
        string memory lastName,
        string memory department,
        string memory designation,
        bytes32 recordHash
    ) public onlyAdmin {
        require(!faculty[facultyId].exists, "Faculty already exists");

        faculty[facultyId] = Faculty({
            facultyId: facultyId,
            firstName: firstName,
            lastName: lastName,
            department: department,
            designation: designation,
            recordHash: recordHash,
            exists: true
        });

        totalFaculty++;
        emit FacultyRegistered(facultyId, recordHash, block.timestamp);
    }

    /**
     * @dev Upload grade for a student
     */
    function uploadGrade(
        string memory gradeId,
        string memory studentId,
        string memory courseCode,
        string memory courseName,
        string memory letterGrade,
        uint256 credits,
        uint256 semester,
        uint256 year,
        bytes32 gradeHash
    ) public onlyAdmin {
        require(!grades[gradeId].exists, "Grade already exists");

        grades[gradeId] = Grade({
            gradeId: gradeId,
            studentId: studentId,
            courseCode: courseCode,
            courseName: courseName,
            letterGrade: letterGrade,
            credits: credits,
            semester: semester,
            year: year,
            gradeHash: gradeHash,
            timestamp: block.timestamp,
            exists: true
        });

        studentGrades[studentId].push(gradeId);
        totalGrades++;
        emit GradeUploaded(gradeId, studentId, courseCode, gradeHash, block.timestamp);
    }

    /**
     * @dev Upload course data
     */
    function uploadCourse(
        string memory courseCode,
        string memory courseName,
        string memory facultyId,
        uint256 semester,
        uint256 year,
        bytes32 courseHash
    ) public onlyAdmin {
        require(!courses[courseCode].exists, "Course already exists");

        courses[courseCode] = Course({
            courseCode: courseCode,
            courseName: courseName,
            facultyId: facultyId,
            semester: semester,
            year: year,
            courseHash: courseHash,
            timestamp: block.timestamp,
            exists: true
        });

        totalCourses++;
        emit CourseUploaded(courseCode, facultyId, courseHash, block.timestamp);
    }

    /**
     * @dev Get faculty record
     */
    function getFaculty(string memory facultyId) public view returns (Faculty memory) {
        require(faculty[facultyId].exists, "Faculty does not exist");
        return faculty[facultyId];
    }

    /**
     * @dev Get grade by ID
     */
    function getGrade(string memory gradeId) public view returns (Grade memory) {
        require(grades[gradeId].exists, "Grade does not exist");
        return grades[gradeId];
    }

    /**
     * @dev Get all grades for a student
     */
    function getStudentGrades(string memory studentId) public view returns (string[] memory) {
        return studentGrades[studentId];
    }

    /**
     * @dev Verify grade hash
     */
    function verifyGradeHash(string memory gradeId, bytes32 hash) public view returns (bool) {
        require(grades[gradeId].exists, "Grade does not exist");
        return grades[gradeId].gradeHash == hash;
    }
}


