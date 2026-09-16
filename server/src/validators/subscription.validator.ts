import { z } from "zod";

export const createCheckoutSessionSchema = z
  .object({
    plan: z.enum(["MONTHLY", "YEARLY"], {
      errorMap: () => ({ message: "Plan must be either MONTHLY or YEARLY" }),
    }),
  })
  .strict();

export type CreateCheckoutSessionDto = z.infer<typeof createCheckoutSessionSchema>;
