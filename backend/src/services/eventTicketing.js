import { readFileSync } from "node:fs";
import {
  Contract,
  Interface,
  JsonRpcProvider,
  getAddress,
  isAddress,
} from "ethers";
import config from "../config/config.js";

const artifactUrl = new URL("../abi/EventTicketing.json", import.meta.url);
const eventTicketingAbi = JSON.parse(readFileSync(artifactUrl, "utf8"));
const provider = new JsonRpcProvider(config.SEPOLIA_RPC_URL);
const eventTicketingInterface = new Interface(eventTicketingAbi);
const eventTicketing = new Contract(config.EVENT_CONTRACT_ADDRESS, eventTicketingAbi, provider);

export async function prepareEventCreatorRoleGrant(adminWalletAddress, walletAddress) {
  if (!isAddress(adminWalletAddress) || !isAddress(walletAddress)) {
    throw new Error("The creator or admin wallet address is invalid");
  }

  const normalizedAdminAddress = getAddress(adminWalletAddress);
  const normalizedAddress = getAddress(walletAddress);
  const adminRole = await eventTicketing.DEFAULT_ADMIN_ROLE();

  if (!(await eventTicketing.hasRole(adminRole, normalizedAdminAddress))) {
    throw new Error("Authenticated admin wallet does not have DEFAULT_ADMIN_ROLE");
  }

  const creatorRole = await eventTicketing.EVENT_CREATOR_ROLE();
  if (await eventTicketing.hasRole(creatorRole, normalizedAddress)) {
    return { alreadyGranted: true, walletAddress: normalizedAddress };
  }

  return {
    alreadyGranted: false,
    walletAddress: normalizedAddress,
    transaction: {
      to: getAddress(config.EVENT_CONTRACT_ADDRESS),
      data: eventTicketingInterface.encodeFunctionData("grantRole", [creatorRole, normalizedAddress]),
      chainId: (await provider.getNetwork()).chainId.toString(),
    },
  };
}

export async function verifyEventCreatorRoleGrant(txHash, adminWalletAddress, walletAddress) {
  if (!isAddress(adminWalletAddress) || !isAddress(walletAddress)) {
    throw new Error("The creator or admin wallet address is invalid");
  }
  if (typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    throw new Error("A valid transaction hash is required");
  }

  const normalizedAdminAddress = getAddress(adminWalletAddress);
  const normalizedAddress = getAddress(walletAddress);
  const adminRole = await eventTicketing.DEFAULT_ADMIN_ROLE();
  if (!(await eventTicketing.hasRole(adminRole, normalizedAdminAddress))) {
    throw new Error("Authenticated admin wallet does not have DEFAULT_ADMIN_ROLE");
  }

  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!tx || !receipt) {
    throw new Error("Transaction not found; wait for confirmation and retry");
  }
  if (receipt.status !== 1) {
    throw new Error("The transaction to grant creator role failed");
  }
  if (!tx.from || getAddress(tx.from) !== normalizedAdminAddress) {
    throw new Error("Transaction sender does not match this approval");
  }

  // Wallets may route a call through a smart-account contract, so tx.to and
  // tx.data may describe the wrapper. Verify the actual role grant from the
  // EventTicketing contract log emitted in the mined receipt instead.
  const creatorRole = await eventTicketing.EVENT_CREATOR_ROLE();
  const roleGranted = receipt.logs.some((log) => {
    if (getAddress(log.address) !== getAddress(config.EVENT_CONTRACT_ADDRESS)) {
      return false;
    }

    try {
      const parsedLog = eventTicketingInterface.parseLog(log);
      return (
        parsedLog?.name === "RoleGranted" &&
        parsedLog.args.role.toLowerCase() === creatorRole.toLowerCase() &&
        getAddress(parsedLog.args.account) === normalizedAddress &&
        getAddress(parsedLog.args.sender) === normalizedAdminAddress
      );
    } catch {
      return false;
    }
  });

  if (!roleGranted) {
    throw new Error("Transaction does not grant creator role to the requested wallet");
  }

  if (!(await eventTicketing.hasRole(creatorRole, normalizedAddress))) {
    throw new Error("Creator role grant is not visible on chain yet");
  }

  return { alreadyGranted: false, walletAddress: normalizedAddress, txHash: receipt.hash };
}
