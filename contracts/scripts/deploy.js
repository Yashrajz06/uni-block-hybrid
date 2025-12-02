const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy StudentRecord
  console.log("\nDeploying StudentRecord...");
  const StudentRecord = await hre.ethers.getContractFactory("StudentRecord");
  const studentRecord = await StudentRecord.deploy();
  await studentRecord.waitForDeployment();
  const studentRecordAddress = await studentRecord.getAddress();
  console.log("StudentRecord deployed to:", studentRecordAddress);

  // Deploy FacultyRecord
  console.log("\nDeploying FacultyRecord...");
  const FacultyRecord = await hre.ethers.getContractFactory("FacultyRecord");
  const facultyRecord = await FacultyRecord.deploy();
  await facultyRecord.waitForDeployment();
  const facultyRecordAddress = await facultyRecord.getAddress();
  console.log("FacultyRecord deployed to:", facultyRecordAddress);

  // Deploy TranscriptManager
  console.log("\nDeploying TranscriptManager...");
  const TranscriptManager = await hre.ethers.getContractFactory("TranscriptManager");
  const transcriptManager = await TranscriptManager.deploy();
  await transcriptManager.waitForDeployment();
  const transcriptManagerAddress = await transcriptManager.getAddress();
  console.log("TranscriptManager deployed to:", transcriptManagerAddress);
  
  // Grant ADMIN role to deployer on TranscriptManager
  try {
    console.log("Granting ADMIN role to deployer on TranscriptManager...");
    const ADMIN_ROLE = hre.ethers.id("ADMIN_ROLE");
    await transcriptManager.grantRole(ADMIN_ROLE, deployer.address);
    console.log("ADMIN role granted to:", deployer.address);
  } catch (error) {
    console.warn("Could not grant ADMIN role (may not be supported):", error.message);
  }

  // Deploy Certificate
  console.log("\nDeploying Certificate...");
  const Certificate = await hre.ethers.getContractFactory("Certificate");
  const certificate = await Certificate.deploy();
  await certificate.waitForDeployment();
  const certificateAddress = await certificate.getAddress();
  console.log("Certificate deployed to:", certificateAddress);

  // Deploy CredentialManager
  console.log("\nDeploying CredentialManager...");
  const CredentialManager = await hre.ethers.getContractFactory("CredentialManager");
  const credentialManager = await CredentialManager.deploy();
  await credentialManager.waitForDeployment();
  const credentialManagerAddress = await credentialManager.getAddress();
  console.log("CredentialManager deployed to:", credentialManagerAddress);
  
  // Try to grant ADMIN role if supported
  try {
    console.log("Granting ADMIN role to deployer on CredentialManager...");
    const ADMIN_ROLE = hre.ethers.id("ADMIN_ROLE");
    await credentialManager.grantRole(ADMIN_ROLE, deployer.address);
    console.log("ADMIN role granted to:", deployer.address);
  } catch (error) {
    console.warn("Could not grant ADMIN role (may not be supported):", error.message);
  }

  // Deploy AccessControlABE
  console.log("\nDeploying AccessControlABE...");
  const AccessControlABE = await hre.ethers.getContractFactory("AccessControlABE");
  const accessControlABE = await AccessControlABE.deploy();
  await accessControlABE.waitForDeployment();
  const accessControlABEAddress = await accessControlABE.getAddress();
  console.log("AccessControlABE deployed to:", accessControlABEAddress);

  // Save deployment addresses
  const network = await hre.ethers.provider.getNetwork();
  const deploymentInfo = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    contracts: {
      StudentRecord: studentRecordAddress,
      FacultyRecord: facultyRecordAddress,
      TranscriptManager: transcriptManagerAddress,
      Certificate: certificateAddress,
      CredentialManager: credentialManagerAddress,
      AccessControlABE: accessControlABEAddress
    },
    timestamp: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "../deployments", `${hre.network.name}.json`);
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ All contracts deployed successfully!");
  console.log("Deployment info saved to:", deploymentPath);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

