import { supabaseServer } from "../../../lib/supabase/server";
import { supabase } from "../../../lib/supabase/client";
import { migrateQuestionExplanation } from "../../../lib/explanation/explanation.migrator";
import { adaptExplanationForLevel, DIFFICULTY_LEVELS } from "../../../lib/explanation/explanation.schema";
import quizData from "../../../data/ui/quiz_bank.json";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  const { questionId, difficulty } = req.query;

  if (!questionId) {
    return res.status(400).json({ error: "Missing 'questionId' query parameter." });
  }

  const targetDifficulty = difficulty || DIFFICULTY_LEVELS.INTERMEDIATE;

  try {
    // 1. Try to fetch from Supabase explanations table
    const dbClient = supabaseServer || supabase;
    const { data: dbExplanation, error } = await dbClient
      .from("explanations")
      .select("*")
      .eq("question_id", questionId)
      .eq("status", "published")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbExplanation && !error) {
      const adapted = adaptExplanationForLevel(dbExplanation, targetDifficulty);
      return res.status(200).json({ explanation: adapted, source: "database" });
    }

    // 2. Fallback to question bank in local memory
    let foundQuestion = null;
    for (const topic of quizData.topics || []) {
      const match = topic.questions?.find((q) => q.id === questionId);
      if (match) {
        foundQuestion = match;
        break;
      }
    }

    if (!foundQuestion) {
      return res.status(404).json({ error: `Question with id '${questionId}' not found.` });
    }

    // 3. Migrate and format into standardized 5-field JSON
    const structuredExpl = migrateQuestionExplanation(foundQuestion, targetDifficulty);
    const adapted = adaptExplanationForLevel(structuredExpl, targetDifficulty);

    return res.status(200).json({ explanation: adapted, source: "generated" });
  } catch (err) {
    console.error("[API Explanation Error]:", err);
    return res.status(500).json({ error: "Internal server error fetching explanation." });
  }
}
