import { supabase } from "../lib/supabase/client";

export const QuizRepository = {
  async insertAttempt(userId, { topicCode, score, totalQuestions, timeSpentSeconds, incorrectQuestionIds }) {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: userId,
        topic_code: topicCode || "all",
        score: score || 0,
        total_questions: totalQuestions || 50,
        time_spent_seconds: timeSpentSeconds || 0,
        incorrect_question_ids: incorrectQuestionIds || [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getUserHistory(userId, limit = 20) {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};
