import { createClient } from "@supabase/supabase-js";

// Active Supabase Project: wtvlbbcyvtqqygtojxay
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wtvlbbcyvtqqygtojxay.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0dmxiYmN5dnRxcXlndG9qeGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzNDgzMDEsImV4cCI6MjEwOTkyNDMwMX0.LUZdHwRP_fuAT59DlkOiJE9Xnil3W2yeBTq0gR5D2Xc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: Get active Supabase session
export async function getActiveSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (e) {
    console.warn("Could not get active session:", e.message);
    return null;
  }
}

// Helper: Sign in with Supabase
export async function signInWithSupabase(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// Helper: Sign up with Supabase
export async function signUpWithSupabase(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "FREE",
      },
    },
  });
  if (error) throw error;
  return data;
}

// Helper: Sign out from Supabase
export async function signOutSupabase() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Sign out warning:", e.message);
    return false;
  }
}

// Helper: Fetch all profiles (for Admin Management)
export async function getAllProfiles() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn("Could not fetch all profiles from Supabase:", e.message);
    return [];
  }
}

// Helper: Update user profile role or status (for Admin)
export async function updateProfileRoleOrStatus(userId, { role, status }) {
  try {
    const updates = { updated_at: new Date().toISOString() };
    if (role) updates.role = role;
    if (status) updates.status = status;
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("Could not update profile role/status:", e.message);
    return null;
  }
}

// Helper: Log user activity for Admin audit
export async function logActivity(userId, userEmail, actionType, details = {}) {
  try {
    const { data, error } = await supabase
      .from("user_activity_logs")
      .insert({
        user_id: userId,
        user_email: userEmail,
        action_type: actionType,
        details: details,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("Could not log activity:", e.message);
    return null;
  }
}

// Helper: Fetch recent activity logs (for Admin)
export async function getActivityLogs(limit = 50) {
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
}

// Helper: Fetch all profiles combined with their learning trackers (for Admin)
export async function getAllProfilesWithTrackers() {
  try {
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (pErr) throw pErr;

    const { data: trackers } = await supabase
      .from("user_learning_trackers")
      .select("*");

    const trackerMap = (trackers || []).reduce((acc, t) => {
      acc[t.user_id] = t;
      return acc;
    }, {});

    return (profiles || []).map((p) => ({
      ...p,
      tracker: trackerMap[p.id] || { streak: 1, xp: 0, completed_lessons: [], last_active_date: null },
    }));
  } catch (e) {
    console.warn("Could not fetch profiles with trackers:", e.message);
    return [];
  }
}

// Helper: Fetch user profile
export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("Could not fetch profile from Supabase:", e.message);
    return null;
  }
}

// Helper: Upsert user profile
export async function upsertProfile(profile) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: profile.id,
        email: profile.email,
        full_name: profile.name || profile.full_name,
        role: profile.role || "FREE",
        status: profile.status || "ACTIVE",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("Could not upsert profile on Supabase:", e.message);
    return null;
  }
}

// Helper: Fetch user tracker (streak, xp, etc.)
export async function getTracker(userId) {
  try {
    const { data, error } = await supabase
      .from("user_learning_trackers")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  } catch (e) {
    console.warn("Could not fetch tracker from Supabase:", e.message);
    return null;
  }
}

// Helper: Upsert user tracker
export async function upsertTracker(userId, trackerData) {
  try {
    const { data, error } = await supabase
      .from("user_learning_trackers")
      .upsert({
        user_id: userId,
        streak: trackerData.streak || 1,
        xp: trackerData.xp || 0,
        last_active_date: trackerData.lastActiveDate || new Date().toISOString().split("T")[0],
        active_days: trackerData.activeDays || [],
        daily_goal: trackerData.dailyGoal || { targetQuestions: 10, solvedToday: 0 },
        completed_lessons: trackerData.completedLessons || [],
        quizzes_completed_today: trackerData.quizzesCompletedToday || 0,
        quiz_date: trackerData.quizDate || new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("Could not upsert tracker on Supabase:", e.message);
    return null;
  }
}

// Helper: Fetch user mistakes
export async function getMistakes(userId) {
  try {
    const { data, error } = await supabase
      .from("user_mistakes")
      .select("*")
      .eq("user_id", userId)
      .order("failed_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn("Could not fetch mistakes from Supabase:", e.message);
    return [];
  }
}

// Helper: Add mistake
export async function addMistake(userId, mistake) {
  try {
    const { data, error } = await supabase
      .from("user_mistakes")
      .insert({
        user_id: userId,
        question_id: mistake.id || mistake.question_id || `q_${Date.now()}`,
        chapter_title: mistake.chapterTitle || mistake.chapter_title || "",
        question_prompt: mistake.prompt || mistake.question_prompt || "",
        user_wrong_answer: mistake.wrongAnswer || mistake.user_wrong_answer || "",
        correct_answer: mistake.correctAnswer || mistake.correct_answer || "",
        explanation: mistake.explanation || "",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("Could not add mistake on Supabase:", e.message);
    return null;
  }
}

// Helper: Remove mistake
export async function removeMistake(userId, questionId) {
  try {
    const { error } = await supabase
      .from("user_mistakes")
      .delete()
      .eq("user_id", userId)
      .eq("question_id", questionId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Could not remove mistake on Supabase:", e.message);
    return false;
  }
}

// Helper: Fetch user vocabularies
export async function getVocabularies(userId) {
  try {
    const { data, error } = await supabase
      .from("user_vocabularies")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn("Could not fetch vocabularies from Supabase:", e.message);
    return [];
  }
}

// Helper: Add vocabulary
export async function addVocabulary(userId, vocab) {
  try {
    const { data, error } = await supabase
      .from("user_vocabularies")
      .insert({
        user_id: userId,
        word: vocab.word,
        phonetic: vocab.phonetic || "",
        vietnamese: vocab.vietnamese || "",
        part_of_speech: vocab.partOfSpeech || vocab.part_of_speech || "",
        audio_url: vocab.audioUrl || vocab.audio_url || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("Could not add vocabulary on Supabase:", e.message);
    return null;
  }
}

// Helper: Remove vocabulary
export async function removeVocabulary(userId, word) {
  try {
    const { error } = await supabase
      .from("user_vocabularies")
      .delete()
      .eq("user_id", userId)
      .ilike("word", word);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Could not remove vocabulary on Supabase:", e.message);
    return false;
  }
}

// Helper: Get system policy
export async function getSystemPolicy() {
  try {
    const { data, error } = await supabase
      .from("system_policies")
      .select("*")
      .eq("key", "default")
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("Could not fetch system policy from Supabase:", e.message);
    return null;
  }
}

// Helper: Update system policy
export async function updateSystemPolicy(policy) {
  try {
    const { data, error } = await supabase
      .from("system_policies")
      .upsert({
        key: "default",
        free_exercise_limit: policy.freeExerciseLimit || policy.free_exercise_limit || 10,
        free_daily_quiz_limit: policy.freeDailyQuizLimit || policy.free_daily_quiz_limit || 2,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn("Could not update system policy on Supabase:", e.message);
    return null;
  }
}
