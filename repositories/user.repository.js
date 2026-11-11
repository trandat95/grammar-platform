import { supabase } from "../lib/supabase/client";

export const UserRepository = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getTracker(userId) {
    const { data, error } = await supabase
      .from("user_learning_trackers")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async upsertTracker(userId, trackerData) {
    const payload = {
      user_id: userId,
      streak: trackerData.streak || 1,
      xp: trackerData.xp || 0,
      last_active_date: trackerData.last_active_date || new Date().toISOString().split("T")[0],
      active_days: trackerData.active_days || [new Date().toISOString().split("T")[0]],
      daily_goal: trackerData.daily_goal || { targetQuestions: 10, targetLessons: 1 },
      completed_lessons: trackerData.completed_lessons || [],
      quizzes_today: trackerData.quizzes_today || 0,
      quiz_date: trackerData.quiz_date || new Date().toISOString().split("T")[0],
      version: (trackerData.version || 1) + 1,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_learning_trackers")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
