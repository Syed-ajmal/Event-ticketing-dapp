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
const eventTicketing = new Contract(
  config.EVENT_CONTRACT_ADDRESS,
  eventTicketingAbi,
  provider,
);

export async function prepareEventCreatorRoleGrant(
  adminWalletAddress,
  walletAddress,
) {
  if (!isAddress(adminWalletAddress) || !isAddress(walletAddress)) {
    throw new Error("The creator or admin wallet address is invalid");
  }

  const normalizedAdminAddress = getAddress(adminWalletAddress);
  const normalizedAddress = getAddress(walletAddress);
  const adminRole = await eventTicketing.DEFAULT_ADMIN_ROLE();

  if (!(await eventTicketing.hasRole(adminRole, normalizedAdminAddress))) {
    throw new Error(
      "Authenticated admin wallet does not have DEFAULT_ADMIN_ROLE",
    );
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
      data: eventTicketingInterface.encodeFunctionData("grantRole", [
        creatorRole,
        normalizedAddress,
      ]),
      chainId: (await provider.getNetwork()).chainId.toString(),
    },
  };
}

export async function verifyEventCreatorRoleGrant(
  txHash,
  adminWalletAddress,
  walletAddress,
) {
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
    throw new Error(
      "Authenticated admin wallet does not have DEFAULT_ADMIN_ROLE",
    );
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
    throw new Error(
      "Transaction does not grant creator role to the requested wallet",
    );
  }

  if (!(await eventTicketing.hasRole(creatorRole, normalizedAddress))) {
    throw new Error("Creator role grant is not visible on chain yet");
  }

  return {
    alreadyGranted: false,
    walletAddress: normalizedAddress,
    txHash: receipt.hash,
  };
}

export async function prepareCreateEvent(walletAddress, event) {
  if (!isAddress(walletAddress)) {
    throw new Error("The creator wallet address is invalid");
  }

  const normalizedAddress = getAddress(walletAddress);
  const creatorRole = await eventTicketing.EVENT_CREATOR_ROLE();
  if (!(await eventTicketing.hasRole(creatorRole, normalizedAddress))) {
    throw new Error("Connected wallet does not have EVENT_CREATOR_ROLE");
  }

  return {
    walletAddress: normalizedAddress,
    transaction: {
      to: getAddress(config.EVENT_CONTRACT_ADDRESS),
      data: eventTicketingInterface.encodeFunctionData("createEvent", [
        event.startsAt,
        event.endsAt,
        event.ticketLimit,
        event.ticketPrice,
        event.metadataURI,
      ]),
      chainId: (await provider.getNetwork()).chainId.toString(),
    },
  };
}

export async function verifyCreateEvent(txHash, walletAddress, expectedEvent) {
  if (!isAddress(walletAddress)) {
    throw new Error("The creator wallet address is invalid");
  }

  if (typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    throw new Error("A valid transaction hash is required");
  }

  const normalizedAddress = getAddress(walletAddress);
  const creatorRole = await eventTicketing.EVENT_CREATOR_ROLE();

  if (!(await eventTicketing.hasRole(creatorRole, normalizedAddress))) {
    throw new Error("Connected wallet does not have EVENT_CREATOR_ROLE");
  }

  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!tx || !receipt)
    throw new Error("Transaction not found; wait for confirmation and retry");

  if (receipt.status !== 1)
    throw new Error("The event creation transaction failed");

  if (!tx.from || getAddress(tx.from) !== normalizedAddress) {
    throw new Error("Transaction sender does not match the connected wallet");
  }

  const createdEvent = receipt.logs.reduce((found, log) => {
    if (getAddress(log.address) !== getAddress(config.EVENT_CONTRACT_ADDRESS))
      return found;

    try {
      const parsed = eventTicketingInterface.parseLog(log);
      if (parsed?.name !== "EventCreated") return found;

      const [
        eventId,
        creator,
        startsAt,
        endsAt,
        ticketLimit,
        ticketPrice,
        metadataURI,
      ] = parsed.args;

      if (
        getAddress(creator) === normalizedAddress &&
        startsAt === BigInt(expectedEvent.startsAt) &&
        endsAt === BigInt(expectedEvent.endsAt) &&
        ticketLimit === BigInt(expectedEvent.ticketLimit) &&
        ticketPrice === BigInt(expectedEvent.ticketPrice) &&
        metadataURI === expectedEvent.metadataURI
      )
        return eventId.toString();
    } catch {
      // Ignore logs that are not valid events from this contract.
    }
    return found;
  }, null);

  if (createdEvent === null) {
    throw new Error("Transaction does not create the requested event");
  }
  return {
    eventId: createdEvent,
    walletAddress: normalizedAddress,
    txHash: receipt.hash,
  };
}

