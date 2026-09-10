import { defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

// Granular Hardhat plugins are used instead of the monolithic
// @nomicfoundation/hardhat-toolbox-mocha-ethers. The toolbox bundles
// hardhat-ignition, hardhat-verify, and hardhat-gas-reporter — none of
// which this project uses — so importing only what's actually used keeps
// the dependency tree (and `npm audit`) lean. TypeChain is dropped: the
// backend is plain JavaScript now.
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import chaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";
import networkHelpers from "@nomicfoundation/hardhat-network-helpers";
import mocha from "@nomicfoundation/hardhat-mocha";

dotenv.config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

export default defineConfig({
  plugins: [hardhatEthers, chaiMatchers, networkHelpers, mocha],
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 31337,
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    ...(SEPOLIA_RPC_URL
      ? {
          sepolia: {
            type: "http",
            url: SEPOLIA_RPC_URL,
            accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
            chainId: 11155111,
          },
        }
      : {}),
  },
  paths: {
    sources: "./contracts",
    tests: "./test/contract",
    cache: "./cache",
    artifacts: "./artifacts",
  },
});
