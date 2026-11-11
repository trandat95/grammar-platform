import { supabase } from "../lib/supabase/client";

export const DiagnosticRepository = {
  async getActiveTest() {
    const { data, error } = await supabase
      .from("diagnostic_tests")
      .select("*")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async createAttempt(userId, testId, totalQuestions = 30) {
    const { data, error } = await supabase
      .from("diagnostic_attempts")
      .insert({
        user_id: userId,
        test_id: testId,
        total_questions: totalQuestions,
        status: "IN_PROGRESS",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async recordAnswers(attemptId, answersArray) {
    const rows = answersArray.map((ans) => ({
      attempt_id: attemptId,
      question_id: ans.questionId,
      question_snapshot: ans.questionSnapshot || null,
      selected_answer: ans.selectedAnswer,
      is_correct: ans.isCorrect,
      time_spent_seconds: ans.timeSpentSeconds || 0,
      answered_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("diagnostic_answers")
      .insert(rows)
      .select();
    if (error) throw error;
    return data;
  },

  async finalizeAttempt(attemptId, { correctAnswers, totalScore, estimatedLevel }) {
    const { data, error } = await supabase
      .from("diagnostic_attempts")
      .update({
        correct_answers: correctAnswers,
        total_score: totalScore,
        estimated_level: estimatedLevel,
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
      })
      .eq("id", attemptId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async saveSkillResults(attemptId, userId, skillResultsArray) {
    const rows = skillResultsArray.map((res) => ({
      attempt_id: attemptId,
      user_id: userId,
      topic_id: res.topicId,
      topic_name: res.topicName,
      total_questions: res.totalQuestions,
      correct_answers: res.correctAnswers,
      accuracy: res.accuracy,
      confidence: res.confidence || "medium",
      classification: res.classification || "developing",
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("diagnostic_skill_results")
      .insert(rows)
      .select();
    if (error) throw error;
    return data;
  },

  async createRoadmap(userId, attemptId, roadmapData) {
    const { data: roadmap, error: rError } = await supabase
      .from("user_learning_roadmaps")
      .insert({
        user_id: userId,
        diagnostic_attempt_id: attemptId,
        title: roadmapData.title || "Personalized Grammar Mastery Plan",
        target_level: roadmapData.targetLevel || "B1",
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (rError) throw rError;

    if (roadmapData.items && roadmapData.items.length > 0) {
      const items = roadmapData.items.map((item, idx) => ({
        roadmap_id: roadmap.id,
        user_id: userId,
        lesson_id: item.lessonId,
        practice_id: item.practiceId || null,
        topic_id: item.topicId || null,
        title: item.title,
        item_type: item.itemType || "THEORY",
        priority: item.priority || "HIGH",
        sequence_order: idx + 1,
        status: "PENDING",
        reason: item.reason || "",
      }));

      const { error: itemsError } = await supabase
        .from("roadmap_items")
        .insert(items);
      if (itemsError) throw itemsError;
    }

    return roadmap;
  },

  async getLatestRoadmap(userId) {
    const { data: roadmap, error } = await supabase
      .from("user_learning_roadmaps")
      .select("*, roadmap_items(*)")
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return roadmap;
  },
};
