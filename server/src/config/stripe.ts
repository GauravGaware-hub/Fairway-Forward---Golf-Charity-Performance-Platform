import Stripe from "stripe";
import { env } from "./env.js";

const apiKey = env.STRIPE_SECRET_KEY || "sk_test_placeholder_key_for_development";

export const stripe = new Stripe(apiKey, {
  apiVersion: "2024-09-30.acacia" as Stripe.LatestApiVersion,
  typescript: true,
});
