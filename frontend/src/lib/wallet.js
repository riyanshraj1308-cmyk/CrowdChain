import { BrowserProvider } from "ethers";

export function hasInjectedWallet() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export async function connectWallet() {
  if (!hasInjectedWallet()) {
    throw new Error("No wallet extension detected. Install MetaMask or another EVM wallet.");
  }
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();
  return { provider, address: accounts[0], chainId: Number(network.chainId) };
}

export async function signMessage(provider, address, message) {
  const signer = await provider.getSigner(address);
  return signer.signMessage(message);
}

export async function sendContribution(provider, contractAddress, campaignId, amountEth) {
  const signer = await provider.getSigner();
  const abi = ["function contribute(uint256 campaignId) payable"];
  const { Contract, parseEther } = await import("ethers");
  const contract = new Contract(contractAddress, abi, signer);
  const tx = await contract.contribute(campaignId, { value: parseEther(amountEth) });
  const receipt = await tx.wait();
  return receipt.hash;
}

export function subscribeToAccountChange(callback) {
  if (!hasInjectedWallet()) return () => {};
  window.ethereum.on("accountsChanged", callback);
  return () => window.ethereum.removeListener("accountsChanged", callback);
}

export function subscribeToChainChange(callback) {
  if (!hasInjectedWallet()) return () => {};
  window.ethereum.on("chainChanged", callback);
  return () => window.ethereum.removeListener("chainChanged", callback);
}
