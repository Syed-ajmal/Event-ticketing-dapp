import { readFileSync } from "node:fs";
import { Contract, JsonRpcProvider, Wallet, getAddress, isAddress } from "ethers";
import config from "../config/config.js";

const artifactUrl = new URL("../abi/EventTicketing.json", import.meta.url);
const eventTicketingAbi = JSON.parse(readFileSync(artifactUrl, "utf8"));

const provider = new JsonRpcProvider(config.SEPOLIA_RPC_URL);
const adminSigner = new Wallet(config.CONTRACT_ADMIN_PRIVATE_KEY, provider);
const eventTicketing = new Contract(
  config.EVENT_CONTRACT_ADDRESS,
  eventTicketingAbi,
  adminSigner,
);

export async function grantEventCreatorRole(walletAddress) {
  if (!isAddress(walletAddress)) {
    throw new Error("The creator wallet address is invalid");
  }

  const normalizedAddress = getAddress(walletAddress);
  const adminAddress = await adminSigner.getAddress();
  const adminRole = await eventTicketing.DEFAULT_ADMIN_ROLE();

  if (!(await eventTicketing.hasRole(adminRole, adminAddress))) {
    throw new Error("Configured backend signer does not have DEFAULT_ADMIN_ROLE");
  }

  const creatorRole = await eventTicketing.EVENT_CREATOR_ROLE();
  if (await eventTicketing.hasRole(creatorRole, normalizedAddress)) {
    return { alreadyGranted: true, walletAddress: normalizedAddress, txHash: null };
  }

  const tx = await eventTicketing.grantRole(creatorRole, normalizedAddress);
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("The transaction to grant creator role failed");
  }

  return { alreadyGranted: false, walletAddress: normalizedAddress, txHash: tx.hash };
}
