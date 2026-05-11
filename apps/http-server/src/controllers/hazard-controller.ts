import { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/db";
import { newHazardSchema, confirmHazardSchema } from "@/schemas/hazard-schema";

// Custom request type (assuming you have this defined in a types file ideally)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const addNewHazard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = newHazardSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(422).json({
        status: "fail",
        message: "Invalid request data",
        errors: parsedData.error.flatten().fieldErrors
      });
    }

    const { latitude, longitude, type, description } = parsedData.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized access" });
    }

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return res.status(401).json({ status: "fail", message: "User account not found" });
    }

    // 🔥 FIXED: Using Prisma's Nested Write feature
    // Eta automatically backend-e transaction handle kore ebang sothik foreign key bosiye dey
    const newHazard = await prisma.report.create({
        data: {
            latitude,
            longitude,
            type,
            description,
            userId,
            confidence: 1.0,
            confirmations: {
                create: {
                    userId,
                    isTrue: true
                }
            }
        }
    });

    return res.status(201).json({
      message: "Hazard reported successfully",
      hazardId: newHazard.id
    });

  } catch (error) {
    next(error);
  }
};

export const confirmHazard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = confirmHazardSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(422).json({
        status: "fail",
        message: "Invalid request data",
        errors: parsedData.error.flatten().fieldErrors
      });
    }

    const { isTrue, hazardId } = parsedData.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized access" });
    }

    // Run independent checks concurrently
    const [userExists, existingConfirmation] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.confirmation.findUnique({
        where: {
          reportId_userId: { reportId: hazardId, userId }
        }
      })
    ]);

    if (!userExists) {
      return res.status(401).json({ status: "fail", message: "User account not found" });
    }

    if (existingConfirmation) {
      return res.status(409).json({
        status: "fail",
        message: "You have already confirmed or dismissed this hazard"
      });
    }

    // Check if hazard exists
    const hazard = await prisma.report.findUnique({ where: { id: hazardId } });
    if (!hazard) {
      return res.status(404).json({ status: "fail", message: "Hazard not found" });
    }

    // Use transaction for Confirmation creation + Confidence update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create confirmation
      const confirmation = await tx.confirmation.create({
        data: { reportId: hazardId, userId, isTrue }
      });

      // 2. Fetch all current confirmations to recalculate
      // Optimization: You can aggregate directly in DB, but fetching is okay for now if data is small.
      const allConfirmations = await tx.confirmation.findMany({ 
          where: { reportId: hazardId },
          select: { isTrue: true } // Only fetch what's needed
      });
      
      const totalConfirmations = allConfirmations.length;
      const positiveConfirmations = allConfirmations.filter(c => c.isTrue).length;

      // Base confidence logic
      let newConfidence = totalConfirmations > 0 ? positiveConfirmations / totalConfirmations : 0.5;

      // 3. Update report confidence
      await tx.report.update({
        where: { id: hazardId },
        data: { confidence: newConfidence }
      });

      return { confirmationId: confirmation.id, newConfidence };
    });

    return res.status(200).json({
      status: "success",
      message: "Confirmation recorded",
      data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getAllHazards = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Only select the data needed for the map/UI to reduce payload size
    const hazards = await prisma.report.findMany({
        select: {
            id: true,
            type: true,
            latitude: true,
            longitude: true,
            confidence: true
        }
    });

  return res.status(200).json(
    hazards.map(hazard => ({
      hazardId: hazard.id,
      hazardType: hazard.type,
      latitude: hazard.latitude,
      longitude: hazard.longitude,
      confidence: hazard.confidence
    }))
  );

  } catch (error) {
    next(error);
  }
};