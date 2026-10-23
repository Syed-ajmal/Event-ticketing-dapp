import eventModel from "../models/event.model.js";
import { uploadEventMetadata } from "../services/pinata.js";
import {
  prepareCancelEvent,
  prepareCreateEvent,
  verifyCancelEvent,
  verifyCreateEvent,
} from "../services/eventTicketing.js";

const UINT64_MAX = (1n << 64n) - 1n;
const UINT32_MAX = (1n << 32n) - 1n;
const UINT96_MAX = (1n << 96n) - 1n;
const UINT256_MAX = (1n << 256n) - 1n;

export async function uploadMetadata(req, res) {
  if (req.user.role !== "creator") {
    return res.status(403).json({ message: "Creator access required" });
  }

  const metadata = req.body?.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return res.status(400).json({ message: "metadata must be a JSON object" });
  }

  try {
    const metadataURI = await uploadEventMetadata(metadata);
    return res.status(201).json({ message: "Metadata uploaded", metadataURI });
  } catch (error) {
    console.error("Pinata metadata upload failed:", error);
    return res
      .status(502)
      .json({ message: "Could not upload metadata to Pinata" });
  }
}

function parseUnsignedInteger(value, name, max) {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    !/^\d+$/.test(String(value))
  ) {
    throw new Error(`${name} must be an unsigned integer`);
  }
  const parsed = BigInt(value);
  if (parsed > max) throw new Error(`${name} is out of range`);
  return parsed;
}

function parseEventInput(body) {
  const startsAt = parseUnsignedInteger(body?.startsAt, "startsAt", UINT64_MAX);
  const endsAt = parseUnsignedInteger(body?.endsAt, "endsAt", UINT64_MAX);
  const ticketLimit = parseUnsignedInteger(
    body?.ticketLimit,
    "ticketLimit",
    UINT32_MAX,
  );
  const ticketPrice = parseUnsignedInteger(
    body?.ticketPrice,
    "ticketPrice",
    UINT96_MAX,
  );
  const metadataURI = body?.metadataURI;

  if (ticketLimit === 0n)
    throw new Error("ticketLimit must be greater than zero");
  if (startsAt <= BigInt(Math.floor(Date.now() / 1000)))
    throw new Error("startsAt must be in the future");
  if (endsAt <= startsAt) throw new Error("endsAt must be after startsAt");
  if (typeof metadataURI !== "string" || metadataURI.trim().length === 0) {
    throw new Error("metadataURI must be a non-empty string");
  }
  return {
    startsAt: startsAt.toString(),
    endsAt: endsAt.toString(),
    ticketLimit: ticketLimit.toString(),
    ticketPrice: ticketPrice.toString(),
    metadataURI: metadataURI.trim(),
  };
}

