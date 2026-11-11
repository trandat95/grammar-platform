import { supabase } from "../lib/supabase/client";

const DEFAULT_FALLBACK = {
  key: "default",
  policy_version: 1,
  free_exercise_limit: 10,
  free_daily_quiz_limit: 2,
  diagnostic_cooldown_days: 7,
  offline_sync_max_batch: 50,
};

export const PolicyService = {
  async getSystemPolicy(key = "default") {
    try {
      const { data, error } = await supabase
        .from("system_policies")
        .select("*")
        .in("key", [key, "default", "global"])
        .limit(5);

      if (error && error.code !== "PGRST116") throw error;
      const rows = data || [];
      const exact = rows.find((r) => r.key === key) || rows.find((r) => r.key === "default") || rows[0];
      return exact || DEFAULT_FALLBACK;
    } catch (e) {
      console.warn("Could not fetch system policy:", e.message);
      return DEFAULT_FALLBACK;
    }
  },

  async updateSystemPolicy(
    key = "default",
    {
      freeExerciseLimit,
      freeDailyQuizLimit,
      diagnosticCooldownDays = 7,
      offlineSyncMaxBatch = 50,
    }
  ) {
    const payload = {
      key: key === "global" ? "default" : key,
      free_exercise_limit: freeExerciseLimit,
      free_daily_quiz_limit: freeDailyQuizLimit,
      diagnostic_cooldown_days: diagnosticCooldownDays,
      offline_sync_max_batch: offlineSyncMaxBatch,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("system_policies")
      .upsert(payload, { onConflict: "key" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
