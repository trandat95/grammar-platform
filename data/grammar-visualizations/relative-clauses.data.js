/**
 * Milestone 2.7: Relative Clauses Visualization Data
 * Architecture: Sentence Tree & Relative Pronoun Linker
 */

export const RELATIVE_CLAUSES_VISUALIZATION_DATA = {
  id: "relative-clauses",
  topic: "Mệnh Đề Quan Hệ (Relative Clauses)",
  title_vi: "Sơ Đồ Cấu Trúc Câu & Liên Kết Đại Từ Quan Hệ",
  description_vi:
    "Trực quan hoá cách đại từ quan hệ thay thế cho danh từ đứng trước, phân biệt mệnh đề xác định và không xác định, cùng các quy tắc rút gọn mệnh đề thần tốc.",

  // 1. Relative Pronouns Matrix
  pronouns: [
    {
      pronoun: "who",
      replaces: "Chỉ người (Person)",
      role: "Làm Chủ ngữ (Subject) hoặc Tân ngữ (Object)",
      example: "The teacher who teaches us English is very kind.",
      example_audio: "The teacher who teaches us English is very kind.",
      translation: "Người giáo viên dạy chúng tôi môn tiếng Anh rất tốt bụng.",
      rule_tip: "Đứng ngay sau danh từ chỉ người, theo sau là động từ (V).",
      color: "#3b82f6", // blue
    },
    {
      pronoun: "whom",
      replaces: "Chỉ người (Person)",
      role: "Chỉ làm Tân ngữ (Object)",
      example: "The boy whom you met yesterday is my cousin.",
      example_audio: "The boy whom you met yesterday is my cousin.",
      translation: "Cậu bé người mà bạn gặp hôm qua là anh họ của tôi.",
      rule_tip: "Theo sau bắt buộc phải là một mệnh đề có Chủ ngữ mới (S + V). Đứng sau giới từ (e.g. to whom, with whom).",
      color: "#06b6d4", // cyan
    },
    {
      pronoun: "which",
      replaces: "Chỉ vật, đồ vật, con vật, hoặc cả mệnh đề",
      role: "Làm Chủ ngữ hoặc Tân ngữ",
      example: "This is the laptop which won the design award.",
      example_audio: "This is the laptop which won the design award.",
      translation: "Đây là chiếc máy tính xách tay đã đạt giải thưởng thiết kế.",
      rule_tip: "Có thể thay thế cho cả một mệnh đề đứng trước (ngăn cách bằng dấu phẩy: ', which...').",
      color: "#10b981", // emerald
    },
    {
      pronoun: "whose",
      replaces: "Chỉ sở hữu (Possessive: his, her, their, its, 's)",
      role: "Tính từ sở hữu nối 2 danh từ",
      example: "I know a girl whose mother is a famous pianist.",
      example_audio: "I know a girl whose mother is a famous pianist.",
      translation: "Tôi quen một cô gái có mẹ là nghệ sĩ dương cầm nổi tiếng.",
      rule_tip: "Công thức bất biến: Noun (người/vật) + whose + Noun (không có the/a/an).",
      color: "#f59e0b", // amber
    },
    {
      pronoun: "that",
      replaces: "Chỉ cả người lẫn vật",
      role: "Thay cho who, whom, which trong mệnh đề xác định",
      example: "The book that you gave me is amazing.",
      example_audio: "The book that you gave me is amazing.",
      translation: "Cuốn sách mà bạn tặng tôi thật tuyệt vời.",
      rule_tip: "BẮT BUỘC dùng sau: đại từ bất định (everything, all, none), so sánh nhất (the best). CẤM DÙNG: sau dấu phẩy (mệnh đề không xác định) và sau giới từ.",
      color: "#8b5cf6", // purple
    },
  ],

  // 2. Relative Adverbs
  adverbs: [
    {
      adverb: "where",
      replaces: "Chỉ nơi chốn (= in/at/on which)",
      example: "This is the school where I studied 10 years ago.",
      example_audio: "This is the school where I studied ten years ago.",
      translation: "Đây là ngôi trường nơi tôi từng học 10 năm trước.",
    },
    {
      adverb: "when",
      replaces: "Chỉ thời gian (= in/on/at which)",
      example: "I still remember the day when we first met.",
      example_audio: "I still remember the day when we first met.",
      translation: "Tôi vẫn nhớ cái ngày khi mà chúng ta lần đầu gặp gỡ.",
    },
    {
      adverb: "why",
      replaces: "Chỉ lý do (= for which)",
      example: "Tell me the reason why you arrived late.",
      example_audio: "Tell me the reason why you arrived late.",
      translation: "Hãy cho tôi biết lý do vì sao bạn đến muộn.",
    },
  ],

  // 3. Clause Types Comparison
  clause_types: [
    {
      type: "DEFINING",
      title: "Mệnh đề quan hệ Xác định (Defining)",
      description: "Cung cấp thông tin thiết yếu để định danh danh từ. Nếu bỏ đi thì câu không đủ nghĩa.",
      comma: "KHÔNG có dấu phẩy ngăn cách",
      can_use_that: "ĐƯỢC phép dùng 'that'",
      omission: "ĐƯỢC lược bỏ đại từ quan hệ khi nó đóng vai trò Tân ngữ (Object)",
      example: "The car (which) she bought is electric.",
      example_audio: "The car she bought is electric.",
      analysis: "'The car' chưa xác định, cần mệnh đề 'which she bought' để biết là xe nào. Có thể lược bỏ 'which'.",
    },
    {
      type: "NON_DEFINING",
      title: "Mệnh đề quan hệ Không xác định (Non-defining)",
      description: "Bổ sung thông tin phụ cho danh từ đã rõ ràng (tên riêng, có this/that/my). Bỏ đi câu vẫn hoàn chỉnh nghĩa.",
      comma: "BẮT BUỘC có dấu phẩy ngăn cách ( , ... , )",
      can_use_that: "TUYỆT ĐỐI KHÔNG dùng 'that' (phải dùng who/whom/which)",
      omission: "TUYỆT ĐỐI KHÔNG được lược bỏ đại từ quan hệ",
      example: "Ha Long Bay, which is famous for its islands, attracts millions of tourists.",
      example_audio: "Ha Long Bay, which is famous for its islands, attracts millions of tourists.",
      analysis: "'Ha Long Bay' là danh từ riêng đã xác định rõ, mệnh đề giữa 2 dấu phẩy là thông tin bổ trợ.",
    },
  ],

  // 4. Reduced Relative Clauses (Rút gọn mệnh đề quan hệ)
  reduced_forms: [
    {
      pattern: "Chủ động ➔ Cụm V-ing (Present Participle)",
      condition: "Động từ trong mệnh đề quan hệ ở thể chủ động.",
      original: "The man who is standing at the door is my uncle.",
      reduced: "The man standing at the door is my uncle.",
      reduced_audio: "The man standing at the door is my uncle.",
      rule_step: "Lược bỏ đại từ (who) và to-be (is), đưa động từ về V-ing.",
    },
    {
      pattern: "Bị động ➔ Cụm V3/V-ed (Past Participle)",
      condition: "Động từ trong mệnh đề quan hệ ở thể bị động.",
      original: "The instructions which were given by the teacher were clear.",
      reduced: "The instructions given by the teacher were clear.",
      reduced_audio: "The instructions given by the teacher were clear.",
      rule_step: "Lược bỏ đại từ (which) và to-be (were), giữ lại Quá khứ phân từ (V3/V-ed).",
    },
    {
      pattern: "Thứ tự / Duy nhất ➔ Cụm To-Infinitive (to + V)",
      condition: "Trước danh từ có the first, the second, the last, the only, so sánh nhất.",
      original: "Neil Armstrong was the first man who walked on the Moon.",
      reduced: "Neil Armstrong was the first man to walk on the Moon.",
      reduced_audio: "Neil Armstrong was the first man to walk on the Moon.",
      rule_step: "Lược bỏ đại từ (who) và đổi động từ thành to-infinitive (to walk).",
    },
  ],

  // 5. Interactive Sample Sentences for Visualizer
  interactive_sentences: [
    {
      id: "rel_demo_1",
      title: "Câu phân tích 1: Đại từ làm Chủ ngữ",
      antecedent: "The scientist",
      pronoun: "who",
      relative_clause: "discovered the vaccine",
      main_predicate: "won the Nobel Prize",
      full_sentence: "The scientist who discovered the vaccine won the Nobel Prize.",
      audio: "The scientist who discovered the vaccine won the Nobel Prize.",
      translation: "Nhà khoa học người mà tìm ra vắc-xin đã đoạt giải Nobel.",
      type: "Defining",
    },
    {
      id: "rel_demo_2",
      title: "Câu phân tích 2: Đại từ làm Sở hữu",
      antecedent: "A student",
      pronoun: "whose",
      relative_clause: "essay was chosen",
      main_predicate: "will represent our school",
      full_sentence: "A student whose essay was chosen will represent our school.",
      audio: "A student whose essay was chosen will represent our school.",
      translation: "Học sinh có bài luận được chọn sẽ đại diện cho trường chúng ta.",
      type: "Defining",
    },
    {
      id: "rel_demo_3",
      title: "Câu phân tích 3: Mệnh đề không xác định có dấu phẩy",
      antecedent: "Paris",
      pronoun: ", which",
      relative_clause: "is known as the City of Light,",
      main_predicate: "is beautiful in spring.",
      full_sentence: "Paris, which is known as the City of Light, is beautiful in spring.",
      audio: "Paris, which is known as the City of Light, is beautiful in spring.",
      translation: "Paris, nơi được mệnh danh là Kinh đô Ánh sáng, rất đẹp vào mùa xuân.",
      type: "Non-defining",
    },
  ],
};
