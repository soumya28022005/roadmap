import { z } from "zod";

export const HazardType = [
  "POTHOLE",
  "SINGLE_SPEED_BUMP",
  "MULTIPLE_SPEED_BUMP",
  "ROAD_PATCH"
] as const;

export const newHazardSchema = z.object({
  latitude: z.number()
             .min(-90, "Latitude must be >= -90")
             .max(90, "Latitude must be <= 90"),
  longitude: z.number()
              .min(-180, "Longitude must be >= -180")
              .max(180, "Longitude must be <= 180"),
  type: z.enum(HazardType),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional()
});

export const confirmHazardSchema = z.object({
  isTrue: z.boolean(),
  hazardId: z.string().uuid("Invalid Hazard ID format")
});

export type NewHazardRequest = z.infer<typeof newHazardSchema>;
export type ConfirmHazardRequest = z.infer<typeof confirmHazardSchema>;