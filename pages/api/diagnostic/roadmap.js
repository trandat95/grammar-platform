/**
 * API: /api/diagnostic/roadmap
 * GET: Retrieve active personalized roadmap and items for a user
 * PATCH: Toggle completion status of a roadmap task
 */

import { supabaseServer } from "../../../lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
  return typeof str === "string" && UUID_REGEX.test(str);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { user_id } = req.query;

    if (!user_id || !isValidUUID(user_id)) {
      return res.status(200).json({ success: true, roadmap: null, message: "Guest or invalid UUID" });
    }

    try {
      const { data: roadmap, error } = await supabaseServer
        .from("user_learning_roadmaps")
        .select(`
          id,
          user_id,
          title,
          target_level,
          status,
          created_at,
          roadmap_items (
            id,
            lesson_id,
            topic_id,
            title,
            item_type,
            priority,
            sequence_order,
            status,
            reason,
            completed_at
          )
        `)
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(200).json({ success: true, roadmap });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === "PATCH") {
    const { task_id, is_completed, user_id } = req.body;

    if (!task_id) {
      return res.status(400).json({ success: false, error: "task_id is required" });
    }

    if (user_id && isValidUUID(user_id) && isValidUUID(task_id)) {
      try {
        const { error } = await supabaseServer
          .from("roadmap_items")
          .update({
            status: is_completed ? "COMPLETED" : "PENDING",
            completed_at: is_completed ? new Date().toISOString() : null,
          })
          .eq("id", task_id);

        if (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      } catch (dbErr) {
        console.warn("DB roadmap item update warning:", dbErr.message);
      }
    }

    return res.status(200).json({ success: true, task_id, is_completed });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ success: false, error: "Method not allowed" });
}
