import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional().default("https://placeholder.supabase.co"),
  SUPABASE_ANON_KEY: z.string().optional().default("placeholder-anon-key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default("placeholder-service-role-key"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().optional().default("http://localhost:5173/subscription/success"),
  STRIPE_CANCEL_URL: z.string().optional().default("http://localhost:5173/subscription/cancel"),
  PRIZE_POOL_PERCENTAGE: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
