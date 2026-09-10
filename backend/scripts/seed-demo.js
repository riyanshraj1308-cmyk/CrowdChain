/**
 * Demo / seed script.
 *
 * Walks the ENTIRE flow end-to-end against a running local Hardhat node and a
 * running backend API:
 *   1. Deployer account creates a campaign directly on-chain
 *   2. Two demo accounts contribute until the goal is reached
 *   3. Creator authenticates with the backend (wallet signature -> JWT)
 *   4. Campaign metadata is indexed into MongoDB via POST /api/campaigns
 *   5. Contributions are recorded via POST /api/campaigns/:id/contribute
 *   6. Creator submits milestone 0, contributors vote and it is finalized
 *   7. Milestone funds are released and recorded via the API
 *
 * Usage (after `npx hardhat node` and `npm run hardhat:deploy` and `npm run dev`
 * are all running in separate terminals):
 *   npm run seed:demo
 */
import { network } from "hardhat";
// Pulls in hardhat-ethers' NetworkConnection augmentation (connection.ethers).
import "@nomicfoundation/hardhat-ethers";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const API_BASE = process.env.API_BASE_URL || "http://localhost:4000/api";

// Hardhat 3: ethers lives on the network connection, not the global hre.
const { ethers } = await network.getOrCreate();

async function authenticate(wallet, address) {
  const nonceRes = await axios.post(`${API_BASE}/auth/nonce`, { walletAddress: address });
  const { message } = nonceRes.data.data;
  const signature = await wallet.signMessage(message);
  const verifyRes = await axios.post(`${API_BASE}/auth/verify`, { walletAddress: address, signature });
  return verifyRes.data.data.token;
}

async function main() {
  const deploymentPath = path.join(
    import.meta.dirname,
    "..",
    "src",
    "blockchain",
    "contracts",
    "Crowdfunding.latest.json"
  );
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("No deployment found. Run `npm run hardhat:deploy` first.");
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  const [deployerSigner, aliceSigner, bobSigner] = await ethers.getSigners();
  const contract = new ethers.Contract(deployment.address, deployment.abi, deployerSigner);

  console.log("1. Creating campaign on-chain...");
  const goal = ethers.parseEther("3");
  const milestoneAmounts = [ethers.parseEther("1"), ethers.parseEther("2")];
  const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  const createTx = await contract.createCampaign(goal, deadline, milestoneAmounts);
  const createReceipt = await createTx.wait();
  const campaignId = 0; // first campaign in a fresh deployment
  console.log(`   Campaign created on-chain with id ${campaignId}, tx ${createReceipt.hash}`);

  console.log("2. Authenticating creator with backend...");
  const creatorToken = await authenticate(deployerSigner, deployerSigner.address);

  console.log("3. Indexing campaign metadata into MongoDB...");
  const campaignRes = await axios.post(
    `${API_BASE}/campaigns`,
    {
      contractCampaignId: campaignId,
      contractAddress: deployment.address,
      chainId: deployment.chainId,
      creationTxHash: createReceipt.hash,
      title: "Clean Water Wells for Rural Villages",
      description:
        "Funding the drilling and installation of solar-powered water wells for three villages.",
      imageUrl: "https://example.com/images/water-well.jpg",
      goal: goal.toString(),
      deadline: new Date(deadline * 1000).toISOString(),
      milestones: [
        {
          contractMilestoneId: 0,
          title: "Site survey and equipment procurement",
          description: "Complete geological survey and purchase drilling equipment.",
          amount: milestoneAmounts[0].toString(),
        },
        {
          contractMilestoneId: 1,
          title: "Drilling, installation and handover",
          description: "Drill wells, install solar pumps, and hand over to village committees.",
          amount: milestoneAmounts[1].toString(),
        },
      ],
    },
    { headers: { Authorization: `Bearer ${creatorToken}` } }
  );
  const dbCampaignId = campaignRes.data.data.id;
  console.log(`   Indexed campaign with DB id ${dbCampaignId}`);

  console.log("4. Alice and Bob contribute...");
  const aliceContract = contract.connect(aliceSigner);
  const bobContract = contract.connect(bobSigner);

  const aliceTx = await aliceContract.contribute(campaignId, { value: ethers.parseEther("2") });
  const aliceReceipt = await aliceTx.wait();
  const bobTx = await bobContract.contribute(campaignId, { value: ethers.parseEther("1") });
  const bobReceipt = await bobTx.wait();

  const aliceToken = await authenticate(aliceSigner, aliceSigner.address);
  const bobToken = await authenticate(bobSigner, bobSigner.address);

  await axios.post(
    `${API_BASE}/campaigns/${dbCampaignId}/contribute`,
    { txHash: aliceReceipt.hash },
    { headers: { Authorization: `Bearer ${aliceToken}` } }
  );
  await axios.post(
    `${API_BASE}/campaigns/${dbCampaignId}/contribute`,
    { txHash: bobReceipt.hash },
    { headers: { Authorization: `Bearer ${bobToken}` } }
  );
  console.log("   Contributions verified and recorded (goal reached: 3 ETH).");

  console.log("5. Creator submits milestone 0...");
  const submitTx = await contract.submitMilestone(campaignId, 0, "ipfs://demo-proof-cid");
  const submitReceipt = await submitTx.wait();
  await axios.post(
    `${API_BASE}/campaigns/${dbCampaignId}/milestones/0/submit`,
    {
      description: "Geological survey complete, drilling rig and solar pumps purchased.",
      proofUrl: "https://example.com/proof/milestone-0.pdf",
      txHash: submitReceipt.hash,
    },
    { headers: { Authorization: `Bearer ${creatorToken}` } }
  );

  console.log("6. Alice and Bob vote to approve milestone 0...");
  const aliceVoteTx = await aliceContract.voteOnMilestone(campaignId, 0, true);
  const aliceVoteReceipt = await aliceVoteTx.wait();
  await axios.post(
    `${API_BASE}/campaigns/${dbCampaignId}/milestones/0/vote`,
    { support: true, txHash: aliceVoteReceipt.hash },
    { headers: { Authorization: `Bearer ${aliceToken}` } }
  );

  const bobVoteTx = await bobContract.voteOnMilestone(campaignId, 0, true);
  const bobVoteReceipt = await bobVoteTx.wait();
  await axios.post(
    `${API_BASE}/campaigns/${dbCampaignId}/milestones/0/vote`,
    { support: true, txHash: bobVoteReceipt.hash },
    { headers: { Authorization: `Bearer ${bobToken}` } }
  );

  console.log("7. Fast-forwarding past the voting period and finalizing on-chain...");
  await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
  await ethers.provider.send("evm_mine", []);
  await contract.finalizeMilestoneVote(campaignId, 0);

  console.log("8. Releasing milestone 0 funds to the creator...");
  const releaseTx = await contract.releaseMilestone(campaignId, 0);
  const releaseReceipt = await releaseTx.wait();
  await axios.post(
    `${API_BASE}/campaigns/${dbCampaignId}/milestones/0/release`,
    { txHash: releaseReceipt.hash },
    { headers: { Authorization: `Bearer ${creatorToken}` } }
  );

  console.log("\nDemo complete! 1 ETH released to creator, 2 ETH remains escrowed for milestone 2.");
  console.log(`View the campaign at GET ${API_BASE}/campaigns/${dbCampaignId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
