import { createClient } from "@supabase/supabase-js";
import { AuthService } from "../../services/auth.service";
import { ProfileService } from "../../services/profile.service";
import { TrackerService } from "../../services/tracker.service";
import { MistakesService } from "../../services/mistakes.service";
import { VocabularyService } from "../../services/vocabulary.service";
import { QuizService } from "../../services/quiz.service";
import { PolicyService } from "../../services/policy.service";
import { ActivityRepository } from "../../repositories/activity.repository";

// Active Supabase Project: wtvlbbcyvtqqygtojxay
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wtvlbbcyvtqqygtojxay.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0dmxiYmN5dnRxcXlndG9qeGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzNDgzMDEsImV4cCI6MjEwOTkyNDMwMX0.LUZdHwRP_fuAT59DlkOiJE9Xnil3W2yeBTq0gR5D2Xc";

// Browser Client (Strictly uses anon key, persists sessions locally)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Delegate functions & aliases for backwards compatibility across existing pages
export const getActiveSession = AuthService.getActiveSession;
export const signInWithSupabase = AuthService.signIn;
export const signUpWithSupabase = AuthService.signUp;
export const signOutSupabase = AuthService.signOut;
export const resetPasswordWithSupabase = AuthService.resetPasswordForEmail;
export const resendConfirmationWithSupabase = AuthService.resendConfirmationEmail;
export const updatePasswordWithSupabase = AuthService.updatePassword;
export const onSupabaseAuthStateChange = AuthService.onAuthStateChange;

export const getProfile = (id) => ProfileService.getProfile(id);
export const upsertProfile = (profile) => ProfileService.updateRoleOrStatus(profile.id, profile);
export const getAllProfiles = ProfileService.getAllProfiles;
export const updateProfileRoleOrStatus = ProfileService.updateRoleOrStatus;

export const getTracker = (userId) => TrackerService.getTracker(userId);
export const upsertTracker = (userId, tracker) => TrackerService.syncTracker(userId, tracker);
export const getUserTracker = TrackerService.getTracker;
export const upsertUserTracker = TrackerService.syncTracker;

export const getMistakes = (userId) => MistakesService.getMistakes(userId);
export const addMistake = (userId, m) => MistakesService.recordMistake(userId, m);
export const removeMistake = (userId, mId) => MistakesService.deleteMistake(userId, mId);
export const getUserMistakes = MistakesService.getMistakes;
export const upsertUserMistake = MistakesService.recordMistake;
export const deleteUserMistake = MistakesService.deleteMistake;
export const clearUserMistakes = MistakesService.clearAllMistakes;

export const getVocabularies = (userId) => VocabularyService.getVocabulary(userId);
export const addVocabulary = (userId, v) => VocabularyService.saveWord(userId, v);
export const removeVocabulary = (userId, vId) => VocabularyService.removeWord(userId, vId);
export const getUserVocabularies = VocabularyService.getVocabulary;
export const insertUserVocabulary = VocabularyService.saveWord;
export const deleteUserVocabulary = VocabularyService.removeWord;

export const insertQuizAttempt = QuizService.recordAttempt;
export const getSystemPolicy = PolicyService.getSystemPolicy;
export const updateSystemPolicy = PolicyService.updateSystemPolicy;

export const logActivity = ActivityRepository.logActivity;
export const getActivityLogs = (limit) => ActivityRepository.getAllLogs(limit);
export const getAllActivityLogs = ActivityRepository.getAllLogs;

export const getAllProfilesWithTrackers = async () => {
  try {
    const profiles = await ProfileService.getAllProfiles();
    const withTrackers = await Promise.all(
      profiles.map(async (p) => {
        try {
          const tracker = await TrackerService.getTracker(p.id);
          return { ...p, tracker };
        } catch {
          return { ...p, tracker: null };
        }
      })
    );
    return withTrackers;
  } catch (err) {
    console.warn("getAllProfilesWithTrackers error:", err.message);
    return [];
  }
};
