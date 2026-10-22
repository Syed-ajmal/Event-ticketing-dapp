import { Router } from "express";
import * as creatorController from "../controllers/creator.controller.js";
import * as authMiddleware from "../middlewares/auth.middleware.js";

const creatorRouter = Router();

creatorRouter.post(
  "/request",
  authMiddleware.authUser,
  creatorController.request,
);

creatorRouter.get(
  "/pending",
  authMiddleware.authAdmin,
  creatorController.listPending,
);

creatorRouter.patch(
  "/:requestId/approve",
  authMiddleware.authAdmin,
  creatorController.approve,
);

export default creatorRouter;
