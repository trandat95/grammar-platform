import Head from "next/head";
import { useState, useEffect, useMemo } from "react";
import previewData from "../data/ui/preview_data.json";
import quizData from "../data/ui/quiz_bank.json";

export default function Home() {
  // Navigation mode: 'study' | 'quiz' | 'mistakes' | 'dashboard'
  const [currentView, setCurrentView] = useState("dashboard");

  // Study View State
  const [selectedChapterId, setSelectedChapterId] = useState(previewData.chapters[0]?.id || "");
  const selectedChapter = useMemo(
    () => previewData.chapters.find((c) => c.id === selectedChapterId) || previewData.chapters[0],
    [selectedChapterId]
  );

  const [selectedLessonId, setSelectedLessonId] = useState(
    previewData.chapters[0]?.lessons[0]?.id || ""
  );
  const selectedLesson = useMemo(() => {
    if (!selectedChapter?.lessons?.length) return null;
    return selectedChapter.lessons.find((l) => l.id === selectedLessonId) || selectedChapter.lessons[0];
  }, [selectedChapter, selectedLessonId]);

  const [activeTab, setActiveTab] = useState("theory"); // 'theory' | 'exercises'
  const [chapterSearch, setChapterSearch] = useState("");

  // Study Exercise Interaction State
  const [userInputs, setUserInputs] = useState({});
  const [results, setResults] = useState({});
  const [showAnswers, setShowAnswers] = useState({});

  // Quiz State
  const [selectedQuizTopic, setSelectedQuizTopic] = useState("ALL");
  const [activeQuizQuestions, setActiveQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizSingleChecks, setQuizSingleChecks] = useState({});
  const [quizShowAnswers, setQuizShowAnswers] = useState({});

  // Mistakes Storage State (saved in localStorage)
  const [savedMistakes, setSavedMistakes] = useState([]);
  const [mistakeInputs, setMistakeInputs] = useState({});
  const [mistakeResults, setMistakeResults] = useState({});
  const [showMistakeAnswers, setShowMistakeAnswers] = useState({});
  const [mistakeFilterTopic, setMistakeFilterTopic] = useState("ALL");

  // Duolingo-style Learning Tracker State
  const [userTracker, setUserTracker] = useState({
    streak: 1,
    lastActiveDate: "",
    activeDays: [],
    xp: 50,
    completedLessons: [],
    completedQuestions: [],
    dailyGoal: { targetQuestions: 10, solvedToday: 0, date: "" }
  });
  const [xpToast, setXpToast] = useState(null);

  // Helper date strings
  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getYesterdayDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Toast notification for XP gain
  const triggerXpGain = (amount, msg) => {
    setXpToast({ amount, message: msg || `+${amount} XP` });
    setTimeout(() => setXpToast(null), 2800);
  };

  // Load Tracker and Mistakes from localStorage on client mount
  useEffect(() => {
    try {
      // 1. Load mistakes
      const storedMistakes = localStorage.getItem("grammar_platform_mistakes");
      if (storedMistakes) {
        setSavedMistakes(JSON.parse(storedMistakes));
      }

      // 2. Load and verify Duolingo tracker
      const today = getTodayDateStr();
      const yesterday = getYesterdayDateStr();
      const storedTracker = localStorage.getItem("grammar_platform_tracker");

      if (storedTracker) {
        const parsed = JSON.parse(storedTracker);
        let newStreak = parsed.streak || 1;
        let newActiveDays = parsed.activeDays || [];

        if (!parsed.lastActiveDate) {
          newStreak = 1;
        } else if (parsed.lastActiveDate === today) {
          // already active today
        } else if (parsed.lastActiveDate === yesterday) {
          // consecutive active day!
          newStreak = (parsed.streak || 0) + 1;
        } else {
          // streak broken
          newStreak = 1;
        }

        if (!newActiveDays.includes(today)) {
          newActiveDays.push(today);
        }

        let dailyGoal = parsed.dailyGoal || { targetQuestions: 10, solvedToday: 0, date: today };
        if (dailyGoal.date !== today) {
          dailyGoal = { targetQuestions: 10, solvedToday: 0, date: today };
        }

        const updated = {
          ...parsed,
          streak: newStreak,
          lastActiveDate: today,
          activeDays: newActiveDays,
          dailyGoal: dailyGoal
        };
        setUserTracker(updated);
        localStorage.setItem("grammar_platform_tracker", JSON.stringify(updated));
      } else {
        // Initial setup for new learner
        const initial = {
          streak: 1,
          lastActiveDate: today,
          activeDays: [today],
          xp: 50, // Welcome gift
          completedLessons: [],
          completedQuestions: [],
          dailyGoal: { targetQuestions: 10, solvedToday: 0, date: today }
        };
        setUserTracker(initial);
        localStorage.setItem("grammar_platform_tracker", JSON.stringify(initial));
      }
    } catch (e) {
      console.error("Failed to initialize user tracker", e);
    }
  }, []);

  // Persist tracker updates helper
  const persistTracker = (updater) => {
    setUserTracker((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      try {
        localStorage.setItem("grammar_platform_tracker", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save tracker", e);
      }
      return next;
    });
  };

  const persistMistakes = (newMistakes) => {
    setSavedMistakes(newMistakes);
    try {
      localStorage.setItem("grammar_platform_mistakes", JSON.stringify(newMistakes));
    } catch (e) {
      console.error("Failed to save mistakes", e);
    }
  };

  // Toggle mark lesson as completed
  const toggleLessonCompletion = (lessonId) => {
    const isDone = userTracker.completedLessons.includes(lessonId);
    persistTracker((prev) => {
      let nextList = [...prev.completedLessons];
      let xpGain = 0;
      if (isDone) {
        nextList = nextList.filter((id) => id !== lessonId);
      } else {
        nextList.push(lessonId);
        xpGain = 25;
        triggerXpGain(25, "Đã hoàn thành bài học: +25 XP!");
      }
      return {
        ...prev,
        xp: prev.xp + xpGain,
        completedLessons: nextList,
      };
    });
  };

  // Record correct question answered
  const recordCorrectQuestion = (questionId, isQuiz = false) => {
    const xpReward = isQuiz ? 15 : 10;
    persistTracker((prev) => {
      const today = getTodayDateStr();
      const alreadyDone = prev.completedQuestions.includes(questionId);
      const nextQuestions = alreadyDone ? prev.completedQuestions : [...prev.completedQuestions, questionId];
      const todaySolved = (prev.dailyGoal?.date === today ? (prev.dailyGoal?.solvedToday || 0) : 0) + 1;
      
      if (!alreadyDone) {
        triggerXpGain(xpReward, isQuiz ? "Chính xác câu Quiz: +15 XP!" : "Đúng bài tập: +10 XP!");
      }

      return {
        ...prev,
        xp: prev.xp + (alreadyDone ? 0 : xpReward),
        completedQuestions: nextQuestions,
        dailyGoal: {
          targetQuestions: prev.dailyGoal?.targetQuestions || 10,
          solvedToday: todaySolved,
          date: today
        }
      };
    });
  };

  const handleSelectChapter = (ch) => {
    setSelectedChapterId(ch.id);
    setSelectedLessonId(ch.lessons[0]?.id || "");
    setActiveTab("theory");
  };

  const normalizeText = (text) => {
    if (!text) return "";
    return text
      .trim()
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
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

  const getQuestionTypeInfo = (type) => {
    switch (type) {
      case "FILL_IN_THE_BLANKS":
        return { label: "Điền ô trống", tag: "FILL-BLANK" };
      case "REWRITE_SENTENCES":
        return { label: "Viết lại câu", tag: "REWRITE" };
      case "SENTENCE_TRANSFORMATION":
        return { label: "Biến đổi câu", tag: "TRANSFORM" };
      case "MULTIPLE_CHOICE":
        return { label: "Trắc nghiệm", tag: "CHOICE" };
      case "WORD_FORMATION":
        return { label: "Chia dạng từ", tag: "WORD-FORM" };
      case "COMPLETE_SENTENCES":
        return { label: "Hoàn thiện câu", tag: "COMPLETE" };
      case "ERROR_CORRECTION":
        return { label: "Sửa lỗi sai", tag: "ERROR-FIX" };
      default:
        return { label: type || "Bài tập", tag: "PRACTICE" };
    }
  };

  // --- Study Exercise Handlers ---
  const handleInputChange = (questionId, value) => {
    setUserInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const checkSingleQuestion = (q, exerciseType = "") => {
    const userInput = userInputs[q.id] || "";
    if (!userInput.trim()) {
      setResults((prev) => ({
        ...prev,
        [q.id]: { checked: true, isCorrect: false, feedback: "Vui lòng nhập câu trả lời trước khi kiểm tra." },
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
        feedback: isCorrect ? "Chính xác! Đáp án hoàn toàn đúng." : "Chưa chính xác. Xem đáp án mẫu bên dưới.",
      },
    }));

    if (isCorrect) {
      recordCorrectQuestion(q.id, false);
    } else {
      addMistakeRecord({
        id: q.id,
        stem: q.stem,
        starter_prompt: q.starter_prompt,
        instruction: q.instruction || exerciseType || "",
        answers: answersList,
        explanation: q.explanation,
        topic_name: selectedChapter.title_vi,
      });
    }
  };

  const checkAllQuestions = (exercise) => {
    exercise.questions.forEach((q) => checkSingleQuestion(q, exercise.instruction_vi || exercise.title));
  };

  const toggleShowAnswer = (qId) => {
    setShowAnswers((prev) => ({ ...prev, [qId]: !prev[qId] }));
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
      alert("Không có câu hỏi trong chuyên đề đã chọn!");
      return;
    }

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

  const checkSingleQuizQuestion = (q) => {
    const userAns = quizAnswers[q.id] || "";
    if (!userAns.trim()) {
      setQuizSingleChecks((prev) => ({
        ...prev,
        [q.id]: { checked: true, isCorrect: false, feedback: "Vui lòng nhập câu trả lời trước khi kiểm tra." },
      }));
      return;
    }

    const isCorrect = isAnswerMatching(userAns, q.answers);
    setQuizSingleChecks((prev) => ({
      ...prev,
      [q.id]: {
        checked: true,
        isCorrect: isCorrect,
        feedback: isCorrect ? "Chính xác! Đáp án hoàn toàn đúng." : "Chưa chính xác. Xem gợi ý hoặc đối chiếu đáp án.",
      },
    }));

    if (isCorrect) {
      recordCorrectQuestion(q.id, true);
    } else {
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
        recordCorrectQuestion(q.id, true);
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
    if (confirm("Xác nhận xóa toàn bộ danh sách câu hỏi trong sổ tay câu sai?")) {
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
        feedback: isCorrect ? "Rất tốt! Bạn đã trả lời đúng câu này." : "Vẫn chưa đúng. Hãy đối chiếu đáp án mẫu bên dưới.",
      },
    }));

    if (isCorrect) {
      recordCorrectQuestion(item.id, false);
    }
  };

  // Filtered chapters for search
  const filteredChapters = useMemo(() => {
    if (!chapterSearch.trim()) return previewData.chapters;
    const term = chapterSearch.toLowerCase();
    return previewData.chapters.filter(
      (c) =>
        c.title_vi.toLowerCase().includes(term) ||
        c.title_en.toLowerCase().includes(term) ||
        `chương ${c.number}`.includes(term) ||
        c.lessons.some((l) => l.title_vi.toLowerCase().includes(term))
    );
  }, [chapterSearch]);

  const filteredMistakes = useMemo(() => {
    if (mistakeFilterTopic === "ALL") return savedMistakes;
    return savedMistakes.filter((m) => m.topic_name === mistakeFilterTopic);
  }, [savedMistakes, mistakeFilterTopic]);

  const mistakeTopics = useMemo(() => {
    const set = new Set();
    savedMistakes.forEach((m) => {
      if (m.topic_name) set.add(m.topic_name);
    });
    return Array.from(set);
  }, [savedMistakes]);

  // Overall progression calculations
  const totalLessonsCount = 53;
  const totalQuestionsCount = 2939;
  const overallLessonsProgress = Math.round(
    ((userTracker.completedLessons?.length || 0) / totalLessonsCount) * 100
  );

  // User Rank / Level based on XP
  const userRank = useMemo(() => {
    const xp = userTracker.xp || 0;
    if (xp >= 1500) return { title: "Bậc Thầy Anh Ngữ", level: 5, badge: "💎 Diamond", nextXp: 2000 };
    if (xp >= 800) return { title: "Chiến Binh Ngữ Pháp", level: 4, badge: "🏆 Platinum", nextXp: 1500 };
    if (xp >= 400) return { title: "Cao Thủ Cú Vọ", level: 3, badge: "🥇 Gold", nextXp: 800 };
    if (xp >= 150) return { title: "Học Viên Tích Cực", level: 2, badge: "🥈 Silver", nextXp: 400 };
    return { title: "Tập Sự Khởi Đầu", level: 1, badge: "🥉 Bronze", nextXp: 150 };
  }, [userTracker.xp]);

  // Smart Daily Recommendation Algorithm
  const dailyRecommendation = useMemo(() => {
    // 1. If there are saved mistakes, recommend reviewing that chapter first
    if (savedMistakes.length > 0) {
      const topMistake = savedMistakes[0];
      const targetCh = previewData.chapters.find((c) => c.title_vi === topMistake.topic_name) || previewData.chapters[0];
      const targetLs = targetCh.lessons[0] || null;
      return {
        chapter: targetCh,
        lesson: targetLs,
        reason: `Cần phục thù: Bạn đang có ${savedMistakes.length} câu làm sai cần củng cố ở chuyên đề này.`,
        tag: "ÔN TẬP CỦNG CỐ",
        tagColor: "#f59e0b"
      };
    }

    // 2. Next uncompleted lesson in sequential order
    for (const ch of previewData.chapters) {
      for (const ls of ch.lessons) {
        if (!userTracker.completedLessons.includes(ls.id)) {
          return {
            chapter: ch,
            lesson: ls,
            reason: `Tiếp nối lộ trình học tập: Chuyên đề ${ch.number} - ${ch.title_vi}.`,
            tag: "BÀI HỌC TIẾP THEO",
            tagColor: "#38bdf8"
          };
        }
      }
    }

    // 3. All completed fallback
    return {
      chapter: previewData.chapters[0],
      lesson: previewData.chapters[0].lessons[0],
      reason: "Xuất sắc! Bạn đã hoàn thành toàn bộ 53 bài học. Hãy làm đề Quiz 50 câu để duy trì phong độ!",
      tag: "LUYỆN TẬP NÂNG CAO",
      tagColor: "#10b981"
    };
  }, [savedMistakes, userTracker.completedLessons]);

  const startRecommendedLesson = () => {
    if (dailyRecommendation?.chapter && dailyRecommendation?.lesson) {
      setSelectedChapterId(dailyRecommendation.chapter.id);
      setSelectedLessonId(dailyRecommendation.lesson.id);
      setActiveTab("theory");
      setCurrentView("study");
    }
  };

  // 7-day mini calendar for streak
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    const dayNames = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        dateStr: str,
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        isActive: userTracker.activeDays?.includes(str) || false,
        isToday: i === 0,
      });
    }
    return days;
  }, [userTracker.activeDays]);

  // Total exercise questions in current chapter
  const totalChapterExerciseQuestions = useMemo(() => {
    if (!selectedChapter?.exercises) return 0;
    return selectedChapter.exercises.reduce((acc, ex) => acc + (ex.questions?.length || 0), 0);
  }, [selectedChapter]);

  // Total formulas in selected lesson
  const totalLessonFormulas = useMemo(() => {
    if (!selectedLesson?.sections) return 0;
    return selectedLesson.sections.reduce((acc, s) => acc + (s.formulas?.length || 0), 0);
  }, [selectedLesson]);

  // Quiz answered stats
  const answeredCount = useMemo(() => {
    return Object.keys(quizAnswers).filter((k) => quizAnswers[k]?.trim()).length;
  }, [quizAnswers]);

  const isCurrentLessonDone = userTracker.completedLessons.includes(selectedLesson?.id);

  return (
    <>
      <Head>
        <title>Grammar Engine — Nền tảng Ngữ pháp Tiếng Anh Toàn diện</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style jsx global>{`
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body {
          background-color: #09090b;
          color: #fafafa;
          font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        input, button, select, textarea {
          font-family: inherit;
        }
        ::placeholder {
          color: #71717a;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #09090b;
        }
        ::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
        code, kbd, pre {
          font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75rem 0;
          font-size: 0.85rem;
        }
        th, td {
          border: 1px solid #27272a;
          padding: 0.65rem 0.85rem;
          text-align: left;
        }
        th {
          background-color: #18181b;
          color: #fafafa;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: rgba(255, 255, 255, 0.02);
        }
      `}</style>

      {/* Floating XP Toast */}
      {xpToast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 100,
            backgroundColor: "#18181b",
            border: "1px solid #10b981",
            boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.3)",
            color: "#fafafa",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            animation: "slideIn 0.3s ease",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>⚡</span>
          <div>
            <div style={{ fontWeight: "700", color: "#34d399", fontSize: "0.95rem" }}>
              {xpToast.message}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>Điểm kinh nghiệm đã cộng</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#09090b" }}>
        
        {/* Top Navbar — Duolingo-style Streak & XP Bar */}
        <header
          style={{
            height: "56px",
            borderBottom: "1px solid #27272a",
            backgroundColor: "#09090b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 1.5rem",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          {/* Logo & Product Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                backgroundColor: "#27272a",
                border: "1px solid #3f3f46",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fafafa",
                fontSize: "0.85rem",
                fontWeight: "700",
              }}
            >
              G
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: "600", letterSpacing: "-0.015em", color: "#fafafa" }}>
                Grammar Engine
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontFamily: "Geist Mono",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "4px",
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  color: "#a1a1aa",
                }}
              >
                v1.3 PRO
              </span>
            </div>
          </div>

          {/* Segmented Mode Control (Tabs) */}
          <nav
            style={{
              display: "flex",
              backgroundColor: "#18181b",
              padding: "3px",
              borderRadius: "8px",
              border: "1px solid #27272a",
              gap: "2px",
            }}
          >
            {/* Tab 0: Duolingo Dashboard */}
            <button
              onClick={() => setCurrentView("dashboard")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "6px",
                fontSize: "0.825rem",
                fontWeight: currentView === "dashboard" ? "600" : "500",
                color: currentView === "dashboard" ? "#fafafa" : "#a1a1aa",
                backgroundColor: currentView === "dashboard" ? "#27272a" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
              <span>Lộ trình & Streak</span>
            </button>

            {/* Tab 1: 12 Chapters Study */}
            <button
              onClick={() => setCurrentView("study")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "6px",
                fontSize: "0.825rem",
                fontWeight: currentView === "study" ? "600" : "500",
                color: currentView === "study" ? "#fafafa" : "#a1a1aa",
                backgroundColor: currentView === "study" ? "#27272a" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                <path d="M6 6h10"/>
                <path d="M6 10h10"/>
              </svg>
              <span>12 Chuyên đề</span>
            </button>

            {/* Tab 2: Quiz Engine */}
            <button
              onClick={() => {
                setCurrentView("quiz");
                if (activeQuizQuestions.length === 0) startNewQuiz("ALL");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "6px",
                fontSize: "0.825rem",
                fontWeight: currentView === "quiz" ? "600" : "500",
                color: currentView === "quiz" ? "#fafafa" : "#a1a1aa",
                backgroundColor: currentView === "quiz" ? "#27272a" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              <span>Quiz Engine (50 câu)</span>
            </button>

            {/* Tab 3: Sổ tay câu sai */}
            <button
              onClick={() => setCurrentView("mistakes")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "6px",
                fontSize: "0.825rem",
                fontWeight: currentView === "mistakes" ? "600" : "500",
                color: currentView === "mistakes" ? "#fafafa" : "#a1a1aa",
                backgroundColor: currentView === "mistakes" ? "#27272a" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
              </svg>
              <span>Sổ tay câu sai</span>
              {savedMistakes.length > 0 && (
                <span
                  style={{
                    backgroundColor: "#f43f5e",
                    color: "#ffffff",
                    fontSize: "0.68rem",
                    fontWeight: "600",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "999px",
                  }}
                >
                  {savedMistakes.length}
                </span>
              )}
            </button>
          </nav>

          {/* Duolingo Gamification Stats Pill Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Streak Pill */}
            <div
              onClick={() => setCurrentView("dashboard")}
              title="Chuỗi ngày học liên tiếp"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                backgroundColor: "#1c1917",
                border: "1px solid #78350f",
                padding: "0.25rem 0.65rem",
                borderRadius: "999px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "0.9rem" }}>🔥</span>
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#f59e0b" }}>
                {userTracker.streak} ngày
              </span>
            </div>

            {/* XP Pill */}
            <div
              onClick={() => setCurrentView("dashboard")}
              title="Tổng điểm kinh nghiệm tích lũy"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                backgroundColor: "#141c2b",
                border: "1px solid #1e3a8a",
                padding: "0.25rem 0.65rem",
                borderRadius: "999px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "0.9rem" }}>⚡</span>
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#60a5fa" }}>
                {userTracker.xp} XP
              </span>
            </div>

            {/* Overall Progress Pill */}
            <div
              style={{
                fontSize: "0.75rem",
                color: "#71717a",
                fontFamily: "Geist Mono",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>Tiến độ:</span>
              <strong style={{ color: "#34d399" }}>{overallLessonsProgress}%</strong>
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* VIEW 0: DUOLINGO-STYLE PROGRESS & STREAK DASHBOARD             */}
        {/* ============================================================== */}
        {currentView === "dashboard" && (
          <div style={{ flex: 1, backgroundColor: "#09090b", padding: "2rem 1.5rem" }}>
            <div style={{ maxWidth: "980px", margin: "0 auto" }}>
              
              {/* Hero Banner: Streak & Rank */}
              <div
                style={{
                  backgroundColor: "#121215",
                  border: "1px solid #27272a",
                  borderRadius: "12px",
                  padding: "1.75rem 2rem",
                  marginBottom: "1.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1.5rem",
                  background: "linear-gradient(135deg, rgba(24, 24, 27, 0.8) 0%, rgba(9, 9, 11, 0.95) 100%)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "1.6rem" }}>🔥</span>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#fafafa", margin: 0 }}>
                      Chuỗi học tập {userTracker.streak} ngày liên tiếp!
                    </h1>
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "#a1a1aa", margin: "0 0 1rem 0" }}>
                    Duy trì thói quen học mỗi ngày để mở khóa huy hiệu và làm chủ toàn bộ 12 chuyên đề ngữ pháp.
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        color: "#fafafa",
                        fontSize: "0.78rem",
                        padding: "0.25rem 0.65rem",
                        borderRadius: "6px",
                        fontWeight: "600",
                      }}
                    >
                      {userRank.badge} • Cấp {userRank.level} ({userRank.title})
                    </span>

                    <span style={{ fontSize: "0.78rem", color: "#71717a" }}>
                      Mục tiêu cấp tiếp theo: <strong style={{ color: "#60a5fa" }}>{userTracker.xp} / {userRank.nextXp} XP</strong>
                    </span>
                  </div>
                </div>

                {/* 7-Day Mini Calendar */}
                <div
                  style={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    padding: "1rem 1.25rem",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", color: "#71717a", textTransform: "uppercase", marginBottom: "0.75rem", textAlign: "center" }}>
                    LỊCH HOẠT ĐỘNG 7 NGÀY
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    {last7Days.map((d, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <span style={{ fontSize: "0.68rem", color: d.isToday ? "#fafafa" : "#71717a", fontWeight: d.isToday ? "700" : "500" }}>
                          {d.dayName}
                        </span>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: d.isActive ? "#f59e0b" : "#27272a",
                            color: d.isActive ? "#09090b" : "#71717a",
                            fontSize: "0.85rem",
                            fontWeight: "700",
                            border: d.isToday ? "2px solid #38bdf8" : "none",
                          }}
                        >
                          {d.isActive ? "🔥" : d.dayNum}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SMART DAILY RECOMMENDATION CARD */}
              <div
                style={{
                  backgroundColor: "#121215",
                  border: "1px solid #3b82f6",
                  borderRadius: "12px",
                  padding: "1.5rem 1.75rem",
                  marginBottom: "1.75rem",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontFamily: "Geist Mono",
                          backgroundColor: `${dailyRecommendation.tagColor}20`,
                          color: dailyRecommendation.tagColor,
                          border: `1px solid ${dailyRecommendation.tagColor}50`,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                          fontWeight: "700",
                        }}
                      >
                        {dailyRecommendation.tag}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#71717a" }}>Đề xuất học hôm nay</span>
                    </div>

                    <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "#fafafa", margin: "0.35rem 0" }}>
                      Chương {dailyRecommendation.chapter.number}: {dailyRecommendation.lesson ? dailyRecommendation.lesson.title_vi : dailyRecommendation.chapter.title_vi}
                    </h2>

                    <p style={{ fontSize: "0.875rem", color: "#a1a1aa", margin: "0.2rem 0 0.85rem 0" }}>
                      {dailyRecommendation.reason}
                    </p>
                  </div>

                  <button
                    onClick={startRecommendedLesson}
                    style={{
                      padding: "0.65rem 1.5rem",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(37, 99, 235, 0.35)",
                    }}
                  >
                    Bắt đầu học ngay hôm nay →
                  </button>
                </div>

                {/* Daily Goal Progress Bar */}
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #1f1f23" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                    <span style={{ color: "#a1a1aa" }}>
                      🎯 Mục tiêu hàng ngày: <strong>{userTracker.dailyGoal?.solvedToday || 0}</strong> / {userTracker.dailyGoal?.targetQuestions || 10} câu bài tập
                    </span>
                    <span style={{ color: "#34d399", fontFamily: "Geist Mono", fontWeight: "600" }}>
                      {Math.min(100, Math.round(((userTracker.dailyGoal?.solvedToday || 0) / (userTracker.dailyGoal?.targetQuestions || 10)) * 100))}%
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "#27272a", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.round(((userTracker.dailyGoal?.solvedToday || 0) / (userTracker.dailyGoal?.targetQuestions || 10)) * 100))}%`,
                        height: "100%",
                        backgroundColor: "#10b981",
                        borderRadius: "999px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 4 Analytics Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ backgroundColor: "#121215", border: "1px solid #27272a", borderRadius: "8px", padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#71717a", textTransform: "uppercase", fontWeight: "600" }}>
                    Bài học đã hoàn thành
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "#fafafa", margin: "0.4rem 0" }}>
                    {userTracker.completedLessons?.length || 0} <span style={{ fontSize: "0.95rem", color: "#71717a" }}>/ {totalLessonsCount}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#34d399" }}>
                    {overallLessonsProgress}% toàn bộ khóa học
                  </div>
                </div>

                <div style={{ backgroundColor: "#121215", border: "1px solid #27272a", borderRadius: "8px", padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#71717a", textTransform: "uppercase", fontWeight: "600" }}>
                    Câu hỏi đã giải đúng
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "#fafafa", margin: "0.4rem 0" }}>
                    {userTracker.completedQuestions?.length || 0} <span style={{ fontSize: "0.95rem", color: "#71717a" }}>/ {totalQuestionsCount}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#60a5fa" }}>
                    Tích lũy từ bài tập & Quiz
                  </div>
                </div>

                <div style={{ backgroundColor: "#121215", border: "1px solid #27272a", borderRadius: "8px", padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#71717a", textTransform: "uppercase", fontWeight: "600" }}>
                    Tổng điểm kinh nghiệm
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "#fafafa", margin: "0.4rem 0" }}>
                    {userTracker.xp} <span style={{ fontSize: "0.95rem", color: "#71717a" }}>XP</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#f59e0b" }}>
                    {userRank.title}
                  </div>
                </div>

                <div style={{ backgroundColor: "#121215", border: "1px solid #27272a", borderRadius: "8px", padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#71717a", textTransform: "uppercase", fontWeight: "600" }}>
                    Sổ tay câu sai cần ôn
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "700", color: savedMistakes.length > 0 ? "#fb7185" : "#fafafa", margin: "0.4rem 0" }}>
                    {savedMistakes.length} <span style={{ fontSize: "0.95rem", color: "#71717a" }}>câu</span>
                  </div>
                  <div
                    onClick={() => setCurrentView("mistakes")}
                    style={{ fontSize: "0.8rem", color: "#fb7185", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Xem và luyện lại ngay →
                  </div>
                </div>
              </div>

              {/* 12 Chapters Mastery Map */}
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#fafafa", margin: 0 }}>
                      Bản đồ tiến độ 12 Chuyên đề Ngữ pháp
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "#71717a", margin: "0.2rem 0 0 0" }}>
                      Theo dõi tỷ lệ hoàn thành lý thuyết và bài tập từng chương theo chuẩn sách Mai Lan Hương.
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                  {previewData.chapters.map((ch) => {
                    const doneLessons = ch.lessons.filter((l) => userTracker.completedLessons?.includes(l.id)).length;
                    const pct = Math.round((doneLessons / ch.lessons.length) * 100);

                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          handleSelectChapter(ch);
                          setCurrentView("study");
                        }}
                        style={{
                          backgroundColor: "#121215",
                          border: "1px solid #27272a",
                          borderRadius: "8px",
                          padding: "1.1rem 1.25rem",
                          cursor: "pointer",
                          transition: "border-color 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", color: "#60a5fa", fontWeight: "700" }}>
                            CHƯƠNG {String(ch.number).padStart(2, "0")}
                          </span>
                          <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: pct === 100 ? "#34d399" : "#a1a1aa" }}>
                            {doneLessons} / {ch.lessons.length} bài
                          </span>
                        </div>

                        <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "#fafafa", marginBottom: "0.6rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ch.title_vi}
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: "100%", height: "4px", backgroundColor: "#27272a", borderRadius: "999px", overflow: "hidden", marginBottom: "0.5rem" }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              backgroundColor: pct === 100 ? "#10b981" : "#3b82f6",
                              borderRadius: "999px",
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#71717a" }}>
                          <span>{ch.exercises?.length || 0} bài tập</span>
                          <span style={{ color: pct > 0 ? "#fafafa" : "#71717a" }}>{pct}% hoàn thành</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: STUDY MODE (12 CHAPTERS & LESSONS EXPLORER)             */}
        {/* ============================================================== */}
        {currentView === "study" && (
          <div style={{ display: "flex", flex: 1, minHeight: "calc(100vh - 56px)" }}>
            
            {/* Left Sidebar — Chapters & Lessons Tree */}
            <aside
              style={{
                width: "320px",
                borderRight: "1px solid #27272a",
                backgroundColor: "#0c0c0e",
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
              }}
            >
              {/* Search Filter Header */}
              <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid #1f1f23" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backgroundColor: "#141417",
                    border: "1px solid #27272a",
                    borderRadius: "6px",
                    padding: "0.4rem 0.65rem",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                  </svg>
                  <input
                    type="text"
                    value={chapterSearch}
                    onChange={(e) => setChapterSearch(e.target.value)}
                    placeholder="Lọc 12 chuyên đề..."
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#fafafa",
                      fontSize: "0.8rem",
                      width: "100%",
                    }}
                  />
                  {chapterSearch && (
                    <button
                      onClick={() => setChapterSearch("")}
                      style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Chapters Tree List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0.6rem 0.5rem" }}>
                <div
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: "600",
                    color: "#71717a",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "0.4rem 0.65rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  DANH MỤC 12 CHUYÊN ĐỀ ({filteredChapters.length})
                </div>

                {filteredChapters.map((ch) => {
                  const isSelected = ch.id === selectedChapter?.id;
                  const chapterNum = String(ch.number || "").padStart(2, "0");

                  return (
                    <div key={ch.id} style={{ marginBottom: "0.25rem" }}>
                      <div
                        onClick={() => handleSelectChapter(ch)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "0.5rem 0.65rem",
                          borderRadius: "6px",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#18181b" : "transparent",
                          border: isSelected ? "1px solid #27272a" : "1px solid transparent",
                          transition: "all 0.12s ease",
                          gap: "0.65rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontFamily: "Geist Mono",
                            color: isSelected ? "#60a5fa" : "#71717a",
                            fontWeight: "700",
                            minWidth: "22px",
                            flexShrink: 0,
                          }}
                        >
                          {chapterNum}
                        </span>

                        <span
                          style={{
                            fontSize: "0.835rem",
                            color: isSelected ? "#fafafa" : "#d4d4d8",
                            fontWeight: isSelected ? "600" : "400",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            flex: 1,
                          }}
                        >
                          {ch.title_vi}
                        </span>

                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontFamily: "Geist Mono",
                            color: "#71717a",
                            flexShrink: 0,
                          }}
                        >
                          {ch.lessons?.length || 0} bài
                        </span>
                      </div>

                      {/* Expanded Sub-lessons if chapter is selected */}
                      {isSelected && ch.lessons && ch.lessons.length > 0 && (
                        <div style={{ marginLeft: "1.75rem", paddingLeft: "0.6rem", borderLeft: "1px solid #27272a", marginTop: "0.2rem", marginBottom: "0.4rem" }}>
                          {ch.lessons.map((ls, idx) => {
                            const isLessonActive = selectedLesson?.id === ls.id;
                            const isLessonCompleted = userTracker.completedLessons?.includes(ls.id);

                            return (
                              <div
                                key={ls.id}
                                onClick={() => {
                                  setSelectedLessonId(ls.id);
                                  setActiveTab("theory");
                                }}
                                style={{
                                  padding: "0.35rem 0.5rem",
                                  borderRadius: "4px",
                                  fontSize: "0.78rem",
                                  color: isLessonActive ? "#38bdf8" : isLessonCompleted ? "#34d399" : "#a1a1aa",
                                  backgroundColor: isLessonActive ? "#0f172a" : "transparent",
                                  cursor: "pointer",
                                  fontWeight: isLessonActive ? "600" : "400",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                  {isLessonCompleted && <span style={{ color: "#10b981", fontSize: "0.7rem" }}>✓</span>}
                                  {ls.title_vi}
                                </span>
                                <span style={{ fontSize: "0.68rem", color: "#52525b", fontFamily: "Geist Mono" }}>
                                  {ls.sections?.length || 0} mục
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, overflowY: "auto", padding: "2rem 2.5rem", maxWidth: "980px" }}>
              
              {/* Breadcrumbs & Header */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8rem", color: "#71717a", marginBottom: "0.5rem" }}>
                  <span>Chương {selectedChapter?.number}</span>
                  <span>/</span>
                  <span style={{ color: "#a1a1aa" }}>{selectedChapter?.title_vi}</span>
                  {selectedLesson && (
                    <>
                      <span>/</span>
                      <span style={{ color: "#fafafa", fontWeight: "500" }}>{selectedLesson.title_vi}</span>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: "700", letterSpacing: "-0.02em", color: "#fafafa" }}>
                      {activeTab === "theory" ? (selectedLesson ? selectedLesson.title_vi : selectedChapter?.title_vi) : `Bài tập thực hành: ${selectedChapter?.title_vi}`}
                    </h1>
                    <div style={{ fontSize: "0.875rem", color: "#71717a", marginTop: "0.2rem" }}>
                      {activeTab === "theory" ? (selectedLesson ? selectedLesson.title_en : selectedChapter?.title_en) : `${selectedChapter?.exercises?.length || 0} bài tập tổng hợp (${totalChapterExerciseQuestions} câu)`}
                    </div>
                  </div>

                  {/* Tab Switcher: Theory vs Exercises */}
                  <div style={{ display: "flex", backgroundColor: "#18181b", padding: "3px", borderRadius: "6px", border: "1px solid #27272a" }}>
                    <button
                      onClick={() => setActiveTab("theory")}
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: "4px",
                        border: "none",
                        fontSize: "0.8rem",
                        fontWeight: activeTab === "theory" ? "600" : "500",
                        color: activeTab === "theory" ? "#fafafa" : "#71717a",
                        backgroundColor: activeTab === "theory" ? "#27272a" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      Lý thuyết & Quy tắc ({selectedLesson?.sections?.length || 0} mục)
                    </button>
                    <button
                      onClick={() => setActiveTab("exercises")}
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: "4px",
                        border: "none",
                        fontSize: "0.8rem",
                        fontWeight: activeTab === "exercises" ? "600" : "500",
                        color: activeTab === "exercises" ? "#fafafa" : "#71717a",
                        backgroundColor: activeTab === "exercises" ? "#27272a" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      Bài tập thực hành ({selectedChapter?.exercises?.length || 0})
                    </button>
                  </div>
                </div>
              </div>

              {/* TAB 1: THEORY CONTENT (DEEP-DIVE PEDAGOGICAL VIEW) */}
              {activeTab === "theory" && (
                <div>
                  {selectedLesson ? (
                    <div>
                      {/* Lesson Overview & Mark Completion Bar */}
                      <div
                        style={{
                          backgroundColor: "#121215",
                          border: isCurrentLessonDone ? "1px solid #10b981" : "1px solid #27272a",
                          borderRadius: "8px",
                          padding: "1.25rem 1.5rem",
                          marginBottom: "1.5rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontFamily: "Geist Mono",
                                backgroundColor: "#27272a",
                                color: "#60a5fa",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "4px",
                                fontWeight: "700",
                              }}
                            >
                              {selectedLesson.code}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>•</span>
                            <span style={{ fontSize: "0.75rem", color: "#d4d4d8" }}>
                              {selectedLesson.sections?.length || 0} Phân mục
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>•</span>
                            <span style={{ fontSize: "0.75rem", color: "#d4d4d8" }}>
                              {totalLessonFormulas} Công thức
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>•</span>
                            <span style={{ fontSize: "0.75rem", color: "#d4d4d8" }}>
                              {selectedLesson.examples?.length || 0} Ví dụ
                            </span>
                          </div>

                          {/* Duolingo Mark as Completed Button */}
                          <button
                            onClick={() => toggleLessonCompletion(selectedLesson.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              padding: "0.4rem 0.9rem",
                              borderRadius: "6px",
                              border: isCurrentLessonDone ? "1px solid #10b981" : "1px solid #3f3f46",
                              backgroundColor: isCurrentLessonDone ? "rgba(16, 185, 129, 0.15)" : "#18181b",
                              color: isCurrentLessonDone ? "#34d399" : "#fafafa",
                              fontSize: "0.8rem",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            <span>{isCurrentLessonDone ? "✓ Đã học xong (+25 XP)" : "Đánh dấu đã học xong (+25 XP)"}</span>
                          </button>
                        </div>

                        <p style={{ fontSize: "0.9rem", color: "#d4d4d8", lineHeight: "1.65", margin: 0 }}>
                          {selectedLesson.overview}
                        </p>

                        {/* Quick Table of Contents Pills */}
                        {selectedLesson.sections && selectedLesson.sections.length > 1 && (
                          <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #1f1f23" }}>
                            <div style={{ fontSize: "0.7rem", fontFamily: "Geist Mono", color: "#71717a", textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>
                              NỘI DUNG CHÍNH TRONG BÀI:
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                              {selectedLesson.sections.map((s, idx) => (
                                <a
                                  key={idx}
                                  href={`#sec-${idx}`}
                                  style={{
                                    fontSize: "0.75rem",
                                    backgroundColor: "#18181b",
                                    border: "1px solid #27272a",
                                    color: "#cbd5e1",
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "4px",
                                    textDecoration: "none",
                                  }}
                                >
                                  {s.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sections List */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        {selectedLesson.sections?.map((sec, secIdx) => (
                          <section
                            key={secIdx}
                            id={`sec-${secIdx}`}
                            style={{
                              backgroundColor: "#121215",
                              border: "1px solid #27272a",
                              borderRadius: "8px",
                              padding: "1.5rem",
                            }}
                          >
                            {/* Section Header */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontFamily: "Geist Mono",
                                  backgroundColor: "#18181b",
                                  border: "1px solid #27272a",
                                  color: "#a1a1aa",
                                  padding: "0.1rem 0.4rem",
                                  borderRadius: "4px",
                                  fontWeight: "600",
                                }}
                              >
                                {String(secIdx + 1).padStart(2, "0")}
                              </span>
                              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fafafa", margin: 0 }}>
                                {sec.title}
                              </h2>
                            </div>

                            {/* Formulas Box */}
                            {sec.formulas && sec.formulas.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                                {sec.formulas.map((f, fIdx) => (
                                  <div
                                    key={fIdx}
                                    style={{
                                      backgroundColor: "#09090b",
                                      border: "1px solid #27272a",
                                      borderLeft: f.type?.includes("(+)")
                                        ? "3px solid #10b981"
                                        : f.type?.includes("(-)")
                                        ? "3px solid #f43f5e"
                                        : "3px solid #38bdf8",
                                      borderRadius: "6px",
                                      padding: "0.7rem 1rem",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      flexWrap: "wrap",
                                      gap: "0.5rem",
                                    }}
                                  >
                                    <div style={{ fontFamily: "Geist Mono", fontSize: "0.9rem", color: "#34d399", fontWeight: "600" }}>
                                      {f.text}
                                    </div>
                                    <span
                                      style={{
                                        fontSize: "0.7rem",
                                        fontFamily: "Geist Mono",
                                        backgroundColor: "#18181b",
                                        color: "#a1a1aa",
                                        padding: "0.15rem 0.45rem",
                                        borderRadius: "4px",
                                        border: "1px solid #27272a",
                                      }}
                                    >
                                      {f.type}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Paragraphs */}
                            {sec.paragraphs && sec.paragraphs.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
                                {sec.paragraphs.map((p, pIdx) => (
                                  <p key={pIdx} style={{ fontSize: "0.9rem", color: "#d4d4d8", lineHeight: "1.7", margin: 0 }}>
                                    {p}
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Tables */}
                            {sec.tables && sec.tables.length > 0 && (
                              <div style={{ overflowX: "auto", margin: "1rem 0" }}>
                                {sec.tables.map((tbl, tIdx) => (
                                  <table key={tIdx}>
                                    {tbl.headers && tbl.headers.some((h) => h) && (
                                      <thead>
                                        <tr>
                                          {tbl.headers.map((h, hIdx) => (
                                            <th key={hIdx}>{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                    )}
                                    <tbody>
                                      {tbl.rows?.map((row, rIdx) => (
                                        <tr key={rIdx}>
                                          {row.map((cell, cIdx) => (
                                            <td key={cIdx}>{cell}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ))}
                              </div>
                            )}

                            {/* Bullets List */}
                            {sec.bullets && sec.bullets.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", margin: "0.85rem 0" }}>
                                {sec.bullets.map((b, bIdx) => (
                                  <div
                                    key={bIdx}
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: "0.6rem",
                                      backgroundColor: "#18181b",
                                      padding: "0.65rem 0.85rem",
                                      borderRadius: "6px",
                                      border: "1px solid #27272a",
                                    }}
                                  >
                                    <span style={{ color: "#38bdf8", fontSize: "0.9rem", lineHeight: "1.4" }}>•</span>
                                    <div style={{ fontSize: "0.875rem", color: "#e4e4e7", lineHeight: "1.6" }}>
                                      {b}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Notes Alert Box */}
                            {sec.notes && sec.notes.length > 0 && (
                              <div style={{ margin: "1rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {sec.notes.map((n, nIdx) => (
                                  <div
                                    key={nIdx}
                                    style={{
                                      backgroundColor: "rgba(245, 158, 11, 0.08)",
                                      borderLeft: "3px solid #f59e0b",
                                      borderRadius: "4px",
                                      padding: "0.75rem 1rem",
                                      fontSize: "0.85rem",
                                      color: "#fcd34d",
                                      lineHeight: "1.6",
                                    }}
                                  >
                                    <strong style={{ color: "#fbbf24", marginRight: "0.4rem" }}>⚠️ Lưu ý:</strong>
                                    {n}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Section Examples */}
                            {sec.examples && sec.examples.length > 0 && (
                              <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #27272a" }}>
                                <div style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "#71717a", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                                  Ví dụ minh họa:
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                                  {sec.examples.map((ex, exIdx) => (
                                    <div
                                      key={exIdx}
                                      style={{
                                        backgroundColor: "#09090b",
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "4px",
                                        border: "1px solid #27272a",
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      <span style={{ color: "#34d399", fontWeight: "600", marginRight: "0.5rem" }}>Ex:</span>
                                      <span style={{ color: "#fafafa" }}>{ex.en}</span>
                                      {ex.vi && <div style={{ color: "#a1a1aa", fontSize: "0.8rem", marginTop: "0.2rem" }}>→ {ex.vi}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </section>
                        ))}
                      </div>

                      {/* Full Lesson Examples Library */}
                      {selectedLesson.examples && selectedLesson.examples.length > 0 && (
                        <div
                          style={{
                            backgroundColor: "#121215",
                            border: "1px solid #27272a",
                            borderRadius: "8px",
                            padding: "1.5rem",
                            marginTop: "2rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <div>
                              <div style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "#71717a", textTransform: "uppercase" }}>
                                TỔNG HỢP VÍ DỤ SONG NGỮ
                              </div>
                              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fafafa", margin: "0.2rem 0 0 0" }}>
                                Kho câu ví dụ minh họa ({selectedLesson.examples.length} câu)
                              </h3>
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            {selectedLesson.examples.map((ex, exIdx) => (
                              <div
                                key={exIdx}
                                style={{
                                  backgroundColor: "#18181b",
                                  padding: "0.75rem 1rem",
                                  borderRadius: "6px",
                                  border: "1px solid #27272a",
                                }}
                              >
                                <div style={{ fontSize: "0.9rem", color: "#fafafa", fontWeight: "500" }}>
                                  • {ex.en}
                                </div>
                                {ex.vi && (
                                  <div style={{ fontSize: "0.825rem", color: "#a1a1aa", marginTop: "0.25rem", paddingLeft: "0.85rem" }}>
                                    → {ex.vi}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bottom Completion & Practice Bar */}
                      <div
                        style={{
                          marginTop: "2rem",
                          padding: "1.75rem",
                          backgroundColor: "#121215",
                          border: isCurrentLessonDone ? "1px solid #10b981" : "1px dashed #3b82f6",
                          borderRadius: "8px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fafafa", marginBottom: "0.4rem" }}>
                          {isCurrentLessonDone ? "🎉 Bạn đã hoàn thành lý thuyết bài học này!" : "Bạn đã nắm vững lý thuyết bài học này?"}
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "#71717a", marginBottom: "1.25rem" }}>
                          Chuyên đề "{selectedChapter?.title_vi}" có {selectedChapter?.exercises?.length || 0} bài tập thực hành ({totalChapterExerciseQuestions} câu hỏi) để bạn củng cố kiến thức.
                        </p>

                        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                          <button
                            onClick={() => toggleLessonCompletion(selectedLesson.id)}
                            style={{
                              padding: "0.6rem 1.25rem",
                              backgroundColor: isCurrentLessonDone ? "#10b981" : "#18181b",
                              border: isCurrentLessonDone ? "none" : "1px solid #3f3f46",
                              borderRadius: "6px",
                              color: isCurrentLessonDone ? "#042f1a" : "#fafafa",
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              cursor: "pointer",
                            }}
                          >
                            {isCurrentLessonDone ? "✓ Đã đánh dấu hoàn thành" : "✓ Đánh dấu đã học xong (+25 XP)"}
                          </button>

                          <button
                            onClick={() => setActiveTab("exercises")}
                            style={{
                              padding: "0.6rem 1.5rem",
                              backgroundColor: "#2563eb",
                              border: "none",
                              borderRadius: "6px",
                              color: "#ffffff",
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              cursor: "pointer",
                            }}
                          >
                            Làm bài tập thực hành ngay →
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "3rem",
                        textAlign: "center",
                        backgroundColor: "#121215",
                        border: "1px dashed #27272a",
                        borderRadius: "8px",
                        color: "#71717a",
                      }}
                    >
                      Chọn một bài học từ danh mục bên trái để bắt đầu nghiên cứu lý thuyết.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EXERCISES PRACTICE */}
              {activeTab === "exercises" && (
                <div>
                  {selectedChapter?.exercises && selectedChapter.exercises.length > 0 ? (
                    selectedChapter.exercises.map((ex, eIdx) => (
                      <div
                        key={ex.id || eIdx}
                        style={{
                          backgroundColor: "#121215",
                          border: "1px solid #27272a",
                          borderRadius: "8px",
                          padding: "1.5rem",
                          marginBottom: "2rem",
                        }}
                      >
                        {/* Exercise Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontFamily: "Geist Mono",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "4px",
                                  backgroundColor: "#27272a",
                                  color: "#fafafa",
                                  fontWeight: "700",
                                }}
                              >
                                EXERCISE {ex.roman || (eIdx + 1)}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "#71717a" }}>
                                {ex.questions?.length || 0} câu hỏi
                              </span>
                            </div>
                            <div style={{ fontSize: "1rem", fontWeight: "600", color: "#fafafa" }}>
                              {ex.instruction_vi || ex.title}
                            </div>
                            {ex.instruction_vi && ex.title && (
                              <div style={{ fontSize: "0.825rem", color: "#71717a", marginTop: "0.2rem" }}>
                                {ex.title}
                              </div>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => checkAllQuestions(ex)}
                              style={{
                                padding: "0.4rem 0.75rem",
                                borderRadius: "4px",
                                backgroundColor: "#27272a",
                                border: "1px solid #3f3f46",
                                color: "#fafafa",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              Chấm điểm tất cả
                            </button>
                            <button
                              onClick={() => resetExercise(ex)}
                              style={{
                                padding: "0.4rem 0.65rem",
                                borderRadius: "4px",
                                backgroundColor: "transparent",
                                border: "1px solid #27272a",
                                color: "#a1a1aa",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Làm lại
                            </button>
                          </div>
                        </div>

                        {/* Questions List */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1.25rem" }}>
                          {ex.questions?.map((q, qIdx) => {
                            const res = results[q.id];
                            const isAnswerOpen = showAnswers[q.id];
                            const inputVal = userInputs[q.id] || "";
                            const typeInfo = getQuestionTypeInfo(ex.type);

                            return (
                              <div
                                key={q.id || qIdx}
                                style={{
                                  backgroundColor: "#18181b",
                                  border: res?.checked
                                    ? res.isCorrect
                                      ? "1px solid #10b981"
                                      : "1px solid #f43f5e"
                                    : "1px solid #27272a",
                                  borderRadius: "6px",
                                  padding: "1.1rem",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                                  <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "#71717a", fontWeight: "600" }}>
                                    CÂU {q.num || (qIdx + 1)}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.68rem",
                                      fontFamily: "Geist Mono",
                                      padding: "0.1rem 0.4rem",
                                      borderRadius: "3px",
                                      backgroundColor: "#09090b",
                                      color: "#a1a1aa",
                                      border: "1px solid #27272a",
                                    }}
                                  >
                                    {typeInfo.tag}
                                  </span>
                                </div>

                                {/* Stem */}
                                <div style={{ fontSize: "0.95rem", color: "#fafafa", lineHeight: "1.6", marginBottom: "0.75rem" }}>
                                  {q.stem}
                                </div>

                                {/* Starter Prompt for Rewriting */}
                                {q.starter_prompt && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.5rem",
                                      backgroundColor: "#1c1917",
                                      border: "1px solid #44403c",
                                      padding: "0.45rem 0.75rem",
                                      borderRadius: "4px",
                                      fontSize: "0.825rem",
                                      color: "#f59e0b",
                                      marginBottom: "0.75rem",
                                    }}
                                  >
                                    <span style={{ color: "#a8a29e", fontSize: "0.75rem", fontWeight: "600" }}>GỢI Ý MỞ ĐẦU:</span>
                                    <span style={{ fontWeight: "600" }}>"{q.starter_prompt}..."</span>
                                  </div>
                                )}

                                {/* Input Row */}
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                                  <input
                                    type="text"
                                    value={inputVal}
                                    placeholder={q.starter_prompt ? `Tiếp tục câu: "${q.starter_prompt}..."` : "Nhập câu trả lời..."}
                                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") checkSingleQuestion(q, ex.instruction_vi || ex.title);
                                    }}
                                    style={{
                                      flex: 1,
                                      minWidth: "220px",
                                      padding: "0.5rem 0.75rem",
                                      backgroundColor: "#09090b",
                                      border: res?.checked
                                        ? res.isCorrect
                                          ? "1px solid #10b981"
                                          : "1px solid #f43f5e"
                                        : "1px solid #27272a",
                                      borderRadius: "5px",
                                      color: "#fafafa",
                                      fontSize: "0.875rem",
                                      outline: "none",
                                    }}
                                  />

                                  <button
                                    onClick={() => checkSingleQuestion(q, ex.instruction_vi || ex.title)}
                                    style={{
                                      padding: "0.5rem 0.9rem",
                                      backgroundColor: "#27272a",
                                      border: "1px solid #3f3f46",
                                      borderRadius: "5px",
                                      color: "#fafafa",
                                      fontSize: "0.8rem",
                                      fontWeight: "600",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Kiểm tra
                                  </button>

                                  <button
                                    onClick={() => toggleShowAnswer(q.id)}
                                    style={{
                                      padding: "0.5rem 0.75rem",
                                      backgroundColor: "transparent",
                                      border: "1px solid #27272a",
                                      borderRadius: "5px",
                                      color: "#71717a",
                                      fontSize: "0.8rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {isAnswerOpen ? "Ẩn đáp án" : "Đáp án"}
                                  </button>
                                </div>

                                {/* Instant Result Message */}
                                {res?.checked && (
                                  <div
                                    style={{
                                      marginTop: "0.6rem",
                                      fontSize: "0.825rem",
                                      fontWeight: "500",
                                      color: res.isCorrect ? "#34d399" : "#fb7185",
                                    }}
                                  >
                                    {res.feedback}
                                  </div>
                                )}

                                {/* Correct Answer Box */}
                                {isAnswerOpen && (
                                  <div
                                    style={{
                                      marginTop: "0.75rem",
                                      padding: "0.65rem 0.85rem",
                                      backgroundColor: "#09090b",
                                      border: "1px solid #27272a",
                                      borderRadius: "5px",
                                    }}
                                  >
                                    <div style={{ fontSize: "0.72rem", color: "#71717a", fontWeight: "600", textTransform: "uppercase" }}>
                                      Đáp án chính xác:
                                    </div>
                                    <div style={{ fontSize: "0.9rem", color: "#60a5fa", fontWeight: "600", marginTop: "0.2rem" }}>
                                      {q.answers.map((a) => a.correct).join("  /  ")}
                                    </div>
                                    {q.explanation && (
                                      <div style={{ fontSize: "0.8rem", color: "#a1a1aa", marginTop: "0.35rem" }}>
                                        {q.explanation}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "3rem", textAlign: "center", backgroundColor: "#121215", border: "1px dashed #27272a", borderRadius: "8px", color: "#71717a" }}>
                      Chuyên đề này chưa có bài tập thực hành.
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: QUIZ ENGINE (50 RANDOM QUESTIONS BY TOPIC)             */}
        {/* ============================================================== */}
        {currentView === "quiz" && (
          <div style={{ flex: 1, backgroundColor: "#09090b", padding: "2rem 1.5rem" }}>
            <div style={{ maxWidth: "860px", margin: "0 auto" }}>
              
              {/* Quiz Control Card */}
              <div
                style={{
                  backgroundColor: "#121215",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  marginBottom: "1.75rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h1 style={{ fontSize: "1.35rem", fontWeight: "700", color: "#fafafa", letterSpacing: "-0.015em" }}>
                      Bộ đề Quiz 50 câu ngẫu nhiên
                    </h1>
                    <p style={{ fontSize: "0.85rem", color: "#71717a", marginTop: "0.35rem", lineHeight: "1.5" }}>
                      Hệ thống tự động rút trích 50 câu hỏi từ ngân hàng 2,900+ bài tập. Các câu trả lời sai sẽ được ghi nhận vào Sổ tay để ôn luyện.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => startNewQuiz(selectedQuizTopic)}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#27272a",
                        border: "1px solid #3f3f46",
                        borderRadius: "6px",
                        color: "#fafafa",
                        fontSize: "0.825rem",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Trộn đề mới (50 câu)
                    </button>

                    {!quizSubmitted && activeQuizQuestions.length > 0 && (
                      <button
                        onClick={submitQuiz}
                        style={{
                          padding: "0.5rem 1.25rem",
                          backgroundColor: "#10b981",
                          border: "none",
                          borderRadius: "6px",
                          color: "#042f1a",
                          fontSize: "0.825rem",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        Nộp bài chấm điểm
                      </button>
                    )}
                  </div>
                </div>

                {/* Topic Selector & Progress Bar */}
                <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid #1f1f23", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <label style={{ fontSize: "0.8rem", color: "#71717a", fontWeight: "500" }}>Chủ đề kiểm tra:</label>
                    <select
                      value={selectedQuizTopic}
                      onChange={(e) => {
                        setSelectedQuizTopic(e.target.value);
                        startNewQuiz(e.target.value);
                      }}
                      style={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                        padding: "0.45rem 0.75rem",
                        color: "#fafafa",
                        fontSize: "0.825rem",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="ALL">Toàn bộ 12 Chương (Tổng hợp)</option>
                      {quizData.topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          Chương {t.number}: {t.title_vi} ({t.question_count} câu)
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeQuizQuestions.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.8rem", fontFamily: "Geist Mono", color: "#a1a1aa" }}>
                        Đã làm: <strong style={{ color: "#fafafa" }}>{answeredCount}</strong> / {activeQuizQuestions.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Score Banner when Submitted */}
              {quizSubmitted && quizResults && (
                <div
                  style={{
                    backgroundColor: "#121215",
                    border: quizResults.percentage >= 80 ? "1px solid #10b981" : "1px solid #f43f5e",
                    borderRadius: "8px",
                    padding: "1.75rem",
                    marginBottom: "1.75rem",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", fontFamily: "Geist Mono", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    KẾT QUẢ ĐÁNH GIÁ
                  </div>
                  <div
                    style={{
                      fontSize: "2.25rem",
                      fontWeight: "700",
                      color: quizResults.percentage >= 80 ? "#34d399" : "#fb7185",
                      margin: "0.4rem 0",
                    }}
                  >
                    {quizResults.score} / {quizResults.total}
                    <span style={{ fontSize: "1.1rem", color: "#71717a", marginLeft: "0.5rem" }}>
                      ({quizResults.percentage}%)
                    </span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#a1a1aa" }}>
                    {quizResults.percentage >= 80
                      ? "Kết quả rất tốt! Bạn đã nắm chắc kiến thức chuyên đề này."
                      : "Các câu làm sai đã được tự động lưu vào Sổ tay để bạn có thể xem lại và làm lại bất cứ lúc nào."}
                  </p>
                </div>
              )}

              {/* Questions List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {activeQuizQuestions.map((q, idx) => {
                  const userAns = quizAnswers[q.id] || "";
                  const detail = quizResults?.details?.find((d) => d.question.id === q.id);
                  const singleCheck = quizSingleChecks[q.id];
                  const isAnswerShown = quizShowAnswers[q.id];
                  const typeInfo = getQuestionTypeInfo(q.type);

                  return (
                    <div
                      key={q.id || idx}
                      style={{
                        backgroundColor: "#121215",
                        border: quizSubmitted
                          ? detail?.isCorrect
                            ? "1px solid #10b981"
                            : "1px solid #f43f5e"
                          : singleCheck?.checked
                          ? singleCheck.isCorrect
                            ? "1px solid #10b981"
                            : "1px solid #f43f5e"
                          : "1px solid #27272a",
                        borderRadius: "8px",
                        padding: "1.25rem 1.5rem",
                      }}
                    >
                      {/* Question meta header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "#a1a1aa", fontWeight: "600" }}>
                            CÂU {idx + 1} / {activeQuizQuestions.length}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#52525b" }}>•</span>
                          <span style={{ fontSize: "0.75rem", color: "#71717a" }}>{q.topic_name}</span>
                        </div>

                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontFamily: "Geist Mono",
                            padding: "0.1rem 0.4rem",
                            borderRadius: "3px",
                            backgroundColor: "#18181b",
                            color: "#a1a1aa",
                            border: "1px solid #27272a",
                          }}
                        >
                          {typeInfo.tag}
                        </span>
                      </div>

                      {/* Explicit Instruction Box */}
                      {q.instruction && (
                        <div
                          style={{
                            backgroundColor: "#0d1b2a",
                            borderLeft: "3px solid #38bdf8",
                            padding: "0.5rem 0.85rem",
                            borderRadius: "4px",
                            marginBottom: "0.85rem",
                            fontSize: "0.825rem",
                            color: "#bae6fd",
                            lineHeight: "1.5",
                          }}
                        >
                          <strong style={{ color: "#7dd3fc" }}>Yêu cầu:</strong> {q.instruction}
                        </div>
                      )}

                      {/* Stem */}
                      <div style={{ fontSize: "0.975rem", color: "#fafafa", lineHeight: "1.6", marginBottom: "0.75rem" }}>
                        {q.stem}
                      </div>

                      {/* Starter Prompt Box */}
                      {q.starter_prompt && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            backgroundColor: "#1c1917",
                            border: "1px solid #44403c",
                            padding: "0.45rem 0.75rem",
                            borderRadius: "4px",
                            fontSize: "0.825rem",
                            color: "#f59e0b",
                            marginBottom: "0.85rem",
                          }}
                        >
                          <span style={{ color: "#a8a29e", fontSize: "0.72rem", fontWeight: "600" }}>BẮT ĐẦU VỚI:</span>
                          <span style={{ fontWeight: "600" }}>"{q.starter_prompt}..."</span>
                        </div>
                      )}

                      {/* Input & Action Buttons */}
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.85rem" }}>
                        <input
                          type="text"
                          disabled={quizSubmitted}
                          value={userAns}
                          placeholder={q.starter_prompt ? `Viết tiếp từ "${q.starter_prompt}..."` : "Nhập câu trả lời..."}
                          onChange={(e) => handleQuizAnswerChange(q.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !quizSubmitted) checkSingleQuizQuestion(q);
                          }}
                          style={{
                            flex: 1,
                            minWidth: "240px",
                            padding: "0.55rem 0.85rem",
                            borderRadius: "6px",
                            border: singleCheck?.checked
                              ? singleCheck.isCorrect
                                ? "1px solid #10b981"
                                : "1px solid #f43f5e"
                              : "1px solid #27272a",
                            fontSize: "0.875rem",
                            backgroundColor: "#09090b",
                            color: "#fafafa",
                            outline: "none",
                          }}
                        />

                        {!quizSubmitted && (
                          <>
                            <button
                              onClick={() => checkSingleQuizQuestion(q)}
                              style={{
                                backgroundColor: "#27272a",
                                color: "#fafafa",
                                border: "1px solid #3f3f46",
                                padding: "0.55rem 1rem",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              Kiểm tra
                            </button>
                            <button
                              onClick={() => toggleQuizShowAnswer(q.id)}
                              style={{
                                backgroundColor: "transparent",
                                color: "#71717a",
                                border: "1px solid #27272a",
                                padding: "0.55rem 0.85rem",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                              }}
                            >
                              {isAnswerShown ? "Ẩn đáp án" : "Xem đáp án"}
                            </button>
                          </>
                        )}
                      </div>

                      {/* Instant Single Check Feedback */}
                      {!quizSubmitted && singleCheck?.checked && (
                        <div
                          style={{
                            marginTop: "0.55rem",
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            color: singleCheck.isCorrect ? "#34d399" : "#fb7185",
                          }}
                        >
                          {singleCheck.feedback}
                        </div>
                      )}

                      {/* Answer Reveal Box */}
                      {(!quizSubmitted && isAnswerShown) && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            padding: "0.7rem 0.85rem",
                            backgroundColor: "#09090b",
                            border: "1px solid #27272a",
                            borderRadius: "5px",
                          }}
                        >
                          <div style={{ fontSize: "0.72rem", color: "#71717a", fontWeight: "600", textTransform: "uppercase" }}>
                            Đáp án chính xác:
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "#60a5fa", fontWeight: "600", marginTop: "0.2rem" }}>
                            {q.answers.join("  /  ")}
                          </div>
                        </div>
                      )}

                      {/* Post-submission Review Box */}
                      {quizSubmitted && detail && (
                        <div
                          style={{
                            marginTop: "0.85rem",
                            padding: "0.75rem 0.95rem",
                            backgroundColor: detail.isCorrect ? "rgba(16, 185, 129, 0.05)" : "rgba(244, 63, 94, 0.05)",
                            borderRadius: "5px",
                            border: `1px solid ${detail.isCorrect ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)"}`,
                          }}
                        >
                          <div style={{ fontSize: "0.8rem", color: detail.isCorrect ? "#34d399" : "#fb7185", fontWeight: "600" }}>
                            {detail.isCorrect ? "✓ Chính xác" : "✕ Chưa đúng"}
                          </div>
                          <div style={{ fontSize: "0.825rem", color: "#d4d4d8", marginTop: "0.25rem" }}>
                            Đáp án chuẩn: <strong style={{ color: "#fafafa" }}>{q.answers.join(" / ")}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Submit Action */}
              {!quizSubmitted && activeQuizQuestions.length > 0 && (
                <div style={{ marginTop: "2rem", textAlign: "center" }}>
                  <button
                    onClick={submitQuiz}
                    style={{
                      padding: "0.75rem 2.5rem",
                      backgroundColor: "#10b981",
                      color: "#042f1a",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.95rem",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Hoàn tất & Nộp bài chấm điểm
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: MISTAKES NOTEBOOK (SỔ TAY CÂU SAI ĐỂ ÔN LẠI)            */}
        {/* ============================================================== */}
        {currentView === "mistakes" && (
          <div style={{ flex: 1, backgroundColor: "#09090b", padding: "2rem 1.5rem" }}>
            <div style={{ maxWidth: "860px", margin: "0 auto" }}>
              
              {/* Notebook Header Card */}
              <div
                style={{
                  backgroundColor: "#121215",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  marginBottom: "1.75rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h1 style={{ fontSize: "1.35rem", fontWeight: "700", color: "#fafafa", letterSpacing: "-0.015em" }}>
                      Sổ tay câu hỏi cần ôn lại
                    </h1>
                    <p style={{ fontSize: "0.85rem", color: "#71717a", marginTop: "0.35rem" }}>
                      Lưu trữ tự động các câu bạn đã làm chưa đúng trong phần bài tập và bài thi Quiz. Bạn có thể làm lại tại đây cho đến khi thành thạo.
                    </p>
                  </div>

                  {savedMistakes.length > 0 && (
                    <button
                      onClick={clearAllMistakes}
                      style={{
                        padding: "0.45rem 0.85rem",
                        backgroundColor: "transparent",
                        border: "1px solid #ef4444",
                        color: "#ef4444",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      Xóa toàn bộ sổ tay
                    </button>
                  )}
                </div>

                {/* Filter Topic bar */}
                {savedMistakes.length > 0 && (
                  <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #1f1f23", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "#71717a" }}>Lọc theo chủ đề:</span>
                    <select
                      value={mistakeFilterTopic}
                      onChange={(e) => setMistakeFilterTopic(e.target.value)}
                      style={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                        padding: "0.35rem 0.65rem",
                        color: "#fafafa",
                        fontSize: "0.8rem",
                        outline: "none",
                      }}
                    >
                      <option value="ALL">Tất cả ({savedMistakes.length} câu)</option>
                      {mistakeTopics.map((topic, i) => (
                        <option key={i} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Empty state */}
              {savedMistakes.length === 0 ? (
                <div
                  style={{
                    padding: "4rem 2rem",
                    textAlign: "center",
                    backgroundColor: "#121215",
                    border: "1px dashed #27272a",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "#fafafa", marginBottom: "0.5rem" }}>
                    Chưa có câu sai nào được lưu
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#71717a", maxWidth: "420px", margin: "0 auto 1.25rem auto" }}>
                    Khi bạn làm bài tập ở mục "12 Chuyên đề" hoặc làm bài kiểm tra ở "Quiz Engine", những câu chưa đúng sẽ tự động xuất hiện tại đây để bạn ôn luyện lại.
                  </p>
                  <button
                    onClick={() => {
                      setCurrentView("quiz");
                      if (activeQuizQuestions.length === 0) startNewQuiz("ALL");
                    }}
                    style={{
                      padding: "0.55rem 1.25rem",
                      backgroundColor: "#27272a",
                      border: "1px solid #3f3f46",
                      borderRadius: "6px",
                      color: "#fafafa",
                      fontSize: "0.825rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Bắt đầu làm Quiz ngay
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {filteredMistakes.map((item, idx) => {
                    const inputVal = mistakeInputs[item.id] || "";
                    const res = mistakeResults[item.id];
                    const isShown = showMistakeAnswers[item.id];

                    return (
                      <div
                        key={item.id || idx}
                        style={{
                          backgroundColor: "#121215",
                          border: res?.checked
                            ? res.isCorrect
                              ? "1px solid #10b981"
                              : "1px solid #f43f5e"
                            : "1px solid #27272a",
                          borderRadius: "8px",
                          padding: "1.25rem 1.5rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "#a1a1aa", fontWeight: "600" }}>
                            CÂU {idx + 1} • {item.topic_name}
                          </span>
                          <button
                            onClick={() => removeMistakeRecord(item.id)}
                            style={{
                              backgroundColor: "transparent",
                              border: "none",
                              color: "#71717a",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            Đánh dấu đã hiểu (Xóa)
                          </button>
                        </div>

                        {item.instruction && (
                          <div
                            style={{
                              backgroundColor: "#0d1b2a",
                              borderLeft: "3px solid #38bdf8",
                              padding: "0.45rem 0.75rem",
                              borderRadius: "4px",
                              marginBottom: "0.75rem",
                              fontSize: "0.8rem",
                              color: "#bae6fd",
                            }}
                          >
                            <strong>Yêu cầu:</strong> {item.instruction}
                          </div>
                        )}

                        <div style={{ fontSize: "0.95rem", color: "#fafafa", lineHeight: "1.6", marginBottom: "0.75rem" }}>
                          {item.stem}
                        </div>

                        {item.starter_prompt && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              backgroundColor: "#1c1917",
                              border: "1px solid #44403c",
                              padding: "0.45rem 0.75rem",
                              borderRadius: "4px",
                              fontSize: "0.825rem",
                              color: "#f59e0b",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <span style={{ color: "#a8a29e", fontSize: "0.72rem", fontWeight: "600" }}>BẮT ĐẦU VỚI:</span>
                            <span style={{ fontWeight: "600" }}>"{item.starter_prompt}..."</span>
                          </div>
                        )}

                        {/* Input Row */}
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            type="text"
                            value={inputVal}
                            placeholder={item.starter_prompt ? `Tiếp tục: "${item.starter_prompt}..."` : "Làm lại câu này..."}
                            onChange={(e) => setMistakeInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") checkSingleMistake(item);
                            }}
                            style={{
                              flex: 1,
                              minWidth: "220px",
                              padding: "0.55rem 0.85rem",
                              borderRadius: "6px",
                              border: res?.checked
                                ? res.isCorrect
                                  ? "1px solid #10b981"
                                  : "1px solid #f43f5e"
                                : "1px solid #27272a",
                              fontSize: "0.875rem",
                              backgroundColor: "#09090b",
                              color: "#fafafa",
                              outline: "none",
                            }}
                          />

                          <button
                            onClick={() => checkSingleMistake(item)}
                            style={{
                              backgroundColor: "#27272a",
                              color: "#fafafa",
                              border: "1px solid #3f3f46",
                              padding: "0.55rem 1rem",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            Kiểm tra lại
                          </button>

                          <button
                            onClick={() => setShowMistakeAnswers((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                            style={{
                              backgroundColor: "transparent",
                              color: "#71717a",
                              border: "1px solid #27272a",
                              padding: "0.55rem 0.85rem",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            {isShown ? "Ẩn đáp án" : "Xem đáp án"}
                          </button>
                        </div>

                        {res?.checked && (
                          <div
                            style={{
                              marginTop: "0.55rem",
                              fontSize: "0.8rem",
                              fontWeight: "500",
                              color: res.isCorrect ? "#34d399" : "#fb7185",
                            }}
                          >
                            {res.feedback}
                          </div>
                        )}

                        {isShown && (
                          <div
                            style={{
                              marginTop: "0.75rem",
                              padding: "0.65rem 0.85rem",
                              backgroundColor: "#09090b",
                              border: "1px solid #27272a",
                              borderRadius: "5px",
                            }}
                          >
                            <div style={{ fontSize: "0.72rem", color: "#71717a", fontWeight: "600", textTransform: "uppercase" }}>
                              Đáp án chuẩn:
                            </div>
                            <div style={{ fontSize: "0.875rem", color: "#60a5fa", fontWeight: "600", marginTop: "0.2rem" }}>
                              {item.answers.join("  /  ")}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
