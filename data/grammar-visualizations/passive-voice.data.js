/**
 * Structured Visualization Data for Passive Voice (Chapter 10, Lesson 1 & 2)
 * Interactive Transformation Diagram Model
 */

export const PASSIVE_VOICE_VISUALIZATION_DATA = {
  id: "passive-voice-transform",
  title: "Sơ Đồ Biến Đổi Câu Bị Động (Passive Voice Transformation Diagram)",
  description: "Trực quan hóa luồng dịch chuyển vị trí S - V - O, quy tắc chia trợ động từ TO BE theo từng thì, và nguyên tắc lược bỏ tác nhân By + O.",
  steps: [
    {
      step: 1,
      title: "Xác định thành phần câu chủ động",
      instruction: "Tách bạch rõ Chủ ngữ (Subject), Động từ chính (Verb), và Tân ngữ trực tiếp (Object).",
      icon: "🔍",
    },
    {
      step: 2,
      title: "Chuyển Tân ngữ lên làm Chủ ngữ mới",
      instruction: "Tân ngữ (O) của câu chủ động chuyển lên đầu câu làm Chủ ngữ (S) của câu bị động.",
      icon: "➡️",
    },
    {
      step: 3,
      title: "Xác định dạng thích hợp của Động từ TO BE",
      instruction: "Chia 'TO BE' theo THÌ của câu chủ động VÀ số ít/số nhiều của CHỦ NGỮ MỚI.",
      icon: "⚙️",
    },
    {
      step: 4,
      title: "Đưa động từ chính về Quá khứ phân từ (V3/V-ed)",
      instruction: "Động từ chính chuyển thành dạng V3 (Past Participle).",
      icon: "🔄",
    },
    {
      step: 5,
      title: "Đặt tác nhân thực hiện sau 'By + Tân ngữ'",
      instruction: "Chủ ngữ ban đầu đưa về sau với 'by + O'. Lược bỏ nếu tác nhân không quan trọng hoặc chung chung.",
      icon: "🏷️",
    },
  ],
  tensesExamples: [
    {
      tense_id: "PRES_SIMPLE",
      tense_name: "Hiện tại đơn (Present Simple)",
      be_formula: "am / is / are + V3",
      active: {
        subject: "The company",
        verb: "develops",
        object: "innovative software",
        full: "The company develops innovative software every year.",
      },
      passive: {
        subject: "Innovative software",
        be_verb: "is",
        past_participle: "developed",
        agent: "by the company",
        full: "Innovative software is developed by the company every year.",
      },
      explanation: "Chủ ngữ mới 'Innovative software' là danh từ không đếm được -> dùng 'is' + V3 'developed'.",
    },
    {
      tense_id: "PAST_SIMPLE",
      tense_name: "Quá khứ đơn (Past Simple)",
      be_formula: "was / were + V3",
      active: {
        subject: "Alexander Fleming",
        verb: "discovered",
        object: "penicillin",
        full: "Alexander Fleming discovered penicillin in 1928.",
      },
      passive: {
        subject: "Penicillin",
        be_verb: "was",
        past_participle: "discovered",
        agent: "by Alexander Fleming",
        full: "Penicillin was discovered by Alexander Fleming in 1928.",
      },
      explanation: "Thì quá khứ đơn -> To Be chia là 'was' (số ít) + V3 'discovered'.",
    },
    {
      tense_id: "PRES_CONT",
      tense_name: "Hiện tại tiếp diễn (Present Continuous)",
      be_formula: "am / is / are + being + V3",
      active: {
        subject: "The engineers",
        verb: "are testing",
        object: "the electric car",
        full: "The engineers are testing the electric car right now.",
      },
      passive: {
        subject: "The electric car",
        be_verb: "is being",
        past_participle: "tested",
        agent: "by the engineers",
        full: "The electric car is being tested by the engineers right now.",
      },
      explanation: "Tiếp diễn luôn có 'being' đứng trước V3: 'is being tested'.",
    },
    {
      tense_id: "PRES_PERF",
      tense_name: "Hiện tại hoàn thành (Present Perfect)",
      be_formula: "have / has + been + V3",
      active: {
        subject: "They",
        verb: "have built",
        object: "a new high-tech hospital",
        full: "They have built a new high-tech hospital in the city.",
      },
      passive: {
        subject: "A new high-tech hospital",
        be_verb: "has been",
        past_participle: "built",
        agent: "", // Omitted: 'by them' is vague
        full: "A new high-tech hospital has been built in the city.",
      },
      explanation: "Tác nhân 'They' không xác định cụ thể nên được LƯỢC BỎ. Hoàn thành luôn có 'been': 'has been built'.",
    },
    {
      tense_id: "FUT_SIMPLE",
      tense_name: "Tương lai đơn (Future Simple)",
      be_formula: "will be + V3",
      active: {
        subject: "The government",
        verb: "will construct",
        object: "a modern bridge",
        full: "The government will construct a modern bridge next year.",
      },
      passive: {
        subject: "A modern bridge",
        be_verb: "will be",
        past_participle: "constructed",
        agent: "by the government",
        full: "A modern bridge will be constructed by the government next year.",
      },
      explanation: "Động từ khiếm khuyết / tương lai dùng 'will be' + V3 'constructed'.",
    },
    {
      tense_id: "MODAL",
      tense_name: "Động từ khuyết thiếu (Modal Verbs: Must/Can/Should)",
      be_formula: "Modal + be + V3",
      active: {
        subject: "All students",
        verb: "must wear",
        object: "school uniforms",
        full: "All students must wear school uniforms on Mondays.",
      },
      passive: {
        subject: "School uniforms",
        be_verb: "must be",
        past_participle: "worn",
        agent: "by all students",
        full: "School uniforms must be worn by all students on Mondays.",
      },
      explanation: "Giữ nguyên Modal verb 'must', thêm 'be' nguyên mẫu + V3 'worn'.",
    },
  ],
  agentRules: [
    {
      condition: "Tác nhân là đại từ bất định (someone, people, they, nobody)",
      action: "Bắt buộc LƯỢC BỎ 'by + O' để câu văn tự nhiên và súc tích.",
      example: "Someone stole my bike. -> My bike was stolen. (Không viết: 'by someone')",
    },
    {
      condition: "Nội động từ (Intransitive verbs: die, arrive, happen, exist)",
      action: "KHÔNG THỂ chuyển sang câu bị động vì không có tân ngữ trực tiếp tiếp nhận hành động.",
      example: "An accident happened yesterday. (Không có dạng bị động)",
    },
  ],
};
