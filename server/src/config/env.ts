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
  RAZORPAY_KEY_ID: z.string().optional().default("rzp_test_placeholder"),
  RAZORPAY_KEY_SECRET: z.string().optional().default("secret_placeholder"),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_MONTHLY_PLAN_ID: z.string().optional().default("plan_monthly_placeholder"),
  RAZORPAY_YEARLY_PLAN_ID: z.string().optional().default("plan_yearly_placeholder"),
  PRIZE_POOL_PERCENTAGE: z.string().optional(),
  DEMO_MODE: z.string().optional().transform((val) => val === "true" || val === "1"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
