// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AccessControlABE
 * @dev Attribute-Based Encryption (ABE) access control implementation
 * Implements CP-ABE (Ciphertext-Policy Attribute-Based Encryption) logic
 */
contract AccessControlABE {
    struct Attribute {
        string key;
        string value;
        bool exists;
    }

    struct AccessPolicy {
        string policyId;
        string resourceType; // "transcript", "certificate", "record"
        string resourceId;
        string[] requiredAttributes; // Array of attribute keys required
        mapping(string => string) attributeValues; // attribute key => required value
        address[] authorizedAddresses;
        bool isActive;
    }

    struct UserAttributes {
        address userAddress;
        mapping(string => string) attributes; // attribute key => value
        string[] attributeKeys;
    }

    mapping(address => UserAttributes) public userAttributes;
    mapping(string => AccessPolicy) public policies;
    mapping(string => mapping(address => bool)) public accessGrants; // resourceId => user => hasAccess

    address public admin;
    uint256 public totalPolicies;
    uint256 public totalUsers;

    event AttributeAssigned(address indexed user, string key, string value, uint256 timestamp);
    event PolicyCreated(string indexed policyId, string resourceType, string resourceId, uint256 timestamp);
    event AccessGranted(string indexed resourceId, address indexed user, uint256 timestamp);
    event AccessRevoked(string indexed resourceId, address indexed user, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Assign attributes to a user
     */
    function assignAttribute(
        address userAddress,
        string memory key,
        string memory value
    ) public onlyAdmin {
        UserAttributes storage user = userAttributes[userAddress];
        
        if (user.attributeKeys.length == 0) {
            totalUsers++;
        }

        // Check if attribute key already exists
        bool keyExists = false;
        for (uint256 i = 0; i < user.attributeKeys.length; i++) {
            if (keccak256(bytes(user.attributeKeys[i])) == keccak256(bytes(key))) {
                keyExists = true;
                break;
            }
        }

        if (!keyExists) {
            user.attributeKeys.push(key);
        }

        user.attributes[key] = value;
        emit AttributeAssigned(userAddress, key, value, block.timestamp);
    }

    /**
     * @dev Create an access policy
     */
    function createPolicy(
        string memory policyId,
        string memory resourceType,
        string memory resourceId,
        string[] memory requiredAttributes,
        string[] memory requiredValues,
        address[] memory authorizedAddresses
    ) public onlyAdmin {
        require(requiredAttributes.length == requiredValues.length, "Attributes and values length mismatch");

        AccessPolicy storage policy = policies[policyId];
        policy.policyId = policyId;
        policy.resourceType = resourceType;
        policy.resourceId = resourceId;
        policy.requiredAttributes = requiredAttributes;
        policy.authorizedAddresses = authorizedAddresses;
        policy.isActive = true;

        for (uint256 i = 0; i < requiredAttributes.length; i++) {
            policy.attributeValues[requiredAttributes[i]] = requiredValues[i];
        }

        totalPolicies++;
        emit PolicyCreated(policyId, resourceType, resourceId, block.timestamp);
    }

    /**
     * @dev Check if user has required attributes for access
     */
    function checkAttributes(address userAddress, string memory policyId) public view returns (bool) {
        AccessPolicy storage policy = policies[policyId];
        require(policy.isActive, "Policy is not active");

        UserAttributes storage user = userAttributes[userAddress];

        // Check if user has all required attributes with matching values
        for (uint256 i = 0; i < policy.requiredAttributes.length; i++) {
            string memory requiredKey = policy.requiredAttributes[i];
            string memory requiredValue = policy.attributeValues[requiredKey];
            
            // Check if user has this attribute
            bool hasAttribute = false;
            string memory userValue = "";
            
            for (uint256 j = 0; j < user.attributeKeys.length; j++) {
                if (keccak256(bytes(user.attributeKeys[j])) == keccak256(bytes(requiredKey))) {
                    hasAttribute = true;
                    userValue = user.attributes[requiredKey];
                    break;
                }
            }

            if (!hasAttribute || keccak256(bytes(userValue)) != keccak256(bytes(requiredValue))) {
                return false;
            }
        }

        return true;
    }

    /**
     * @dev Grant access to a resource
     */
    function grantAccess(
        string memory resourceId,
        address userAddress,
        string memory policyId
    ) public onlyAdmin {
        require(policies[policyId].isActive, "Policy is not active");
        
        // Check if user meets policy requirements
        bool hasAccess = checkAttributes(userAddress, policyId);
        require(hasAccess, "User does not meet policy requirements");

        accessGrants[resourceId][userAddress] = true;
        emit AccessGranted(resourceId, userAddress, block.timestamp);
    }

    /**
     * @dev Revoke access to a resource
     */
    function revokeAccess(string memory resourceId, address userAddress) public onlyAdmin {
        accessGrants[resourceId][userAddress] = false;
        emit AccessRevoked(resourceId, userAddress, block.timestamp);
    }

    /**
     * @dev Check if user has access to a resource
     */
    function hasAccess(string memory resourceId, address userAddress) public view returns (bool) {
        return accessGrants[resourceId][userAddress];
    }

    /**
     * @dev Get user attributes
     */
    function getUserAttribute(address userAddress, string memory key) public view returns (string memory) {
        return userAttributes[userAddress].attributes[key];
    }

    /**
     * @dev Get all attribute keys for a user
     */
    function getUserAttributeKeys(address userAddress) public view returns (string[] memory) {
        return userAttributes[userAddress].attributeKeys;
    }
}


