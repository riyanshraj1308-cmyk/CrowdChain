import { network } from "hardhat";
// Pulls in hardhat-ethers' NetworkConnection augmentation (connection.ethers).
import "@nomicfoundation/hardhat-ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const connection = await network.getOrCreate();
  const { ethers } = connection;

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying Crowdfunding contract with account: ${deployer.address}`);
  console.log(`Network: ${connection.networkName} (chainId ${connection.networkConfig.chainId})`);

  const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy();
  await crowdfunding.waitForDeployment();

  const address = await crowdfunding.getAddress();
  console.log(`Crowdfunding deployed to: ${address}`);

  // Persist deployment info so the backend can pick up the address + ABI automatically.
  const artifact = JSON.parse(
    fs.readFileSync(
      path.join(import.meta.dirname, "..", "artifacts", "contracts", "Crowdfunding.sol", "Crowdfunding.json"),
      "utf-8"
    )
  );

  const deploymentInfo = {
    network: connection.networkName,
    chainId: connection.networkConfig.chainId,
    address,
    deployerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  const outDir = path.join(import.meta.dirname, "..", "src", "blockchain", "contracts");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, `Crowdfunding.${connection.networkName}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  // Also write a "latest" pointer used by the backend in local dev.
  fs.writeFileSync(
    path.join(outDir, "Crowdfunding.latest.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`Deployment info written to src/blockchain/contracts/Crowdfunding.${connection.networkName}.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
