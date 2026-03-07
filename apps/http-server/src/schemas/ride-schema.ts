import { z } from "zod";

const VehicleType = [
  "two-wheeler",
  "three-wheeler",
  "four-wheeler"
] as const;

export const rideSchema = z.object({
  driverId: z.string(),
  origin: z.number(),
  destination: z.number(),
  vehicleType: z.enum(VehicleType),
});
