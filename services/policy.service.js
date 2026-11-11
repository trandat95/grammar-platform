import { supabase } from "../lib/supabase/client";

export const PolicyService = {
  async getSystemPolicy(key = "global") {
    try {
      const { data, error } = await supabase
        .from("system_policies")
        .select("*")
        .eq("key", key)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return (
        data || {
          key: "global",
          free_exercise_limit: 10,
          free_daily_quiz_limit: 2,
        }
      );
    } catch (e) {
      console.warn("Could not fetch system policy:", e.message);
      return {
        key: "global",
        free_exercise_limit: 10,
        free_daily_quiz_limit: 2,
      };
    }
  },

  async updateSystemPolicy(key = "global", { freeExerciseLimit, freeDailyQuizLimit }) {
    const payload = {
      key,
      free_exercise_limit: freeExerciseLimit,
      free_daily_quiz_limit: freeDailyQuizLimit,
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
