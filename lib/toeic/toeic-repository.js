/**
 * High-Performance TOEIC Data Repository (Milestone E1)
 * Provides O(1) in-memory indexing for 4,000 questions, 24 topics, 15 error patterns,
 * 7 milestone templates, and 540 dictation tracks.
 */

const fs = require('fs');
const path = require('path');

let _cachedData = null;

function resolveCorpusPath() {
  const possiblePaths = [
    path.join(process.cwd(), 'ETS_Corpus_Normalized_Enriched_Database'),
    path.join(__dirname, '..', '..', 'ETS_Corpus_Normalized_Enriched_Database'),
    path.join(process.cwd(), 'data', 'toeic'),
    path.join(__dirname, '..', '..', 'data', 'toeic')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(path.join(p, 'ets_toeic_ai_grammar_master.json'))) {
      return p;
    }
  }
  // Default fallback
  return path.join(process.cwd(), 'ETS_Corpus_Normalized_Enriched_Database');
}

function initRepository() {
  if (_cachedData) return _cachedData;

  const corpusDir = resolveCorpusPath();
  const masterFile = path.join(corpusDir, 'ets_toeic_ai_grammar_master.json');
  const taxonomyFile = path.join(corpusDir, 'grammar_taxonomy.json');
  const errorFile = path.join(corpusDir, 'error_pattern_catalog.json');
  const milestoneFile = path.join(corpusDir, 'milestone_templates.json');

  let masterJson = {};
  if (fs.existsSync(masterFile)) {
    masterJson = JSON.parse(fs.readFileSync(masterFile, 'utf-8'));
  }

  let taxonomyJson = {};
  if (fs.existsSync(taxonomyFile)) {
    taxonomyJson = JSON.parse(fs.readFileSync(taxonomyFile, 'utf-8'));
  }

  let errorJson = {};
  if (fs.existsSync(errorFile)) {
    errorJson = JSON.parse(fs.readFileSync(errorFile, 'utf-8'));
  }

  let milestoneJson = {};
  if (fs.existsSync(milestoneFile)) {
    milestoneJson = JSON.parse(fs.readFileSync(milestoneFile, 'utf-8'));
  }

  const grammarBank = masterJson.part5_part6_grammar_bank || [];
  const questionMap = new Map();
  const topicMap = new Map();
  const questionsByTopic = new Map();
  const questionsByDifficulty = new Map();

  for (const q of grammarBank) {
    questionMap.set(q.id, q);

    const topicId = q.primary_grammar_topic_id;
    if (topicId) {
      if (!questionsByTopic.has(topicId)) {
        questionsByTopic.set(topicId, []);
      }
      questionsByTopic.get(topicId).push(q);
    }

    const diff = q.difficulty_level || 2;
    if (!questionsByDifficulty.has(diff)) {
      questionsByDifficulty.set(diff, []);
    }
    questionsByDifficulty.get(diff).push(q);
  }

  const topics = taxonomyJson.topics || masterJson.grammar_taxonomy?.topics || [];
  for (const t of topics) {
    topicMap.set(t.id, t);
  }

  const errorPatterns = errorJson.error_patterns || masterJson.error_pattern_catalog?.error_patterns || [];
  const errorMap = new Map();
  for (const e of errorPatterns) {
    errorMap.set(e.code, e);
  }

  const milestones = milestoneJson.milestones || masterJson.milestone_templates?.milestones || [];

  _cachedData = {
    corpusDir,
    grammarBank,
    questionMap,
    topicMap,
    topics,
    questionsByTopic,
    questionsByDifficulty,
    errorMap,
    errorPatterns,
    milestones,
    testCache: new Map(),
    dictationCache: new Map()
  };

  return _cachedData;
}

