const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Setting up roles with account:", deployer.address);

  // Get deployment info
  const deploymentPath = require('path').join(__dirname, "../deployments/localhost.json");
  const deployment = require(deploymentPath);

  // Define roles
  const ADMIN_ROLE = hre.ethers.id("ADMIN_ROLE");
  const FACULTY_ROLE = hre.ethers.id("FACULTY_ROLE");

  console.log("\n=== TranscriptManager ===");
  const TranscriptManager = await hre.ethers.getContractAt("TranscriptManager", deployment.contracts.TranscriptManager);
  
  console.log("Granting ADMIN_ROLE...");
  let tx = await TranscriptManager.grantRole(ADMIN_ROLE, deployer.address);
  await tx.wait();
  console.log("✓ ADMIN_ROLE granted");

  console.log("Granting FACULTY_ROLE...");
  tx = await TranscriptManager.grantRole(FACULTY_ROLE, deployer.address);
  await tx.wait();
  console.log("✓ FACULTY_ROLE granted");

  console.log("\n✅ All roles set up successfully!");
  console.log("Address with roles:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
