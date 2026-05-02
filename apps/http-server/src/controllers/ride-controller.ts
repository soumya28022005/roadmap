import { Request, Response, NextFunction } from "express";
import { rideSchema } from "@/schemas/ride-schema";
import { prisma } from "@repo/db";

// Assuming you have the same AuthenticatedRequest type
interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string };
}

export const startNewRide = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = rideSchema.safeParse(req.body);
    
    if (!parsedData.success) {
      return res.status(422).json({
        status: "fail",
        message: "Invalid request data.",
        errors: parsedData.error.flatten().fieldErrors
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized access" });
    }

    const { origin, destination, vehicleType } = parsedData.data;

    // TODO: Create Ride model in Prisma schema
    /*
    const newRide = await prisma.ride.create({
      data: {
        userId,
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: destination.lat,
        destLng: destination.lng,
        vehicleType,
        status: "IN_PROGRESS"
      }
    });
    */

    return res.status(201).json({
      status: "success",
      message: "Ride started successfully",
      data: {
        rideId: "mock-ride-id-replace-with-db-id", // Replace with newRide.id
        origin,
        destination,
        vehicleType
      }
    });

  } catch (error) {
    next(error);
  }
};

export const endRide = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rideId = req.params.rideId;
    
    if (!rideId) {
      return res.status(400).json({ status: "fail", message: "Ride ID is required" });
    }

    // TODO: Update ride status in DB
    /*
    const updatedRide = await prisma.ride.update({
        where: { id: rideId, userId: req.user?.id },
        data: { status: "COMPLETED", endTime: new Date() }
    });
    */

    return res.status(200).json({ 
      status: "success", 
      message: "Ride ended successfully" 
    });
  } catch (error) {
     next(error);
  }
};

export const getRideDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
     const rideId = req.params.rideId;

     // TODO: Fetch from DB
     // const ride = await prisma.ride.findUnique({ where: { id: rideId } });

     return res.status(200).json({ 
       status: "success",
       data: {
         id: rideId,
         status: "IN_PROGRESS",
         // ...other details
       }
     });
  } catch (error) {
     next(error);
  }
};