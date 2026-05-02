import { z } from "zod";

const VehicleType = [
  "two-wheeler",
  "three-wheeler",
  "four-wheeler"
] as const;

// Notun: Location ke object hisebe toiri kora hocche
const locationSchema = z.object({
  lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  lng: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
});

export const rideSchema = z.object({
  driverId: z.string().optional(), // Jekhetu aager schema te chilo, eta optional kore dilam 
  origin: locationSchema,         // Ekhon origin ekta object (lat, lng)
  destination: locationSchema,    // Ekhon destination ekta object (lat, lng)
  vehicleType: z.enum(VehicleType),
});

export type RideRequest = z.infer<typeof rideSchema>;