export async function prepareCancelEvent(walletAddress, eventId) {
  if (!isAddress(walletAddress)) {
    throw new Error("The creator wallet address is invalid");
  }

  return {
    walletAddress: getAddress(walletAddress),
    transaction: {
      to: getAddress(config.EVENT_CONTRACT_ADDRESS),
      data: eventTicketingInterface.encodeFunctionData("cancelEvent", [
        eventId,
      ]),
      chainId: (await provider.getNetwork()).chainId.toString(),
    },
  };
}

export async function verifyCancelEvent(txHash, walletAddress, eventId) {
  if (!isAddress(walletAddress)) {
    throw new Error("The creator wallet address is invalid");
  }

  if (typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    throw new Error("A valid transaction hash is required");
  }

  const normalizedAddress = getAddress(walletAddress);
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!tx || !receipt) {
    throw new Error("Transaction not found; wait for confirmation and retry");
  }
  if (receipt.status !== 1) {
    throw new Error("The event cancellation transaction failed");
  }
  if (!tx.from || getAddress(tx.from) !== normalizedAddress) {
    throw new Error("Transaction sender does not match the connected wallet");
  }

  const cancellationConfirmed = receipt.logs.some((log) => {
    if (getAddress(log.address) !== getAddress(config.EVENT_CONTRACT_ADDRESS)) {
      return false;
    }
    try {
      const parsed = eventTicketingInterface.parseLog(log);

      return (
        parsed?.name === "EventCancelledByCreator" &&
        parsed.args.eventId === BigInt(eventId)
      );
    } catch {
      return false;
    }
  });
  if (!cancellationConfirmed) {
    throw new Error("Transaction does not cancel the requested event");
  }
  return { walletAddress: normalizedAddress, txHash: receipt.hash };
}

export async function prepareClaimTicket(walletAddress, eventId) {
  if (!isAddress(walletAddress)) {
    throw new Error("The attendee wallet address is invalid");
  }

  const normalizedAddress = getAddress(walletAddress);
  const eventInfo = await eventTicketing.getFunction("getEvent")(eventId);
  if (eventInfo.creator === "0x0000000000000000000000000000000000000000") {
    throw new Error("Event not found on chain");
  }
  if (eventInfo.cancelled) throw new Error("Event is cancelled");
  if (eventInfo.endsAt <= BigInt(Math.floor(Date.now() / 1000))) {
    throw new Error("Event has ended");
  }

  return {
    walletAddress: normalizedAddress,
    ticketPrice: eventInfo.ticketPrice.toString(),
    transaction: {
      to: getAddress(config.EVENT_CONTRACT_ADDRESS),
      data: eventTicketingInterface.encodeFunctionData("claimTicket", [eventId]),
      value: eventInfo.ticketPrice.toString(),
      chainId: (await provider.getNetwork()).chainId.toString(),
    },
  };
}

export async function verifyClaimTicket(txHash, walletAddress, eventId) {
  if (!isAddress(walletAddress)) {
    throw new Error("The attendee wallet address is invalid");
  }
  if (typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    throw new Error("A valid transaction hash is required");
  }

  const normalizedAddress = getAddress(walletAddress);
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!tx || !receipt) {
    throw new Error("Transaction not found; wait for confirmation and retry");
  }
  if (receipt.status !== 1) throw new Error("The ticket claim transaction failed");
  if (!tx.from || getAddress(tx.from) !== normalizedAddress) {
    throw new Error("Transaction sender does not match the connected wallet");
  }

  let claimedTicketId = null;
  for (const log of receipt.logs) {
    if (getAddress(log.address) !== getAddress(config.EVENT_CONTRACT_ADDRESS)) {
      continue;
    }
    try {
      const parsed = eventTicketingInterface.parseLog(log);
      if (
        parsed?.name === "TicketClaimed" &&
        parsed.args.eventId === BigInt(eventId) &&
        getAddress(parsed.args.attendee) === normalizedAddress
      ) {
        claimedTicketId = parsed.args.ticketId.toString();
        break;
      }
    } catch {
      // Ignore logs that are not valid events from this contract.
    }
  }

  if (claimedTicketId === null) {
    throw new Error("Transaction does not claim a ticket for this event and wallet");
  }
  return {
    eventId: eventId.toString(),
    ticketId: claimedTicketId,
    walletAddress: normalizedAddress,
    txHash: receipt.hash,
  };
}
