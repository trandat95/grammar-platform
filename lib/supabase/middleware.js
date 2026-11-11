import { supabase } from "./client";
import { getAdminClient } from "./server";

export async function getClientSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (err) {
    console.warn("Session retrieval failed:", err.message);
    return null;
  }
}

export async function verifyServerSession(req) {
  const authHeader = req?.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  if (!token) return null;
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Zero-Trust Admin Verification (Milestone 2.4.6)
 * Requires either a verified Supabase GoTrue JWT belonging to an ACTIVE ADMIN profile
 * or a valid server-side SUPABASE_SERVICE_ROLE_KEY in x-admin-key.
 * Never trusts client-spoofed email or localStorage headers.
 */
export async function verifyAdmin(req) {
  // 1. Check Service Role Key for trusted server scripts
  const adminKey = req?.headers?.["x-admin-key"];
  if (
    adminKey &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    adminKey === process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      user: { id: "a0000000-0000-0000-0000-000000000001", email: "system-admin@grammarpro.com" },
      profile: { role: "ADMIN", status: "ACTIVE" },
    };
  }

  // 2. Verify authentic Supabase GoTrue JWT Bearer token
  const user = await verifyServerSession(req);
  if (user) {
    try {
      const serverClient = getAdminClient();
      const { data: profile, error } = await serverClient
        .from("profiles")
        .select("id, email, role, status")
        .eq("id", user.id)
        .single();

      if (!error && profile && profile.role === "ADMIN" && profile.status === "ACTIVE") {
        return { user, profile };
      }
    } catch (e) {
      console.error("verifyAdmin DB lookup error:", e.message);
    }
  }

  return null;
}
