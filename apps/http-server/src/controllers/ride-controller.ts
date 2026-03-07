import { rideSchema } from "@/schemas/ride-schema";
import { Request, Response } from "express";

export const startNewRide = async (req: Request, res: Response) => {
  const parsedData = rideSchema.safeParse(req.body);
  if(!parsedData.success) {
    return res.status(400).json({
      message: "Invalid request body.",
    });
  };
  const {driverId, origin, destination, vehicleType} = parsedData.data;
  console.log(driverId, origin, destination, vehicleType);
  return res.status(200).json({ message: "Ride started successfully" });
};

export const endRide = async (req: Request, res: Response) => {
return res.status(200).json({ message: "End ride logic coming soon" });
};

export const getRideDetails = async (req: Request, res: Response) => {
return res.status(200).json({ message: "End ride logic coming soon" });
};