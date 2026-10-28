import eventModel from "../models/event.model.js";
import ticketModel from "../models/ticket.model.js";
import { uploadEventMetadata } from "../services/pinata.js";
import {
  prepareCancelEvent,
  prepareClaimTicket,
  prepareCreateEvent,
  verifyCancelEvent,
  verifyClaimTicket,
  verifyCreateEvent,
  prepareCheckInTicket,
  verifyCheckInTicket,
  prepareRefundTicket,
  verifyRefundTicket,
  prepareWithdrawProceeds,
  verifyWithdrawProceeds,
} from "../services/eventTicketing.js";

const UINT64_MAX = (1n << 64n) - 1n;
const UINT32_MAX = (1n << 32n) - 1n;
const UINT96_MAX = (1n << 96n) - 1n;
const UINT256_MAX = (1n << 256n) - 1n;
const PUBLIC_EVENT_PAGE_SIZE = 10;

export async function listPublic(req, res) {
  const rawPage = req.query.page ?? "1";
  if (typeof rawPage !== "string" || !/^\d+$/.test(rawPage)) {
    return res.status(400).json({ message: "page must be a positive integer" });
  }
  const page = Number(rawPage);
  if (!Number.isSafeInteger(page) || page < 1) {
    return res.status(400).json({ message: "page must be a positive integer" });
  }

  const limit = PUBLIC_EVENT_PAGE_SIZE;
  const now = Math.floor(Date.now() / 1000);
  const filter = {
    cancelled: { $ne: true },
    startsAt: { $gt: now },
  };

  try {
    const [events, total] = await Promise.all([
      eventModel
        .find(filter)
        .select(
          "eventId creatorWalletAddress startsAt endsAt ticketLimit ticketPrice metadataURI createdAt",
        )
        .sort({ startsAt: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      eventModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      events,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Public events fetch failed:", error);
    return res.status(500).json({ message: "Could not load events" });
  }
}

export async function listMine(req, res) {
  if (req.user.role !== "creator") {
    return res.status(403).json({ message: "Creator access required" });
  }

  try {
    const events = await eventModel
      .find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ events });
  } catch (error) {
    console.error("Creator events fetch failed:", error);
    return res.status(500).json({ message: "Could not load your events" });
  }
}

export async function listMyTickets(req, res) {
  if (!["attendee", "creator"].includes(req.user.role)) {
    return res.status(403).json({ message: "Attendee or creator access required" });
  }

  try {
    const tickets = await ticketModel
      .find({ attendee: req.user._id })
      .select("ticketId eventId event attendeeWalletAddress transactionHash createdAt")
      .populate({
        path: "event",
        select: "eventId startsAt endsAt ticketPrice metadataURI cancelled",
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ tickets });
  } catch (error) {
    console.error("User tickets fetch failed:", error);
    return res.status(500).json({ message: "Could not load your tickets" });
  }
}

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

export async function claimTicket(req, res) {
  if (!["attendee", "creator"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: "Attendee or creator access required" });
  }
  if (!req.user.walletAddress) {
    return res
      .status(400)
      .json({ message: "Link a wallet before claiming tickets" });
  }

  try {
    const eventId = parseUnsignedInteger(
      req.params.eventId,
      "eventId",
      UINT256_MAX,
    ).toString();
    const event = await eventModel.findOne({ eventId });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.cancelled)
      return res.status(409).json({ message: "Event is cancelled" });
    if (event.endsAt <= Math.floor(Date.now() / 1000)) {
      return res.status(409).json({ message: "Event has ended" });
    }

    if (!req.body?.transactionHash) {
      const prepared = await prepareClaimTicket(
        req.user.walletAddress,
        eventId,
      );
      return res.status(200).json({
        message:
          "Sign and submit this transaction, then send its hash to finish claiming the ticket",
        eventId,
        ticketPrice: prepared.ticketPrice,
        walletAddress: prepared.walletAddress,
        transaction: prepared.transaction,
      });
    }

    const verified = await verifyClaimTicket(
      req.body.transactionHash,
      req.user.walletAddress,
      eventId,
    );
    const txHash = verified.txHash.toLowerCase();
    let ticket;
    try {
      ticket = await ticketModel.findOneAndUpdate(
        { transactionHash: txHash },
        {
          $setOnInsert: {
            ticketId: verified.ticketId,
            eventId: verified.eventId,
            event: event._id,
            attendee: req.user._id,
            attendeeWalletAddress: verified.walletAddress.toLowerCase(),
            transactionHash: txHash,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (error) {
      if (error?.code === 11000) {
        return res
          .status(409)
          .json({ message: "This ticket or transaction is already recorded" });
      }
      throw error;
    }

    return res.status(201).json({ message: "Ticket claimed", ticket });
  } catch (error) {
    const clientErrors = [
      "eventId must be an unsigned integer",
      "eventId is out of range",
      "The attendee wallet address is invalid",
      "Event not found on chain",
      "Event is cancelled",
      "Event has ended",
      "A valid transaction hash is required",
      "Transaction not found; wait for confirmation and retry",
      "The ticket claim transaction failed",
      "Transaction sender does not match the connected wallet",
      "Transaction does not claim a ticket for this event and wallet",
    ];
    if (clientErrors.includes(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Ticket claim failed:", error);
    return res.status(500).json({ message: "Could not claim ticket" });
  }
}

export async function checkInTicket(req, res) {
  if (req.user.role !== "creator") {
    return res.status(403).json({ message: "Creator access required" });
  }
  if (!req.user.walletAddress) {
    return res.status(400).json({ message: "Link a wallet before checking in tickets" });
  }

  try {
    const eventId = parseUnsignedInteger(req.params.eventId, "eventId", UINT256_MAX).toString();
    const ticketId = parseUnsignedInteger(req.body?.ticketId, "ticketId", UINT256_MAX).toString();
    const event = await eventModel.findOne({ eventId, creator: req.user._id });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.creatorWalletAddress !== req.user.walletAddress.toLowerCase()) {
      return res.status(403).json({ message: "Event must be checked in by its creating wallet" });
    }

    const ticket = await ticketModel.findOne({ ticketId, eventId });
    if (!ticket) return res.status(404).json({ message: "Ticket not found for this event" });
    if (ticket.checkedIn) return res.status(409).json({ message: "Ticket is already checked in" });

    if (!req.body?.transactionHash) {
      const prepared = await prepareCheckInTicket(req.user.walletAddress, eventId, ticketId);
      return res.status(200).json({
        message: "Sign and submit this transaction, then send its hash to finish check-in",
        eventId,
        ticketId,
        walletAddress: prepared.walletAddress,
        transaction: prepared.transaction,
      });
    }

    const verified = await verifyCheckInTicket(
      req.body.transactionHash,
      req.user.walletAddress,
      eventId,
      ticketId,
    );
    const txHash = verified.txHash.toLowerCase();
    const updatedTicket = await ticketModel.findOneAndUpdate(
      { _id: ticket._id, checkedIn: false },
      { $set: { checkedIn: true, checkedInAt: new Date(), checkInTransactionHash: txHash } },
      { new: true },
    );
    if (!updatedTicket) {
      const current = await ticketModel.findById(ticket._id).lean();
      if (current?.checkInTransactionHash === txHash) {
        return res.status(200).json({ message: "Ticket checked in", ticket: current });
      }
      return res.status(409).json({ message: "Ticket is already checked in" });
    }
    return res.status(200).json({ message: "Ticket checked in", ticket: updatedTicket });
  } catch (error) {
    const clientErrors = [
      "eventId must be an unsigned integer", "eventId is out of range",
      "ticketId must be an unsigned integer", "ticketId is out of range",
      "The creator wallet address is invalid", "A valid transaction hash is required",
      "Connected wallet is not the event creator", "Event not found on chain",
      "Event is cancelled", "Check-in window is closed",
      "Ticket is not for this event", "Ticket is already checked in",
      "Transaction not found; wait for confirmation and retry",
      "The ticket check-in transaction failed",
      "Transaction sender does not match the connected wallet",
      "Transaction does not check in the requested ticket",
    ];
    if (clientErrors.includes(error.message)) return res.status(400).json({ message: error.message });
    console.error("Ticket check-in failed:", error);
    return res.status(500).json({ message: "Could not check in ticket" });
  }
}

export async function refundTicket(req, res) {
  if (!["attendee", "creator"].includes(req.user.role)) {
    return res.status(403).json({ message: "Attendee access required" });
  }
  if (!req.user.walletAddress) {
    return res.status(400).json({ message: "Link a wallet before refunding tickets" });
  }

  try {
    const eventId = parseUnsignedInteger(req.params.eventId, "eventId", UINT256_MAX).toString();
    const ticketId = parseUnsignedInteger(req.body?.ticketId, "ticketId", UINT256_MAX).toString();
    const event = await eventModel.findOne({ eventId });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!event.cancelled) return res.status(409).json({ message: "Event is not cancelled" });

    const ticket = await ticketModel.findOne({ ticketId, eventId, attendee: req.user._id });
    if (!ticket) return res.status(404).json({ message: "Ticket not found for this account and event" });
    if (ticket.attendeeWalletAddress !== req.user.walletAddress.toLowerCase()) {
      return res.status(403).json({ message: "Connect the wallet that owns this ticket" });
    }
    if (ticket.refunded) return res.status(409).json({ message: "Ticket has already been refunded" });

    if (!req.body?.transactionHash) {
      const prepared = await prepareRefundTicket(req.user.walletAddress, eventId, ticketId);
      return res.status(200).json({
        message: "Sign and submit this transaction, then send its hash to finish the refund",
        eventId,
        ticketId,
        walletAddress: prepared.walletAddress,
        transaction: prepared.transaction,
      });
    }

    const verified = await verifyRefundTicket(
      req.body.transactionHash,
      req.user.walletAddress,
      eventId,
      ticketId,
    );
    const txHash = verified.txHash.toLowerCase();
    const updatedTicket = await ticketModel.findOneAndUpdate(
      { _id: ticket._id, refunded: false },
      { $set: {
        refunded: true,
        refundedAt: new Date(),
        refundAmount: verified.refundAmount,
        refundTransactionHash: txHash,
      } },
      { new: true },
    );
    if (!updatedTicket) {
      const current = await ticketModel.findById(ticket._id).lean();
      if (current?.refundTransactionHash === txHash) {
        return res.status(200).json({ message: "Ticket refunded", refundAmount: verified.refundAmount, ticket: current });
      }
      return res.status(409).json({ message: "Ticket has already been refunded" });
    }
    return res.status(200).json({ message: "Ticket refunded", refundAmount: verified.refundAmount, ticket: updatedTicket });
  } catch (error) {
    const clientErrors = [
      "eventId must be an unsigned integer", "eventId is out of range",
      "ticketId must be an unsigned integer", "ticketId is out of range",
      "The attendee wallet address is invalid", "Event not found on chain",
      "Event is not cancelled", "Ticket is not for this event",
      "Connected wallet does not own this ticket", "A valid transaction hash is required",
      "Transaction not found; wait for confirmation and retry",
      "The ticket refund transaction failed",
      "Transaction sender does not match the connected wallet",
      "Transaction does not refund the requested ticket",
    ];
    if (clientErrors.includes(error.message)) return res.status(400).json({ message: error.message });
    console.error("Ticket refund failed:", error);
    return res.status(500).json({ message: "Could not refund ticket" });
  }
}

export async function withdrawProceeds(req, res) {
  if (req.user.role !== "creator") {
    return res.status(403).json({ message: "Creator access required" });
  }
  if (!req.user.walletAddress) {
    return res.status(400).json({ message: "Link a wallet before withdrawing proceeds" });
  }

  try {
    const eventId = parseUnsignedInteger(req.params.eventId, "eventId", UINT256_MAX).toString();
    const event = await eventModel.findOne({ eventId, creator: req.user._id });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.creatorWalletAddress !== req.user.walletAddress.toLowerCase()) {
      return res.status(403).json({ message: "Proceeds must be withdrawn by the event-creating wallet" });
    }

    if (!req.body?.transactionHash) {
      if (event.proceedsWithdrawn) {
        return res.status(409).json({ message: "Proceeds have already been withdrawn" });
      }
      const prepared = await prepareWithdrawProceeds(req.user.walletAddress, eventId);
      return res.status(200).json({
        message: "Sign and submit this transaction, then send its hash to confirm the withdrawal",
        eventId,
        amount: prepared.amount,
        walletAddress: prepared.walletAddress,
        transaction: prepared.transaction,
      });
    }

    const verified = await verifyWithdrawProceeds(
      req.body.transactionHash,
      req.user.walletAddress,
      eventId,
    );
    const txHash = verified.txHash.toLowerCase();
    const updatedEvent = await eventModel.findOneAndUpdate(
      { _id: event._id, proceedsWithdrawn: { $ne: true } },
      { $set: {
        proceedsWithdrawn: true,
        proceedsWithdrawnAt: new Date(),
        proceedsWithdrawalAmount: verified.amount,
        proceedsWithdrawalTransactionHash: txHash,
      } },
      { new: true },
    );
    if (!updatedEvent) {
      const current = await eventModel.findById(event._id).lean();
      if (current?.proceedsWithdrawalTransactionHash === txHash) {
        return res.status(200).json({ message: "Proceeds withdrawn", amount: verified.amount, event: current });
      }
      return res.status(409).json({ message: "Proceeds have already been withdrawn" });
    }
    return res.status(200).json({ message: "Proceeds withdrawn", amount: verified.amount, event: updatedEvent });
  } catch (error) {
    const clientErrors = [
      "eventId must be an unsigned integer", "eventId is out of range",
      "The creator wallet address is invalid", "Event not found on chain",
      "Connected wallet is not the event creator", "Cancelled event proceeds cannot be withdrawn",
      "Event has not ended yet", "No proceeds available to withdraw",
      "A valid transaction hash is required",
      "Transaction not found; wait for confirmation and retry",
      "The proceeds withdrawal transaction failed",
      "Transaction sender does not match the connected wallet",
      "Transaction does not withdraw proceeds for this event",
    ];
    if (clientErrors.includes(error.message)) return res.status(400).json({ message: error.message });
    console.error("Proceeds withdrawal failed:", error);
    return res.status(500).json({ message: "Could not withdraw proceeds" });
  }
}
