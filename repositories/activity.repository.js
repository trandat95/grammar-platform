import { supabase } from "../lib/supabase/client";

export const ActivityRepository = {
  async logActivity(userId, userEmail, actionType, details = {}) {
    try {
      const { data, error } = await supabase
        .from("user_activity_logs")
        .insert({
          user_id: userId,
          user_email: userEmail,
          action_type: actionType,
          details,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) console.warn("Log activity error:", error.message);
      return data;
    } catch (e) {
      console.warn("Could not log activity:", e.message);
      return null;
    }
  },

  async getAllLogs(limit = 100) {
    try {
      const { data, error } = await supabase
        .from("user_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Could not fetch activity logs:", e.message);
      return [];
    }
  },
};
