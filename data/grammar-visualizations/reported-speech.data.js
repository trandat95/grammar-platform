/**
 * Structured Visualization Data for Reported Speech (Chapter 9, Lesson 1 & 2)
 * Interactive Conversion Flow Pipeline Model
 */

export const REPORTED_SPEECH_VISUALIZATION_DATA = {
  id: "reported-speech-flow",
  title: "Quy Trình Chuyển Đổi Câu Gián Tiếp (Reported Speech Conversion Flow)",
  description: "Trực quan hóa chuỗi 7 bước chuyển dịch từ Lời nói trực tiếp sang Câu gián tiếp, bảng lùi thì và quy tắc đổi đại từ/thời gian.",
  stages: [
    {
      id: "stage_reporting_verb",
      step: 1,
      title: "1. Động từ dẫn (Reporting Verb)",
      desc: "Xác định động từ dẫn: 'said', 'said to + O' -> 'told + O', 'asked + O'.",
      badge: "VERB",
    },
    {
      id: "stage_context",
      step: 2,
      title: "2. Xác định điều kiện lùi thì",
      desc: "Nếu động từ dẫn ở Quá khứ ('said', 'told'), BẮT BUỘC lùi thì động từ chính.",
      badge: "CHECK",
    },
    {
      id: "stage_pronouns",
      step: 3,
      title: "3. Đổi Đại từ & Tính từ sở hữu",
      desc: "Chuyển ngôi thứ 1 và thứ 2 sang ngôi thứ 3 phù hợp với người nói và người nghe.",
      badge: "PRONOUN",
    },
    {
      id: "stage_tense_backshift",
      step: 4,
      title: "4. Lùi thì động từ chính (Backshift)",
      desc: "Thực hiện phép lùi 1 bậc quá khứ theo bảng ma trận quy tắc chuẩn.",
      badge: "TENSE",
    },
    {
      id: "stage_time_adverbs",
      step: 5,
      title: "5. Đổi Trạng từ chỉ thời gian",
      desc: "Chuyển các mốc thời gian phụ thuộc sang góc nhìn quá khứ của người nghe.",
      badge: "TIME",
    },
    {
      id: "stage_place_adverbs",
      step: 6,
      title: "6. Đổi Trạng từ chỉ nơi chốn",
      desc: "Chuyển đổi các từ chỉ khoảng cách: 'here' -> 'there', 'this' -> 'that'.",
      badge: "PLACE",
    },
    {
      id: "stage_sentence_structure",
      step: 7,
      title: "7. Tái thiết lập trật tự câu",
      desc: "Bỏ ngoặc kép; câu hỏi đổi thành thể trần thuật (không còn trợ động từ đảo ngữ).",
      badge: "FINALIZE",
    },
  ],
  backshiftMatrix: [
    { direct: "Present Simple (V1/Vs/es)", reported: "Past Simple (V2/V-ed)", example: "work -> worked" },
    { direct: "Present Continuous (am/is/are + V-ing)", reported: "Past Continuous (was/were + V-ing)", example: "is reading -> was reading" },
    { direct: "Present Perfect (have/has + V3)", reported: "Past Perfect (had + V3)", example: "have seen -> had seen" },
    { direct: "Past Simple (V2/V-ed)", reported: "Past Perfect (had + V3)", example: "visited -> had visited" },
    { direct: "Future Simple (will + V)", reported: "Future in the Past (would + V)", example: "will go -> would go" },
    { direct: "Can + V", reported: "Could + V", example: "can speak -> could speak" },
    { direct: "Must (nghĩa vụ)", reported: "Had to + V", example: "must study -> had to study" },
  ],
  transformationTables: {
    time: [
      { direct: "now", reported: "then / at that time" },
      { direct: "today", reported: "that day" },
      { direct: "yesterday", reported: "the day before / the previous day" },
      { direct: "tomorrow", reported: "the next day / the following day" },
      { direct: "ago", reported: "before" },
      { direct: "last week", reported: "the week before / the previous week" },
      { direct: "next month", reported: "the following month" },
    ],
    place: [
      { direct: "here", reported: "there" },
      { direct: "this", reported: "that" },
      { direct: "these", reported: "those" },
    ],
  },
  examples: [
    {
      id: "ex_statement",
      type: "Câu trần thuật (Statement)",
      direct: 'He said, "I am learning a new programming language today."',
      reported: "He said that he was learning a new programming language that day.",
      changes: [
        { label: "Đại từ", from: "I", to: "he" },
        { label: "Lùi thì", from: "am learning", to: "was learning" },
        { label: "Thời gian", from: "today", to: "that day" },
      ],
      breakdown: "Động từ dẫn 'said' ở quá khứ -> lùi 'am learning' thành 'was learning', đổi 'I' thành 'he', đổi 'today' thành 'that day'.",
    },
    {
      id: "ex_question",
      type: "Câu hỏi Yes/No (Yes/No Question)",
      direct: 'She asked me, "Do you like classical music?"',
      reported: "She asked me if I liked classical music.",
      changes: [
        { label: "Từ nối", from: 'Do you...', to: "if / whether" },
        { label: "Đại từ", from: "you", to: "I" },
        { label: "Lùi thì", from: "like (Hiện tại)", to: "liked (Quá khứ)" },
        { label: "Trật tự", from: "Trợ động từ Do", to: "Bỏ Do, trở về câu trần thuật S + V" },
      ],
      breakdown: "Câu hỏi Yes/No dùng liên từ 'if' hoặc 'whether', bỏ trợ động từ 'do', đưa trật tự từ về dạng trần thuật.",
    },
    {
      id: "ex_command",
      type: "Mệnh lệnh / Yêu cầu (Imperative)",
      direct: 'The teacher said to the students, "Open your books to page 50."',
      reported: "The teacher told the students to open their books to page 50.",
      changes: [
        { label: "Động từ dẫn", from: "said to", to: "told + O + to V" },
        { label: "Tính từ sở hữu", from: "your", to: "their" },
      ],
      breakdown: "Câu mệnh lệnh áp dụng công thức: tell/ask + O + to V (hoặc not to V nếu là phủ định).",
    },
  ],
  exceptions: [
    {
      title: "Chân lý tự nhiên / Sự thật khoa học",
      rule: "KHÔNG lùi thì ngay cả khi động từ dẫn ở quá khứ.",
      example: 'The teacher said, "Water boils at 100 degrees Celsius." -> The teacher said that water boils at 100 degrees Celsius.',
    },
    {
      title: "Động từ dẫn ở Hiện tại (says, tells)",
      rule: "KHÔNG lùi thì của động từ trong câu trần thuật.",
      example: 'He says, "I will call you." -> He says that he will call me.',
    },
  ],
};
