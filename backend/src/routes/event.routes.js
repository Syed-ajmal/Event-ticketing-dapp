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

export default eventRouter;
