import express from "express";
import morgan from "morgan";
import authRouter from "./routes/auth.routes.js";
import creatorRouter from "./routes/creator.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import eventRouter from "./routes/event.routes.js";

const app = express();

app.use(express.json({ limit: "8mb" })); // Supports bounded base64 event poster uploads.
app.use(morgan("dev")); // Use morgan middleware for logging HTTP requests
app.use(cookieParser()); // It is used to read from the cookies

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  }),
);

app.use("/api/auth", authRouter);

app.use("/api/creators", creatorRouter);

app.use("/api/event", eventRouter);

export default app;
