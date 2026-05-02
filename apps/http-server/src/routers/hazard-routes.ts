import express, { Router } from "express";
import { addNewHazard, confirmHazard, getAllHazards } from "@/controllers/hazard-controller";
import { authMiddleware } from "@/middlewares/auth-middleware";

const router: Router = express.Router();

// RESTful principle: Avoid action verbs in the path if possible
// The HTTP method (POST, GET) already describes the action

// Get all hazards
router.get("/", authMiddleware, getAllHazards);

// The driver will add a new report of a road hazard
router.post("/", authMiddleware, addNewHazard);

// The other drivers will be asked to confirm if the hazards exist or not
router.post("/:hazardId/confirm", authMiddleware, confirmHazard); // Standard URL structure for specific resources

export { router as hazardRouter };