export async function createEvent(req, res) {
  if (req.user.role !== "creator") {
    return res.status(403).json({ message: "Creator access required" });
  }
  if (!req.user.walletAddress) {
    return res
      .status(400)
      .json({ message: "Link a wallet before creating events" });
  }

  try {
    const event = parseEventInput(req.body);

    // First request prepares calldata. The creator signs/submits it and retries
    // with transactionHash; only a verified on-chain event is stored in MongoDB.
    if (!req.body?.transactionHash) {
      const prepared = await prepareCreateEvent(req.user.walletAddress, event);
      return res.status(200).json({
        message:
          "Sign and submit this transaction, then send its hash to finish creating the event",
        walletAddress: prepared.walletAddress,
        event: { ...event },
        transaction: prepared.transaction,
      });
    }

    const verified = await verifyCreateEvent(
      req.body.transactionHash,
      req.user.walletAddress,
      event,
    );
    let savedEvent;
    try {
      savedEvent = await eventModel.findOneAndUpdate(
        { transactionHash: verified.txHash.toLowerCase() },
        {
          $setOnInsert: {
            eventId: verified.eventId,
            creator: req.user._id,
            creatorWalletAddress: verified.walletAddress.toLowerCase(),
            startsAt: Number(event.startsAt),
            endsAt: Number(event.endsAt),
            ticketLimit: Number(event.ticketLimit),
            ticketPrice: event.ticketPrice,
            metadataURI: event.metadataURI,
            transactionHash: verified.txHash.toLowerCase(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (error) {
      if (error?.code === 11000) {
        return res
          .status(409)
          .json({ message: "This event or transaction is already recorded" });
      }
      throw error;
    }

    return res
      .status(201)
      .json({ message: "Event created", event: savedEvent });
  } catch (error) {
    const clientErrors = [
      "The creator wallet address is invalid",
      "Connected wallet does not have EVENT_CREATOR_ROLE",
      "A valid transaction hash is required",
      "Transaction not found; wait for confirmation and retry",
      "The event creation transaction failed",
      "Transaction sender does not match the connected wallet",
      "Transaction does not create the requested event",
    ];
    if (
      clientErrors.includes(error.message) ||
      /^(startsAt|endsAt|ticketLimit|ticketPrice|metadataURI) /.test(
        error.message,
      )
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Event creation failed:", error);
    return res.status(500).json({ message: "Could not create event" });
  }
}

export async function cancelEvent(req, res) {
  if (req.user.role !== "creator") {
    return res.status(403).json({ message: "Creator access required" });
  }
  if (!req.user.walletAddress) {
    return res
      .status(400)
      .json({ message: "Link a wallet before cancelling events" });
  }

  try {
    const eventId = parseUnsignedInteger(
      req.params.eventId,
      "eventId",
      UINT256_MAX,
    ).toString();

    const event = await eventModel.findOne({ eventId, creator: req.user._id });

    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.creatorWalletAddress !== req.user.walletAddress.toLowerCase()) {
      return res
        .status(403)
        .json({ message: "Event must be cancelled by its creating wallet" });
    }

    if (event.cancelled) {
      return res.status(409).json({ message: "Event is already cancelled" });
    }

    if (event.startsAt <= Math.floor(Date.now() / 1000)) {
      return res
        .status(409)
        .json({ message: "An event cannot be cancelled after it starts" });
    }

    // As with creation, the client signs the prepared transaction and retries
    // with its hash so the backend can verify the mined cancellation log.
    if (!req.body?.transactionHash) {
      const prepared = await prepareCancelEvent(
        req.user.walletAddress,
        eventId,
      );

      return res.status(200).json({
        message:
          "Sign and submit this transaction, then send its hash to finish cancelling the event",
        eventId,
        walletAddress: prepared.walletAddress,
        transaction: prepared.transaction,
      });
    }

    const verified = await verifyCancelEvent(
      req.body.transactionHash,
      req.user.walletAddress,
      eventId,
    );

    const txHash = verified.txHash.toLowerCase();

    const updatedEvent = await eventModel.findOneAndUpdate(
      { eventId, creator: req.user._id, cancelled: false },
      {
        $set: {
          cancelled: true,
          cancellationTransactionHash: txHash,
          cancelledAt: new Date(),
        },
      },
      { new: true },
    );

    if (!updatedEvent) {
      const currentEvent = await eventModel.findOne({
        eventId,
        creator: req.user._id,
      });

      if (
        currentEvent?.cancelled &&
        currentEvent.cancellationTransactionHash === txHash
      ) {
        return res
          .status(200)
          .json({ message: "Event is already cancelled", event: currentEvent });
      }

      return res.status(409).json({ message: "Event is already cancelled" });
    }

    return res
      .status(200)
      .json({ message: "Event cancelled", event: updatedEvent });
  } catch (error) {
    const clientErrors = [
      "eventId must be an unsigned integer",
      "eventId is out of range",
      "The creator wallet address is invalid",
      "A valid transaction hash is required",
      "Transaction not found; wait for confirmation and retry",
      "The event cancellation transaction failed",
      "Transaction sender does not match the connected wallet",
      "Transaction does not cancel the requested event",
    ];

    if (clientErrors.includes(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Event cancellation failed:", error);

    return res.status(500).json({ message: "Could not cancel event" });
  }
}
