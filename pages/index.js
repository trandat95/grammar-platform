import { useState, useEffect } from "react";
import previewData from "../data/ui/preview_data.json";
import quizData from "../data/ui/quiz_bank.json";

export default function Home() {
  // Navigation: 'study' | 'quiz' | 'mistakes'
  const [currentView, setCurrentView] = useState("study");

  // Study View State
  const [selectedChapter, setSelectedChapter] = useState(previewData.chapters[0]);
  const [selectedLesson, setSelectedLesson] = useState(previewData.chapters[0]?.lessons[0] || null);
  const [activeTab, setActiveTab] = useState("theory"); // 'theory' | 'exercises'

  // Study Exercise Interaction State
  const [userInputs, setUserInputs] = useState({});
  const [results, setResults] = useState({});
  const [showAnswers, setShowAnswers] = useState({});

  // Quiz State
  const [selectedQuizTopic, setSelectedQuizTopic] = useState("ALL"); // 'ALL' or topic id
  const [activeQuizQuestions, setActiveQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null); // { score, total, details: [...] }
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Single Question Realtime Check in Quiz: { [qId]: { checked: boolean, isCorrect: boolean, feedback: string } }
  const [quizSingleChecks, setQuizSingleChecks] = useState({});
  const [quizShowAnswers, setQuizShowAnswers] = useState({});

  // Mistakes Storage State (saved in localStorage)
  const [savedMistakes, setSavedMistakes] = useState([]);
  const [mistakeInputs, setMistakeInputs] = useState({});
  const [mistakeResults, setMistakeResults] = useState({});
  const [showMistakeAnswers, setShowMistakeAnswers] = useState({});

  // Load mistakes from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("grammar_platform_mistakes");
      if (stored) {
        setSavedMistakes(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved mistakes from localStorage", e);
    }
  }, []);

  // Save mistakes to localStorage helper
  const persistMistakes = (newMistakes) => {
    setSavedMistakes(newMistakes);
    try {
      localStorage.setItem("grammar_platform_mistakes", JSON.stringify(newMistakes));
    } catch (e) {
      console.error("Failed to save mistakes to localStorage", e);
    }
  };

  const handleSelectChapter = (ch) => {
    setSelectedChapter(ch);
    setSelectedLesson(ch.lessons[0] || null);
    setActiveTab("theory");
  };

  const normalizeText = (text) => {
    if (!text) return "";
    return text
      .trim()
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .replace(/\s+/g, " ");
  };

  const isAnswerMatching = (userInput, answersList) => {
    const cleanUser = normalizeText(userInput);
    if (!cleanUser) return false;
    return answersList.some((acc) => {
      const parts = acc.split("/").map((p) => normalizeText(p));
      return parts.includes(cleanUser) || normalizeText(acc) === cleanUser;
    });
  };

  // Human-readable type label in Vietnamese
  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case "FILL_IN_THE_BLANKS":
        return "Điền từ vào chỗ trống";
      case "REWRITE_SENTENCES":
        return "Viết lại câu";
      case "SENTENCE_TRANSFORMATION":
        return "Chuyển đổi câu";
      case "MULTIPLE_CHOICE":
        return "Trắc nghiệm chọn đáp án";
      case "WORD_FORMATION":
        return "Chia dạng đúng của từ";
      case "COMPLETE_SENTENCES":
        return "Hoàn thành câu";
      case "ERROR_CORRECTION":
        return "Tìm và sửa lỗi sai";
      default:
        return type || "Bài tập ngữ pháp";
    }
  };

  // --- Study Exercise Handlers ---
  const handleInputChange = (questionId, value) => {
    setUserInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const checkSingleQuestion = (q) => {
    const userInput = userInputs[q.id] || "";
    const cleanUser = normalizeText(userInput);

    if (!cleanUser) {
      setResults((prev) => ({
        ...prev,
        [q.id]: { checked: true, isCorrect: false, feedback: "Vui lòng nhập câu trả lời trước khi kiểm tra!" },
      }));
      return;
    }

    const answersList = q.answers.map((a) => a.correct);
    const isCorrect = isAnswerMatching(userInput, answersList);

    setResults((prev) => ({
      ...prev,
      [q.id]: {
        checked: true,
        isCorrect: isCorrect,
        feedback: isCorrect ? "Chính xác! 🎉" : "Chưa chính xác, thử lại nhé!",
      },
    }));

    if (!isCorrect) {
      addMistakeRecord({
        id: q.id,
        stem: q.stem,
        starter_prompt: q.starter_prompt,
        instruction: q.instruction || "",
        answers: answersList,
        explanation: q.explanation,
        topic_name: selectedChapter.title_vi,
      });
    }
  };

  const toggleShowAnswer = (qId) => {
    setShowAnswers((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const checkAllQuestions = (exercise) => {
    exercise.questions.forEach((q) => checkSingleQuestion(q));
  };

  const resetExercise = (exercise) => {
    setUserInputs((prev) => {
      const next = { ...prev };
      exercise.questions.forEach((q) => delete next[q.id]);
      return next;
    });
    setResults((prev) => {
      const next = { ...prev };
      exercise.questions.forEach((q) => delete next[q.id]);
      return next;
    });
    setShowAnswers((prev) => {
      const next = { ...prev };
      exercise.questions.forEach((q) => delete next[q.id]);
      return next;
    });
  };

  // --- Quiz Handlers ---
  const startNewQuiz = (topicId = selectedQuizTopic) => {
    let pool = [];
    if (topicId === "ALL") {
      pool = quizData.topics.flatMap((t) => t.questions);
    } else {
      const found = quizData.topics.find((t) => String(t.id) === String(topicId));
      pool = found ? found.questions : [];
    }

    if (pool.length === 0) {
      alert("Không có câu hỏi trong chủ đề này!");
      return;
    }

    // Shuffle pool with Fisher-Yates and take up to 50
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 50);

    setActiveQuizQuestions(selected);
    setQuizAnswers({});
    setQuizResults(null);
    setQuizSubmitted(false);
    setQuizSingleChecks({});
    setQuizShowAnswers({});
  };

  const handleQuizAnswerChange = (qId, val) => {
    setQuizAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  // Immediate Single Question Check inside Quiz
  const checkSingleQuizQuestion = (q) => {
    const userAns = quizAnswers[q.id] || "";
    if (!userAns.trim()) {
      setQuizSingleChecks((prev) => ({
        ...prev,
        [q.id]: { checked: true, isCorrect: false, feedback: "Vui lòng nhập câu trả lời trước khi kiểm tra!" },
      }));
      return;
    }

    const isCorrect = isAnswerMatching(userAns, q.answers);
    setQuizSingleChecks((prev) => ({
      ...prev,
      [q.id]: {
        checked: true,
        isCorrect: isCorrect,
        feedback: isCorrect ? "Chính xác! 🎉" : "Chưa đúng, hãy thử kiểm tra lại hoặc xem đáp án!",
      },
    }));

    if (!isCorrect) {
      addMistakeRecord({
        id: q.id,
        stem: q.stem,
        starter_prompt: q.starter_prompt,
        instruction: q.instruction,
        answers: q.answers,
        explanation: q.explanation,
        topic_name: q.topic_name,
      });
    }
  };

  const toggleQuizShowAnswer = (qId) => {
    setQuizShowAnswers((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const submitQuiz = () => {
    let correctCount = 0;
    const details = [];
    const newMistakesToAdd = [];

    activeQuizQuestions.forEach((q, idx) => {
      const userAns = quizAnswers[q.id] || "";
      const isCorrect = isAnswerMatching(userAns, q.answers);

      if (isCorrect) {
        correctCount += 1;
      } else {
        newMistakesToAdd.push({
          id: q.id,
          stem: q.stem,
          starter_prompt: q.starter_prompt,
          instruction: q.instruction,
          answers: q.answers,
          explanation: q.explanation,
          topic_name: q.topic_name,
        });
      }

      details.push({
        num: idx + 1,
        question: q,
        userAnswer: userAns,
        isCorrect: isCorrect,
      });
    });

    setQuizResults({
      score: correctCount,
      total: activeQuizQuestions.length,
      percentage: Math.round((correctCount / activeQuizQuestions.length) * 100),
      details: details,
    });
    setQuizSubmitted(true);

    if (newMistakesToAdd.length > 0) {
      const existingIds = new Set(savedMistakes.map((m) => m.id));
      const filtered = newMistakesToAdd.filter((m) => !existingIds.has(m.id));
      if (filtered.length > 0) {
        persistMistakes([...savedMistakes, ...filtered]);
      }
    }
  };

  // --- Mistakes Review Handlers ---
  const addMistakeRecord = (item) => {
    if (!savedMistakes.some((m) => m.id === item.id)) {
      persistMistakes([...savedMistakes, item]);
    }
  };

  const removeMistakeRecord = (id) => {
    const updated = savedMistakes.filter((m) => m.id !== id);
    persistMistakes(updated);
  };

  const clearAllMistakes = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ danh sách câu hỏi làm sai?")) {
      persistMistakes([]);
    }
  };

  const checkSingleMistake = (item) => {
    const input = mistakeInputs[item.id] || "";
    const isCorrect = isAnswerMatching(input, item.answers);

    setMistakeResults((prev) => ({
      ...prev,
      [item.id]: {
        checked: true,
        isCorrect: isCorrect,
        feedback: isCorrect ? "Làm đúng rồi! Bạn có thể xóa câu này khỏi danh sách ôn tập. 🎉" : "Vẫn chưa chính xác, hãy xem lại đáp án!",
      },
    }));
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1e293b", color: "#fff", padding: "1rem 2rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>📚</span> English Grammar Platform
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#94a3b8" }}>
              Giáo trình <em>Ngữ pháp tiếng Anh</em> — Mai Lan Hương & Hà Thanh Uyên
            </p>
          </div>

          {/* Main Module Switcher */}
          <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "#0f172a", padding: "0.3rem", borderRadius: "10px" }}>
            <button
              onClick={() => setCurrentView("study")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
                backgroundColor: currentView === "study" ? "#2563eb" : "transparent",
                color: "#fff",
                transition: "all 0.15s ease",
              }}
            >
              📖 Lý thuyết & Bài học
            </button>
            <button
              onClick={() => {
                setCurrentView("quiz");
                if (activeQuizQuestions.length === 0) startNewQuiz("ALL");
              }}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
                backgroundColor: currentView === "quiz" ? "#2563eb" : "transparent",
                color: "#fff",
                transition: "all 0.15s ease",
              }}
            >
              🎯 Đề thi Quiz (50 câu)
            </button>
            <button
              onClick={() => setCurrentView("mistakes")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
                backgroundColor: currentView === "mistakes" ? "#dc2626" : "transparent",
                color: "#fff",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>⚠️ Câu sai cần ôn</span>
              {savedMistakes.length > 0 && (
                <span style={{ backgroundColor: "#fff", color: "#dc2626", padding: "0.1rem 0.45rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "700" }}>
                  {savedMistakes.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ================= VIEW 1: STUDY & PRACTICE ================= */}
      {currentView === "study" && (
        <div style={{ maxWidth: "1280px", margin: "2rem auto", padding: "0 1rem", display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.5rem" }}>
          
          {/* Sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ backgroundColor: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: "600" }}>
                Danh mục chương (12 Chương)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "380px", overflowY: "auto", paddingRight: "0.25rem" }}>
                {previewData.chapters.map((ch) => {
                  const isActive = selectedChapter?.id === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => handleSelectChapter(ch)}
                      style={{
                        textAlign: "left",
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: isActive ? "#eff6ff" : "transparent",
                        borderLeft: isActive ? "3px solid #2563eb" : "3px solid transparent",
                        color: isActive ? "#1e40af" : "#334155",
                        fontWeight: isActive ? "600" : "500",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", color: isActive ? "#3b82f6" : "#94a3b8" }}>
                        Chương {ch.number}
                      </div>
                      <div style={{ fontSize: "0.95rem" }}>{ch.title_vi}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{ch.title_en}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedChapter && (
              <div style={{ backgroundColor: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: "600" }}>
                  Bài học trong chương ({selectedChapter.lessons.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "380px", overflowY: "auto" }}>
                  {selectedChapter.lessons.map((les, idx) => {
                    const isLesActive = selectedLesson?.id === les.id;
                    return (
                      <button
                        key={les.id}
                        onClick={() => { setSelectedLesson(les); setActiveTab("theory"); }}
                        style={{
                          textAlign: "left",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: isLesActive ? "#f1f5f9" : "transparent",
                          color: isLesActive ? "#0f172a" : "#475569",
                          fontWeight: isLesActive ? "600" : "400",
                          fontSize: "0.875rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ color: "#94a3b8", fontSize: "0.75rem", minWidth: "1.5rem" }}>{idx + 1}.</span>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{les.title_vi}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <main style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ backgroundColor: "#fff", padding: "1.25rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "500" }}>
                    Chương {selectedChapter?.number}: {selectedChapter?.title_vi}
                  </span>
                  <h2 style={{ margin: "0.25rem 0 0 0", fontSize: "1.4rem", color: "#0f172a" }}>
                    {selectedLesson ? selectedLesson.title_vi : selectedChapter?.title_vi}
                  </h2>
                  <p style={{ margin: "0.15rem 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                    {selectedLesson?.title_en}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "#f1f5f9", padding: "0.25rem", borderRadius: "8px" }}>
                  <button
                    onClick={() => setActiveTab("theory")}
                    style={{
                      padding: "0.5rem 1rem",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      backgroundColor: activeTab === "theory" ? "#fff" : "transparent",
                      color: activeTab === "theory" ? "#0f172a" : "#64748b",
                      boxShadow: activeTab === "theory" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    📖 Lý thuyết & Công thức
                  </button>
                  <button
                    onClick={() => setActiveTab("exercises")}
                    style={{
                      padding: "0.5rem 1rem",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      backgroundColor: activeTab === "exercises" ? "#fff" : "transparent",
                      color: activeTab === "exercises" ? "#0f172a" : "#64748b",
                      boxShadow: activeTab === "exercises" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    ✏️ Luyện tập có chấm điểm ({selectedChapter?.exercises.length || 0})
                  </button>
                </div>
              </div>
            </div>

            {/* Theory Tab */}
            {activeTab === "theory" && selectedLesson && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>🔬</span> Quy tắc ngữ pháp & Cấu trúc ({selectedLesson.rules.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {selectedLesson.rules.map((rule, idx) => (
                      <div key={idx} style={{ padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                        <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "0.4rem" }}>
                          {rule.title}
                        </div>
                        {rule.formula && (
                          <div style={{ backgroundColor: "#e2e8f0", padding: "0.4rem 0.8rem", borderRadius: "4px", fontFamily: "monospace", fontSize: "0.9rem", color: "#0f172a", marginBottom: "0.4rem", display: "inline-block" }}>
                            {rule.formula}
                          </div>
                        )}
                        {rule.explanation_vi && (
                          <div style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.5" }}>
                            {rule.explanation_vi}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>💡</span> Ví dụ minh họa song ngữ ({selectedLesson.examples.length})
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
                    {selectedLesson.examples.map((ex, idx) => (
                      <div key={idx} style={{ padding: "0.85rem", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                        <div style={{ fontWeight: "600", color: "#166534", fontSize: "0.95rem" }}>
                          👉 {ex.en}
                        </div>
                        {ex.vi && (
                          <div style={{ color: "#15803d", fontSize: "0.85rem", marginTop: "0.25rem", fontStyle: "italic" }}>
                            {ex.vi}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Exercises Tab */}
            {activeTab === "exercises" && selectedChapter && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {selectedChapter.exercises.map((ex) => (
                  <div key={ex.id} style={{ border: "1px solid #cbd5e1", borderRadius: "10px", padding: "1.5rem", backgroundColor: "#ffffff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "2px solid #f1f5f9", paddingBottom: "0.75rem" }}>
                      <div>
                        <span style={{ fontWeight: "800", color: "#1d4ed8", fontSize: "1.1rem" }}>
                          Exercise {ex.roman}: {ex.title}
                        </span>
                        {ex.instruction_vi && (
                          <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>
                            {ex.instruction_vi}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <button
                          onClick={() => checkAllQuestions(ex)}
                          style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "0.35rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" }}
                        >
                          Chấm điểm tất cả
                        </button>
                        <button
                          onClick={() => resetExercise(ex)}
                          style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "none", padding: "0.35rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" }}
                        >
                          Làm lại
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {ex.questions.map((q) => {
                        const res = results[q.id];
                        const isAnswerShown = showAnswers[q.id];
                        const currentVal = userInputs[q.id] || "";

                        return (
                          <div
                            key={q.id}
                            style={{
                              padding: "1rem",
                              backgroundColor: res?.checked ? (res.isCorrect ? "#f0fdf4" : "#fef2f2") : "#f8fafc",
                              border: res?.checked ? (res.isCorrect ? "1px solid #86efac" : "1px solid #fca5a5") : "1px solid #e2e8f0",
                              borderRadius: "8px",
                            }}
                          >
                            <div style={{ fontSize: "0.95rem", color: "#1e293b", marginBottom: "0.75rem" }}>
                              <strong style={{ color: "#2563eb", marginRight: "0.5rem" }}>{q.num}.</strong>
                              <span>{q.stem}</span>
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                              <input
                                type="text"
                                value={currentVal}
                                placeholder="Nhập câu trả lời / từ cần điền..."
                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") checkSingleQuestion(q); }}
                                style={{
                                  flex: "1",
                                  minWidth: "260px",
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "6px",
                                  border: res?.checked ? (res.isCorrect ? "2px solid #22c55e" : "2px solid #ef4444") : "1px solid #cbd5e1",
                                  fontSize: "0.9rem",
                                  backgroundColor: "#fff",
                                }}
                              />
                              <button
                                onClick={() => checkSingleQuestion(q)}
                                style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}
                              >
                                Kiểm tra
                              </button>
                              <button
                                onClick={() => toggleShowAnswer(q.id)}
                                style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
                              >
                                {isAnswerShown ? "Ẩn đáp án" : "Xem đáp án"}
                              </button>
                            </div>

                            {res?.checked && (
                              <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", fontWeight: "600", color: res.isCorrect ? "#15803d" : "#b91c1c" }}>
                                {res.feedback}
                              </div>
                            )}

                            {isAnswerShown && (
                              <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "#eff6ff", borderRadius: "6px", border: "1px dashed #60a5fa" }}>
                                <div style={{ fontSize: "0.85rem", color: "#1e40af", fontWeight: "600" }}>✅ Đáp án: {q.answers.map((a) => a.correct).join(" / ")}</div>
                                {q.explanation && <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.25rem" }}>💡 {q.explanation}</div>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* ================= VIEW 2: QUIZ 50 CÂU HỎI THEO CHỦ ĐỀ ================= */}
      {currentView === "quiz" && (
        <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Quiz Control Card */}
          <div style={{ backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.35rem", color: "#0f172a" }}>
              🎯 Bộ đề Quiz ngẫu nhiên 50 câu theo chủ đề
            </h2>
            <p style={{ margin: "0 0 1.25rem 0", color: "#64748b", fontSize: "0.9rem" }}>
              Mỗi câu hỏi đều hiển thị rõ <strong>yêu cầu bài tập (Instruction)</strong> và <strong>gợi ý bắt đầu câu (Starter Prompt)</strong> nếu có. Bạn có thể bấm <strong>"Kiểm tra ngay"</strong> hoặc <strong>"Xem đáp án"</strong> từng câu bất cứ lúc nào!
            </p>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: "600", color: "#334155" }}>Chọn chủ đề:</label>
                <select
                  value={selectedQuizTopic}
                  onChange={(e) => {
                    setSelectedQuizTopic(e.target.value);
                    startNewQuiz(e.target.value);
                  }}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", backgroundColor: "#fff", outline: "none" }}
                >
                  <option value="ALL">🌟 Tất cả 12 Chương tổng hợp</option>
                  {quizData.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      Chương {t.number}: {t.title_vi} ({t.question_count} câu)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => startNewQuiz(selectedQuizTopic)}
                style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "600", cursor: "pointer" }}
              >
                🔄 Trộn 50 câu mới
              </button>
            </div>
          </div>

          {/* Quiz Score Summary Banner (If Submitted) */}
          {quizSubmitted && quizResults && (
            <div style={{ backgroundColor: quizResults.percentage >= 80 ? "#ecfdf5" : quizResults.percentage >= 50 ? "#eff6ff" : "#fef2f2", border: `2px solid ${quizResults.percentage >= 80 ? "#10b981" : quizResults.percentage >= 50 ? "#3b82f6" : "#ef4444"}`, padding: "1.5rem", borderRadius: "12px", textAlign: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.4rem", color: quizResults.percentage >= 80 ? "#065f46" : quizResults.percentage >= 50 ? "#1e40af" : "#991b1b" }}>
                Kết quả bài thi: {quizResults.score} / {quizResults.total} điểm ({quizResults.percentage}%)
              </h3>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem", color: "#475569" }}>
                {quizResults.percentage >= 80
                  ? "Xuất sắc! Bạn đã nắm rất vững kiến thức phần này! 🎉"
                  : quizResults.percentage >= 50
                  ? "Khá tốt! Hãy xem lại các câu sai bên dưới hoặc vào mục 'Câu sai cần ôn' để luyện lại."
                  : "Cần ôn tập thêm. Đừng lo, các câu sai đã được lưu lại để bạn rèn luyện tiếp!"}
              </p>
            </div>
          )}

          {/* Quiz Questions List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {activeQuizQuestions.map((q, idx) => {
              const userAns = quizAnswers[q.id] || "";
              const detail = quizResults?.details?.find((d) => d.question.id === q.id);
              const singleCheck = quizSingleChecks[q.id];
              const isAnswerShown = quizShowAnswers[q.id];

              return (
                <div
                  key={q.id}
                  style={{
                    backgroundColor: "#fff",
                    padding: "1.25rem",
                    borderRadius: "10px",
                    border: quizSubmitted
                      ? (detail?.isCorrect ? "1px solid #86efac" : "1px solid #fca5a5")
                      : singleCheck?.checked
                      ? (singleCheck.isCorrect ? "1px solid #86efac" : "1px solid #fca5a5")
                      : "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* Top Bar: Topic & Type Tag */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: "700" }}>
                      Câu {idx + 1} / {activeQuizQuestions.length} • {q.topic_name}
                    </span>
                    <span style={{ fontSize: "0.75rem", backgroundColor: "#f1f5f9", padding: "0.2rem 0.6rem", borderRadius: "4px", color: "#475569", fontWeight: "600" }}>
                      {getQuestionTypeLabel(q.type)}
                    </span>
                  </div>

                  {/* EXPLICIT INSTRUCTION BOX - Tells user what to do! */}
                  {q.instruction && (
                    <div style={{ backgroundColor: "#f0f9ff", borderLeft: "4px solid #0284c7", padding: "0.6rem 0.85rem", borderRadius: "4px", marginBottom: "0.75rem", fontSize: "0.875rem", color: "#0369a1" }}>
                      <strong>📌 Yêu cầu bài tập:</strong> {q.instruction}
                    </div>
                  )}

                  {/* Question Stem */}
                  <div style={{ fontSize: "1rem", color: "#0f172a", marginBottom: "0.5rem", lineHeight: "1.5" }}>
                    {q.stem}
                  </div>

                  {/* Starter Prompt (Gợi ý từ đầu câu cho dạng viết lại câu) */}
                  {q.starter_prompt && (
                    <div style={{ backgroundColor: "#fefce8", border: "1px solid #fef08a", padding: "0.4rem 0.75rem", borderRadius: "6px", marginBottom: "0.75rem", fontSize: "0.875rem", color: "#854d0e" }}>
                      <strong>👉 Viết tiếp câu bắt đầu bằng:</strong> <span style={{ fontWeight: "700", color: "#b45309" }}>"{q.starter_prompt}..."</span>
                    </div>
                  )}

                  {/* Answer Input Field & Inline Check Action */}
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.75rem" }}>
                    <input
                      type="text"
                      disabled={quizSubmitted}
                      value={userAns}
                      placeholder={q.starter_prompt ? `Viết tiếp từ "${q.starter_prompt}..."` : "Gõ đáp án của bạn vào đây..."}
                      onChange={(e) => handleQuizAnswerChange(q.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !quizSubmitted) checkSingleQuizQuestion(q);
                      }}
                      style={{
                        flex: "1",
                        minWidth: "260px",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: singleCheck?.checked
                          ? (singleCheck.isCorrect ? "2px solid #22c55e" : "2px solid #ef4444")
                          : "1px solid #cbd5e1",
                        fontSize: "0.95rem",
                        backgroundColor: quizSubmitted ? "#f8fafc" : "#fff",
                      }}
                    />
                    
                    {!quizSubmitted && (
                      <>
                        <button
                          onClick={() => checkSingleQuizQuestion(q)}
                          style={{
                            backgroundColor: "#2563eb",
                            color: "#fff",
                            border: "none",
                            padding: "0.55rem 1rem",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Kiểm tra
                        </button>
                        <button
                          onClick={() => toggleQuizShowAnswer(q.id)}
                          style={{
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                            padding: "0.55rem 0.85rem",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                          }}
                        >
                          {isAnswerShown ? "Ẩn đáp án" : "Xem đáp án"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Realtime Single Check Feedback */}
                  {!quizSubmitted && singleCheck?.checked && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", fontWeight: "700", color: singleCheck.isCorrect ? "#15803d" : "#b91c1c" }}>
                      {singleCheck.feedback}
                    </div>
                  )}

                  {/* Realtime Single Answer Box (if toggled) */}
                  {!quizSubmitted && isAnswerShown && (
                    <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "#eff6ff", borderRadius: "6px", border: "1px dashed #60a5fa" }}>
                      <div style={{ fontSize: "0.85rem", color: "#1e40af", fontWeight: "600" }}>✅ Đáp án chính xác:</div>
                      <div style={{ fontSize: "0.95rem", color: "#1d4ed8", fontWeight: "700", marginTop: "0.2rem" }}>
                        {q.answers.join(" / ")}
                      </div>
                      {q.explanation && (
                        <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.25rem" }}>💡 {q.explanation}</div>
                      )}
                    </div>
                  )}

                  {/* Submitted Quiz Final Review */}
                  {quizSubmitted && detail && (
                    <div style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: "6px", backgroundColor: detail.isCorrect ? "#f0fdf4" : "#fef2f2" }}>
                      <div style={{ fontWeight: "700", color: detail.isCorrect ? "#166534" : "#991b1b", fontSize: "0.9rem" }}>
                        {detail.isCorrect ? "✅ Làm đúng!" : "❌ Chưa đúng!"}
                      </div>
                      {!detail.isCorrect && (
                        <div style={{ marginTop: "0.3rem", fontSize: "0.875rem", color: "#1e3a8a" }}>
                          <strong>Đáp án đúng:</strong> {q.answers.join(" / ")}
                        </div>
                      )}
                      {q.explanation && (
                        <div style={{ marginTop: "0.2rem", fontSize: "0.8rem", color: "#64748b" }}>
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Quiz Action */}
          {!quizSubmitted && activeQuizQuestions.length > 0 && (
            <div style={{ textAlign: "center", margin: "1rem 0 3rem 0" }}>
              <button
                onClick={submitQuiz}
                style={{
                  backgroundColor: "#10b981",
                  color: "#fff",
                  border: "none",
                  padding: "0.85rem 2.5rem",
                  borderRadius: "10px",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)",
                }}
              >
                🏁 Nộp toàn bộ bài và tính điểm
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 3: SAVED MISTAKES (CÂU SAI CẦN ÔN) ================= */}
      {currentView === "mistakes" && (
        <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div style={{ backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ margin: "0 0 0.4rem 0", fontSize: "1.35rem", color: "#991b1b" }}>
                  ⚠️ Danh sách các câu hỏi làm sai cần ôn lại
                </h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                  Mỗi khi bạn làm sai ở bài tập hoặc trong Quiz, câu hỏi sẽ được lưu tự động tại đây. Sau khi bạn làm lại chính xác, bạn có thể xóa câu đó ra khỏi danh sách.
                </p>
              </div>

              {savedMistakes.length > 0 && (
                <button
                  onClick={clearAllMistakes}
                  style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}
                >
                  🗑️ Xóa toàn bộ
                </button>
              )}
            </div>
          </div>

          {savedMistakes.length === 0 ? (
            <div style={{ backgroundColor: "#fff", padding: "3rem", borderRadius: "12px", textAlign: "center", border: "1px dashed #cbd5e1" }}>
              <span style={{ fontSize: "3rem" }}>🎉</span>
              <h3 style={{ margin: "1rem 0 0.5rem 0", color: "#0f172a" }}>Tuyệt vời! Bạn không có câu hỏi sai nào cần ôn tập!</h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                Hãy thử sức với các bài tập hoặc làm đề thi Quiz 50 câu để kiểm tra trình độ.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {savedMistakes.map((item, idx) => {
                const res = mistakeResults[item.id];
                const isShown = showMistakeAnswers[item.id];
                const inputVal = mistakeInputs[item.id] || "";

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "#fff",
                      padding: "1.25rem",
                      borderRadius: "10px",
                      border: res?.checked ? (res.isCorrect ? "1px solid #86efac" : "1px solid #fca5a5") : "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: "700" }}>
                        Câu #{idx + 1} • {item.topic_name}
                      </span>
                      <button
                        onClick={() => removeMistakeRecord(item.id)}
                        style={{ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        ✕ Xóa câu này
                      </button>
                    </div>

                    {item.instruction && (
                      <div style={{ backgroundColor: "#f0f9ff", borderLeft: "3px solid #0284c7", padding: "0.4rem 0.6rem", borderRadius: "4px", marginBottom: "0.5rem", fontSize: "0.8rem", color: "#0369a1" }}>
                        <strong>📌 Yêu cầu:</strong> {item.instruction}
                      </div>
                    )}

                    <div style={{ fontSize: "0.95rem", color: "#1e293b", marginBottom: "0.5rem", lineHeight: "1.5" }}>
                      {item.stem}
                    </div>

                    {item.starter_prompt && (
                      <div style={{ backgroundColor: "#fefce8", padding: "0.3rem 0.6rem", borderRadius: "4px", marginBottom: "0.6rem", fontSize: "0.85rem", color: "#854d0e" }}>
                        👉 Viết tiếp: <strong>"{item.starter_prompt}..."</strong>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        value={inputVal}
                        placeholder="Thử làm lại câu này..."
                        onChange={(e) => setMistakeInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") checkSingleMistake(item); }}
                        style={{
                          flex: "1",
                          minWidth: "260px",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "6px",
                          border: res?.checked ? (res.isCorrect ? "2px solid #22c55e" : "2px solid #ef4444") : "1px solid #cbd5e1",
                          fontSize: "0.9rem",
                        }}
                      />
                      <button
                        onClick={() => checkSingleMistake(item)}
                        style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}
                      >
                        Kiểm tra lại
                      </button>
                      <button
                        onClick={() => setShowMistakeAnswers((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                        style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}
                      >
                        {isShown ? "Ẩn đáp án" : "Xem đáp án"}
                      </button>
                    </div>

                    {res?.checked && (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", fontWeight: "600", color: res.isCorrect ? "#15803d" : "#b91c1c" }}>
                        {res.feedback}
                      </div>
                    )}

                    {isShown && (
                      <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "#eff6ff", borderRadius: "6px", border: "1px dashed #60a5fa" }}>
                        <div style={{ fontSize: "0.85rem", color: "#1e40af", fontWeight: "600" }}>✅ Đáp án chuẩn: {item.answers.join(" / ")}</div>
                        {item.explanation && <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.25rem" }}>💡 {item.explanation}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e2e8f0", marginTop: "4rem", padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
        English Grammar Learning Platform &copy; 2026. Built with Next.js 14 & Prisma.
      </footer>
    </div>
  );
}
