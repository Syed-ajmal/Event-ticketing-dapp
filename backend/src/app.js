import express from "express";
import morgan from "morgan";
import authRouter from "./routes/auth.routes.js";
import creatorRouter from "./routes/creator.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(express.json()); // with the help of this middleware we can access the data using req.username OR req.email
app.use(morgan("dev")); // Use morgan middleware for logging HTTP requests
app.use(cookieParser()); // It is used to read from the cookies
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);

app.use("/api/auth", authRouter);

app.use("/api/creators", creatorRouter);

export default app;
