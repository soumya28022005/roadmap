import { endRide, getRideDetails, startNewRide } from "@/controllers/ride-controller";
import { authMiddleware } from "@/middlewares/auth-middleware";
import express, { Router } from "express";

const router: Router = express.Router();

// responds with route data + any hazards already mapped given the route polyline
router.post("/start", authMiddleware, startNewRide);

// simply ends the ride and saves data if needed
router.post("/end", authMiddleware, endRide);

// responds the data related to any specific ride
router.post("/:rideId", authMiddleware, getRideDetails);

export { router as rideRouter };        