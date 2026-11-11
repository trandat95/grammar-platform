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
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
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

export async function verifyAdmin(req) {
  const user = await verifyServerSession(req);
  if (!user) return null;

  try {
    const serverClient = getAdminClient();
    const { data: profile, error } = await serverClient
      .from("profiles")
      .select("id, email, role, status")
      .eq("id", user.id)
      .single();

    if (error || !profile || profile.role !== "ADMIN" || profile.status !== "ACTIVE") {
      return null;
    }
    return { user, profile };
  } catch (e) {
    console.error("verifyAdmin check failed:", e.message);
    return null;
  }
}

