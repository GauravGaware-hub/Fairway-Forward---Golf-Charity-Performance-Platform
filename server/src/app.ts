import cors from "cors";
import express, { Express } from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import apiRouter from "./routes/index.js";

export function createApp(): Express {
  const app = express();

  // CORS configuration using CLIENT_URL (supports single or comma-separated origins)
  const allowedOrigins = env.CLIENT_URL.includes(",")
    ? env.CLIENT_URL.split(",").map((url) => url.trim())
    : env.CLIENT_URL;

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  // Stripe Webhook Raw Body Parser (must run BEFORE express.json())
  app.use(
    "/api/v1/webhooks/stripe",
    express.raw({ type: "application/json" })
  );

  app.use(express.json());

  // API v1 Routes Registration
  app.use("/api/v1", apiRouter);

  // 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
