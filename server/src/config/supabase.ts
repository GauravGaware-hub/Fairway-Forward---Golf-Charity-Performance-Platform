import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Server-side Supabase client initialization for Auth token verification
export const supabaseServer = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);
