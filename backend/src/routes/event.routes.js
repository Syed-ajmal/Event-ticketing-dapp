import { Router } from "express";
import * as eventController from "../controllers/event.controller.js";
import * as authMiddleware from "../middlewares/auth.middleware.js";

const eventRouter = Router();

/**
 * GET /api/event?page=1
 */
eventRouter.get("/", eventController.listPublic);

/**
 * GET /api/event/mine
 */
eventRouter.get("/mine", authMiddleware.authUser, eventController.listMine);

/**
 * GET /api/event/my-tickets
 */
eventRouter.get(
  "/my-tickets",
  authMiddleware.authUser,
  eventController.listMyTickets,
);

/**
 * POST /api/event/image
 */
eventRouter.post("/image", authMiddleware.authUser, eventController.uploadImage);

/**
 * POST /api/event/metadata
 */
eventRouter.post(
  "/metadata",
  authMiddleware.authUser,
  eventController.uploadMetadata,
);

/**
 * POST /api/event/create-event
 */
eventRouter.post(
  "/create-event",
  authMiddleware.authUser,
  eventController.createEvent,
);

/**
 * PATCH /api/event/:eventId/cancel
 */
eventRouter.patch(
  "/:eventId/cancel",
  authMiddleware.authUser,
  eventController.cancelEvent,
);

/**
 * POST /api/event/:eventId/claim-ticket
 */
eventRouter.post(
  "/:eventId/claim-ticket",
  authMiddleware.authUser,
  eventController.claimTicket,
);

/**
 * POST /api/event/:eventId/check-in { ticketId, transactionHash? }
 */
eventRouter.post(
  "/:eventId/check-in",
  authMiddleware.authUser,
  eventController.checkInTicket,
);

/** POST /api/event/:eventId/refund-ticket { ticketId, transactionHash? } */
eventRouter.post(
  "/:eventId/refund-ticket",
  authMiddleware.authUser,
  eventController.refundTicket,
);

/** POST /api/event/:eventId/withdraw-proceeds { transactionHash? } */
eventRouter.post(
  "/:eventId/withdraw-proceeds",
  authMiddleware.authUser,
  eventController.withdrawProceeds,
);

export default eventRouter;
