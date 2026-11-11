/**
 * Structured Visualization Data for Conditional Sentences (Chapter 3, Lesson 1)
 * Interactive Decision Tree Model
 */

export const CONDITIONALS_VISUALIZATION_DATA = {
  id: "conditionals-tree",
  title: "Cây Quyết Định Câu Điều Kiện (Conditional Sentences Decision Tree)",
  description: "Dẫn hướng tư duy từng bước để xác định chính xác Loại câu điều kiện và cấu trúc thì tương ứng.",
  rootQuestion: "Mối quan hệ bản chất giữa mệnh đề Điều kiện (If) và Kết quả là gì?",
  nodes: {
    root: {
      id: "root",
      question: "Điều kiện và kết quả có phải là một sự thật hiển nhiên, chân lý khoa học hoặc thói quen luôn luôn đúng không?",
      question_en: "Is the condition and result a general truth, scientific law, or invariable habit?",
      options: [
        { label: "CÓ (Sự thật 100% luôn đúng)", next: "type_0", highlight: true },
        { label: "KHÔNG (Có điều kiện cụ thể)", next: "q_real_possibility" },
      ],
    },
    q_real_possibility: {
      id: "q_real_possibility",
      question: "Điều kiện này có khả năng thực tế xảy ra ở Hiện tại hoặc Tương lai không?",
      question_en: "Is this condition realistically possible in the present or future?",
      options: [
        { label: "CÓ (Khả thi & Có thật)", next: "type_1", highlight: true },
        { label: "KHÔNG (Giả định trái ngược thực tế)", next: "q_time_frame" },
      ],
    },
    q_time_frame: {
      id: "q_time_frame",
      question: "Sự việc giả định này trái ngược với thực tế ở mốc thời gian nào?",
      question_en: "At what point in time is the hypothetical scenario untrue?",
      options: [
        { label: "Trái ngược ở HIỆN TẠI hoặc TƯƠNG LAI", next: "type_2", highlight: true },
        { label: "Trái ngược ở QUÁ KHỨ", next: "q_mixed_or_pure" },
      ],
    },
    q_mixed_or_pure: {
      id: "q_mixed_or_pure",
      question: "Hệ quả của sự việc trong quá khứ này tác động tới thời điểm nào?",
      question_en: "When does the consequence of that past action take effect?",
      options: [
        { label: "Kết quả cũng đã kết thúc trong QUÁ KHỨ", next: "type_3", highlight: true },
        { label: "Kết quả để lại ảnh hưởng ở HIỆN TẠI (Hỗn hợp)", next: "type_mixed", highlight: true },
      ],
    },
  },
  results: {
    type_0: {
      id: "type_0",
      code: "ZERO_CONDITIONAL",
      name_vi: "Câu điều kiện loại 0 (Zero Conditional)",
      name_en: "Zero Conditional: General Truth",
      formula: "If + S + V(s/es), S + V(s/es)",
      if_tense: "Present Simple",
      main_tense: "Present Simple",
      reason: "Bản chất là chân lý, định luật khoa học hoặc thói quen lặp lại. Cứ có điều kiện A thì 100% xảy ra kết quả B.",
      example: {
        en: "If you heat water to 100 degrees Celsius, it boils.",
        vi: "Nếu bạn đun nước đến 100 độ C, nó sẽ sôi.",
        breakdown: "Cả 2 mệnh đề đều dùng Hiện tại đơn ('heat' & 'boils') vì đây là quy luật vật lý tự nhiên.",
      },
      common_mistakes: "Dùng 'will' ở mệnh đề chính khi nói về chân lý khoa học hiển nhiên.",
    },
    type_1: {
      id: "type_1",
      code: "FIRST_CONDITIONAL",
      name_vi: "Câu điều kiện loại 1 (First Conditional)",
      name_en: "First Conditional: Real Future Possibility",
      formula: "If + S + V(s/es), S + will + V (bare)",
      if_tense: "Present Simple",
      main_tense: "Future Simple (will + V)",
      reason: "Điều kiện có thật và hoàn toàn có khả năng xảy ra trong hiện tại hoặc tương lai.",
      example: {
        en: "If it rains tomorrow, we will stay at home and watch a movie.",
        vi: "Nếu ngày mai trời mưa, chúng tôi sẽ ở nhà xem phim.",
        breakdown: "Khả năng trời mưa ngày mai là hoàn toàn có thật. Mệnh đề if dùng 'rains', mệnh đề chính dùng 'will stay'.",
      },
      common_mistakes: "Dùng 'will' ngay trong mệnh đề If (viết sai: 'If it will rain...').",
    },
    type_2: {
      id: "type_2",
      code: "SECOND_CONDITIONAL",
      name_vi: "Câu điều kiện loại 2 (Second Conditional)",
      name_en: "Second Conditional: Unreal Present / Hypothetical",
      formula: "If + S + V2/were, S + would + V (bare)",
      if_tense: "Past Simple (were cho mọi ngôi)",
      main_tense: "would / could / might + V (bare)",
      reason: "Giả định một tình huống không có thật, trái ngược với thực tế ở hiện tại hoặc tương lai (ước muốn viển vông).",
      example: {
        en: "If I were a billionaire, I would travel around the world in my own spaceship.",
        vi: "Nếu tôi là tỷ phú (thực tế tôi không phải), tôi sẽ du lịch vòng quanh thế giới bằng tàu vũ trụ riêng.",
        breakdown: "Giả định trái thực tế hiện tại: dùng 'were' và 'would travel'.",
      },
      common_mistakes: "Dùng 'was' trong văn phong học thuật trang trọng (chuẩn ngữ pháp quy ước dùng 'were' cho tất cả các ngôi).",
    },
    type_3: {
      id: "type_3",
      code: "THIRD_CONDITIONAL",
      name_vi: "Câu điều kiện loại 3 (Third Conditional)",
      name_en: "Third Conditional: Unreal Past / Regret",
      formula: "If + S + had + V3/V-ed, S + would have + V3/V-ed",
      if_tense: "Past Perfect (had + V3)",
      main_tense: "would have + V3",
      reason: "Giả định một hành động trái ngược hoàn toàn với sự thật đã xảy ra trong quá khứ, thường diễn tả sự tiếc nuối hoặc trách móc.",
      example: {
        en: "If she had left home earlier, she would not have missed the morning flight.",
        vi: "Nếu cô ấy rời nhà sớm hơn (thực tế cô ấy đã đi muộn), cô ấy đã không bị lỡ chuyến bay buổi sáng.",
        breakdown: "Cả điều kiện và kết quả đều nằm trong quá khứ và không thể thay đổi được nữa.",
      },
      common_mistakes: "Viết nhầm 'would had + V3' thay vì 'would have + V3' ở mệnh đề chính.",
    },
    type_mixed: {
      id: "type_mixed",
      code: "MIXED_CONDITIONAL",
      name_vi: "Câu điều kiện hỗn hợp (Mixed Conditional)",
      name_en: "Mixed Conditional: Past Action, Present Consequence",
      formula: "If + S + had + V3/V-ed, S + would + V (bare) [now/today]",
      if_tense: "Past Perfect (Giả định quá khứ)",
      main_tense: "would + V (bare) (Kết quả hiện tại)",
      reason: "Giả định hành động trong quá khứ nhưng kết quả trực tiếp kéo dài ảnh hưởng tới tận thời điểm nói (Hiện tại).",
      example: {
        en: "If I had taken your advice yesterday, I would be much happier today.",
        vi: "Nếu hôm qua tôi nghe lời khuyên của bạn (quá khứ), thì hôm nay tôi đã vui hơn nhiều rồi (hiện tại).",
        breakdown: "Mệnh đề If ở quá khứ ('had taken'), mệnh đề kết quả ở hiện tại ('would be today').",
      },
      common_mistakes: "Không nhận ra trạng từ chỉ thời gian đối nghịch ('yesterday' vs 'now/today') để kết hợp thì phù hợp.",
    },
  },
};
