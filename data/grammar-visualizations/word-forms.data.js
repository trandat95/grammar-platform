/**
 * Milestone 2.7: Word Forms & Morphology Visualization Data
 * Architecture: Word Family Tree & Suffix Engine
 */

export const WORD_FORMS_VISUALIZATION_DATA = {
  id: "word-forms",
  topic: "Từ Loại & Cấu Tạo Từ (Word Forms & Morphology)",
  title_vi: "Cây Họ Từ & Động Cơ Hậu Tố (Word Family Tree)",
  description_vi:
    "Trực quan hoá mạng lưới phân nhánh từ gốc từ (Root) sang Danh từ, Động từ, Tính từ, Trạng từ cùng bộ quy tắc nhận diện vị trí và hậu tố vàng trong câu.",

  // 1. Suffix Gold Rules (Hậu tố nhận diện từ loại)
  suffix_rules: [
    {
      part_of_speech: "Danh từ (Noun)",
      badge: "NOUN",
      color: "#10b981", // emerald
      position: "Đứng sau mạo từ (a/an/the), tính từ sở hữu, giới từ, tính từ hoặc làm Chủ ngữ/Tân ngữ",
      suffixes: [
        { suffix: "-tion / -sion", meaning: "hành động, tình trạng", example: "action, decision" },
        { suffix: "-ment", meaning: "kết quả, hành động", example: "development, movement" },
        { suffix: "-ness", meaning: "tính chất, trạng thái", example: "happiness, darkness" },
        { suffix: "-ity / -ty", meaning: "phẩm chất, đặc tính", example: "activity, reality" },
        { suffix: "-er / -or / -ist", meaning: "người thực hiện", example: "teacher, actor, scientist" },
        { suffix: "-ance / -ence", meaning: "sự việc, trạng thái", example: "importance, difference" },
      ],
      sample_sentence: "Her intelligence surprised everyone.",
      sample_sentence_audio: "Her intelligence surprised everyone.",
    },
    {
      part_of_speech: "Động từ (Verb)",
      badge: "VERB",
      color: "#ef4444", // red
      position: "Đứng sau Chủ ngữ (S), sau trợ động từ (can, must, do), hoặc sau to-infinitive",
      suffixes: [
        { suffix: "-ize / -ise", meaning: "làm cho trở thành", example: "modernize, realize" },
        { suffix: "-en", meaning: "làm cho có tính chất", example: "widen, shorten, sharpen" },
        { suffix: "-ify", meaning: "biến thành", example: "beautify, simplify" },
        { suffix: "en- (tiền tố)", meaning: "đưa vào trạng thái", example: "endanger, encourage" },
      ],
      sample_sentence: "They decided to modernize the factory.",
      sample_sentence_audio: "They decided to modernize the factory.",
    },
    {
      part_of_speech: "Tính từ (Adjective)",
      badge: "ADJECTIVE",
      color: "#3b82f6", // blue
      position: "Đứng trước Danh từ (Adj + Noun), đứng sau Linking Verbs (be, look, seem, feel, become)",
      suffixes: [
        { suffix: "-ful / -less", meaning: "đầy đủ / không có", example: "careful, careless" },
        { suffix: "-able / -ible", meaning: "có thể được", example: "comfortable, visible" },
        { suffix: "-ive", meaning: "có xu hướng", example: "active, creative" },
        { suffix: "-ous", meaning: "đầy, mang tính", example: "dangerous, famous" },
        { suffix: "-al / -ic", meaning: "thuộc về", example: "cultural, economic" },
      ],
      sample_sentence: "He is a very creative designer.",
      sample_sentence_audio: "He is a very creative designer.",
    },
    {
      part_of_speech: "Trạng từ (Adverb)",
      badge: "ADVERB",
      color: "#8b5cf6", // purple
      position: "Bổ nghĩa cho Động từ (V + Adv / Adv + V), Tính từ (Adv + Adj), hoặc đứng đầu câu cách nhau dấu phẩy",
      formula: "Tính từ (Adj) + -ly = Trạng từ (Adv)",
      special_notes: "Cẩn thận các tính từ tận cùng -ly: friendly, lovely, silly, lonely, elderly, cowardly (không phải trạng từ!).",
      suffixes: [
        { suffix: "-ly", meaning: "một cách...", example: "carefully, beautifully, quickly" },
        { suffix: "-ward(s)", meaning: "theo hướng", example: "forward, backwards" },
      ],
      sample_sentence: "She completed the examination successfully.",
      sample_sentence_audio: "She completed the examination successfully.",
    },
  ],

  // 2. 8 Classic Word Families (Bộ họ từ kinh điển)
  word_families: [
    {
      root: "SUCCESS",
      vietnamese_concept: "Thành công",
      verb: { word: "succeed", phonetic: "/səkˈsiːd/", example: "He worked hard to succeed in business." },
      noun: { word: "success", phonetic: "/səkˈses/", example: "Her new book was a huge success." },
      adjective: { word: "successful", phonetic: "/səkˈses.fəl/", example: "They launched a successful campaign." },
      adverb: { word: "successfully", phonetic: "/səkˈses.fəl.i/", example: "The rocket landed successfully." },
    },
    {
      root: "DANGER",
      vietnamese_concept: "Nguy hiểm",
      verb: { word: "endanger", phonetic: "/ɪnˈdeɪn.dʒər/", example: "Pollution endangers wildlife." },
      noun: { word: "danger", phonetic: "/ˈdeɪn.dʒər/", example: "The climbers were in grave danger." },
      adjective: { word: "dangerous", phonetic: "/ˈdeɪn.dʒər.əs/", example: "Driving in dense fog is dangerous." },
      adverb: { word: "dangerously", phonetic: "/ˈdeɪn.dʒər.əs.li/", example: "He was driving dangerously fast." },
    },
    {
      root: "DECIDE",
      vietnamese_concept: "Quyết định",
      verb: { word: "decide", phonetic: "/dɪˈsaɪd/", example: "I cannot decide what to wear." },
      noun: { word: "decision", phonetic: "/dɪˈsɪʒ.ən/", example: "We made an important decision." },
      adjective: { word: "decisive", phonetic: "/dɪˈsaɪ.sɪv/", example: "She is a decisive leader." },
      adverb: { word: "decisively", phonetic: "/dɪˈsaɪ.sɪv.li/", example: "The general acted decisively." },
    },
    {
      root: "BEAUTY",
      vietnamese_concept: "Vẻ đẹp",
      verb: { word: "beautify", phonetic: "/ˈbjuː.tɪ.faɪ/", example: "They planted trees to beautify the city." },
      noun: { word: "beauty", phonetic: "/ˈbjuː.ti/", example: "The natural beauty of the island is breathtaking." },
      adjective: { word: "beautiful", phonetic: "/ˈbjuː.tɪ.fəl/", example: "She wore a beautiful dress." },
      adverb: { word: "beautifully", phonetic: "/ˈbjuː.tɪ.fəl.i/", example: "The choir sang beautifully." },
    },
    {
      root: "CREATE",
      vietnamese_concept: "Sáng tạo",
      verb: { word: "create", phonetic: "/kriˈeɪt/", example: "Artists create inspiring artwork." },
      noun: { word: "creation / creativity", phonetic: "/kriˈeɪ.ʃən/", example: "Creativity is vital in marketing." },
      adjective: { word: "creative", phonetic: "/kriˈeɪ.tɪv/", example: "Children have creative imaginations." },
      adverb: { word: "creatively", phonetic: "/kriˈeɪ.tɪv.li/", example: "She solves problems creatively." },
    },
    {
      root: "DIFFER",
      vietnamese_concept: "Khác biệt",
      verb: { word: "differ", phonetic: "/ˈdɪf.ər/", example: "Opinions differ on this sensitive issue." },
      noun: { word: "difference", phonetic: "/ˈdɪf.ər.əns/", example: "Can you tell the difference?" },
      adjective: { word: "different", phonetic: "/ˈdɪf.ər.ənt/", example: "Twins often have different hobbies." },
      adverb: { word: "differently", phonetic: "/ˈdɪf.ər.ənt.li/", example: "People think differently about work." },
    },
    {
      root: "CARE",
      vietnamese_concept: "Cẩn thận / Chăm sóc",
      verb: { word: "care", phonetic: "/keər/", example: "Doctors care for their patients." },
      noun: { word: "care", phonetic: "/keər/", example: "Take good care of yourself." },
      adjective: { word: "careful / careless", phonetic: "/ˈkeə.fəl/", example: "Be careful when crossing the street." },
      adverb: { word: "carefully / carelessly", phonetic: "/ˈkeə.fəl.i/", example: "Please read the instructions carefully." },
    },
    {
      root: "ACT",
      vietnamese_concept: "Hành động / Hoạt động",
      verb: { word: "act", phonetic: "/ækt/", example: "We must act before it is too late." },
      noun: { word: "action / activity", phonetic: "/ˈæk.ʃən/", example: "Actions speak louder than words." },
      adjective: { word: "active", phonetic: "/ˈæk.tɪv/", example: "Stay active to maintain good health." },
      adverb: { word: "actively", phonetic: "/ˈæk.tɪv.li/", example: "Students actively participate in discussions." },
    },
  ],
};
