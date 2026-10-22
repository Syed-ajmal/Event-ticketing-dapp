import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import * as authMiddleware from "../middlewares/auth.middleware.js";

const authRouter = Router();

/**
 * POST /api/auth/register
 */
authRouter.post("/register", authController.register);

/**
 * POST /api/auth/login
 */
authRouter.post("/login", authController.login);

/**
 * GET /api/auth//get-me
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMe);

/**
 * GET /api/auth/refresh-token
 */
authRouter.get("/refresh-token", authController.refreshToken);

/**
 * GET /api/auth/logout
 */
authRouter.get("/logout", authController.logout);

/**
 * GET /api/auth/logout-all
 */
authRouter.get("/logout-all", authController.logoutAll);

/**
 * POST /api/auth/wallet/nonce
 */
authRouter.post(
  "/wallet/nonce",
  authMiddleware.authUser,
  authController.getWalletNonce,
);

/**
 * POST /api/auth/wallet/link
 */
authRouter.post(
  "/wallet/link",
  authMiddleware.authUser,
  authController.linkWallet,
);

export default authRouter;
