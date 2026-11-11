import { supabaseServer } from "../../../../lib/supabase/server";
import { supabase } from "../../../../lib/supabase/client";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  const dbClient = supabaseServer || supabase;

  try {
    const { questionId } = req.query;

    let query = dbClient.from("explanation_feedback").select("*");
    if (questionId) {
      query = query.eq("question_id", questionId);
    }

    const { data: allFeedback, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const total = allFeedback.length;
    const helpful = allFeedback.filter((f) => f.feedback_type === "helpful").length;
    const reported = allFeedback.filter((f) => f.feedback_type === "report_error").length;
    const helpfulRate = total > 0 ? Math.round((helpful / total) * 100) : 100;

    // Error category breakdown
    const errorBreakdown = {};
    allFeedback
      .filter((f) => f.feedback_type === "report_error" && f.error_category)
      .forEach((f) => {
        errorBreakdown[f.error_category] = (errorBreakdown[f.error_category] || 0) + 1;
      });

    return res.status(200).json({
      summary: {
        totalFeedback: total,
        helpfulCount: helpful,
        reportErrorCount: reported,
        helpfulRatePercent: helpfulRate,
        errorBreakdown,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error fetching feedback summary." });
  }
}
