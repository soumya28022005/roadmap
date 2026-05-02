import { Request, Response, NextFunction } from "express";
import { rideSchema } from "@/schemas/ride-schema";
import { prisma } from "@repo/db";

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string };
}

// 1. START A NEW RIDE
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

    // Assuming origin and destination come as { lat: number, lng: number } from frontend/Zod
    const { origin, destination, vehicleType } = parsedData.data;

    // 🔥 Store the ride in the Database
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

    return res.status(201).json({
      status: "success",
      message: "Ride started successfully",
      data: {
        rideId: newRide.id,
        status: newRide.status,
        startTime: newRide.startTime
      }
    });

  } catch (error) {
    next(error);
  }
};

// 2. END A RIDE
export const endRide = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rideId = req.params.rideId; // Extracted from URL: /api/v1/ride/:rideId/end
    const userId = req.user?.id;
    
    if (!rideId || !userId) {
      return res.status(400).json({ status: "fail", message: "Ride ID is required" });
    }

    // 🔥 Update the ride status and set endTime
    const updatedRide = await prisma.ride.update({
        where: { 
            id: rideId,
            userId: userId // Security check: Only the ride owner can end it
        },
        data: { 
            status: "COMPLETED", 
            endTime: new Date() 
        }
    });

    return res.status(200).json({ 
      status: "success", 
      message: "Ride ended successfully",
      data: {
          rideId: updatedRide.id,
          endTime: updatedRide.endTime
      }
    });
  } catch (error) {
     console.error("Error ending ride:", error);
     return res.status(500).json({ status: "error", message: "Failed to end ride. Please check if Ride ID is correct."});
  }
};

// 3. GET RIDE DETAILS
export const getRideDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
     const rideId = req.params.rideId;

     // 🔥 Fetch from Database
     const ride = await prisma.ride.findUnique({ 
         where: { id: rideId } 
     });

     if (!ride) {
         return res.status(404).json({ status: "fail", message: "Ride not found" });
     }

     return res.status(200).json({ 
       status: "success",
       data: ride
     });
  } catch (error) {
     next(error);
  }
};