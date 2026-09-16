import { z } from "zod";

export const createScoreSchema = z
  .object({
    score: z
      .number({ required_error: "Score is required" })
      .int("Score must be an integer")
      .min(1, "Score must be at least 1")
      .max(45, "Score cannot exceed 45"),
    playedAt: z
      .string({ required_error: "Played date is required" })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format for playedAt",
      })
      .transform((val) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          return new Date(`${val}T00:00:00.000Z`);
        }
        return new Date(val);
      }),
  })
  .strict();

export const updateScoreSchema = z
  .object({
    score: z
      .number()
      .int("Score must be an integer")
      .min(1, "Score must be at least 1")
      .max(45, "Score cannot exceed 45")
      .optional(),
    playedAt: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format for playedAt",
      })
      .transform((val) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          return new Date(`${val}T00:00:00.000Z`);
        }
        return new Date(val);
      })
      .optional(),
  })
  .strict();

export type CreateScoreDto = z.infer<typeof createScoreSchema>;
export type UpdateScoreDto = z.infer<typeof updateScoreSchema>;
