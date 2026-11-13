import { checkApiRateLimit, sendSafeServerError, getCorrelationId } from '../../../../lib/api/security-guard';
import { generateOrUpdateUserRoadmap } from '../../../../lib/ai-engine/roadmap-generator';
import ToeicRepository from '../../../../lib/toeic/toeic-repository';

export default async function handler(req, res) {
  const correlationId = getCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkApiRateLimit(req, res, { windowMs: 60000, maxRequests: 60, tier: 'toeic_roadmap_get' })) {
    return;
  }

  try {
    const { userId } = req.query;

    const taxonomy = ToeicRepository.getTaxonomy();
    const defaultMasteryList = taxonomy.map(t => ({
      grammar_topic_id: t.id,
      topic_name_vi: t.name_vi,
      mastery_score: 50.0,
      focus_priority_index: t.weight_in_toeic * 10
    }));

    const milestones = generateOrUpdateUserRoadmap(
      { id: userId, predicted_toeic_score: 450 },
      defaultMasteryList
    );

    const topFocusTopics = defaultMasteryList
      .sort((a, b) => b.focus_priority_index - a.focus_priority_index)
      .slice(0, 3);

    return res.status(200).json({
      success: true,
      userSummary: {
        userId,
        predictedScore: 450,
        targetScore: 650,
        streakDays: 1,
        dailyGoalQuestions: 30
      },
      milestones,
      topFocusTopics,
      srsDueCount: 5
    });
  } catch (err) {
    return sendSafeServerError(res, err, correlationId, 'Lỗi lấy lộ trình cá nhân hóa');
  }
}
