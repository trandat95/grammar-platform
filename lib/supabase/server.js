import { createClient } from "@supabase/supabase-js";

// Active Supabase Project: wtvlbbcyvtqqygtojxay
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://wtvlbbcyvtqqygtojxay.supabase.co";

// Server-side service key (never exposed to browser)
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function getAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("getAdminClient can only be executed in a server-side runtime!");
  }
  return supabaseServer;
}