const ToeicRepository = {
  /**
   * Get all 24 grammar & reading/listening topics
   */
  getTaxonomy() {
    const data = initRepository();
    return data.topics;
  },

  /**
   * Get topic by ID
   */
  getTopicById(topicId) {
    const data = initRepository();
    return data.topicMap.get(topicId) || null;
  },

  /**
   * Get all 15 error patterns
   */
  getErrorPatterns() {
    const data = initRepository();
    return data.errorPatterns;
  },

  /**
   * Get error pattern by code
   */
  getErrorPatternByCode(code) {
    const data = initRepository();
    return data.errorMap.get(code) || null;
  },

  /**
   * Get all 7 milestone templates
   */
  getMilestoneTemplates() {
    const data = initRepository();
    return data.milestones;
  },

  /**
   * O(1) lookup question by ID
   */
  getQuestionById(questionId) {
    const data = initRepository();
    if (data.questionMap.has(questionId)) {
      return data.questionMap.get(questionId);
    }

    // If not in grammar bank, check test files
    const parts = questionId.split('_');
    if (parts.length >= 2) {
      const series = parts[0];
      const testCode = parts[1]; // e.g. T01
      const testNum = parseInt(testCode.replace('T', ''), 10);
      if (!isNaN(testNum)) {
        const fullTest = this.getTestQuestionsAndPassages(series, testNum);
        if (fullTest && fullTest.questions) {
          for (const q of fullTest.questions) {
            data.questionMap.set(q.id, q);
            if (q.id === questionId) return q;
          }
        }
      }
    }
    return null;
  },

  /**
   * Get questions by primary grammar topic ID
   */
  getQuestionsByTopic(topicId, limit = 15, excludeIds = []) {
    const data = initRepository();
    const list = data.questionsByTopic.get(topicId) || [];
    const excludeSet = new Set(excludeIds);
    const available = list.filter(q => !excludeSet.has(q.id));
    return available.slice(0, limit);
  },

  /**
   * Get Twin Questions from similar_question_ids
   */
  getTwinQuestions(questionId, limit = 3) {
    const q = this.getQuestionById(questionId);
    if (!q || !q.ai_analysis || !Array.isArray(q.ai_analysis.similar_question_ids)) {
      return [];
    }

    const twins = [];
    for (const simId of q.ai_analysis.similar_question_ids) {
      const simQ = this.getQuestionById(simId);
      if (simQ) {
        twins.push(simQ);
      }
      if (twins.length >= limit) break;
    }

    // Fallback: if not enough twins from similar_question_ids, pull questions with same topic
    if (twins.length < limit && q.primary_grammar_topic_id) {
      const fallback = this.getQuestionsByTopic(q.primary_grammar_topic_id, limit, [questionId, ...twins.map(t => t.id)]);
      for (const fb of fallback) {
        twins.push(fb);
        if (twins.length >= limit) break;
      }
    }

    return twins;
  },

  /**
   * Diagnostic Stage 1: 10 baseline questions across 10 core topics (difficulty = 2)
   */
  getDiagnosticStage1Questions() {
    const data = initRepository();
    const coreTopics = [
      'GRM_POS_NOUN',
      'GRM_POS_ADJ',
      'GRM_POS_ADV',
      'GRM_POS_VERB',
      'GRM_PRON_CASE',
      'GRM_VERB_SVA',
      'GRM_VERB_TENSE',
      'GRM_CONN_PREP_VS_CONJ',
      'GRM_VERB_PARTICIPLE',
      'VOC_COLLOCATION'
    ];

    const stage1 = [];
    for (const topicId of coreTopics) {
      const candidates = (data.questionsByTopic.get(topicId) || []).filter(q => q.difficulty_level === 2);
      if (candidates.length > 0) {
        stage1.push(candidates[0]);
      } else {
        const anyDiff = data.questionsByTopic.get(topicId) || [];
        if (anyDiff.length > 0) stage1.push(anyDiff[0]);
      }
    }
    return stage1;
  },

  /**
   * Diagnostic Stage 2: Adaptive Difficulty Branching based on Stage 1 score
   */
  getDiagnosticStage2Questions(stage1CorrectCount, excludeIds = []) {
    const data = initRepository();
    const excludeSet = new Set(excludeIds);

    const pullFromTopics = (topicConfigs) => {
      const result = [];
      for (const { topicId, count, minDiff, maxDiff } of topicConfigs) {
        const pool = (data.questionsByTopic.get(topicId) || []).filter(
          q => !excludeSet.has(q.id) && q.difficulty_level >= minDiff && q.difficulty_level <= maxDiff
        );
        const selected = pool.slice(0, count);
        result.push(...selected);
        selected.forEach(q => excludeSet.add(q.id));
      }
      return result;
    };

    if (stage1CorrectCount >= 7) {
      // Branch A (Advanced: diff 3-4)
      return pullFromTopics([
        { topicId: 'GRM_VERB_PARTICIPLE', count: 2, minDiff: 3, maxDiff: 4 },
        { topicId: 'GRM_PRON_RELATIVE', count: 1, minDiff: 3, maxDiff: 4 },
        { topicId: 'GRM_CONN_TRANSITION', count: 2, minDiff: 3, maxDiff: 4 },
        { topicId: 'GRM_COMP_QUANTIFIER', count: 1, minDiff: 3, maxDiff: 4 },
        { topicId: 'GRM_COND_INVERSION', count: 1, minDiff: 3, maxDiff: 4 },
        { topicId: 'VOC_PHRASAL_PREP', count: 1, minDiff: 3, maxDiff: 4 },
        { topicId: 'COH_P6_SENTENCE_INSERT', count: 2, minDiff: 3, maxDiff: 4 }
      ]);
    } else if (stage1CorrectCount >= 4) {
      // Branch B (Intermediate: diff 2-3)
      return pullFromTopics([
        { topicId: 'GRM_VERB_PASSIVE', count: 2, minDiff: 2, maxDiff: 3 },
        { topicId: 'GRM_VERB_INFINITIVE_GERUND', count: 2, minDiff: 2, maxDiff: 3 },
        { topicId: 'GRM_CONN_PREP_MEANING', count: 2, minDiff: 2, maxDiff: 3 },
        { topicId: 'GRM_CONN_PREP_VS_CONJ', count: 2, minDiff: 2, maxDiff: 3 },
        { topicId: 'COH_P6_SENTENCE_INSERT', count: 2, minDiff: 2, maxDiff: 3 }
      ]);
    } else {
      // Branch C (Foundation: diff 1-2)
      return pullFromTopics([
        { topicId: 'GRM_POS_NOUN', count: 2, minDiff: 1, maxDiff: 2 },
        { topicId: 'GRM_POS_ADJ', count: 2, minDiff: 1, maxDiff: 2 },
        { topicId: 'GRM_POS_ADV', count: 2, minDiff: 1, maxDiff: 2 },
        { topicId: 'GRM_POS_VERB', count: 2, minDiff: 1, maxDiff: 2 },
        { topicId: 'GRM_PRON_CASE', count: 2, minDiff: 1, maxDiff: 2 }
      ]);
    }
  },

  /**
   * Diagnostic Stage 3: Targeted Weakness Verification (6 Twin Questions from failed questions)
   * + 1 Part 7 Passage (4 questions) for reading speed check
   */
  getDiagnosticStage3Questions(incorrectQuestionIds = [], excludeIds = []) {
    const excludeSet = new Set(excludeIds);
    const stage3Questions = [];

    // 1. Pull 6 twin questions from first 3 incorrect questions (2 per incorrect question)
    const targetWrong = incorrectQuestionIds.slice(0, 3);
    for (const wrongId of targetWrong) {
      const twins = this.getTwinQuestions(wrongId, 2);
      for (const tw of twins) {
        if (!excludeSet.has(tw.id) && stage3Questions.length < 6) {
          stage3Questions.push(tw);
          excludeSet.add(tw.id);
        }
      }
    }

    // Fill remaining up to 6 if needed
    if (stage3Questions.length < 6) {
      const coreFallback = ['GRM_POS_NOUN', 'GRM_VERB_TENSE', 'GRM_CONN_PREP_VS_CONJ'];
      for (const tId of coreFallback) {
        const more = this.getQuestionsByTopic(tId, 2, Array.from(excludeSet));
        for (const m of more) {
          if (stage3Questions.length < 6) {
            stage3Questions.push(m);
            excludeSet.add(m.id);
          }
        }
      }
    }

    // 2. Pull 1 Part 7 Passage with 4 questions
    const part7Passage = this.getSamplePart7Passage();
    if (part7Passage && part7Passage.questions) {
      stage3Questions.push(...part7Passage.questions);
    }

    return {
      questions: stage3Questions,
      passage: part7Passage?.passage || null
    };
  },

  /**
   * Retrieve a sample Part 7 Passage with 4 questions for reading speed check
   */
  getSamplePart7Passage() {
    const data = initRepository();
    const testData = this.getTestQuestionsAndPassages('ETS2024', 1);
    if (!testData || !testData.passages) return null;

    // Look for a 4-question passage group (e.g., P164-167 or similar)
    const passage = testData.passages.find(p => p.questions && p.questions.length === 4 && p.part === 7) || testData.passages[0];
    if (!passage) return null;

    const questions = testData.questions.filter(q => passage.questions.includes(q.number));
    return {
      passage,
      questions
    };
  },

  /**
   * Load test data for ETS2024 or ETS2026 Test 01..10
   */
  getTestQuestionsAndPassages(series = 'ETS2024', testNum = 1, mode = 'full') {
    const data = initRepository();
    const cacheKey = `${series}_T${String(testNum).padStart(2, '0')}_${mode}`;
    if (data.testCache.has(cacheKey)) {
      return data.testCache.get(cacheKey);
    }

    const testFolder = `Test_${String(testNum).padStart(2, '0')}`;
    let readingPath = path.join(data.corpusDir, series, testFolder, 'reading.json');
    if (!fs.existsSync(readingPath)) {
      const alt = path.join(process.cwd(), 'ETS_Corpus_Normalized_Enriched_Database', series, testFolder, 'reading.json');
      if (fs.existsSync(alt)) readingPath = alt;
    }
    let listeningPath = path.join(data.corpusDir, series, testFolder, 'listening.json');
    if (!fs.existsSync(listeningPath)) {
      const alt = path.join(process.cwd(), 'ETS_Corpus_Normalized_Enriched_Database', series, testFolder, 'listening.json');
      if (fs.existsSync(alt)) listeningPath = alt;
    }

    let passages = [];
    let questions = [];

    if (fs.existsSync(readingPath)) {
      try {
        const rData = JSON.parse(fs.readFileSync(readingPath, 'utf-8'));
        passages = rData.passages || [];
        questions = rData.questions || [];
      } catch (e) {
        console.error('Error reading reading.json:', e);
      }
    }

    if (mode === 'full' || mode === 'listening') {
      if (fs.existsSync(listeningPath)) {
        try {
          const lData = JSON.parse(fs.readFileSync(listeningPath, 'utf-8'));
          const lQuestions = lData.questions || [];
          questions = [...lQuestions, ...questions];
        } catch (e) {
          console.error('Error reading listening.json:', e);
        }
      }
    }

    // Filter by mode
    if (mode === 'part5') {
      questions = questions.filter(q => q.part === 5);
      passages = [];
    } else if (mode === 'part6') {
      questions = questions.filter(q => q.part === 6);
      passages = passages.filter(p => p.part === 6);
    } else if (mode === 'part7') {
      questions = questions.filter(q => q.part === 7);
      passages = passages.filter(p => p.part === 7);
    }

    // Group passages by passage_group_id
    const passageGroups = {};
    for (const p of passages) {
      const gId = p.passage_group_id || p.id;
      if (!passageGroups[gId]) {
        passageGroups[gId] = [];
      }
      passageGroups[gId].push(p);
    }
    // Sort each group by doc_order
    for (const gId in passageGroups) {
      passageGroups[gId].sort((a, b) => (a.doc_order || 1) - (b.doc_order || 1));
    }

    const result = {
      series,
      testNumber: testNum,
      mode,
      passages,
      passageGroups,
      questions
    };

    data.testCache.set(cacheKey, result);
    return result;
  },

  /**
   * Load dictation tracks for ETS2026 Test 01..10
   */
  getDictationTracks(series = 'ETS2026', testNum = 1) {
    const data = initRepository();
    const cacheKey = `${series}_T${String(testNum).padStart(2, '0')}`;
    if (data.dictationCache.has(cacheKey)) {
      return data.dictationCache.get(cacheKey);
    }

    const testFolder = `Test_${String(testNum).padStart(2, '0')}`;
    let dictPath = path.join(data.corpusDir, series, testFolder, 'dictation.json');
    if (!fs.existsSync(dictPath)) {
      const alt = path.join(process.cwd(), 'ETS_Corpus_Normalized_Enriched_Database', series, testFolder, 'dictation.json');
      if (fs.existsSync(alt)) dictPath = alt;
    }

    let tracks = [];
    if (fs.existsSync(dictPath)) {
      try {
        const dData = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));
        tracks = dData.tracks || [];
      } catch (e) {
        console.error('Error reading dictation.json:', e);
      }
    }

    data.dictationCache.set(cacheKey, tracks);
    return tracks;
  }
};

ToeicRepository.default = ToeicRepository;
module.exports = ToeicRepository;
