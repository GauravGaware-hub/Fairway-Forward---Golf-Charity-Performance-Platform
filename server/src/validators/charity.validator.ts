import { z } from "zod";

export const setCharitySelectionSchema = z
  .object({
    charityId: z.string({ required_error: "Charity ID is required" }).min(1),
    contributionPercentage: z
      .number({ required_error: "Contribution percentage is required" })
      .int("Contribution percentage must be an integer")
      .min(10, "Contribution percentage must be at least 10%"),
  })
  .strict();

export const createCharitySchema = z
  .object({
    name: z.string({ required_error: "Charity name is required" }).min(1),
    slug: z.string().optional(),
    description: z.string({ required_error: "Description is required" }).min(1),
    imageUrl: z.string().url("Invalid image URL").or(z.literal("")).nullable().optional(),
    websiteUrl: z.string().url("Invalid website URL").or(z.literal("")).nullable().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateCharitySchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    description: z.string().min(1).optional(),
    imageUrl: z.string().url("Invalid image URL").or(z.literal("")).nullable().optional(),
    websiteUrl: z.string().url("Invalid website URL").or(z.literal("")).nullable().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type SetCharitySelectionDto = z.infer<typeof setCharitySelectionSchema>;
export type CreateCharityDto = z.infer<typeof createCharitySchema>;
export type UpdateCharityDto = z.infer<typeof updateCharitySchema>;
