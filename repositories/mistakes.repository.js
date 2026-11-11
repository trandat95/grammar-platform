import { supabase } from "../lib/supabase/client";

export const MistakesRepository = {
  async getByUserId(userId) {
    const { data, error } = await supabase
      .from("user_mistakes")
      .select("*")
      .eq("user_id", userId)
      .order("failed_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async upsertMistake(userId, mistakeItem) {
    const payload = {
      user_id: userId,
      question_id: String(mistakeItem.id || mistakeItem.question_id),
      chapter_title: mistakeItem.chapter_title || mistakeItem.topic_name || "Chưa phân loại",
      question_prompt: mistakeItem.question_prompt || mistakeItem.stem || "",
      user_wrong_answer: mistakeItem.user_wrong_answer || mistakeItem.userAnswer || "",
      correct_answer: Array.isArray(mistakeItem.correct_answer || mistakeItem.answers)
        ? (mistakeItem.correct_answer || mistakeItem.answers).join(" / ")
        : String(mistakeItem.correct_answer || mistakeItem.answers || ""),
      explanation: typeof mistakeItem.explanation === "string" ? mistakeItem.explanation : JSON.stringify(mistakeItem.explanation || {}),
      explanation_structured: mistakeItem.pedagogy || null,
      failed_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_mistakes")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteById(userId, mistakeId) {
    const { error } = await supabase
      .from("user_mistakes")
      .delete()
      .eq("user_id", userId)
      .eq("id", mistakeId);
    if (error) throw error;
    return true;
  },

  async clearAll(userId) {
    const { error } = await supabase
      .from("user_mistakes")
      .delete()
      .eq("user_id", userId);
    if (error) throw error;
    return true;
  },
};
