/**
 * Milestone 2.7: Comparisons Visualization Data
 * Architecture: Comparison Spectrum & Scale Visualizer
 */

export const COMPARISONS_VISUALIZATION_DATA = {
  id: "comparisons",
  topic: "Các Dạng So Sánh (Comparisons)",
  title_vi: "Thẻ So Sánh Đa Cấp & Thang Đo Tỷ Lệ (Comparison Scale)",
  description_vi:
    "Trực quan hoá 4 cấp độ so sánh (Bằng nhau, Hơn, Nhất, So sánh kép), phân biệt tính từ ngắn vs tính từ dài và bảng chuyển đổi bất quy tắc cốt lõi.",

  // 1. Core Comparison Tiers
  tiers: [
    {
      id: "equal",
      name: "So Sánh Bằng (Equal Comparison)",
      symbol: "=",
      percentage_relation: "A = B (100% : 100%)",
      color: "#10b981", // emerald
      formula_affirmative: "S1 + V + as + adj/adv + as + S2 / O",
      formula_negative: "S1 + V_not + as/so + adj/adv + as + S2 / O",
      example_affirmative: "Tom is as tall as Peter.",
      example_affirmative_audio: "Tom is as tall as Peter.",
      example_negative: "This phone is not so expensive as that one.",
      example_negative_audio: "This phone is not so expensive as that one.",
      rule_summary: "Tính từ và trạng từ luôn ở dạng NGUYÊN THỂ, không thêm đuôi -er hay more.",
      key_signals: ["as... as", "the same as", "not so... as"],
    },
    {
      id: "comparative",
      name: "So Sánh Hơn (Comparative)",
      symbol: ">",
      percentage_relation: "A > B (140% : 100%)",
      color: "#3b82f6", // blue
      short_rule: "Short Adj/Adv: Adj + -er + than",
      short_example: "Mount Everest is higher than K2.",
      short_example_audio: "Mount Everest is higher than K2.",
      long_rule: "Long Adj/Adv: more + Adj/Adv + than",
      long_example: "Gold is more valuable than silver.",
      long_example_audio: "Gold is more valuable than silver.",
      emphasis_tip: "Để nhấn mạnh mức độ chênh lệch lớn, dùng: much / far / a lot + comparative (e.g. much faster). Chênh lệch ít dùng: a bit / slightly.",
      key_signals: ["than", "more", "-er", "much", "far"],
    },
    {
      id: "superlative",
      name: "So Sánh Nhất (Superlative)",
      symbol: "MAX",
      percentage_relation: "A đứng đầu trong tập thể (100% of Group)",
      color: "#8b5cf6", // purple
      short_rule: "Short Adj/Adv: the + Adj + -est",
      short_example: "The blue whale is the largest animal on Earth.",
      short_example_audio: "The blue whale is the largest animal on Earth.",
      long_rule: "Long Adj/Adv: the most + Adj/Adv",
      long_example: "This is the most interesting book I've ever read.",
      long_example_audio: "This is the most interesting book I have ever read.",
      emphasis_tip: "Thường đi kèm giới từ: 'in' + địa điểm/tổ chức số ít (in the world, in the class), 'of' + khoảng thời gian/nhóm số nhiều (of all, of the three).",
      key_signals: ["the most", "the ...-est", "in the world", "of all", "ever"],
    },
    {
      id: "double",
      name: "So Sánh Kép & Lũy Tiến (Double Comparison)",
      symbol: "↗↗",
      percentage_relation: "Tỷ lệ thuận / nghịch biến thiên liên tục",
      color: "#f59e0b", // amber
      type1_formula: "Càng ngày càng: adj-er and adj-er / more and more + adj",
      type1_example: "The weather is getting hotter and hotter.",
      type1_example_audio: "The weather is getting hotter and hotter.",
      type2_formula: "Càng... thì càng...: The + comparative, the + comparative",
      type2_example: "The more you practice, the better you speak.",
      type2_example_audio: "The more you practice, the better you speak.",
      emphasis_tip: "Cả hai vế bắt buộc phải có mạo từ 'The' đứng trước dạng so sánh hơn.",
      key_signals: ["The more... the more...", "hotter and hotter", "more and more"],
    },
  ],

  // 2. Short vs Long Adjective Rules
  morphology_rules: [
    {
      category: "Tính từ ngắn (1 âm tiết)",
      rule: "Thêm -er / -est",
      examples: [
        { base: "fast", comp: "faster", sup: "fastest" },
        { base: "tall", comp: "taller", sup: "tallest" },
        { base: "big (1 nguyên âm + 1 phụ âm)", comp: "bigger", sup: "biggest" },
      ],
    },
    {
      category: "Tính từ 2 âm tiết tận cùng là -y, -le, -er, -ow, -et",
      rule: "Vẫn xem là tính từ ngắn (đổi -y thành -i + er/est)",
      examples: [
        { base: "happy", comp: "happier", sup: "happiest" },
        { base: "simple", comp: "simpler", sup: "simplest" },
        { base: "narrow", comp: "narrower", sup: "narrowest" },
      ],
    },
    {
      category: "Tính từ dài (≥ 2 âm tiết thông thường)",
      rule: "Dùng more / the most",
      examples: [
        { base: "beautiful", comp: "more beautiful", sup: "the most beautiful" },
        { base: "important", comp: "more important", sup: "the most important" },
        { base: "fluently (adv)", comp: "more fluently", sup: "the most fluently" },
      ],
    },
  ],

  // 3. Irregular Adjectives & Adverbs Table
  irregulars: [
    {
      base: "good / well",
      comparative: "better",
      superlative: "the best",
      meaning: "Tốt, giỏi",
      example: "She plays piano better than her sister.",
      example_audio: "She plays piano better than her sister.",
    },
    {
      base: "bad / badly",
      comparative: "worse",
      superlative: "the worst",
      meaning: "Tồi tệ, dở",
      example: "Traffic today is worse than yesterday.",
      example_audio: "Traffic today is worse than yesterday.",
    },
    {
      base: "many / much",
      comparative: "more",
      superlative: "the most",
      meaning: "Nhiều",
      example: "I need more time to finish this project.",
      example_audio: "I need more time to finish this project.",
    },
    {
      base: "little",
      comparative: "less",
      superlative: "the least",
      meaning: "Ít",
      example: "Eat less sugar and drink more water.",
      example_audio: "Eat less sugar and drink more water.",
    },
    {
      base: "far",
      comparative: "farther / further",
      superlative: "farthest / furthest",
      meaning: "Xa (farther: khoảng cách vật lý; further: mức độ/thời gian sâu hơn)",
      example: "For further information, please visit our website.",
      example_audio: "For further information, please visit our website.",
    },
  ],
};
