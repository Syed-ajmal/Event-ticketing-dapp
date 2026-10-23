import { Router } from "express";
import * as eventController from "../controllers/event.controller.js";
import * as authMiddleware from "../middlewares/auth.middleware.js";

const eventRouter = Router();

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

export default eventRouter;
