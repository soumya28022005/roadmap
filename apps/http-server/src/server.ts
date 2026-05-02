import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import { authRouter } from "@/routers/auth-routes";
import { hazardRouter } from "@/routers/hazard-routes";
import { rideRouter } from "@/routers/ride-routes";

const app: Express = express();

// --- Global Middlewares ---
app.use(helmet()); // Security headers add kore
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true // Cookie pass korar jonno mandatory
}));
app.use(express.json({ limit: "10mb" })); // Payload size limit kora holo DDOS theke bachte
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Routes ---
app.use("/api/v1/auth", authRouter); // API versioning add kora industry standard
app.use("/api/v1/ride", rideRouter);
app.use("/api/v1/hazards", hazardRouter);

// --- Health Check ---
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Server health is ok.",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// --- Global Error Handler (Must be at the end) ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error] ${err.message}`);
  res.status(500).json({
    status: "error",
    message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
});

export default app;