/**
 * Personalized 7-Milestone Roadmap Generator (Milestone E2)
 * Matches specification in Section 3.3 verbatim.
 */

const ToeicRepository = require('../toeic/toeic-repository');

/**
 * Generate or update user roadmap based on diagnostic/test results and mastery state
 */
function generateOrUpdateUserRoadmap(user, topicMasteryList = []) {
  const milestoneTemplates = ToeicRepository.getMilestoneTemplates();
  const predictedScore = user.predicted_toeic_score || 450;

  // Build map of topic mastery scores and FPI
  const masteryMap = new Map();
  for (const m of topicMasteryList) {
    masteryMap.set(m.grammar_topic_id, m);
  }

  // Find top 2 highest FPI topics across all topics
  const sortedByFpi = [...topicMasteryList].sort((a, b) => (b.focus_priority_index || 0) - (a.focus_priority_index || 0));
  const topFpiTopicIds = sortedByFpi.slice(0, 5).map(m => m.grammar_topic_id);

  let firstIncompleteFound = false;
  const userMilestones = [];

  for (let i = 0; i < milestoneTemplates.length; i++) {
    const template = milestoneTemplates[i];
    const order = template.order || (i + 1);
    const focusTopics = template.focus_topic_ids || [];

    // Calculate average mastery score for this milestone's focus topics
    let totalMastery = 0;
    let count = 0;
    for (const tId of focusTopics) {
      if (masteryMap.has(tId)) {
        totalMastery += masteryMap.get(tId).mastery_score || 0;
        count++;
      }
    }
    const avgMastery = count > 0 ? totalMastery / count : 0;

    // Rule 1: Fast-track if target band <= predictedScore - 30 AND avgMastery >= 80%
    const isFastTrack = (template.target_band_score <= (predictedScore - 30)) && (avgMastery >= 80);

    let status = 'LOCKED';
    let injectedTopics = [];

    if (isFastTrack) {
      status = 'COMPLETED';
    } else if (!firstIncompleteFound) {
      status = 'IN_PROGRESS';
      firstIncompleteFound = true;

      // Rule 3: Personal Weakness Injection: top 2 highest FPI topics not in focus_topics
      for (const fpiId of topFpiTopicIds) {
        if (!focusTopics.includes(fpiId) && injectedTopics.length < 2) {
          injectedTopics.push(fpiId);
        }
      }
    } else {
      status = 'LOCKED';
    }

    userMilestones.push({
      milestone_id: template.milestone_id,
      milestone_order: order,
      title_vi: template.title_vi,
      target_band_score: template.target_band_score,
      status,
      focus_topic_ids: focusTopics,
      injected_weak_topic_ids_json: injectedTopics,
      completed_drill_questions: 0,
      required_drill_questions: 48,
      best_boss_gate_accuracy: 0.0,
      boss_gate_passed: isFastTrack,
      boss_gate_criteria: template.boss_gate_criteria
    });
  }

  // Edge case: if all were fast-tracked, keep last one in progress
  if (!firstIncompleteFound && userMilestones.length > 0) {
    userMilestones[userMilestones.length - 1].status = 'IN_PROGRESS';
    userMilestones[userMilestones.length - 1].boss_gate_passed = false;
  }

  return userMilestones;
}

/**
 * Rule 4: Boss Gate Evaluation
 */
function evaluateBossGateAttempt(milestone, attemptStats) {
  const criteria = milestone.boss_gate_criteria || {
    question_count: 20,
    max_time_sec: 420,
    min_accuracy_pct: 85
  };

  const accuracy = attemptStats.accuracy_pct || 0;
  const totalTime = attemptStats.time_spent_sec || 0;
  const passed = (accuracy >= criteria.min_accuracy_pct) && (totalTime <= criteria.max_time_sec);

  let remediationTwinQuestionIds = [];
  if (!passed) {
    const wrongQuestions = attemptStats.wrong_questions || [];
    for (const wq of wrongQuestions) {
      const twins = ToeicRepository.getTwinQuestions(wq.id, 2);
      for (const tw of twins) {
        if (!remediationTwinQuestionIds.includes(tw.id) && remediationTwinQuestionIds.length < 10) {
          remediationTwinQuestionIds.push(tw.id);
        }
      }
    }
  }

  return {
    passed,
    accuracy,
    totalTime,
    criteria,
    remediationTwinQuestionIds
  };
}

const RoadmapGenerator = {
  generateOrUpdateUserRoadmap,
  evaluateBossGateAttempt
};

module.exports = {
  ...RoadmapGenerator,
  default: RoadmapGenerator
};
