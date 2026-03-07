import express from "express";
import type { Express, Request, Response } from "express";
import { authRouter } from "@/routers/auth-routes";
import { authMiddleware } from "@/middlewares/auth-middleware";
import { hazardRouter } from "./routers/hazard-routes";
import { rideRouter } from "./routers/ride-routes";
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/ride", rideRouter);
app.use("/hazards", hazardRouter);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Server health is ok.",
    environment: process.env.NODE_ENV || "unknown",
  });
});

export default app;
