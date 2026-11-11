/**
 * Milestone 2.7: Modal Verbs Visualization Data
 * Architecture: Probability Spectrum & Function Matrix
 */

export const MODAL_VERBS_VISUALIZATION_DATA = {
  id: "modal-verbs",
  topic: "Động Từ Khuyết Thiếu (Modal Verbs)",
  title_vi: "Ma Trận Cấp Độ Nghĩa & Thang Đo Xác Suất (Modal Matrix)",
  description_vi:
    "Trực quan hoá thang đo mức độ chắc chắn từ 0% đến 100%, phân loại chức năng (Khả năng, Xin phép, Bắt buộc, Khuyên can) và sơ đồ suy đoán quá khứ (Perfect Modals).",

  // 1. Certainty / Probability Scale (0% - 100%)
  probability_scale: [
    {
      percentage: "0%",
      level: "IMPOSSIBLE",
      label: "Không thể nào xảy ra (Phủ định tuyệt đối)",
      modals: ["can't", "couldn't"],
      example: "That story can't be true! He was in Tokyo yesterday.",
      example_audio: "That story can't be true! He was in Tokyo yesterday.",
      explanation: "Dùng để khẳng định một điều gì đó là bất khả thi dựa trên chứng cứ thực tế hiện có.",
      color: "#ef4444", // red
    },
    {
      percentage: "30%",
      level: "SLIGHT_POSSIBILITY",
      label: "Khả năng rất thấp (Chỉ là phỏng đoán mong manh)",
      modals: ["might", "could"],
      example: "Take an umbrella. It might rain later.",
      example_audio: "Take an umbrella. It might rain later.",
      explanation: "Diễn tả một khả năng có thể xảy ra nhưng người nói không hề chắc chắn.",
      color: "#f97316", // orange
    },
    {
      percentage: "50%",
      level: "MEDIUM_POSSIBILITY",
      label: "Khả năng 50/50 (Có thể hoặc không)",
      modals: ["may"],
      example: "She may join our team meeting this afternoon.",
      example_audio: "She may join our team meeting this afternoon.",
      explanation: "Khả năng xảy ra ở mức trung bình, có cơ sở nhưng chưa được xác nhận.",
      color: "#f59e0b", // amber
    },
    {
      percentage: "75%",
      level: "HIGH_EXPECTATION",
      label: "Kỳ vọng cao / Suy luận hợp lý",
      modals: ["should", "ought to"],
      example: "The train should arrive in 10 minutes if there is no delay.",
      example_audio: "The train should arrive in ten minutes if there is no delay.",
      explanation: "Dự đoán điều gì đó sẽ xảy ra vì nó theo đúng lịch trình hoặc quy luật thông thường.",
      color: "#3b82f6", // blue
    },
    {
      percentage: "95% - 100%",
      level: "CERTAINTY",
      label: "Chắc chắn 100% (Suy đoán logic hiển nhiên)",
      modals: ["must"],
      example: "You have worked for 12 hours straight. You must be exhausted!",
      example_audio: "You have worked for twelve hours straight. You must be exhausted!",
      explanation: "Khẳng định chắc chắn một sự việc là đúng vì có bằng chứng rõ ràng trước mắt.",
      color: "#10b981", // emerald
    },
  ],

  // 2. Functional Categories Matrix
  functional_categories: [
    {
      id: "ability",
      name: "Khả Năng (Ability)",
      icon: "💪",
      rules: [
        {
          modal: "can",
          time: "Hiện tại",
          usage: "Khả năng nói chung hoặc kỹ năng học được",
          example: "She can speak four languages fluently.",
          example_audio: "She can speak four languages fluently.",
        },
        {
          modal: "could",
          time: "Quá khứ",
          usage: "Khả năng chung trong quá khứ",
          example: "My grandfather could run very fast when he was young.",
          example_audio: "My grandfather could run very fast when he was young.",
        },
        {
          modal: "be able to",
          time: "Mọi thì / Tình huống cụ thể",
          usage: "Xoay sở làm được việc gì trong một hoàn cảnh cụ thể (= managed to)",
          example: "Despite the storm, they were able to reach the summit.",
          example_audio: "Despite the storm, they were able to reach the summit.",
        },
      ],
    },
    {
      id: "permission",
      name: "Xin Phép & Cho Phép (Permission)",
      icon: "🔑",
      rules: [
        {
          modal: "Can I / Could I",
          time: "Thân mật / Lịch sự",
          usage: "Could I lịch sự hơn Can I khi đề nghị hoặc xin phép",
          example: "Could I borrow your pen for a moment?",
          example_audio: "Could I borrow your pen for a moment?",
        },
        {
          modal: "May I",
          time: "Trang trọng (Formal)",
          usage: "Dùng trong ngữ cảnh trang trọng, công việc",
          example: "May I see your boarding pass, please?",
          example_audio: "May I see your boarding pass, please?",
        },
      ],
    },
    {
      id: "obligation",
      name: "Bắt Buộc & Cấm Đoán (Obligation & Prohibition)",
      icon: "⚖️",
      rules: [
        {
          modal: "must",
          time: "Bắt buộc chủ quan / Luật lệ",
          usage: "Người nói tự thấy cần thiết hoặc quy định bắt buộc",
          example: "You must wear a helmet when riding a motorbike.",
          example_audio: "You must wear a helmet when riding a motorbike.",
        },
        {
          modal: "have to",
          time: "Bắt buộc khách quan",
          usage: "Do hoàn cảnh, mệnh lệnh từ sếp hoặc yếu tố bên ngoài chi phối",
          example: "I have to wake up at 5 AM because my flight is at 7.",
          example_audio: "I have to wake up at 5 AM because my flight is at 7.",
        },
        {
          modal: "mustn't",
          time: "CẤM ĐOÁN (Prohibition)",
          usage: "Tuyệt đối không được phép làm (vi phạm sẽ bị phạt)",
          example: "You mustn't park your car in front of the hospital gate.",
          example_audio: "You mustn't park your car in front of the hospital gate.",
        },
        {
          modal: "don't have to",
          time: "Không bắt buộc / Tùy ý",
          usage: "Không cần thiết phải làm, nhưng làm cũng không sao",
          example: "Tomorrow is Sunday, so you don't have to get up early.",
          example_audio: "Tomorrow is Sunday, so you don't have to get up early.",
        },
      ],
    },
    {
      id: "advice",
      name: "Lời Khuyên (Advice)",
      icon: "💡",
      rules: [
        {
          modal: "should / ought to",
          time: "Khuyên nên làm",
          usage: "Điều tốt, có lợi hoặc đúng đắn nên làm",
          example: "You look tired. You should take a short break.",
          example_audio: "You look tired. You should take a short break.",
        },
        {
          modal: "had better",
          time: "Cảnh báo khẩn cấp",
          usage: "Tốt hơn hết nên làm, nếu không sẽ có hậu quả xấu",
          example: "You'd better leave now or you'll miss the train.",
          example_audio: "You had better leave now or you will miss the train.",
        },
      ],
    },
  ],

  // 3. Past Modals / Perfect Modals (Suy đoán & nuối tiếc trong quá khứ)
  perfect_modals: [
    {
      formula: "must have + V3",
      meaning: "Chắc hẳn là đã... (Khẳng định chắc chắn về quá khứ)",
      example: "The ground is wet. It must have rained last night.",
      example_audio: "The ground is wet. It must have rained last night.",
      trap_alert: "Không dùng 'can have + V3' cho suy đoán khẳng định.",
    },
    {
      formula: "can't / couldn't have + V3",
      meaning: "Chắc hẳn là đã không thể... (Phủ định chắc chắn về quá khứ)",
      example: "He couldn't have stolen the car; he was with me all evening.",
      example_audio: "He could not have stolen the car; he was with me all evening.",
      trap_alert: "Là thể phủ định trực tiếp của 'must have V3'.",
    },
    {
      formula: "should have + V3",
      meaning: "Lẽ ra nên làm... (nhưng thực tế trong quá khứ đã KHÔNG làm)",
      example: "I failed the test. I should have studied harder.",
      example_audio: "I failed the test. I should have studied harder.",
      trap_alert: "Diễn tả sự hối tiếc hoặc trách móc một hành động không được thực hiện.",
    },
    {
      formula: "needn't have + V3",
      meaning: "Lẽ ra không cần làm... (nhưng thực tế đã LÀM RỒI và tốn công vô ích)",
      example: "You needn't have bought bread. We already had plenty.",
      example_audio: "You needn't have bought bread. We already had plenty.",
      trap_alert: "Khác với 'didn't need to V' (không cần và thực tế đã không làm).",
    },
  ],
};
