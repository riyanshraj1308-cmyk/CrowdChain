import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Loads deployment info written by scripts/deploy.js. Falls back to
 * CONTRACT_ADDRESS + a bundled ABI if the deployment file isn't present
 * (e.g. when pointing at an already-deployed testnet contract).
 */
function loadDeployment() {
  const contractsDir = path.join(import.meta.dirname, "contracts");
  const latestPath = path.join(contractsDir, "Crowdfunding.latest.json");

  if (fs.existsSync(latestPath)) {
    const raw = fs.readFileSync(latestPath, "utf-8");
    return JSON.parse(raw);
  }

  if (!env.CONTRACT_ADDRESS) {
    throw new Error(
      "No deployment file found and CONTRACT_ADDRESS is not set. Run `npm run hardhat:deploy` first."
    );
  }

  // Minimal ABI fallback (only what the backend needs) if no artifact is available.
  const abiPath = path.join(contractsDir, "Crowdfunding.abi.json");
  const abi = fs.existsSync(abiPath) ? JSON.parse(fs.readFileSync(abiPath, "utf-8")) : [];

  return {
    network: "custom",
    chainId: env.CHAIN_ID,
    address: env.CONTRACT_ADDRESS,
    abi,
  };
}

let provider = null;
let deployment = null;

export function getProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(env.RPC_URL);
  }
  return provider;
}

export function getDeployment() {
  if (!deployment) {
    deployment = loadDeployment();
    logger.info(`Loaded Crowdfunding deployment at ${deployment.address} (chainId ${deployment.chainId})`);
  }
  return deployment;
}

/** Read-only contract instance, suitable for queries and event listening. */
export function getReadOnlyContract() {
  const { address, abi } = getDeployment();
  return new ethers.Contract(address, abi, getProvider());
}
