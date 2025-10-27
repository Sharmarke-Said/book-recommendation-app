import express from "express";
import cors from "cors";
import "dotenv/config";
import job from "./lib/cron.js";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { connectDB } from "./lib/db.js";
import { globalErrorHandler } from "./controllers/errorController.js";

const app = express();
const PORT = process.env.PORT || 3000;

// job.start();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION shutting down...");
  console.error(`${err.name}: ${err.message}`);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION shutting down...");
  console.error(`${err.name}: ${err.message} ${err.stack}`);
  server.close(() => {
    process.exit(1);
  });
});
