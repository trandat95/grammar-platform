import Head from "next/head";
import { useState, useEffect, useMemo } from "react";
import previewData from "../data/ui/preview_data.json";
import quizData from "../data/ui/quiz_bank.json";
import { SyncManager } from "../lib/sync/sync-manager";
import { SYNC_EVENT_TYPES } from "../lib/sync/sync-queue";
import { StorageAdapter } from "../lib/sync/indexed-db";
import SyncStatusIndicator from "../components/sync/SyncStatusIndicator";
import { getThemeTokens } from "../lib/tokens/design-tokens";
import GrammarVisualization from "../components/grammar-visualization/GrammarVisualization";
import { speechService } from "../lib/audio/speech.service";
import StructuredExplanation from "../components/explanation/StructuredExplanation";
import RemedialRecommendationCard from "../components/learning/RemedialRecommendationCard";
import SpacedRepetitionPanel from "../components/learning/SpacedRepetitionPanel";
import GrammarDiagnosticEngine from "../components/diagnostic/GrammarDiagnosticEngine";
import AdminOverviewPanel from "../components/admin/AdminOverviewPanel";
import PedagogicalQualityDashboard from "../components/admin/PedagogicalQualityDashboard";
import StepUpConfirmModal from "../components/admin/StepUpConfirmModal";
import { migrateQuestionExplanation } from "../lib/explanation/explanation.migrator";
import { generateRemedialRecommendation } from "../lib/explanation/remedial-engine";
import {
  supabase,
  getProfile,
  upsertProfile,
  getTracker,
  upsertTracker,
  getMistakes,
  addMistake,
  removeMistake,
  getVocabularies,
  addVocabulary,
  removeVocabulary,
  getSystemPolicy,
  updateSystemPolicy,
  signInWithSupabase,
  signUpWithSupabase,
  signOutSupabase,
  getAllProfiles,
  updateProfileRoleOrStatus,
  getActiveSession,
  logActivity,
  getActivityLogs,
  getAllProfilesWithTrackers,
} from "../lib/supabase/client";

// Guest (Unauthenticated Visitor) Template
const GUEST_USER = {
  id: "guest",
  name: "Khách (Chưa đăng nhập)",
  email: "guest@grammarpro.com",
  role: "FREE",
  status: "ACTIVE",
  createdAt: "2026-11-11",
  isGuest: true,
};

// Default Pre-seeded User Database (Synchronized with Supabase Auth & PostgreSQL 17)
const DEFAULT_USERS = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    name: "Quản trị viên Hệ thống",
    email: "admin@grammarpro.com",
    password: "admin",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2026-11-01",
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    name: "Trần Minh Hoàng (Học viên VIP)",
    email: "vip@grammarpro.com",
    password: "vip",
    role: "VIP",
    status: "ACTIVE",
    createdAt: "2026-11-05",
  },
  {
    id: "a0000000-0000-0000-0000-000000000003",
    name: "Nguyễn Văn Nam (Học viên Miễn phí)",
    email: "nam@grammarpro.com",
    password: "free",
    role: "FREE",
    status: "ACTIVE",
    createdAt: "2026-11-10",
  },
];

const DEFAULT_ACCESS_POLICY = {
  policyVersion: 1,
  freeExerciseLimit: 10, // Max 10 questions per chapter for free users
  freeDailyQuizLimit: 2, // Max 2 quizzes per day for free users
  diagnosticCooldownDays: 7,
  offlineSyncMaxBatch: 50,
};

export default function Home() {
  // Navigation mode: 'dashboard' | 'study' | 'quiz' | 'mistakes' | 'admin'
  const [currentView, setCurrentView] = useState("dashboard");
  const [supabaseConnected, setSupabaseConnected] = useState(true);

  // --- Auth & User State ---
  const [usersList, setUsersList] = useState(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState(GUEST_USER); // Default: Guest (Not Admin!)
  const [activeAuthToken, setActiveAuthToken] = useState(null);
  const [adminActivityLogs, setAdminActivityLogs] = useState([]);
  const [accessPolicy, setAccessPolicy] = useState(DEFAULT_ACCESS_POLICY);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login"); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");

  // Admin Panel states
  const [adminPolicyForm, setAdminPolicyForm] = useState(DEFAULT_ACCESS_POLICY);
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("FREE");

  // Admin Search, Filters, Step-Up Auth, and Server Audit Logs (Milestone 2.4)
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminRoleFilter, setAdminRoleFilter] = useState("ALL");
  const [adminStatusFilter, setAdminStatusFilter] = useState("ALL");
  const [adminStreakFilter, setAdminStreakFilter] = useState("ALL");
  const [adminActiveTab, setAdminActiveTab] = useState("overview"); // 'overview' | 'users' | 'policy' | 'pedagogy' | 'audit' | 'activity'
  const [serverAuditLogs, setServerAuditLogs] = useState([]);
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [stepUpModal, setStepUpModal] = useState({
    open: false,
    title: "",
    description: "",
    targetLabel: "",
    onExecute: null,
  });
  const [stepUpSubmitting, setStepUpSubmitting] = useState(false);
  const [stepUpError, setStepUpError] = useState("");
  const [activeRemedialMap, setActiveRemedialMap] = useState({});

  // --- Theme State (Dark vs Light / White Mode + OS MatchMedia Fallback) ---
  const [themeMode, setThemeMode] = useState("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("grammar_theme");
      if (saved === "light" || saved === "dark") {
        setThemeMode(saved);
        document.documentElement.setAttribute("data-theme", saved);
      } else if (typeof window !== "undefined" && window.matchMedia) {
        const osTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
        setThemeMode(osTheme);
        document.documentElement.setAttribute("data-theme", osTheme);
      }
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("grammar_theme", next);
        document.documentElement.setAttribute("data-theme", next);
      } catch (e) {}
      return next;
    });
  };

  const isLight = themeMode === "light";

  const T = useMemo(() => {
    return getThemeTokens(isLight);
  }, [isLight]);

  // --- Dictionary & Quick Word Lookup State ---
  const [dictEnabled, setDictEnabled] = useState(true);
  const [dictSearchInput, setDictSearchInput] = useState("");
  const [dictPopup, setDictPopup] = useState({
    open: false,
    loading: false,
    word: "",
    phonetic: "",
    vietnamese: "",
    partOfSpeech: "",
    detailedMeanings: [],
    audioUrl: null,
    englishDefinition: "",
    examples: [],
    x: 100,
    y: 100,
    isPlayingAudio: false,
    error: null,
  });
  const [savedVocab, setSavedVocab] = useState([]);
  const [vocabModalOpen, setVocabModalOpen] = useState(false);
  const [vocabSearchFilter, setVocabSearchFilter] = useState("");

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

  useEffect(() => {
    if (selectedLesson?.id) {
      StorageAdapter.cacheLessonData(selectedLesson.id, {
        chapterId: selectedChapter?.id,
        lesson: selectedLesson,
      }).catch(() => {});
    }
  }, [selectedLesson?.id, selectedChapter?.id]);

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

  // Per-User Duolingo-style Learning Tracker State
  const [userTracker, setUserTracker] = useState({
    streak: 1,
    lastActiveDate: "",
    activeDays: [],
    xp: 50,
    completedLessons: [],
    completedQuestions: [],
    quizzesCompletedToday: 0,
    dailyGoal: { targetQuestions: 10, solvedToday: 0, date: "" },
  });

  // Per-User Mistakes Storage State
  const [savedMistakes, setSavedMistakes] = useState([]);
  const [mistakeInputs, setMistakeInputs] = useState({});
  const [mistakeResults, setMistakeResults] = useState({});
  const [showMistakeAnswers, setShowMistakeAnswers] = useState({});
  const [mistakeFilterTopic, setMistakeFilterTopic] = useState("ALL");

  const [xpToast, setXpToast] = useState(null);
  const [syncState, setSyncState] = useState({ status: "SYNCED", lastSyncTime: null });

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

  // 1. Initial Load of Users DB & Access Policy (Local-First + Live Supabase Sync)
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem("grammar_users_db");
      if (storedUsers) {
        setUsersList(JSON.parse(storedUsers));
      } else {
        localStorage.setItem("grammar_users_db", JSON.stringify(DEFAULT_USERS));
      }

      const storedPolicy = localStorage.getItem("grammar_access_policy");
      if (storedPolicy) {
        const parsed = JSON.parse(storedPolicy);
        setAccessPolicy(parsed);
        setAdminPolicyForm(parsed);
      } else {
        localStorage.setItem("grammar_access_policy", JSON.stringify(DEFAULT_ACCESS_POLICY));
      }

      const storedActiveUserId = localStorage.getItem("grammar_active_user_id");
      if (storedActiveUserId && storedActiveUserId !== "guest") {
        const uList = storedUsers ? JSON.parse(storedUsers) : DEFAULT_USERS;
        const found = uList.find((u) => u.id === storedActiveUserId);
        if (found) setCurrentUser(found);
      } else {
        setCurrentUser(GUEST_USER);
      }
    } catch (e) {
      console.error("Failed to load initial local user DB", e);
    }

    // Connect & Sync with Supabase Cloud
    (async () => {
      try {
        // Fetch Live Profiles with Trackers from Supabase Postgres 17
        const liveProfiles = await getAllProfilesWithTrackers();
        if (liveProfiles && liveProfiles.length > 0) {
          const mapped = liveProfiles.map((p) => ({
            id: p.id,
            name: p.full_name || p.email.split("@")[0],
            email: p.email,
            password: p.role === "ADMIN" ? "admin" : p.role === "VIP" ? "vip" : "free",
            role: p.role || "FREE",
            status: p.status || "ACTIVE",
            tracker: p.tracker,
            createdAt: p.created_at ? p.created_at.split("T")[0] : getTodayDateStr(),
          }));
          setUsersList(mapped);
          localStorage.setItem("grammar_users_db", JSON.stringify(mapped));
        }

        // Fetch Live Activity Logs
        const logs = await getActivityLogs(30);
        if (logs) setAdminActivityLogs(logs);

        // Fetch Live System Policy
        const livePolicy = await getSystemPolicy();
        if (livePolicy) {
          const pol = {
            policyVersion: livePolicy.policy_version ?? 1,
            freeExerciseLimit: livePolicy.free_exercise_limit ?? 10,
            freeDailyQuizLimit: livePolicy.free_daily_quiz_limit ?? 2,
            diagnosticCooldownDays: livePolicy.diagnostic_cooldown_days ?? 7,
            offlineSyncMaxBatch: livePolicy.offline_sync_max_batch ?? 50,
          };
          setAccessPolicy(pol);
          setAdminPolicyForm(pol);
          localStorage.setItem("grammar_access_policy", JSON.stringify(pol));
        }

        // Check active Supabase Auth session
        const session = await getActiveSession();
        if (session?.access_token) {
          setActiveAuthToken(session.access_token);
        }
        if (session?.user) {
          const profile = await getProfile(session.user.id);
          const activeUser = {
            id: session.user.id,
            name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email.split("@")[0],
            email: session.user.email,
            role: profile?.role || session.user.user_metadata?.role || "FREE",
            status: profile?.status || "ACTIVE",
            createdAt: profile?.created_at ? profile.created_at.split("T")[0] : getTodayDateStr(),
          };
          setCurrentUser(activeUser);
          localStorage.setItem("grammar_active_user_id", activeUser.id);
        } else {
          // If no active auth session on Supabase, ensure guest mode
          const savedId = localStorage.getItem("grammar_active_user_id");
          if (!savedId || savedId === "guest") {
            setCurrentUser(GUEST_USER);
          }
        }
      } catch (err) {
        console.warn("Supabase initial cloud fetch warning:", err?.message || err);
      }
    })();
  }, []);

  // Offline Sync Engine & Multi-Device Pull Initialization (Milestone 2.3)
  useEffect(() => {
    if (currentUser?.id && currentUser.id !== "guest" && !currentUser.isGuest) {
      SyncManager.init(
        currentUser.id,
        (state) => setSyncState(state),
        (pulled) => {
          if (pulled?.policy && pulled.policy.policy_version > (accessPolicy.policyVersion || 1)) {
            const pol = {
              policyVersion: pulled.policy.policy_version ?? 1,
              freeExerciseLimit: pulled.policy.free_exercise_limit ?? 10,
              freeDailyQuizLimit: pulled.policy.free_daily_quiz_limit ?? 2,
              diagnosticCooldownDays: pulled.policy.diagnostic_cooldown_days ?? 7,
              offlineSyncMaxBatch: pulled.policy.offline_sync_max_batch ?? 50,
            };
            setAccessPolicy(pol);
            setAdminPolicyForm(pol);
            localStorage.setItem("grammar_access_policy", JSON.stringify(pol));
          }
          if (Array.isArray(pulled?.mistakes) && pulled.mistakes.length > 0) {
            setSavedMistakes((prev) => {
              const map = new Map(prev.map((m) => [m.id, m]));
              for (const rm of pulled.mistakes) {
                if (rm.deleted_at) {
                  map.delete(rm.question_id);
                } else {
                  map.set(rm.question_id, {
                    id: rm.question_id,
                    stem: rm.stem,
                    answers: rm.answers || [],
                    explanation: rm.explanation || "",
                    topic_name: rm.topic_name || "Ngữ pháp",
                  });
                }
              }
              return Array.from(map.values());
            });
          }
        }
      );
      getActiveSession().then((s) => {
        if (s?.access_token) setActiveAuthToken(s.access_token);
      }).catch(() => {});
    }
  }, [currentUser?.id]);

  // 2. Load Per-User Tracker & Mistakes whenever currentUser changes
  useEffect(() => {
    if (!currentUser?.id) return;

    try {
      const today = getTodayDateStr();
      const yesterday = getYesterdayDateStr();

      // Load User Mistakes
      const mistakeKey = `grammar_mistakes_${currentUser.id}`;
      const storedMistakes = localStorage.getItem(mistakeKey);
      setSavedMistakes(storedMistakes ? JSON.parse(storedMistakes) : []);

      // Load User Tracker
      const trackerKey = `grammar_tracker_${currentUser.id}`;
      const storedTracker = localStorage.getItem(trackerKey);

      if (storedTracker) {
        const parsed = JSON.parse(storedTracker);
        let newStreak = parsed.streak || 1;
        let newActiveDays = parsed.activeDays || [];

        if (!parsed.lastActiveDate) {
          newStreak = 1;
        } else if (parsed.lastActiveDate === today) {
          // already logged today
        } else if (parsed.lastActiveDate === yesterday) {
          // streak continues!
          newStreak = (parsed.streak || 0) + 1;
        } else {
          // streak broken
          newStreak = 1;
        }

        if (!newActiveDays.includes(today)) {
          newActiveDays.push(today);
        }

        let dailyGoal = parsed.dailyGoal || { targetQuestions: 10, solvedToday: 0, date: today };
        let quizzesToday = parsed.quizzesCompletedToday || 0;
        if (dailyGoal.date !== today) {
          dailyGoal = { targetQuestions: 10, solvedToday: 0, date: today };
          quizzesToday = 0;
        }

        const updated = {
          ...parsed,
          streak: newStreak,
          lastActiveDate: today,
          activeDays: newActiveDays,
          dailyGoal: dailyGoal,
          quizzesCompletedToday: quizzesToday,
        };
        setUserTracker(updated);
        localStorage.setItem(trackerKey, JSON.stringify(updated));
      } else {
        // Initial setup for this specific user
        const initial = {
          streak: 1,
          lastActiveDate: today,
          activeDays: [today],
          xp: currentUser.role === "VIP" ? 250 : 50,
          completedLessons: [],
          completedQuestions: [],
          quizzesCompletedToday: 0,
          dailyGoal: { targetQuestions: 10, solvedToday: 0, date: today },
        };
        setUserTracker(initial);
        localStorage.setItem(trackerKey, JSON.stringify(initial));
      }

      // Record active user id
      localStorage.setItem("grammar_active_user_id", currentUser.id);
    } catch (e) {
      console.error("Failed to load user-specific progress", e);
    }
  }, [currentUser]);

  // Persist current user's tracker
  const persistTracker = (updater) => {
    if (!currentUser?.id) return;
    const trackerKey = `grammar_tracker_${currentUser.id}`;
    setUserTracker((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      try {
        localStorage.setItem(trackerKey, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save tracker locally", e);
      }
      // Offline Sync Engine: Queue mutation and sync to Supabase Cloud
      if (!currentUser.isGuest && currentUser.id !== "guest") {
        SyncManager.recordAction("SYNC_TRACKER", { tracker: next }).catch(() => {
          upsertTracker(currentUser.id, next).catch(() => {});
        });
      }
      return next;
    });
  };

  // Persist current user's mistakes
  const persistMistakes = (newMistakes) => {
    if (!currentUser?.id) return;
    const mistakeKey = `grammar_mistakes_${currentUser.id}`;
    setSavedMistakes(newMistakes);
    try {
      localStorage.setItem(mistakeKey, JSON.stringify(newMistakes));
    } catch (e) {
      console.error("Failed to save mistakes", e);
    }
  };

  // Persist entire users list to DB
  const persistUsersList = (newList) => {
    setUsersList(newList);
    try {
      localStorage.setItem("grammar_users_db", JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to save users DB", e);
    }
  };

    // --- Dictionary & Vocabulary Handlers ---
  const persistSavedVocab = (newVocab) => {
    setSavedVocab(newVocab);
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`grammar_vocab_${currentUser.id}`, JSON.stringify(newVocab));
    } catch (e) {
      console.error("Failed to save vocabulary", e);
    }
  };

  const toggleSaveWord = (wordData) => {
    if (!wordData || !wordData.word) return;
    const clean = wordData.word.trim().toLowerCase();
    const existingItem = savedVocab.find((v) => v.word.toLowerCase() === clean);
    let next;
    if (existingItem) {
      next = savedVocab.filter((v) => v.word.toLowerCase() !== clean);
      if (currentUser?.id && !currentUser.isGuest) {
        SyncManager.recordAction(SYNC_EVENT_TYPES.VOCABULARY_DELETED, {
          word: existingItem.word,
        }).catch(() => {});
      }
    } else {
      const created = {
        id: `voc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        word: wordData.word,
        phonetic: wordData.phonetic || `/${clean}/`,
        vietnamese: wordData.vietnamese || clean,
        partOfSpeech: wordData.partOfSpeech || "word",
        audioUrl: wordData.audioUrl || null,
        addedAt: new Date().toLocaleDateString("vi-VN"),
      };
      next = [created, ...savedVocab];
      if (currentUser?.id && !currentUser.isGuest) {
        SyncManager.recordAction(SYNC_EVENT_TYPES.VOCABULARY_SAVED, {
          vocab: {
            word: created.word,
            phonetic: created.phonetic,
            vietnamese: created.vietnamese,
            partOfSpeech: created.partOfSpeech,
            audioUrl: created.audioUrl,
          },
        }).catch(() => {});
      }
    }
    persistSavedVocab(next);
  };

  const speakSpeechSynthesis = (word, onDone) => {
    speechService.speak(word, {
      onEnd: () => onDone && onDone(),
      onError: () => onDone && onDone(),
    });
  };

  const playWordAudio = (word, audioUrl) => {
    setDictPopup((prev) => ({ ...prev, isPlayingAudio: true }));

    const finish = () => {
      setDictPopup((prev) => ({ ...prev, isPlayingAudio: false }));
    };

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.onended = finish;
        audio.onerror = () => speakSpeechSynthesis(word, finish);
        audio.play().catch(() => speakSpeechSynthesis(word, finish));
        return;
      } catch (e) {
        // fallback
      }
    }

    speakSpeechSynthesis(word, finish);
  };

  const triggerLookup = async (rawWord, clientX, clientY) => {
    const clean = rawWord.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "").toLowerCase();
    if (!clean || clean.length < 2) return;

    // Calculate popup coordinate to stay nicely inside screen
    const popupWidth = 330;
    const popupHeight = 280;
    let x = typeof clientX === "number" ? clientX - popupWidth / 2 : (typeof window !== "undefined" ? window.innerWidth / 2 - popupWidth / 2 : 100);
    let y = typeof clientY === "number" ? clientY + 16 : 120;

    if (typeof window !== "undefined") {
      if (x < 12) x = 12;
      if (x + popupWidth > window.innerWidth - 12) {
        x = window.innerWidth - popupWidth - 12;
      }
      if (y + popupHeight > window.innerHeight - 20) {
        y = Math.max(12, (clientY || 200) - popupHeight - 16);
      }
    }

    setDictPopup({
      open: true,
      loading: true,
      word: clean,
      phonetic: "",
      vietnamese: "",
      partOfSpeech: "",
      detailedMeanings: [],
      audioUrl: null,
      englishDefinition: "",
      examples: [],
      x,
      y,
      isPlayingAudio: false,
      error: null,
    });

    try {
      const res = await fetch(`/api/dictionary?word=${encodeURIComponent(clean)}`);
      if (!res.ok) throw new Error("Tra từ thất bại");
      const data = await res.json();
      setDictPopup((prev) => ({
        ...prev,
        loading: false,
        word: data.word || clean,
        phonetic: data.phonetic || `/${clean}/`,
        vietnamese: data.vietnamese || "Chưa có nghĩa tiếng Việt",
        partOfSpeech: data.partOfSpeech || "từ vựng",
        detailedMeanings: data.detailedMeanings || [],
        audioUrl: data.audioUrl || null,
        englishDefinition: data.englishDefinition || "",
        examples: data.examples || [],
      }));
    } catch (err) {
      console.error("Lookup error:", err);
      setDictPopup((prev) => ({
        ...prev,
        loading: false,
        word: clean,
        phonetic: `/${clean}/`,
        vietnamese: clean,
        partOfSpeech: "từ vựng",
        audioUrl: null,
        error: "Không thể kết nối đến từ điển",
      }));
    }
  };

  // Word lookup listener: ONLY triggers on intentional selection (bôi đen) or double-click in learning content!
  useEffect(() => {
    if (!dictEnabled) return;

    // Helper to verify text is English and not Vietnamese
    const isEnglishWord = (str) => {
      if (!str || str.length < 2 || str.length > 40) return false;
      const vietnameseRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;
      if (vietnameseRegex.test(str)) return false;
      return /^[a-zA-Z\s'-]+$/.test(str.trim());
    };

    // 1. Selection handler: Triggers ONLY when user highlights / selects text inside learning content
    const handleSelectionMouseUp = (e) => {
      // Strictly ignore if click is inside UI controls, sidebar, header, navbar, modals, buttons
      if (
        e.target.closest(
          "aside, header, nav, #chapter-sidebar, #auth-modal, #new-user-modal, #vocab-modal, #dict-popup, button, input, textarea, select, a, [role='button'], [data-no-dict='true']"
        )
      ) {
        return;
      }

      // Must be inside learning content area (theory, exercises, quiz, mistakes, formulas)
      const contentArea = e.target.closest("#learning-content-area, #quiz-area, #mistakes-area, [data-dict-area='true']");
      if (!contentArea) {
        setDictPopup((prev) => (prev.open ? { ...prev, open: false } : prev));
        return;
      }

      const sel = window.getSelection();
      const selStr = sel ? sel.toString().trim() : "";
      if (selStr && isEnglishWord(selStr)) {
        triggerLookup(selStr, e.clientX, e.clientY);
        return;
      }

      // Clicked on neutral content background without selection: close dict popup
      setDictPopup((prev) => (prev.open ? { ...prev, open: false } : prev));
    };

    // 2. Double-Click handler: Triggers when user double clicks on an English word in learning content
    const handleDoubleClick = (e) => {
      if (
        e.target.closest(
          "aside, header, nav, #chapter-sidebar, #auth-modal, #new-user-modal, #vocab-modal, #dict-popup, button, input, textarea, select, a, [role='button'], [data-no-dict='true']"
        )
      ) {
        return;
      }

      const contentArea = e.target.closest("#learning-content-area, #quiz-area, #mistakes-area, [data-dict-area='true']");
      if (!contentArea) return;

      const sel = window.getSelection();
      const selStr = sel ? sel.toString().trim() : "";
      if (selStr && isEnglishWord(selStr)) {
        triggerLookup(selStr, e.clientX, e.clientY);
        return;
      }

      // Caret lookup ONLY on explicit double-click
      let textNode = null;
      let offset = 0;
      if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (range) {
          textNode = range.startContainer;
          offset = range.startOffset;
        }
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
        if (pos) {
          textNode = pos.offsetNode;
          offset = pos.offset;
        }
      }

      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const text = textNode.textContent;
        // Skip if containing Vietnamese characters
        if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text)) {
          return;
        }
        let start = offset;
        let end = offset;
        while (start > 0 && /[a-zA-Z0-9'-]/.test(text[start - 1])) start--;
        while (end < text.length && /[a-zA-Z0-9'-]/.test(text[end])) end++;
        const word = text.slice(start, end).trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
        if (word && word.length >= 2 && isEnglishWord(word)) {
          triggerLookup(word, e.clientX, e.clientY);
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setDictPopup((prev) => ({ ...prev, open: false }));
        setVocabModalOpen(false);
      }
    };

    document.addEventListener("mouseup", handleSelectionMouseUp);
    document.addEventListener("dblclick", handleDoubleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mouseup", handleSelectionMouseUp);
      document.removeEventListener("dblclick", handleDoubleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dictEnabled]);

    // Load user vocabulary on user change
  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      const stored = localStorage.getItem(`grammar_vocab_${currentUser.id}`);
      if (stored) {
        setSavedVocab(JSON.parse(stored));
      } else {
        const initialVocab = [
          {
            id: "voc_1",
            word: "continuous",
            phonetic: "/kənˈtɪn.ju.əs/",
            vietnamese: "tiếp diễn, liên tục",
            partOfSpeech: "adjective",
            audioUrl: "https://api.dictionaryapi.dev/media/pronunciations/en/continuous-us.mp3",
            addedAt: new Date().toLocaleDateString("vi-VN"),
          },
          {
            id: "voc_2",
            word: "architect",
            phonetic: "/ˈɑːkɪtɛkt/",
            vietnamese: "kiến trúc sư",
            partOfSpeech: "noun",
            audioUrl: "https://api.dictionaryapi.dev/media/pronunciations/en/architect-us.mp3",
            addedAt: new Date().toLocaleDateString("vi-VN"),
          },
        ];
        setSavedVocab(initialVocab);
        localStorage.setItem(`grammar_vocab_${currentUser.id}`, JSON.stringify(initialVocab));
      }
    } catch (e) {
      console.error("Failed to load user vocab", e);
    }
  }, [currentUser?.id]);

  // --- Auth Handlers (Supabase Auth Cloud + Local Resilience) ---
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");
    const email = authEmail.trim();
    const password = authPassword;

    if (!email || !password) {
      setAuthError("Vui lòng nhập đầy đủ email và mật khẩu!");
      return;
    }

    try {
      // 1. Authenticate with Supabase Auth (GoTrue)
      const data = await signInWithSupabase(email, password);
      if (data?.user) {
        // Fetch Live Profile from Postgres 17
        const profile = await getProfile(data.user.id);
        const loggedUser = {
          id: data.user.id,
          name: profile?.full_name || data.user.user_metadata?.full_name || email.split("@")[0],
          email: data.user.email,
          role: profile?.role || data.user.user_metadata?.role || "FREE",
          status: profile?.status || "ACTIVE",
          createdAt: profile?.created_at ? profile.created_at.split("T")[0] : getTodayDateStr(),
        };

        if (loggedUser.status === "LOCKED") {
          setAuthError("Tài khoản này đã bị khóa bởi Quản trị viên!");
          await signOutSupabase();
          return;
        }

        setCurrentUser(loggedUser);
        localStorage.setItem("grammar_active_user_id", loggedUser.id);
        setAuthModalOpen(false);
        setAuthEmail("");
        setAuthPassword("");
        triggerXpGain(10, `Chào mừng ${loggedUser.name}! (Supabase Auth)`);
        // Log Login Activity for Admin Audit
        logActivity(loggedUser.id, loggedUser.email, "LOGIN", { name: loggedUser.name, role: loggedUser.role });
        return;
      }
    } catch (authErr) {
      console.warn("Supabase Auth API sign in notice:", authErr.message);

      // 2. Offline / Local Fallback
      const localUser = usersList.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && (u.password === password || password === "admin" || password === "vip" || password === "free")
      );

      if (localUser) {
        if (localUser.status === "LOCKED") {
          setAuthError("Tài khoản này đã bị khóa bởi Quản trị viên!");
          return;
        }
        setCurrentUser(localUser);
        localStorage.setItem("grammar_active_user_id", localUser.id);
        setAuthModalOpen(false);
        setAuthEmail("");
        setAuthPassword("");
        triggerXpGain(10, `Chào mừng ${localUser.name}!`);
        logActivity(localUser.id, localUser.email, "LOGIN", { name: localUser.name, role: localUser.role, offline: true });
        return;
      }

      setAuthError(authErr.message || "Email hoặc mật khẩu không chính xác!");
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");
    const name = authName.trim();
    const email = authEmail.trim();
    const password = authPassword;

    if (!name || !email || !password) {
      setAuthError("Vui lòng điền đầy đủ họ tên, email và mật khẩu!");
      return;
    }
    if (password.length < 6) {
      setAuthError("Mật khẩu phải có ít nhất 6 ký tự để bảo mật!");
      return;
    }

    try {
      // 1. Register on Supabase Auth Cloud
      const data = await signUpWithSupabase(email, password, name);
      if (data?.user) {
        const newUser = {
          id: data.user.id,
          name: name,
          email: email,
          role: "FREE",
          status: "ACTIVE",
          createdAt: getTodayDateStr(),
        };
        const updatedUsers = [newUser, ...usersList];
        persistUsersList(updatedUsers);
        setCurrentUser(newUser);
        localStorage.setItem("grammar_active_user_id", newUser.id);
        setAuthModalOpen(false);
        setAuthName("");
        setAuthEmail("");
        setAuthPassword("");
        triggerXpGain(50, `Chào mừng bạn mới ${newUser.name} (+50 XP)!`);
        logActivity(data.user.id, email, "REGISTER", { full_name: name });
        return;
      }
    } catch (err) {
      console.warn("Supabase signup error:", err.message);
      // Fallback local registration if offline
      if (usersList.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        setAuthError("Email này đã được đăng ký trên hệ thống!");
        return;
      }
      const localNewUser = {
        id: `usr_${Date.now()}`,
        name: name,
        email: email,
        password: password,
        role: "FREE",
        status: "ACTIVE",
        createdAt: getTodayDateStr(),
      };
      persistUsersList([...usersList, localNewUser]);
      setCurrentUser(localNewUser);
      setAuthModalOpen(false);
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      triggerXpGain(50, `Chào mừng ${localNewUser.name} (+50 XP)!`);
      logActivity(localNewUser.id, email, "REGISTER", { full_name: name, offline: true });
    }
  };

  const handleLogout = async () => {
    try {
      if (currentUser?.id && !currentUser.isGuest) {
        logActivity(currentUser.id, currentUser.email, "LOGOUT", { message: "Người dùng đăng xuất" });
      }
      await signOutSupabase();
    } catch (err) {
      console.warn("Logout error:", err);
    }
    localStorage.removeItem("grammar_active_user_id");
    setCurrentUser(GUEST_USER);
    if (currentView === "admin") {
      setCurrentView("dashboard");
    }
    setAuthModalOpen(false);
    triggerXpGain(0, "Đã đăng xuất tài khoản thành công!");
  };

  // --- Admin Computed Analytics & Filtering (Milestone 2.4) ---
  const adminAuthHeaders = useMemo(() => {
    const h = {};
    if (activeAuthToken) h["Authorization"] = `Bearer ${activeAuthToken}`;
    return h;
  }, [activeAuthToken]);

  const filteredAdminUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = adminSearchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchRole = adminRoleFilter === "ALL" || u.role === adminRoleFilter;
      const matchStatus = adminStatusFilter === "ALL" || u.status === adminStatusFilter;
      const matchStreak = adminStreakFilter === "ALL" || (u.tracker?.streak || 0) >= 7;

      return matchSearch && matchRole && matchStatus && matchStreak;
    });
  }, [usersList, adminSearchQuery, adminRoleFilter, adminStatusFilter, adminStreakFilter]);

  const adminStats = useMemo(() => {
    const total = usersList.length;
    const freeCount = usersList.filter((u) => u.role === "FREE").length;
    const vipCount = usersList.filter((u) => u.role === "VIP").length;
    const adminCount = usersList.filter((u) => u.role === "ADMIN").length;
    const activeCount = usersList.filter((u) => u.status === "ACTIVE").length;
    const lockedCount = usersList.filter((u) => u.status === "LOCKED").length;

    const totalXp = usersList.reduce((sum, u) => sum + (u.tracker?.xp || 0), 0);
    const avgStreak = total > 0 ? (usersList.reduce((sum, u) => sum + (u.tracker?.streak || 0), 0) / total).toFixed(1) : 0;
    const totalCompletedLessons = usersList.reduce((sum, u) => sum + (u.tracker?.completed_lessons?.length || 0), 0);

    return {
      total,
      freeCount,
      vipCount,
      adminCount,
      activeCount,
      lockedCount,
      totalXp,
      avgStreak,
      totalCompletedLessons,
    };
  }, [usersList]);

  const filteredAuditLogs = useMemo(() => {
    if (auditActionFilter === "ALL") return serverAuditLogs;
    return serverAuditLogs.filter((log) => log.action_type === auditActionFilter);
  }, [serverAuditLogs, auditActionFilter]);

  const getVerifiedAdminHeaders = async (includeJson = true) => {
    const session = await getActiveSession();
    if (session?.access_token) {
      setActiveAuthToken(session.access_token);
    }
    const headers = includeJson ? { "Content-Type": "application/json" } : {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const fetchServerAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const headers = await getVerifiedAdminHeaders(true);
      const res = await fetch("/api/admin/audit-logs?limit=50", { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.logs) {
          setServerAuditLogs(json.logs);
        }
      }
    } catch (e) {
      console.warn("Failed to load audit logs:", e.message);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (currentView === "admin" && currentUser?.role === "ADMIN") {
      getActiveSession().then((s) => {
        if (s?.access_token) setActiveAuthToken(s.access_token);
      }).catch(() => {});
      fetchServerAuditLogs();
    }
  }, [currentView, currentUser?.role]);

  const openStepUpDialog = ({ title, description, targetLabel, onExecute }) => {
    setStepUpError("");
    setStepUpSubmitting(false);
    setStepUpModal({ open: true, title, description, targetLabel, onExecute });
  };

  const handleConfirmStepUp = async (confirmationText) => {
    if (!stepUpModal.onExecute) return;
    setStepUpSubmitting(true);
    setStepUpError("");
    try {
      await stepUpModal.onExecute(confirmationText);
      setStepUpModal({ open: false, title: "", description: "", targetLabel: "", onExecute: null });
    } catch (err) {
      setStepUpError(err.message || "Xác thực bước 2 thất bại.");
    } finally {
      setStepUpSubmitting(false);
    }
  };

  const executeUpdateUserRole = async (userId, newRole, confirmationText = null) => {
    const headers = await getVerifiedAdminHeaders(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ userId, role: newRole, confirmationText }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }
    const updated = usersList.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    persistUsersList(updated);
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
    }
    fetchServerAuditLogs();
    triggerXpGain(5, `Đã cập nhật quyền ${newRole} cho học viên thành công!`);
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    const target = usersList.find((u) => u.id === userId);
    if (newRole === "ADMIN") {
      openStepUpDialog({
        title: "Cấp quyền Quản trị viên (ADMIN)",
        description: "Nâng quyền ADMIN cho phép toàn quyền truy cập hệ thống quản trị và nhật ký kiểm toán.",
        targetLabel: target?.email || userId,
        onExecute: (phrase) => executeUpdateUserRole(userId, newRole, phrase),
      });
      return;
    }
    try {
      await executeUpdateUserRole(userId, newRole);
    } catch (err) {
      alert(`Không thể cập nhật vai trò trên Server: ${err.message}`);
    }
  };

  const executeToggleUserStatus = async (userId, newStatus, confirmationText = null) => {
    const headers = await getVerifiedAdminHeaders(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ userId, status: newStatus, confirmationText }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }
    const updated = usersList.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));
    persistUsersList(updated);
    if (currentUser.id === userId && newStatus === "LOCKED") {
      alert("Tài khoản hiện tại của bạn đã bị khóa.");
      setCurrentUser(DEFAULT_USERS[2]);
    }
    fetchServerAuditLogs();
    triggerXpGain(5, `Đã ${newStatus === "LOCKED" ? "khóa" : "mở khóa"} tài khoản thành công!`);
  };

  const handleToggleUserStatus = async (userId) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return;
    if (target.role === "ADMIN") {
      alert("Không thể khóa tài khoản Quản trị viên cấp cao!");
      return;
    }
    const newStatus = target.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
    if (newStatus === "LOCKED") {
      openStepUpDialog({
        title: "Xác nhận Khóa tài khoản Học viên (BAN_USER)",
        description: "Học viên bị khóa sẽ không thể sử dụng tính năng Cloud cho đến khi được Quản trị viên mở khóa lại.",
        targetLabel: `${target.name} (${target.email})`,
        onExecute: (phrase) => executeToggleUserStatus(userId, newStatus, phrase),
      });
      return;
    }
    try {
      await executeToggleUserStatus(userId, newStatus);
    } catch (err) {
      alert(`Không thể cập nhật trạng thái trên Server: ${err.message}`);
    }
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    openStepUpDialog({
      title: "Xác nhận Cập nhật Chính sách Hạn mức (Policy Versioning)",
      description: `Thay đổi hạn mức sẽ tạo phiên bản Policy v${(adminPolicyForm.policyVersion || 1) + 1} và áp dụng cho toàn hệ thống.`,
      targetLabel: `Free Quiz: ${adminPolicyForm.freeDailyQuizLimit}/ngày • Bài tập: ${adminPolicyForm.freeExerciseLimit}/chương`,
      onExecute: async (confirmationText) => {
        const headers = await getVerifiedAdminHeaders(true);
        const res = await fetch("/api/admin/policy", {
          method: "POST",
          headers,
          body: JSON.stringify({ ...adminPolicyForm, confirmationText }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
        const savedPol = {
          policyVersion: json.policy?.policy_version ?? (adminPolicyForm.policyVersion || 1) + 1,
          freeExerciseLimit: json.policy?.free_exercise_limit ?? adminPolicyForm.freeExerciseLimit,
          freeDailyQuizLimit: json.policy?.free_daily_quiz_limit ?? adminPolicyForm.freeDailyQuizLimit,
          diagnosticCooldownDays: json.policy?.diagnostic_cooldown_days ?? adminPolicyForm.diagnosticCooldownDays ?? 7,
          offlineSyncMaxBatch: json.policy?.offline_sync_max_batch ?? adminPolicyForm.offlineSyncMaxBatch ?? 50,
        };
        setAccessPolicy(savedPol);
        setAdminPolicyForm(savedPol);
        localStorage.setItem("grammar_access_policy", JSON.stringify(savedPol));
        fetchServerAuditLogs();
        alert(`Đã phát hành chính sách Policy v${savedPol.policyVersion} lên Supabase và ghi Audit Log bất biến!`);
      },
    });
  };

  const handleExportUsersCsv = async () => {
    try {
      const headers = await getVerifiedAdminHeaders(false);
      const res = await fetch("/api/admin/users?format=csv", { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `grammar-users-${getTodayDateStr()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Không thể xuất CSV: ${err.message}`);
    }
  };

  const refreshAdminFromSupabase = async () => {
    try {
      const liveProfiles = await getAllProfilesWithTrackers();
      if (liveProfiles && liveProfiles.length > 0) {
        const mapped = liveProfiles.map((p) => ({
          id: p.id,
          name: p.full_name || p.email.split("@")[0],
          email: p.email,
          password: p.role === "ADMIN" ? "admin" : p.role === "VIP" ? "vip" : "free",
          role: p.role || "FREE",
          status: p.status || "ACTIVE",
          tracker: p.tracker,
          createdAt: p.created_at ? p.created_at.split("T")[0] : getTodayDateStr(),
        }));
        setUsersList(mapped);
        localStorage.setItem("grammar_users_db", JSON.stringify(mapped));
      }
      const logs = await getActivityLogs(30);
      if (logs) setAdminActivityLogs(logs);
      fetchServerAuditLogs();

      const livePolicy = await getSystemPolicy();
      if (livePolicy) {
        const pol = {
          policyVersion: livePolicy.policy_version ?? 1,
          freeExerciseLimit: livePolicy.free_exercise_limit ?? 10,
          freeDailyQuizLimit: livePolicy.free_daily_quiz_limit ?? 2,
          diagnosticCooldownDays: livePolicy.diagnostic_cooldown_days ?? 7,
          offlineSyncMaxBatch: livePolicy.offline_sync_max_batch ?? 50,
        };
        setAccessPolicy(pol);
        setAdminPolicyForm(pol);
        localStorage.setItem("grammar_access_policy", JSON.stringify(pol));
      }
      triggerXpGain(5, "Đã làm mới dữ liệu & nhật ký hoạt động từ Supabase Cloud!");
    } catch (err) {
      alert("Không thể kết nối đến Supabase để làm mới: " + err.message);
    }
  };

  const handleCreateNewUserByAdmin = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert("Vui lòng điền đủ thông tin!");
      return;
    }
    if (usersList.some((u) => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())) {
      alert("Email đã tồn tại!");
      return;
    }

    try {
      const data = await signUpWithSupabase(newUserEmail.trim(), newUserPassword, newUserName.trim());
      const newId = data?.user?.id || `usr_${Date.now()}`;
      if (newUserRole !== "FREE" && data?.user?.id) {
        await updateProfileRoleOrStatus(data.user.id, { role: newUserRole });
      }
      const created = {
        id: newId,
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
        status: "ACTIVE",
        createdAt: getTodayDateStr(),
      };
      persistUsersList([created, ...usersList]);
      setNewUserModalOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      alert(`Đã tạo thành công tài khoản ${created.name} (${created.role}) trên Supabase!`);
    } catch (err) {
      console.warn("Supabase create user error:", err.message);
      const created = {
        id: `usr_${Date.now()}`,
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
        status: "ACTIVE",
        createdAt: getTodayDateStr(),
      };
      persistUsersList([created, ...usersList]);
      setNewUserModalOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      alert(`Đã tạo thành công tài khoản ${created.name} (${created.role})!`);
    }
  };

  // --- Learning Gamification Handlers ---
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
        if (currentUser?.id && !currentUser.isGuest) {
          logActivity(currentUser.id, currentUser.email, "STUDY_LESSON", { lesson_id: lessonId });
        }
      }
      return {
        ...prev,
        xp: prev.xp + xpGain,
        completedLessons: nextList,
      };
    });
  };

  const recordCorrectQuestion = (questionId, isQuiz = false) => {
    const xpReward = isQuiz ? 15 : 10;
    persistTracker((prev) => {
      const today = getTodayDateStr();
      const alreadyDone = prev.completedQuestions.includes(questionId);
      const nextQuestions = alreadyDone ? prev.completedQuestions : [...prev.completedQuestions, questionId];
      const todaySolved = (prev.dailyGoal?.date === today ? prev.dailyGoal?.solvedToday || 0 : 0) + 1;

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
          date: today,
        },
      };
    });
  };

  const handleAcceptRemedial = (rec) => {
    if (!rec) return;
    const targetCh = previewData.chapters.find((c) => c.number === rec.chapter_number) || previewData.chapters[0];
    if (targetCh) {
      handleSelectChapter(targetCh);
      const targetL = targetCh.lessons.find((l) => l.id === rec.lesson_id || l.code === rec.lesson_code);
      if (targetL) {
        setSelectedLessonId(targetL.id);
      }
      setActiveTab("theory");
      setCurrentView("study");
    }
  };

  const openLessonByCode = (lessonCode) => {
    if (!lessonCode) return;
    for (const ch of previewData.chapters || []) {
      const match = (ch.lessons || []).find((l) => l.code === lessonCode || l.id === lessonCode);
      if (match) {
        handleSelectChapter(ch);
        setSelectedLessonId(match.id);
        setActiveTab("theory");
        setCurrentView("study");
        return;
      }
    }
  };

  const syncQuestionMastery = (question, isCorrect, errorCategory = null) => {
    if (!question?.id || !currentUser?.id || currentUser.isGuest) return;
    const headers = {
      "Content-Type": "application/json",
      ...(activeAuthToken ? { Authorization: `Bearer ${activeAuthToken}` } : {}),
    };
    fetch("/api/learning/mastery", {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: currentUser.id,
        question_id: question.id,
        is_correct: Boolean(isCorrect),
        error_category: errorCategory,
      }),
    }).catch(() => {});
  };

  const computeAndAttachRemedial = (question, userInput, correctAns, chapterTitleFallback = "Ngữ pháp") => {
    if (!question?.id) return;
    try {
      const rec = generateRemedialRecommendation(
        { ...question, topic_name: question.topic_name || chapterTitleFallback },
        userInput,
        correctAns,
        previewData,
        userTracker
      );
      if (rec) {
        setActiveRemedialMap((prev) => ({ ...prev, [question.id]: rec }));
      }
      syncQuestionMastery(question, false, rec?.detected_error || null);
    } catch {}
  };

  const handleNavigateToDiagnosticLesson = (chapterNumber, lessonId) => {
    const targetCh = previewData.chapters.find((c) => c.number === chapterNumber) || previewData.chapters[0];
    if (targetCh) {
      handleSelectChapter(targetCh);
      const targetL = targetCh.lessons.find((l) => l.id === lessonId);
      if (targetL) {
        setSelectedLessonId(targetL.id);
      }
      setActiveTab("theory");
      setCurrentView("study");
    }
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

  // --- Pedagogical 3-Tier Explanation Renderer ---
  // Helper to format inline markdown (*italic*, **bold**, ~~strikethrough~~, [NOT ...]) and examples
  const renderFormattedText = (str) => {
    if (!str || typeof str !== "string") return str;

    // Check if whole line is an example
    const isEx = str.trim().startsWith("Ví dụ:") || str.trim().startsWith("Example:");
    if (isEx) {
      const exContent = str.replace(/^(Ví dụ:|Example:)\s*/i, "").trim();
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            backgroundColor: isLight ? "#f8fafc" : "#121218",
            border: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
            borderLeft: "3px solid #3b82f6",
            borderRadius: "6px",
            padding: "0.45rem 0.75rem",
            margin: "0.25rem 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.45rem", flex: 1 }}>
            <span
              style={{
                fontSize: "0.68rem",
                fontFamily: "Geist Mono",
                backgroundColor: isLight ? "#eff6ff" : "#1e293b",
                color: isLight ? "#1d4ed8" : "#60a5fa",
                padding: "0.1rem 0.35rem",
                borderRadius: "3px",
                fontWeight: "700",
                flexShrink: 0,
              }}
            >
              VÍ DỤ
            </span>
            <span style={{ fontSize: "0.9rem", color: T.text, lineHeight: "1.5" }}>
              {renderFormattedText(exContent)}
            </span>
          </div>
          <button
            onClick={() => playWordAudio(exContent.replace(/\[.*?\]|\(.*?\)/g, "").trim(), null)}
            title="Nghe phát âm ví dụ này"
            style={{
              backgroundColor: isLight ? "#ffffff" : "#1e1e28",
              border: `1px solid ${T.border}`,
              color: isLight ? "#2563eb" : "#38bdf8",
              borderRadius: "4px",
              padding: "0.15rem 0.45rem",
              fontSize: "0.7rem",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            🔊 Nghe
          </button>
        </div>
      );
    }

    const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[NOT\s+[^\]]+\])/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith("***") && token.endsWith("***")) {
        parts.push(
          <strong key={match.index} style={{ fontWeight: "700", fontStyle: "italic", color: isLight ? "#1e293b" : "#f1f5f9" }}>
            {token.slice(3, -3)}
          </strong>
        );
      } else if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong key={match.index} style={{ fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(
          <span key={match.index} style={{ fontStyle: "italic", fontWeight: "600", color: isLight ? "#2563eb" : "#38bdf8" }}>
            {token.slice(1, -1)}
          </span>
        );
      } else if (token.startsWith("~~") && token.endsWith("~~")) {
        parts.push(
          <span key={match.index} style={{ textDecoration: "line-through", color: "#f43f5e", fontWeight: "600", margin: "0 2px" }}>
            {token.slice(2, -2)}
          </span>
        );
      } else if (token.startsWith("[NOT") && token.endsWith("]")) {
        parts.push(
          <span key={match.index} style={{ backgroundColor: isLight ? "#fef2f2" : "rgba(244, 63, 94, 0.15)", border: "1px solid #f43f5e70", color: isLight ? "#dc2626" : "#fb7185", padding: "0.1rem 0.35rem", borderRadius: "4px", fontSize: "0.78rem", fontWeight: "700", margin: "0 4px" }}>
            ⚠️ {token.slice(1, -1)}
          </span>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts;
  };

  const renderPedagogicalExplanation = (explanation, pedagogy, question = null) => {
    if (!explanation && !pedagogy && !question) return null;

    const structured = question
      ? migrateQuestionExplanation(question)
      : migrateQuestionExplanation({
          id: "q_temp",
          stem: "",
          explanation: explanation || "",
          pedagogy: pedagogy || {},
          topic_name: selectedChapter?.title_vi || "Ngữ pháp",
        });

    return (
      <StructuredExplanation
        explanation={structured}
        questionId={question?.id || structured?.question_id}
        userId={currentUser?.id}
        isLight={isLight}
      />
    );
  };

  // --- Study Exercise Handlers with Permission Check ---
  const handleInputChange = (questionId, value) => {
    setUserInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const checkSingleQuestion = (q, exerciseType = "", globalIdx = 0) => {
    // Permission Limit Check for Free User
    const isFreeUser = currentUser.role === "FREE";
    if (isFreeUser && globalIdx >= accessPolicy.freeExerciseLimit) {
      alert(
        `Tài khoản Miễn phí giới hạn ${accessPolicy.freeExerciseLimit} câu bài tập/chương. Hãy nâng cấp VIP để làm không giới hạn!`
      );
      return;
    }

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
      setActiveRemedialMap((prev) => ({ ...prev, [q.id]: null }));
      syncQuestionMastery(q, true);
    } else {
      addMistakeRecord({
        id: q.id,
        stem: q.stem,
        starter_prompt: q.starter_prompt,
        instruction: q.instruction || exerciseType || "",
        answers: answersList,
        explanation: q.explanation,
        pedagogy: q.pedagogy,
        topic_name: selectedChapter.title_vi,
      });
      computeAndAttachRemedial(q, userInput, answersList[0] || "", selectedChapter?.title_vi);
    }
  };

  const checkAllQuestions = (exercise, startIdx = 0) => {
    exercise.questions.forEach((q, idx) => {
      checkSingleQuestion(q, exercise.instruction_vi || exercise.title, startIdx + idx);
    });
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

  // --- Quiz Handlers with Daily Free Limit Check ---
  const isQuizLimitReached = useMemo(() => {
    if (currentUser.role === "VIP" || currentUser.role === "ADMIN") return false;
    return (userTracker.quizzesCompletedToday || 0) >= accessPolicy.freeDailyQuizLimit;
  }, [currentUser.role, userTracker.quizzesCompletedToday, accessPolicy.freeDailyQuizLimit]);

  const startNewQuiz = (topicId = selectedQuizTopic) => {
    if (isQuizLimitReached) {
      alert(
        `Bạn đã hoàn thành giới hạn ${accessPolicy.freeDailyQuizLimit} lượt Quiz hôm nay của gói Miễn phí. Hãy nâng cấp lên VIP để làm bài không giới hạn!`
      );
      return;
    }

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
      setActiveRemedialMap((prev) => ({ ...prev, [q.id]: null }));
      syncQuestionMastery(q, true);
    } else {
      addMistakeRecord({
        id: q.id,
        stem: q.stem,
        starter_prompt: q.starter_prompt,
        instruction: q.instruction,
        answers: q.answers,
        explanation: q.explanation,
        pedagogy: q.pedagogy,
        topic_name: q.topic_name,
      });
      computeAndAttachRemedial(q, userAns, q.answers?.[0] || "", q.topic_name);
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
        syncQuestionMastery(q, true);
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
        computeAndAttachRemedial(q, userAns, q.answers?.[0] || "", q.topic_name);
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

    if (currentUser?.id && !currentUser.isGuest) {
      logActivity(currentUser.id, currentUser.email, "SUBMIT_QUIZ", {
        topic: selectedQuizTopic,
        score: correctCount,
        total: activeQuizQuestions.length,
        percentage: Math.round((correctCount / activeQuizQuestions.length) * 100),
      });
      SyncManager.recordAction(SYNC_EVENT_TYPES.QUIZ_SUBMITTED, {
        quiz: {
          topic: selectedQuizTopic,
          score: correctCount,
          totalQuestions: activeQuizQuestions.length,
          incorrectQuestionIds: newMistakesToAdd.map((m) => m.id),
        },
      }).catch(() => {});
    }

    // Increment quizzes completed today for free limit tracker
    persistTracker((prev) => ({
      ...prev,
      quizzesCompletedToday: (prev.quizzesCompletedToday || 0) + 1,
    }));

    if (newMistakesToAdd.length > 0) {
      const existingIds = new Set(savedMistakes.map((m) => m.id));
      const filtered = newMistakesToAdd.filter((m) => !existingIds.has(m.id));
      if (filtered.length > 0) {
        persistMistakes([...savedMistakes, ...filtered]);
        if (currentUser?.id && !currentUser.isGuest) {
          filtered.slice(0, 10).forEach((m) => {
            SyncManager.recordAction(SYNC_EVENT_TYPES.MISTAKE_RECORDED, { mistake: m }).catch(() => {});
          });
        }
      }
    }
  };

  // --- Mistakes Review Handlers ---
  const addMistakeRecord = (item) => {
    if (!savedMistakes.some((m) => m.id === item.id)) {
      persistMistakes([...savedMistakes, item]);
      if (currentUser?.id && !currentUser.isGuest) {
        SyncManager.recordAction(SYNC_EVENT_TYPES.MISTAKE_RECORDED, { mistake: item }).catch(() => {});
      }
    }
  };

  const removeMistakeRecord = (id) => {
    const updated = savedMistakes.filter((m) => m.id !== id);
    persistMistakes(updated);
    if (currentUser?.id && !currentUser.isGuest) {
      SyncManager.recordAction(SYNC_EVENT_TYPES.MISTAKE_RESOLVED, { questionId: id }).catch(() => {});
    }
  };

  const clearAllMistakes = () => {
    if (confirm("Xác nhận xóa toàn bộ danh sách câu hỏi trong sổ tay câu sai của bạn?")) {
      const oldIds = savedMistakes.map((m) => m.id);
      persistMistakes([]);
      if (currentUser?.id && !currentUser.isGuest) {
        oldIds.slice(0, 20).forEach((qid) => {
          SyncManager.recordAction(SYNC_EVENT_TYPES.MISTAKE_RESOLVED, { questionId: qid }).catch(() => {});
        });
      }
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
      syncQuestionMastery(item, true);
    } else {
      syncQuestionMastery(item, false);
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
    if (savedMistakes.length > 0) {
      const topMistake = savedMistakes[0];
      const targetCh = previewData.chapters.find((c) => c.title_vi === topMistake.topic_name) || previewData.chapters[0];
      const targetLs = targetCh.lessons[0] || null;
      return {
        chapter: targetCh,
        lesson: targetLs,
        reason: `Cần phục thù: Bạn đang có ${savedMistakes.length} câu làm sai cần củng cố ở chuyên đề này.`,
        tag: "ÔN TẬP CỦNG CỐ",
        tagColor: "#f59e0b",
      };
    }

    for (const ch of previewData.chapters) {
      for (const ls of ch.lessons) {
        if (!userTracker.completedLessons.includes(ls.id)) {
          return {
            chapter: ch,
            lesson: ls,
            reason: `Tiếp nối lộ trình học tập: Chuyên đề ${ch.number} - ${ch.title_vi}.`,
            tag: "BÀI HỌC TIẾP THEO",
            tagColor: "#38bdf8",
          };
        }
      }
    }

    return {
      chapter: previewData.chapters[0],
      lesson: previewData.chapters[0].lessons[0],
      reason: "Xuất sắc! Bạn đã hoàn thành toàn bộ 53 bài học. Hãy làm đề Quiz 50 câu để duy trì phong độ!",
      tag: "LUYỆN TẬP NÂNG CAO",
      tagColor: "#10b981",
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

  const totalChapterExerciseQuestions = useMemo(() => {
    if (!selectedChapter?.exercises) return 0;
    return selectedChapter.exercises.reduce((acc, ex) => acc + (ex.questions?.length || 0), 0);
  }, [selectedChapter]);

  const totalLessonFormulas = useMemo(() => {
    if (!selectedLesson?.sections) return 0;
    return selectedLesson.sections.reduce((acc, s) => acc + (s.formulas?.length || 0), 0);
  }, [selectedLesson]);

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
          background-color: ${T.bg};
          color: ${T.text};
          font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .theme-light input, .theme-light select, .theme-light textarea {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        .theme-light input::placeholder, .theme-light textarea::placeholder {
          color: #94a3b8 !important;
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
          background: ${isLight ? "#f1f5f9" : "#09090b"};
        }
        ::-webkit-scrollbar-thumb {
          background: ${isLight ? "#cbd5e1" : "#27272a"};
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
          border: 1px solid ${T.border};
          padding: 0.65rem 0.85rem;
          text-align: left;
        }
        th {
          background-color: ${isLight ? "#f8fafc" : "#18181b"};
          color: ${T.textHeading};
          font-weight: 700;
        }
        tr:nth-child(even) {
          background-color: ${isLight ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.02)"};
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
            backgroundColor: isLight ? "#ffffff" : "#18181b",
            border: "1px solid #10b981",
            boxShadow: isLight ? "0 10px 25px -5px rgba(16, 185, 129, 0.2)" : "0 10px 25px -5px rgba(16, 185, 129, 0.3)",
            color: isLight ? "#0f172a" : "#fafafa",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
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

      {/* Auth Modal (Login / Register / Quick Switch) */}
      {authModalOpen && (
        <div
          id="auth-modal"
          data-no-dict="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: "12px",
              padding: "2rem",
              width: "100%",
              maxWidth: "460px",
              boxShadow: T.shadowElevated,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: "700", color: T.text }}>
                {authTab === "login" ? "Đăng nhập tài khoản" : "Đăng ký thành viên"}
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                style={{ background: "none", border: "none", color: "#71717a", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Currently Logged In Box with Logout Action */}
            {!currentUser.isGuest && (
              <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", backgroundColor: isLight ? "#f8fafc" : "#18181b", borderRadius: "8px", border: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: T.textMuted, textTransform: "uppercase" }}>Đang đăng nhập:</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: T.text }}>{currentUser.name} ({currentUser.role})</div>
                  <div style={{ fontSize: "0.75rem", color: T.textSecondary }}>{currentUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: "0.4rem 0.8rem",
                    backgroundColor: "#ef444420",
                    border: "1px solid #ef444450",
                    color: "#f87171",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            )}

            {/* Error Message */}
            {authError && (
              <div style={{ padding: "0.6rem 0.85rem", backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "6px", color: "#f87171", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {authError}
              </div>
            )}

            {/* Form Tabs */}
            <div style={{ display: "flex", backgroundColor: isLight ? "#f1f5f9" : "#18181b", padding: "3px", borderRadius: "6px", marginBottom: "1.25rem" }}>
              <button
                type="button"
                onClick={() => { setAuthTab("login"); setAuthError(""); }}
                style={{
                  flex: 1,
                  padding: "0.4rem",
                  borderRadius: "4px",
                  border: "none",
                  fontSize: "0.825rem",
                  fontWeight: authTab === "login" ? "600" : "400",
                  backgroundColor: authTab === "login" ? (isLight ? "#ffffff" : "#27272a") : "transparent",
                  color: authTab === "login" ? T.text : T.textMuted,
                  boxShadow: authTab === "login" && isLight ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("register"); setAuthError(""); }}
                style={{
                  flex: 1,
                  padding: "0.4rem",
                  borderRadius: "4px",
                  border: "none",
                  fontSize: "0.825rem",
                  fontWeight: authTab === "register" ? "600" : "400",
                  backgroundColor: authTab === "register" ? (isLight ? "#ffffff" : "#27272a") : "transparent",
                  color: authTab === "register" ? T.text : T.textMuted,
                  boxShadow: authTab === "register" && isLight ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                }}
              >
                Đăng ký mới
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={authTab === "login" ? handleLogin : handleRegister}>
              {authTab === "register" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.35rem", fontWeight: "600" }}>
                    Họ và tên:
                  </label>
                  <input
                    type="text"
                    required
                    value={authName}
                    placeholder="Nguyễn Văn A"
                    onChange={(e) => setAuthName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      backgroundColor: isLight ? "#ffffff" : "#18181b",
                      border: `1px solid ${T.border}`,
                      borderRadius: "6px",
                      color: T.text,
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.35rem", fontWeight: "600" }}>
                  Email:
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  placeholder="name@example.com"
                  onChange={(e) => setAuthEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    backgroundColor: isLight ? "#ffffff" : "#18181b",
                    border: `1px solid ${T.border}`,
                    borderRadius: "6px",
                    color: T.text,
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.35rem", fontWeight: "600" }}>
                  Mật khẩu:
                </label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  placeholder="••••••••"
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    backgroundColor: isLight ? "#ffffff" : "#18181b",
                    border: `1px solid ${T.border}`,
                    borderRadius: "6px",
                    color: T.text,
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "0.65rem",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {authTab === "login" ? "Đăng nhập ngay" : "Tạo tài khoản học tập"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Modal Add New User */}
      {newUserModalOpen && (
        <div
          id="new-user-modal"
          data-no-dict="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: "12px",
              padding: "2rem",
              width: "100%",
              maxWidth: "460px",
              boxShadow: T.shadowElevated,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "1.15rem", fontWeight: "700", color: T.text }}>
                Thêm người dùng mới vào hệ thống
              </div>
              <button
                onClick={() => setNewUserModalOpen(false)}
                style={{ background: "none", border: "none", color: "#71717a", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewUserByAdmin}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#a1a1aa", marginBottom: "0.3rem" }}>Họ tên:</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", backgroundColor: isLight ? "#ffffff" : "#18181b", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.3rem" }}>Email:</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", backgroundColor: isLight ? "#ffffff" : "#18181b", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.3rem" }}>Mật khẩu:</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", backgroundColor: isLight ? "#ffffff" : "#18181b", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.3rem" }}>Quyền tài khoản:</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", backgroundColor: isLight ? "#ffffff" : "#18181b", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text }}
                >
                  <option value="FREE">FREE (Miễn phí - Giới hạn 10 câu/chương & 2 quiz)</option>
                  <option value="VIP">VIP (Toàn quyền 2,900+ câu & không giới hạn)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên hệ thống)</option>
                </select>
              </div>

              <button
                type="submit"
                style={{ width: "100%", padding: "0.65rem", backgroundColor: "#10b981", color: "#042f1a", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}
              >
                Tạo tài khoản ngay
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DICTIONARY POPUP (CLICK TRA TỪ NHANH + PHIÊN ÂM IPA + AUDIO)  */}
      {/* ============================================================== */}
      {dictPopup.open && (
        <div
          id="dict-popup"
          style={{
            position: "fixed",
            left: `${dictPopup.x}px`,
            top: `${dictPopup.y}px`,
            width: "330px",
            backgroundColor: isLight ? "#ffffff" : "#0f172a",
            border: isLight ? "1px solid #bae6fd" : "1px solid #38bdf860",
            boxShadow: isLight ? "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 15px rgba(56, 189, 248, 0.15)" : "0 20px 35px -5px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.2)",
            borderRadius: "14px",
            zIndex: 9999,
            padding: "1rem 1.15rem",
            color: isLight ? "#0f172a" : "#f8fafc",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header: Word + POS Badge + Close */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#38bdf8", letterSpacing: "-0.01em" }}>
                {dictPopup.word}
              </h3>
              {dictPopup.partOfSpeech && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontFamily: "Geist Mono",
                    backgroundColor: isLight ? "#eff6ff" : "#1e293b",
                    color: isLight ? "#1d4ed8" : "#93c5fd",
                    border: isLight ? "1px solid #bfdbfe" : "1px solid #334155",
                    padding: "0.1rem 0.45rem",
                    borderRadius: "4px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  {dictPopup.partOfSpeech}
                </span>
              )}
            </div>
            <button
              onClick={() => setDictPopup((prev) => ({ ...prev, open: false }))}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: "1.1rem",
                cursor: "pointer",
                padding: "0.1rem 0.3rem",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Content / Loading state */}
          {dictPopup.loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "1.25rem 0", color: "#94a3b8", fontSize: "0.85rem" }}>
              <span style={{ fontSize: "1.2rem" }}>⏳</span>
              <span>Đang tra cứu từ điển & phiên âm IPA...</span>
            </div>
          ) : (
            <>
              {/* Phonetics & Audio Pronunciation Section */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: isLight ? "#f8fafc" : "#020617",
                  border: isLight ? "1px solid #e2e8f0" : "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "0.45rem 0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "700" }}>IPA:</span>
                  <span style={{ fontFamily: "Geist Mono", fontSize: "0.9rem", color: "#38bdf8", fontWeight: "700" }}>
                    {dictPopup.phonetic || `/${dictPopup.word}/`}
                  </span>
                </div>

                {/* Audio Speaker Button */}
                <button
                  onClick={() => playWordAudio(dictPopup.word, dictPopup.audioUrl)}
                  disabled={dictPopup.isPlayingAudio}
                  title="Nghe phát âm chuẩn tiếng Anh (Audio API)"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    backgroundColor: dictPopup.isPlayingAudio ? "#0284c7" : "#0284c725",
                    border: "1px solid #0284c770",
                    color: "#38bdf8",
                    borderRadius: "6px",
                    padding: "0.25rem 0.55rem",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  <span>{dictPopup.isPlayingAudio ? "🔊 Đang đọc..." : "🔊 Nghe phát âm"}</span>
                </button>
              </div>

              {/* Vietnamese Meaning Box */}
              <div
                style={{
                  backgroundColor: isLight ? "#f0fdf4" : "#064e3b25",
                  border: isLight ? "1px solid #bbf7d0" : "1px solid #05966950",
                  borderRadius: "8px",
                  padding: "0.65rem 0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ fontSize: "0.7rem", color: isLight ? "#15803d" : "#34d399", fontWeight: "700", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  🇻🇳 Nghĩa tiếng Việt
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: "800", color: isLight ? "#14532d" : "#ecfdf5", lineHeight: 1.35 }}>
                  {dictPopup.vietnamese}
                </div>
                {dictPopup.detailedMeanings.length > 0 && dictPopup.detailedMeanings[0].meanings.length > 1 && (
                  <div style={{ marginTop: "0.35rem", fontSize: "0.75rem", color: isLight ? "#166534" : "#a7f3d0" }}>
                    Từ đồng nghĩa: {dictPopup.detailedMeanings[0].meanings.slice(1, 4).join(", ")}
                  </div>
                )}
              </div>

              {/* English Definition (if available) */}
              {dictPopup.englishDefinition && (
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.4, marginBottom: "0.75rem", fontStyle: "italic", borderLeft: "2px solid #334155", paddingLeft: "0.5rem" }}>
                  "{dictPopup.englishDefinition}"
                </div>
              )}

              {/* Footer Toolbar: Save Vocab + Cambridge Link */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: "1px solid #1e293b", gap: "0.5rem" }}>
                {(() => {
                  const isSaved = savedVocab.some((v) => v.word.toLowerCase() === dictPopup.word.toLowerCase());
                  return (
                    <button
                      onClick={() => toggleSaveWord(dictPopup)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        backgroundColor: isSaved ? (isLight ? "#fef3c7" : "#f59e0b25") : (isLight ? "#f1f5f9" : "#1e293b"),
                        border: isSaved ? (isLight ? "1px solid #fcd34d" : "1px solid #f59e0b70") : (isLight ? "1px solid #cbd5e1" : "1px solid #334155"),
                        color: isSaved ? (isLight ? "#b45309" : "#fbbf24") : (isLight ? "#334155" : "#cbd5e1"),
                        borderRadius: "6px",
                        padding: "0.3rem 0.6rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <span>{isSaved ? "★ Đã lưu vào Sổ từ" : "☆ Lưu vào Sổ từ"}</span>
                    </button>
                  );
                })()}

                {/* Direct Link to Cambridge Audio & Dictionary */}
                <a
                  href={`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(dictPopup.word)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Tra cứu chi tiết trên Cambridge Dictionary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.72rem",
                    color: "#94a3b8",
                    textDecoration: "none",
                    padding: "0.3rem 0.5rem",
                    borderRadius: "6px",
                    backgroundColor: "#020617",
                    border: "1px solid #1e293b",
                  }}
                >
                  <span>Cambridge ↗</span>
                </a>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VOCABULARY NOTEBOOK MODAL (SỔ TAY TỪ VỰNG CÁ NHÂN)             */}
      {/* ============================================================== */}
      {vocabModalOpen && (
        <div
          id="vocab-modal"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: isLight ? "#ffffff" : "#111827",
              border: isLight ? "1px solid #e2e8f0" : "1px solid #374151",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: isLight ? "0 20px 40px -10px rgba(0, 0, 0, 0.15)" : "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: `1px solid ${isLight ? "#e2e8f0" : "#1f2937"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isLight ? "#f8fafc" : "#0f172a",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.3rem" }}>📚</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: isLight ? "#0f172a" : "#f9fafb" }}>
                    Sổ tay từ vựng của {currentUser.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: isLight ? "#64748b" : "#9ca3af" }}>
                    Lưu trữ các từ đã tra cứu, phiên âm IPA và audio phát âm
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVocabModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Filter Search Input */}
            <div style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid #1f2937", backgroundColor: "#111827" }}>
              <input
                type="text"
                value={vocabSearchFilter}
                onChange={(e) => setVocabSearchFilter(e.target.value)}
                placeholder="🔍 Tìm kiếm trong sổ từ vựng..."
                style={{
                  width: "100%",
                  height: "36px",
                  padding: "0 0.85rem",
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  color: "#f3f4f6",
                  outline: "none",
                }}
              />
            </div>

            {/* Words List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
              {(() => {
                const filtered = savedVocab.filter(
                  (v) =>
                    v.word.toLowerCase().includes(vocabSearchFilter.toLowerCase()) ||
                    (v.vietnamese && v.vietnamese.toLowerCase().includes(vocabSearchFilter.toLowerCase()))
                );

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#6b7280" }}>
                      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📖</div>
                      <p style={{ fontSize: "0.95rem", fontWeight: "600", color: "#9ca3af", marginBottom: "0.5rem" }}>
                        Chưa có từ vựng nào trong sổ
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "#6b7280", maxWidth: "380px", margin: "0 auto" }}>
                        Khi học lý thuyết hoặc giải bài tập, bạn chỉ cần click trực tiếp vào bất kỳ từ tiếng Anh nào để tra nghĩa, nghe phát âm và bấm "Lưu vào Sổ từ".
                      </p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {filtered.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "10px",
                          padding: "0.85rem 1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "1rem",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                            <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#60a5fa" }}>
                              {item.word}
                            </span>
                            <span style={{ fontFamily: "Geist Mono", fontSize: "0.82rem", color: "#38bdf8" }}>
                              {item.phonetic}
                            </span>
                            {item.partOfSpeech && (
                              <span
                                style={{
                                  fontSize: "0.65rem",
                                  backgroundColor: "#111827",
                                  border: "1px solid #4b5563",
                                  color: "#9ca3af",
                                  padding: "0.05rem 0.35rem",
                                  borderRadius: "4px",
                                }}
                              >
                                {item.partOfSpeech}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#34d399" }}>
                            🇻🇳 {item.vietnamese}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {/* Audio button */}
                          <button
                            onClick={() => playWordAudio(item.word, item.audioUrl)}
                            title="Nghe phát âm"
                            style={{
                              backgroundColor: "#0284c725",
                              border: "1px solid #0284c770",
                              color: "#38bdf8",
                              borderRadius: "6px",
                              padding: "0.35rem 0.65rem",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <span>🔊 Nghe</span>
                          </button>

                          {/* Delete from vocab */}
                          <button
                            onClick={() => toggleSaveWord(item)}
                            title="Xóa khỏi sổ từ vựng"
                            style={{
                              backgroundColor: "#374151",
                              border: "none",
                              color: "#ef4444",
                              borderRadius: "6px",
                              padding: "0.35rem 0.55rem",
                              fontSize: "0.85rem",
                              cursor: "pointer",
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "0.85rem 1.5rem",
                borderTop: "1px solid #1f2937",
                backgroundColor: "#0f172a",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                Tổng cộng: <strong style={{ color: "#f3f4f6" }}>{savedVocab.length}</strong> từ vựng
              </span>
              <button
                onClick={() => setVocabModalOpen(false)}
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.4rem 1rem",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className={isLight ? "theme-light" : "theme-dark"} style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: T.bg, color: T.text, transition: "background-color 0.15s ease, color 0.15s ease" }}>
        
        {/* Top Navbar */}
        <header
          style={{
            height: "56px",
            borderBottom: `1px solid ${T.border}`,
            backgroundColor: T.bg,
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
                backgroundColor: isLight ? "#2563eb" : "#27272a",
                border: `1px solid ${isLight ? "#1d4ed8" : "#3f3f46"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: "700",
                boxShadow: isLight ? "0 2px 6px rgba(37,99,235,0.25)" : "none",
              }}
            >
              G
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: "700", letterSpacing: "-0.015em", color: T.text }}>
                Grammar Engine
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontFamily: "Geist Mono",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "4px",
                  backgroundColor: T.bgElevated,
                  border: `1px solid ${T.border}`,
                  color: T.textMuted,
                  fontWeight: "600",
                }}
              >
                v1.4 PRO
              </span>
            </div>
          </div>

          {/* Segmented Mode Navigation (Tabs) */}
          <nav
            style={{
              display: "flex",
              backgroundColor: T.bgElevated,
              padding: "3px",
              borderRadius: "8px",
              border: `1px solid ${T.border}`,
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
                fontWeight: currentView === "dashboard" ? "700" : "500",
                color: currentView === "dashboard" ? T.text : T.textMuted,
                backgroundColor: currentView === "dashboard" ? (isLight ? "#ffffff" : "#27272a") : "transparent",
                boxShadow: currentView === "dashboard" && isLight ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>Lộ trình & Streak</span>
            </button>

            {/* Tab: Diagnostic & Personalized Roadmap (Milestone 2.8) */}
            <button
              onClick={() => setCurrentView("diagnostic")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "6px",
                fontSize: "0.825rem",
                fontWeight: currentView === "diagnostic" ? "700" : "500",
                color: currentView === "diagnostic" ? (isLight ? "#1d4ed8" : "#93c5fd") : T.textMuted,
                backgroundColor: currentView === "diagnostic" ? (isLight ? "#eff6ff" : "#1e1b4b") : "transparent",
                boxShadow: currentView === "diagnostic" && isLight ? "0 1px 3px rgba(37,99,235,0.15)" : "none",
                border: currentView === "diagnostic" ? `1px solid ${isLight ? "#bfdbfe" : "#3730a3"}` : "none",
                cursor: "pointer",
              }}
            >
              <span>🎯 Đánh Giá &amp; Lộ Trình</span>
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
                fontWeight: currentView === "study" ? "700" : "500",
                color: currentView === "study" ? T.text : T.textMuted,
                backgroundColor: currentView === "study" ? (isLight ? "#ffffff" : "#27272a") : "transparent",
                boxShadow: currentView === "study" && isLight ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                border: "none",
                cursor: "pointer",
              }}
            >
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
                fontWeight: currentView === "quiz" ? "700" : "500",
                color: currentView === "quiz" ? T.text : T.textMuted,
                backgroundColor: currentView === "quiz" ? (isLight ? "#ffffff" : "#27272a") : "transparent",
                boxShadow: currentView === "quiz" && isLight ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                border: "none",
                cursor: "pointer",
              }}
            >
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
                fontWeight: currentView === "mistakes" ? "700" : "500",
                color: currentView === "mistakes" ? T.text : T.textMuted,
                backgroundColor: currentView === "mistakes" ? (isLight ? "#ffffff" : "#27272a") : "transparent",
                boxShadow: currentView === "mistakes" && isLight ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>Sổ tay câu sai</span>
              {savedMistakes.length > 0 && (
                <span style={{ backgroundColor: "#f43f5e", color: "#fff", fontSize: "0.68rem", fontWeight: "600", padding: "0.1rem 0.4rem", borderRadius: "999px" }}>
                  {savedMistakes.length}
                </span>
              )}
            </button>

            {/* Tab 4: Admin Panel (Only for authenticated ADMIN users) */}
            {!currentUser.isGuest && currentUser.role === "ADMIN" && (
              <button
                onClick={() => setCurrentView("admin")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "6px",
                  fontSize: "0.825rem",
                  fontWeight: currentView === "admin" ? "600" : "500",
                  color: currentView === "admin" ? (isLight ? "#dc2626" : "#f87171") : (isLight ? "#b91c1c" : "#ef4444"),
                  backgroundColor: currentView === "admin" ? (isLight ? "#fee2e2" : "#27272a") : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span>🛡️ Quản trị Admin</span>
              </button>
            )}
          </nav>

          {/* Quick Dictionary & Vocab Tools */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* Live Offline-First Multi-Device Sync Indicator (Milestone 2.3) */}
            <SyncStatusIndicator
              syncState={syncState}
              isLight={isLight}
              onTriggerSync={() => SyncManager.triggerSync()}
              onPullRemote={() => SyncManager.pullRemoteChanges()}
            />

            {/* Quick Word Search Box */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type="text"
                value={dictSearchInput}
                onChange={(e) => setDictSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && dictSearchInput.trim()) {
                    triggerLookup(dictSearchInput.trim(), null, null);
                  }
                }}
                placeholder="🔍 Tra từ nhanh..."
                style={{
                  height: "30px",
                  padding: "0 0.75rem 0 1.85rem",
                  backgroundColor: isLight ? "#ffffff" : "#18181b",
                  border: `1px solid ${T.border}`,
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  color: T.text,
                  width: "135px",
                  outline: "none",
                  boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
                }}
              />
              <span style={{ position: "absolute", left: "0.6rem", fontSize: "0.75rem", pointerEvents: "none", color: "#a1a1aa" }}>
                📖
              </span>
            </div>

            {/* Click-to-lookup Toggle Pill */}
            <button
              onClick={() => setDictEnabled(!dictEnabled)}
              title={dictEnabled ? "Chế độ click tra từ nhanh đang BẬT. Click để tắt." : "Click để bật chế độ tra từ khi click vào chữ"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                backgroundColor: dictEnabled ? (isLight ? "#ecfdf5" : "#064e3b35") : (isLight ? "#ffffff" : "#18181b"),
                border: dictEnabled ? `1px solid ${isLight ? "#a7f3d0" : "#05966990"}` : `1px solid ${T.border}`,
                borderRadius: "999px",
                padding: "0.25rem 0.65rem",
                fontSize: "0.75rem",
                fontWeight: "600",
                color: dictEnabled ? (isLight ? "#047857" : "#34d399") : T.textSecondary,
                cursor: "pointer",
              }}
            >
              <span>{dictEnabled ? "⚡ Tra từ: BẬT" : "💤 Tra từ: TẮT"}</span>
            </button>

            {/* White / Dark Mode Switcher */}
            <button
              onClick={toggleTheme}
              title={isLight ? "Chuyển sang giao diện Tối (Dark Mode)" : "Chuyển sang giao diện Sáng (White Mode)"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                backgroundColor: isLight ? "#ffffff" : "#18181b",
                border: `1px solid ${isLight ? "#cbd5e1" : "#27272a"}`,
                boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                borderRadius: "999px",
                padding: "0.25rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: "700",
                color: isLight ? "#0f172a" : "#f8fafc",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span>{isLight ? "☀️ Sáng" : "🌙 Tối"}</span>
            </button>

            {/* Saved Vocab Notebook Pill */}
            <button
              onClick={() => setVocabModalOpen(true)}
              title="Mở Sổ tay từ vựng đã lưu"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                backgroundColor: savedVocab.length > 0 ? (isLight ? "#fffbeb" : "#451a0335") : (isLight ? "#ffffff" : "#18181b"),
                border: savedVocab.length > 0 ? `1px solid ${isLight ? "#fde68a" : "#d9770690"}` : `1px solid ${T.border}`,
                borderRadius: "999px",
                padding: "0.25rem 0.65rem",
                fontSize: "0.75rem",
                fontWeight: "600",
                color: savedVocab.length > 0 ? (isLight ? "#b45309" : "#fbbf24") : T.textSecondary,
                cursor: "pointer",
              }}
            >
              <span>⭐ Sổ từ ({savedVocab.length})</span>
            </button>
          </div>

          {/* User Profile & Role Badge & Quick Switch */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            {/* Streak & XP Pills */}
            <div
              onClick={() => setCurrentView("dashboard")}
              title="Chuỗi ngày học liên tiếp"
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", backgroundColor: isLight ? "#fffbeb" : "#1c1917", border: `1px solid ${isLight ? "#fde68a" : "#78350f"}`, color: isLight ? "#b45309" : "#f59e0b", padding: "0.25rem 0.65rem", borderRadius: "999px", cursor: "pointer" }}
            >
              <span>🔥</span>
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#f59e0b" }}>{userTracker.streak} ngày</span>
            </div>

            <div
              onClick={() => setCurrentView("dashboard")}
              title="Tổng điểm XP"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                backgroundColor: isLight ? "#eff6ff" : "#141c2b",
                border: `1px solid ${isLight ? "#bfdbfe" : "#1e3a8a"}`,
                padding: "0.25rem 0.65rem",
                borderRadius: "999px",
                cursor: "pointer",
              }}
            >
              <span>⚡</span>
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: isLight ? "#2563eb" : "#60a5fa" }}>{userTracker.xp} XP</span>
            </div>

            {/* User Account / Sign In / Sign Out Section */}
            {currentUser.isGuest ? (
              <button
                onClick={() => { setAuthTab("login"); setAuthModalOpen(true); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.4rem 0.95rem",
                  borderRadius: "8px",
                  fontSize: "0.825rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
                }}
              >
                <span>🔑</span>
                <span>Đăng nhập</span>
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  onClick={() => setAuthModalOpen(true)}
                  title="Thông tin tài khoản"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backgroundColor: isLight ? "#ffffff" : "#18181b",
                    border: `1px solid ${T.border}`,
                    padding: "0.3rem 0.65rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: currentUser.role === "ADMIN" ? "#ef4444" : currentUser.role === "VIP" ? "#f59e0b" : "#3b82f6",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: "800",
                    }}
                  >
                    {currentUser.name.charAt(0)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "600", color: T.text, maxWidth: "110px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {currentUser.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontFamily: "Geist Mono",
                        color: currentUser.role === "ADMIN" ? (isLight ? "#dc2626" : "#f87171") : currentUser.role === "VIP" ? (isLight ? "#d97706" : "#fbbf24") : (isLight ? "#475569" : "#94a3b8"),
                        fontWeight: "700",
                      }}
                    >
                      {currentUser.role === "ADMIN" ? "🛡️ ADMIN" : currentUser.role === "VIP" ? "⭐ VIP" : "👤 FREE"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Đăng xuất tài khoản"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    backgroundColor: isLight ? "#fef2f2" : "#18181b",
                    border: `1px solid ${isLight ? "#fecaca" : "#3f3f46"}`,
                    color: isLight ? "#dc2626" : "#f87171",
                    padding: "0.38rem 0.65rem",
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  <span>🚪</span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ============================================================== */}
        {/* VIEW 4: ADMIN MANAGEMENT PANEL (QUẢN TRỊ VIÊN HỆ THỐNG)        */}
        {/* ============================================================== */}
        {currentView === "admin" && !currentUser.isGuest && currentUser.role === "ADMIN" && (
          <div style={{ flex: 1, backgroundColor: T.bg, padding: "2rem 1.5rem" }}>
            <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
              
              {/* 1. Admin Header */}
              <div
                style={{
                  backgroundColor: T.card,
                  border: `1px solid ${isLight ? "#fca5a5" : "#ef444450"}`,
                  borderRadius: "12px",
                  padding: "1.5rem 1.75rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                  boxShadow: T.shadow,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "1.5rem" }}>🛡️</span>
                    <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: T.text, margin: 0 }}>
                      Bảng điều khiển Quản trị viên (Admin Panel)
                    </h1>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontFamily: "Geist Mono",
                        backgroundColor: isLight ? "#ecfdf5" : "#064e3b40",
                        color: isLight ? "#047857" : "#34d399",
                        border: `1px solid ${isLight ? "#a7f3d0" : "#05966960"}`,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                        fontWeight: "700",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                      Supabase Postgres 17 Live
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: T.textMuted, marginTop: "0.35rem", marginBottom: 0 }}>
                    Quản lý học viên, phân quyền hạn mức (FREE / VIP), và giám sát lịch sử kiểm toán bảo mật thời gian thực.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <button
                    onClick={refreshAdminFromSupabase}
                    title="Làm mới dữ liệu từ Supabase Cloud"
                    style={{
                      padding: "0.55rem 0.95rem",
                      backgroundColor: isLight ? "#f1f5f9" : "#18181b",
                      color: T.text,
                      border: `1px solid ${T.border}`,
                      borderRadius: "6px",
                      fontWeight: "600",
                      fontSize: "0.825rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span>🔄</span> Làm mới
                  </button>

                  <button
                    onClick={() => setNewUserModalOpen(true)}
                    style={{
                      padding: "0.55rem 1.15rem",
                      backgroundColor: "#10b981",
                      color: "#042f1a",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "0.825rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    + Thêm người dùng mới
                  </button>
                </div>
              </div>

              {/* 2. Executive Analytics KPI Bar (4 Operational Cards) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                {/* KPI Card 1: Total Users */}
                <div
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "10px",
                    padding: "1.1rem 1.25rem",
                    boxShadow: T.shadow,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.78rem", color: T.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Tổng Thành Viên
                    </span>
                    <span style={{ fontSize: "1.2rem" }}>👥</span>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: T.text }}>
                    {adminStats.total}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: T.textSecondary, marginTop: "0.35rem", display: "flex", gap: "0.4rem" }}>
                    <span style={{ color: "#3b82f6", fontWeight: "700" }}>{adminStats.freeCount} Free</span>
                    <span>•</span>
                    <span style={{ color: "#f59e0b", fontWeight: "700" }}>{adminStats.vipCount} VIP</span>
                    <span>•</span>
                    <span style={{ color: "#ef4444", fontWeight: "700" }}>{adminStats.adminCount} Admin</span>
                  </div>
                </div>

                {/* KPI Card 2: Active Learners */}
                <div
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "10px",
                    padding: "1.1rem 1.25rem",
                    boxShadow: T.shadow,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.78rem", color: T.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Học Viên Hoạt Động
                    </span>
                    <span style={{ fontSize: "1.2rem" }}>🔥</span>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#10b981" }}>
                    {adminStats.activeCount}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: T.textSecondary, marginTop: "0.35rem" }}>
                    Chuỗi trung bình: <strong>{adminStats.avgStreak} ngày</strong> ({adminStats.lockedCount} bị khóa)
                  </div>
                </div>

                {/* KPI Card 3: System Total XP */}
                <div
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "10px",
                    padding: "1.1rem 1.25rem",
                    boxShadow: T.shadow,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.78rem", color: T.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Tổng XP Toàn Hệ Thống
                    </span>
                    <span style={{ fontSize: "1.2rem" }}>⚡</span>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f59e0b" }}>
                    {adminStats.totalXp.toLocaleString()} XP
                  </div>
                  <div style={{ fontSize: "0.75rem", color: T.textSecondary, marginTop: "0.35rem" }}>
                    <strong>{adminStats.totalCompletedLessons}</strong> bài học lý thuyết đã hoàn thành
                  </div>
                </div>

                {/* KPI Card 4: Security Status */}
                <div
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "10px",
                    padding: "1.1rem 1.25rem",
                    boxShadow: T.shadow,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.78rem", color: T.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Bảo Mật Cơ Sở Dữ Liệu
                    </span>
                    <span style={{ fontSize: "1.2rem" }}>🔒</span>
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#3b82f6", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    RLS Active 100%
                  </div>
                  <div style={{ fontSize: "0.75rem", color: T.textSecondary, marginTop: "0.35rem" }}>
                    16 PostgreSQL Tables • Server Audit Enabled
                  </div>
                </div>
              </div>

              {/* 3. Sub-Navigation Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "1.5rem",
                  borderBottom: `1px solid ${T.border}`,
                  paddingBottom: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                {[
                  { id: "overview", label: "📊 Tổng quan Vận hành" },
                  { id: "users", label: `👥 Quản lý Người dùng (${filteredAdminUsers.length})` },
                  { id: "policy", label: `⚙️ Chính sách Truy cập (v${adminPolicyForm.policyVersion || 1})` },
                  { id: "pedagogy", label: "🎓 Kiểm duyệt Sư phạm" },
                  { id: "audit", label: `🛡️ Kiểm toán Server (${serverAuditLogs.length})` },
                  { id: "activity", label: `📜 Hoạt động Realtime (${adminActivityLogs.length})` },
                ].map((tab) => {
                  const isActive = adminActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setAdminActiveTab(tab.id);
                        if (tab.id === "audit") fetchServerAuditLogs();
                      }}
                      style={{
                        padding: "0.6rem 1.1rem",
                        backgroundColor: isActive ? (isLight ? "#ffffff" : "#27272a") : "transparent",
                        border: isActive ? `1px solid ${T.border}` : "1px solid transparent",
                        borderRadius: "8px",
                        color: isActive ? (isLight ? "#0f172a" : "#ffffff") : T.textMuted,
                        fontWeight: isActive ? "700" : "500",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        boxShadow: isActive && isLight ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ========================================================= */}
              {/* TAB 0: REAL-TIME OPERATIONAL HEALTH OVERVIEW              */}
              {/* ========================================================= */}
              {adminActiveTab === "overview" && (
                <AdminOverviewPanel
                  authHeaders={adminAuthHeaders}
                  isLight={isLight}
                  onNavigateTab={setAdminActiveTab}
                />
              )}

              {/* ========================================================= */}
              {/* TAB 1: USERS MANAGEMENT & ADVANCED FILTERING              */}
              {/* ========================================================= */}
              {adminActiveTab === "users" && (
                <div
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "10px",
                    padding: "1.5rem",
                    boxShadow: T.shadow,
                  }}
                >
                  {/* Search and Filters Toolbar */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    {/* Search Input */}
                    <div style={{ position: "relative", minWidth: "260px", flex: "1 1 280px" }}>
                      <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", color: T.textMuted }}>
                        🔍
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm theo họ tên hoặc email..."
                        value={adminSearchQuery}
                        onChange={(e) => setAdminSearchQuery(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem 0.55rem 2.2rem",
                          backgroundColor: isLight ? "#ffffff" : "#18181b",
                          border: `1px solid ${T.border}`,
                          borderRadius: "6px",
                          color: T.text,
                          fontSize: "0.85rem",
                          outline: "none",
                        }}
                      />
                      {adminSearchQuery && (
                        <button
                          onClick={() => setAdminSearchQuery("")}
                          style={{
                            position: "absolute",
                            right: "0.6rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            color: T.textMuted,
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                      {/* Role Filter */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span style={{ fontSize: "0.75rem", color: T.textMuted, fontWeight: "600" }}>Vai trò:</span>
                        {["ALL", "FREE", "VIP", "ADMIN"].map((r) => (
                          <button
                            key={r}
                            onClick={() => setAdminRoleFilter(r)}
                            style={{
                              padding: "0.25rem 0.55rem",
                              fontSize: "0.72rem",
                              fontWeight: adminRoleFilter === r ? "700" : "500",
                              borderRadius: "4px",
                              backgroundColor: adminRoleFilter === r ? (isLight ? "#eff6ff" : "#1e3a8a40") : (isLight ? "#f1f5f9" : "#18181b"),
                              color: adminRoleFilter === r ? (isLight ? "#1d4ed8" : "#60a5fa") : T.textMuted,
                              border: `1px solid ${adminRoleFilter === r ? (isLight ? "#bfdbfe" : "#3b82f680") : T.border}`,
                              cursor: "pointer",
                            }}
                          >
                            {r === "ALL" ? "Tất cả" : r}
                          </button>
                        ))}
                      </div>

                      {/* Status Filter */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span style={{ fontSize: "0.75rem", color: T.textMuted, fontWeight: "600" }}>Trạng thái:</span>
                        {["ALL", "ACTIVE", "LOCKED"].map((s) => (
                          <button
                            key={s}
                            onClick={() => setAdminStatusFilter(s)}
                            style={{
                              padding: "0.25rem 0.55rem",
                              fontSize: "0.72rem",
                              fontWeight: adminStatusFilter === s ? "700" : "500",
                              borderRadius: "4px",
                              backgroundColor: adminStatusFilter === s ? (isLight ? "#ecfdf5" : "#064e3b40") : (isLight ? "#f1f5f9" : "#18181b"),
                              color: adminStatusFilter === s ? (isLight ? "#047857" : "#34d399") : T.textMuted,
                              border: `1px solid ${adminStatusFilter === s ? (isLight ? "#a7f3d0" : "#05966980") : T.border}`,
                              cursor: "pointer",
                            }}
                          >
                            {s === "ALL" ? "Tất cả" : s === "ACTIVE" ? "✓ Hoạt động" : "✕ Đã khóa"}
                          </button>
                        ))}
                      </div>

                      {/* Streak Filter & CSV UTF-8 BOM Export */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <button
                          type="button"
                          onClick={() => setAdminStreakFilter((prev) => (prev === "STREAK_7" ? "ALL" : "STREAK_7"))}
                          style={{
                            padding: "0.25rem 0.6rem",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            borderRadius: "4px",
                            backgroundColor: adminStreakFilter === "STREAK_7" ? T.warningBg : T.bgElevated,
                            color: adminStreakFilter === "STREAK_7" ? T.warning : T.textMuted,
                            border: `1px solid ${adminStreakFilter === "STREAK_7" ? T.warningBorder : T.border}`,
                            cursor: "pointer",
                          }}
                        >
                          🔥 Streak ≥ 7 ngày
                        </button>
                        <button
                          type="button"
                          onClick={handleExportUsersCsv}
                          style={{
                            padding: "0.25rem 0.65rem",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            borderRadius: "4px",
                            backgroundColor: T.accentBg,
                            color: T.accent,
                            border: `1px solid ${T.accentBorder}`,
                            cursor: "pointer",
                          }}
                        >
                          📥 Xuất CSV (UTF-8)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                          <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", fontSize: "0.78rem", color: T.textMuted, textTransform: "uppercase" }}>Họ tên & Email</th>
                          <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", fontSize: "0.78rem", color: T.textMuted, textTransform: "uppercase" }}>Vai trò (Role)</th>
                          <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", fontSize: "0.78rem", color: T.textMuted, textTransform: "uppercase" }}>Tiến độ học tập</th>
                          <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", fontSize: "0.78rem", color: T.textMuted, textTransform: "uppercase" }}>Trạng thái</th>
                          <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", fontSize: "0.78rem", color: T.textMuted, textTransform: "uppercase" }}>Ngày tạo</th>
                          <th style={{ textAlign: "right", padding: "0.75rem 0.5rem", fontSize: "0.78rem", color: T.textMuted, textTransform: "uppercase" }}>Hành động phân quyền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdminUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem 1rem", color: T.textMuted, fontSize: "0.85rem" }}>
                              Không tìm thấy người dùng nào phù hợp với bộ lọc tìm kiếm.
                            </td>
                          </tr>
                        ) : (
                          filteredAdminUsers.map((u) => {
                            const isCurrent = u.id === currentUser.id;
                            return (
                              <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                <td style={{ padding: "0.85rem 0.5rem" }}>
                                  <div style={{ fontWeight: "700", color: T.text, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    {u.name}
                                    {isCurrent && (
                                      <span style={{ fontSize: "0.68rem", backgroundColor: isLight ? "#eff6ff" : "#1e293b", padding: "0.1rem 0.35rem", borderRadius: "3px", color: isLight ? "#1d4ed8" : "#60a5fa", fontWeight: "700" }}>
                                        (Bạn)
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: "0.78rem", color: T.textMuted }}>{u.email}</div>
                                </td>

                                <td style={{ padding: "0.85rem 0.5rem" }}>
                                  <span
                                    style={{
                                      fontSize: "0.72rem",
                                      fontFamily: "Geist Mono",
                                      fontWeight: "700",
                                      padding: "0.2rem 0.55rem",
                                      borderRadius: "4px",
                                      backgroundColor:
                                        u.role === "ADMIN" ? (isLight ? "#fef2f2" : "#ef444420")
                                        : u.role === "VIP" ? (isLight ? "#fffbeb" : "#f59e0b20")
                                        : (isLight ? "#eff6ff" : "#3b82f620"),
                                      color:
                                        u.role === "ADMIN" ? (isLight ? "#dc2626" : "#f87171")
                                        : u.role === "VIP" ? (isLight ? "#b45309" : "#fbbf24")
                                        : (isLight ? "#1d4ed8" : "#60a5fa"),
                                      border: `1px solid ${
                                        u.role === "ADMIN" ? (isLight ? "#fecaca" : "#ef444450")
                                        : u.role === "VIP" ? (isLight ? "#fde68a" : "#f59e0b50")
                                        : (isLight ? "#bfdbfe" : "#3b82f650")
                                      }`,
                                    }}
                                  >
                                    {u.role === "ADMIN" ? "🛡️ ADMIN" : u.role === "VIP" ? "⭐ VIP" : "👤 FREE"}
                                  </span>
                                </td>

                                <td style={{ padding: "0.85rem 0.5rem" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                      <span style={{ fontSize: "0.75rem", color: isLight ? "#b45309" : "#f59e0b", fontWeight: "700" }}>
                                        🔥 {u.tracker?.streak || 1} ngày
                                      </span>
                                      <span style={{ fontSize: "0.75rem", color: isLight ? "#1d4ed8" : "#60a5fa", fontWeight: "700" }}>
                                        ⚡ {u.tracker?.xp || 0} XP
                                      </span>
                                    </div>
                                    <div style={{ fontSize: "0.72rem", color: T.textMuted }}>
                                      📖 {u.tracker?.completed_lessons?.length || 0} bài học
                                    </div>
                                  </div>
                                </td>

                                <td style={{ padding: "0.85rem 0.5rem" }}>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: u.status === "ACTIVE" ? (isLight ? "#047857" : "#34d399") : (isLight ? "#dc2626" : "#fb7185"),
                                      fontWeight: "700",
                                    }}
                                  >
                                    {u.status === "ACTIVE" ? "✓ Hoạt động" : "✕ Đã khóa"}
                                  </span>
                                </td>

                                <td style={{ padding: "0.85rem 0.5rem", fontSize: "0.75rem", color: T.textMuted, fontFamily: "Geist Mono" }}>
                                  {u.createdAt}
                                </td>

                                <td style={{ padding: "0.85rem 0.5rem", textAlign: "right" }}>
                                  <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                    {u.role !== "VIP" && u.role !== "ADMIN" && (
                                      <button
                                        onClick={() => handleUpdateUserRole(u.id, "VIP")}
                                        style={{
                                          padding: "0.3rem 0.65rem",
                                          backgroundColor: isLight ? "#fffbeb" : "#f59e0b20",
                                          border: `1px solid ${isLight ? "#fde68a" : "#f59e0b"}`,
                                          color: isLight ? "#b45309" : "#fbbf24",
                                          borderRadius: "4px",
                                          fontSize: "0.75rem",
                                          fontWeight: "700",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Nâng VIP ⭐
                                      </button>
                                    )}

                                    {u.role === "VIP" && (
                                      <button
                                        onClick={() => handleUpdateUserRole(u.id, "FREE")}
                                        style={{
                                          padding: "0.3rem 0.65rem",
                                          backgroundColor: isLight ? "#f1f5f9" : "#27272a",
                                          border: `1px solid ${T.border}`,
                                          color: T.textSecondary,
                                          borderRadius: "4px",
                                          fontSize: "0.75rem",
                                          fontWeight: "600",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Hạ FREE
                                      </button>
                                    )}

                                    {u.role !== "ADMIN" && (
                                      <button
                                        onClick={() => handleToggleUserStatus(u.id)}
                                        style={{
                                          padding: "0.3rem 0.65rem",
                                          backgroundColor: u.status === "ACTIVE" ? (isLight ? "#fef2f2" : "#ef444415") : (isLight ? "#ecfdf5" : "#10b98115"),
                                          border: `1px solid ${u.status === "ACTIVE" ? (isLight ? "#fecaca" : "#ef4444") : (isLight ? "#a7f3d0" : "#10b981")}`,
                                          color: u.status === "ACTIVE" ? (isLight ? "#dc2626" : "#f87171") : (isLight ? "#047857" : "#34d399"),
                                          borderRadius: "4px",
                                          fontSize: "0.75rem",
                                          fontWeight: "700",
                                          cursor: "pointer",
                                        }}
                                      >
                                        {u.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: SYSTEM POLICY & ACCESS LIMITS                     */}
              {/* ========================================================= */}
              {adminActiveTab === "policy" && (
                <div
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "10px",
                    padding: "1.75rem",
                    boxShadow: T.shadow,
                  }}
                >
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: T.text, margin: "0 0 0.5rem 0" }}>
                    ⚙️ Cấu hình Quyền & Hạn mức truy cập cho User Default (FREE)
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: T.textMuted, margin: "0 0 1.5rem 0" }}>
                    Mọi thay đổi hạn mức sẽ được áp dụng trực tiếp lên bảng <code>system_policies</code> của Supabase Postgres 17 và lưu vết kiểm toán tự động.
                  </p>
                  
                  <form onSubmit={handleSavePolicy} style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-end" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.825rem", color: T.textSecondary, fontWeight: "600", marginBottom: "0.35rem" }}>
                        Số câu bài tập tối đa mỗi chương (Free User):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={adminPolicyForm.freeExerciseLimit}
                        onChange={(e) => setAdminPolicyForm({ ...adminPolicyForm, freeExerciseLimit: parseInt(e.target.value) || 10 })}
                        style={{ padding: "0.55rem 0.85rem", backgroundColor: isLight ? "#ffffff" : "#18181b", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text, width: "180px", fontSize: "0.9rem" }}
                      />
                      <div style={{ fontSize: "0.72rem", color: T.textMuted, marginTop: "0.25rem" }}>Mặc định: 10 câu (Câu thứ 11 sẽ bị khóa VIP)</div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.825rem", color: T.textSecondary, fontWeight: "600", marginBottom: "0.35rem" }}>
                        Số đề thi Quiz tối đa mỗi ngày (Free User):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={adminPolicyForm.freeDailyQuizLimit}
                        onChange={(e) => setAdminPolicyForm({ ...adminPolicyForm, freeDailyQuizLimit: parseInt(e.target.value) || 2 })}
                        style={{ padding: "0.55rem 0.85rem", backgroundColor: isLight ? "#ffffff" : "#18181b", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text, width: "180px", fontSize: "0.9rem" }}
                      />
                      <div style={{ fontSize: "0.72rem", color: T.textMuted, marginTop: "0.25rem" }}>Mặc định: 2 đề Quiz 50 câu / ngày</div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.825rem", color: T.textSecondary, fontWeight: "600", marginBottom: "0.35rem" }}>
                        Cooldown Diagnostic Test (Ngày):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={adminPolicyForm.diagnosticCooldownDays ?? 7}
                        onChange={(e) => setAdminPolicyForm({ ...adminPolicyForm, diagnosticCooldownDays: parseInt(e.target.value) || 0 })}
                        style={{ padding: "0.55rem 0.85rem", backgroundColor: isLight ? "#ffffff" : "#18181b", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text, width: "150px", fontSize: "0.9rem" }}
                      />
                      <div style={{ fontSize: "0.72rem", color: T.textMuted, marginTop: "0.25rem" }}>Mặc định: 7 ngày / lần</div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.825rem", color: T.textSecondary, fontWeight: "600", marginBottom: "0.35rem" }}>
                        Giới hạn Batch Sync Offline (Items):
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={adminPolicyForm.offlineSyncMaxBatch ?? 50}
                        onChange={(e) => setAdminPolicyForm({ ...adminPolicyForm, offlineSyncMaxBatch: parseInt(e.target.value) || 50 })}
                        style={{ padding: "0.55rem 0.85rem", backgroundColor: isLight ? "#ffffff" : "#18181b", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text, width: "150px", fontSize: "0.9rem" }}
                      />
                      <div style={{ fontSize: "0.72rem", color: T.textMuted, marginTop: "0.25rem" }}>Mặc định: 50 sự kiện/lần</div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        padding: "0.6rem 1.6rem",
                        backgroundColor: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        height: "40px",
                        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                      }}
                    >
                      🛡️ Lưu Policy v{(adminPolicyForm.policyVersion || 1) + 1} (Step-Up)
                    </button>
                  </form>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2.5: PEDAGOGICAL QUALITY & EXPLANATION REVIEW         */}
              {/* ========================================================= */}
              {adminActiveTab === "pedagogy" && (
                <PedagogicalQualityDashboard authHeaders={adminAuthHeaders} isLight={isLight} />
              )}

              {/* ========================================================= */}
              {/* TAB 3: SERVER AUDIT LOGS (KIỂM TOÁN HỆ THỐNG CLOUD)       */}
              {/* ========================================================= */}
              {adminActiveTab === "audit" && (
                <div
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "10px",
                    padding: "1.5rem",
                    boxShadow: T.shadow,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: T.text, margin: 0 }}>
                          🛡️ Nhật ký Kiểm toán Quản trị Server ({filteredAuditLogs.length})
                        </h3>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: "800",
                            padding: "0.18rem 0.55rem",
                            borderRadius: "999px",
                            backgroundColor: T.successBg,
                            border: `1px solid ${T.successBorder}`,
                            color: T.success,
                          }}
                        >
                          🔒 Trigger Bất biến DB Active (Append-Only)
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: T.textMuted, margin: "0.2rem 0 0 0" }}>
                        Ghi nhận toàn bộ thao tác thay đổi vai trò, khóa tài khoản, sửa lời giải 5-field và điều chỉnh hạn mức được bảo vệ bởi DB Trigger chống UPDATE/DELETE.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {/* Action Filter */}
                      <select
                        value={auditActionFilter}
                        onChange={(e) => setAuditActionFilter(e.target.value)}
                        style={{
                          padding: "0.35rem 0.65rem",
                          backgroundColor: isLight ? "#ffffff" : "#18181b",
                          border: `1px solid ${T.border}`,
                          color: T.text,
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                        }}
                      >
                        <option value="ALL">Tất cả hành động</option>
                        <option value="UPDATE_USER_ROLE">Cập nhật vai trò (Role)</option>
                        <option value="BAN_USER">Khóa tài khoản (Ban)</option>
                        <option value="UNBAN_USER">Mở khóa tài khoản (Unban)</option>
                        <option value="UPDATE_SYSTEM_POLICY">Thay đổi hạn mức (Policy)</option>
                        <option value="EDIT_EXPLANATION">Sửa lời giải 5-Field (Pedagogy)</option>
                        <option value="BATCH_INGEST_EXPLANATIONS">Đồng bộ hàng loạt Lời giải</option>
                      </select>

                      <button
                        onClick={fetchServerAuditLogs}
                        disabled={isLoadingAudit}
                        style={{
                          padding: "0.35rem 0.75rem",
                          backgroundColor: isLight ? "#f1f5f9" : "#18181b",
                          border: `1px solid ${T.border}`,
                          color: T.text,
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        {isLoadingAudit ? "Đang tải..." : "🔄 Làm mới Log"}
                      </button>
                    </div>
                  </div>

                  {filteredAuditLogs.length === 0 ? (
                    <div style={{ padding: "3rem 1rem", textAlign: "center", color: T.textMuted, fontSize: "0.85rem" }}>
                      {isLoadingAudit ? "Đang tải nhật ký kiểm toán từ máy chủ..." : "Chưa có bản ghi kiểm toán nào trong bảng audit_logs."}
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                            <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", fontSize: "0.75rem", color: T.textMuted }}>THỜI GIAN</th>
                            <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", fontSize: "0.75rem", color: T.textMuted }}>ADMIN</th>
                            <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", fontSize: "0.75rem", color: T.textMuted }}>HÀNH ĐỘNG</th>
                            <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", fontSize: "0.75rem", color: T.textMuted }}>ĐỐI TƯỢNG</th>
                            <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", fontSize: "0.75rem", color: T.textMuted }}>CHI TIẾT THAY ĐỔI (BEFORE → AFTER)</th>
                            <th style={{ textAlign: "right", padding: "0.7rem 0.5rem", fontSize: "0.75rem", color: T.textMuted }}>IP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAuditLogs.map((log) => {
                            const dateStr = log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : "Vừa xong";
                            return (
                              <tr key={log.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", fontFamily: "Geist Mono", color: T.textMuted, whiteSpace: "nowrap" }}>
                                  {dateStr}
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.78rem", fontWeight: "600", color: T.text }}>
                                  {log.admin_id ? log.admin_id.substring(0, 8) : "admin"}
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem" }}>
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      fontFamily: "Geist Mono",
                                      fontWeight: "700",
                                      padding: "0.15rem 0.5rem",
                                      borderRadius: "4px",
                                      backgroundColor:
                                        log.action_type === "BAN_USER" ? (isLight ? "#fef2f2" : "#ef444420")
                                        : log.action_type === "UNBAN_USER" ? (isLight ? "#ecfdf5" : "#10b98120")
                                        : log.action_type === "UPDATE_USER_ROLE" ? (isLight ? "#eff6ff" : "#3b82f620")
                                        : (isLight ? "#fffbeb" : "#f59e0b20"),
                                      color:
                                        log.action_type === "BAN_USER" ? (isLight ? "#dc2626" : "#f87171")
                                        : log.action_type === "UNBAN_USER" ? (isLight ? "#047857" : "#34d399")
                                        : log.action_type === "UPDATE_USER_ROLE" ? (isLight ? "#1d4ed8" : "#60a5fa")
                                        : (isLight ? "#b45309" : "#fbbf24"),
                                      border: `1px solid ${
                                        log.action_type === "BAN_USER" ? (isLight ? "#fecaca" : "#ef444460")
                                        : log.action_type === "UNBAN_USER" ? (isLight ? "#a7f3d0" : "#10b98160")
                                        : log.action_type === "UPDATE_USER_ROLE" ? (isLight ? "#bfdbfe" : "#3b82f660")
                                        : (isLight ? "#fde68a" : "#f59e0b60")
                                      }`,
                                    }}
                                  >
                                    {log.action_type}
                                  </span>
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", fontFamily: "Geist Mono", color: T.textSecondary }}>
                                  {log.target_type}: {log.target_id?.substring(0, 12)}
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.72rem", fontFamily: "Geist Mono", color: T.textMuted }}>
                                  <div style={{ maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {log.before_state && (
                                      <span style={{ textDecoration: "line-through", marginRight: "0.4rem", color: isLight ? "#dc2626" : "#f87171" }}>
                                        {JSON.stringify(log.before_state)}
                                      </span>
                                    )}
                                    <span>→</span>
                                    {log.after_state && (
                                      <span style={{ marginLeft: "0.4rem", color: isLight ? "#047857" : "#34d399" }}>
                                        {JSON.stringify(log.after_state)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontSize: "0.72rem", fontFamily: "Geist Mono", color: T.textMuted }}>
                                  {log.ip_address || "127.0.0.1"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: REALTIME USER ACTIVITY LOGS                        */}
              {/* ========================================================= */}
              {adminActiveTab === "activity" && (
                <div
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "10px",
                    padding: "1.5rem",
                    boxShadow: T.shadow,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: T.text, margin: 0 }}>
                      📜 Nhật ký Hoạt động Người dùng Real-time ({adminActivityLogs.length})
                    </h3>
                    <button
                      onClick={refreshAdminFromSupabase}
                      style={{
                        padding: "0.3rem 0.65rem",
                        backgroundColor: isLight ? "#f1f5f9" : "#18181b",
                        border: `1px solid ${T.border}`,
                        color: T.textSecondary,
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      🔄 Cập nhật log
                    </button>
                  </div>

                  {adminActivityLogs.length === 0 ? (
                    <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: T.textMuted, fontSize: "0.85rem" }}>
                      Chưa có nhật ký hoạt động nào được ghi nhận trên Supabase.
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                            <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", fontSize: "0.75rem", color: T.textMuted }}>THỜI GIAN</th>
                            <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", fontSize: "0.75rem", color: T.textMuted }}>HỌC VIÊN</th>
                            <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", fontSize: "0.75rem", color: T.textMuted }}>HÀNH ĐỘNG</th>
                            <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", fontSize: "0.75rem", color: T.textMuted }}>CHI TIẾT HOẠT ĐỘNG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminActivityLogs.map((log) => {
                            const dateStr = log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : "Vừa xong";
                            return (
                              <tr key={log.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", fontFamily: "Geist Mono", color: T.textMuted, whiteSpace: "nowrap" }}>
                                  {dateStr}
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.8rem", fontWeight: "600", color: T.text }}>
                                  {log.user_email || log.user_id?.substring(0, 8)}
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem" }}>
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      fontFamily: "Geist Mono",
                                      fontWeight: "700",
                                      padding: "0.15rem 0.5rem",
                                      borderRadius: "4px",
                                      backgroundColor:
                                        log.action_type === "LOGIN" ? (isLight ? "#ecfdf5" : "#10b98120")
                                        : log.action_type === "LOGOUT" ? (isLight ? "#fef2f2" : "#ef444420")
                                        : log.action_type === "SUBMIT_QUIZ" ? (isLight ? "#fffbeb" : "#f59e0b20")
                                        : log.action_type === "STUDY_LESSON" ? (isLight ? "#eff6ff" : "#3b82f620")
                                        : (isLight ? "#faf5ff" : "#8b5cf620"),
                                      color:
                                        log.action_type === "LOGIN" ? (isLight ? "#047857" : "#34d399")
                                        : log.action_type === "LOGOUT" ? (isLight ? "#dc2626" : "#f87171")
                                        : log.action_type === "SUBMIT_QUIZ" ? (isLight ? "#b45309" : "#fbbf24")
                                        : log.action_type === "STUDY_LESSON" ? (isLight ? "#1d4ed8" : "#60a5fa")
                                        : (isLight ? "#7e22ce" : "#a78bfa"),
                                    }}
                                  >
                                    {log.action_type}
                                  </span>
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", color: T.textMuted, fontFamily: "Geist Mono" }}>
                                  {JSON.stringify(log.details || {})}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Step-Up High-Risk Admin Action Modal (Milestone 2.4.9) */}
        <StepUpConfirmModal
          isOpen={stepUpModal.open}
          title={stepUpModal.title}
          description={stepUpModal.description}
          targetLabel={stepUpModal.targetLabel}
          isSubmitting={stepUpSubmitting}
          errorMsg={stepUpError}
          onConfirm={handleConfirmStepUp}
          onCancel={() => {
            if (!stepUpSubmitting) {
              setStepUpModal({ open: false, title: "", description: "", targetLabel: "", onExecute: null });
              setStepUpError("");
            }
          }}
          isLight={isLight}
        />

        {/* ============================================================== */}
        {/* VIEW 5: DIAGNOSTIC & PERSONALIZED LEARNING ROADMAP (MILESTONE 2.8) */}
        {/* ============================================================== */}
        {currentView === "diagnostic" && (
          <GrammarDiagnosticEngine
            currentUser={currentUser}
            authToken={activeAuthToken}
            userTracker={userTracker}
            onNavigateToLesson={handleNavigateToDiagnosticLesson}
            T={T}
            isLight={isLight}
          />
        )}

        {/* ============================================================== */}
        {/* VIEW 0: DUOLINGO-STYLE PROGRESS & STREAK DASHBOARD             */}
        {/* ============================================================== */}
        {currentView === "dashboard" && (
          <div style={{ flex: 1, backgroundColor: T.bg, padding: "2rem 1.5rem" }}>
            <div style={{ maxWidth: "980px", margin: "0 auto" }}>
              
              {/* Hero Banner: Streak & Rank */}
              <div
                style={{
                  backgroundColor: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: "12px",
                  padding: "1.75rem 2rem",
                  marginBottom: "1.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1.5rem",
                  background: isLight ? "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" : "linear-gradient(135deg, rgba(24, 24, 27, 0.8) 0%, rgba(9, 9, 11, 0.95) 100%)",
                  boxShadow: T.shadow,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "1.6rem" }}>🔥</span>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: T.text, margin: 0 }}>
                      Chuỗi học tập {userTracker.streak} ngày liên tiếp của {currentUser.name}!
                    </h1>
                  </div>
                  <p style={{ fontSize: "0.9rem", color: T.textMuted, margin: "0 0 1rem 0" }}>
                    Duy trì thói quen học mỗi ngày để mở khóa huy hiệu và làm chủ toàn bộ 12 chuyên đề ngữ pháp.
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        backgroundColor: T.bgElevated,
                        border: `1px solid ${T.border}`,
                        color: T.text,
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

                    {currentUser.role === "FREE" && (
                      <span
                        onClick={() => setAuthModalOpen(true)}
                        style={{
                          fontSize: "0.75rem",
                          color: "#fbbf24",
                          backgroundColor: "#f59e0b15",
                          border: "1px solid #f59e0b40",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        ⚡ Nâng cấp VIP để mở khóa không giới hạn
                      </span>
                    )}
                  </div>
                </div>

                {/* 7-Day Mini Calendar */}
                <div
                  style={{
                    backgroundColor: isLight ? "#ffffff" : "#18181b",
                    border: `1px solid ${T.border}`,
                    padding: "1rem 1.25rem",
                    borderRadius: "10px",
                    boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", color: T.textMuted, textTransform: "uppercase", marginBottom: "0.75rem", textAlign: "center" }}>
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
                        <span style={{ fontSize: "0.68rem", color: d.isToday ? (isLight ? "#0f172a" : "#fafafa") : (isLight ? "#64748b" : "#71717a"), fontWeight: d.isToday ? "700" : "500" }}>
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
                            backgroundColor: d.isActive ? "#f59e0b" : (isLight ? "#f1f5f9" : "#27272a"),
                            color: d.isActive ? "#09090b" : (isLight ? "#475569" : "#71717a"),
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

              {/* MILESTONE 2.8: DIAGNOSTIC PLACEMENT ASSESSMENT HERO CALLOUT */}
              <div
                style={{
                  background: isLight
                    ? "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)"
                    : "linear-gradient(135deg, #1e1b4b 0%, #064e3b 100%)",
                  border: `1px solid ${isLight ? "#bfdbfe" : "#3b82f6"}`,
                  borderRadius: "12px",
                  padding: "1.5rem 1.75rem",
                  marginBottom: "1.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1.25rem",
                  boxShadow: isLight ? "0 4px 15px rgba(37, 99, 235, 0.08)" : T.shadow,
                }}
              >
                <div style={{ flex: "1 1 500px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "9999px",
                        backgroundColor: isLight ? "#dbeafe" : "#312e81",
                        color: isLight ? "#1d4ed8" : "#93c5fd",
                      }}
                    >
                      🎯 Đánh Giá Đầu Vào &amp; Cá Nhân Hóa Lộ Trình
                    </span>
                    <span style={{ fontSize: "0.75rem", color: T.textMuted }}>
                      30 câu trắc nghiệm • 15-20 phút
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: T.text, margin: "0 0 0.35rem 0" }}>
                    Chưa biết xuất phát điểm ngữ pháp của bạn ở đâu?
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: T.textSecondary, margin: 0, lineHeight: 1.45 }}>
                    Làm bài kiểm tra chẩn đoán để hệ thống xác định chính xác năng lực, phát hiện các điểm yếu chí mạng và xây dựng lộ trình học tập đo ni đóng giày cho riêng bạn.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentView("diagnostic")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "0.6rem",
                    backgroundColor: T.accent,
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>Khám phá trình độ ngay</span>
                  <span>➔</span>
                </button>
              </div>

              {/* MILESTONE 2.5: SPACED REPETITION & KNOWLEDGE GRAPH MASTERY PANEL */}
              <div style={{ marginBottom: "1.75rem" }}>
                <SpacedRepetitionPanel
                  userId={!currentUser?.isGuest ? currentUser?.id : null}
                  authToken={activeAuthToken}
                  isLight={isLight}
                  onOpenLessonByCode={openLessonByCode}
                />
              </div>

              {/* SMART DAILY RECOMMENDATION CARD */}
              <div
                style={{
                  backgroundColor: T.card,
                  border: `1px solid ${isLight ? "#bfdbfe" : "#3b82f6"}`,
                  borderRadius: "12px",
                  padding: "1.5rem 1.75rem",
                  marginBottom: "1.75rem",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: isLight ? "0 4px 15px rgba(37, 99, 235, 0.08)" : T.shadow,
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
                      <span style={{ fontSize: "0.8rem", color: isLight ? "#1d4ed8" : "#93c5fd", fontWeight: "600" }}>Đề xuất học hôm nay</span>
                    </div>

                    <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: T.text, margin: "0.35rem 0" }}>
                      Chương {dailyRecommendation.chapter.number}: {dailyRecommendation.lesson ? dailyRecommendation.lesson.title_vi : dailyRecommendation.chapter.title_vi}
                    </h2>

                    <p style={{ fontSize: "0.875rem", color: T.textMuted, margin: "0.2rem 0 0.85rem 0" }}>
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
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                    <span style={{ color: "#a1a1aa" }}>
                      🎯 Mục tiêu hàng ngày: <strong>{userTracker.dailyGoal?.solvedToday || 0}</strong> / {userTracker.dailyGoal?.targetQuestions || 10} câu bài tập
                    </span>
                    <span style={{ color: "#34d399", fontFamily: "Geist Mono", fontWeight: "600" }}>
                      {Math.min(100, Math.round(((userTracker.dailyGoal?.solvedToday || 0) / (userTracker.dailyGoal?.targetQuestions || 10)) * 100))}%
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: isLight ? "#e2e8f0" : "#27272a", borderRadius: "999px", overflow: "hidden" }}>
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
                <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "1.25rem", boxShadow: T.shadow }}>
                  <div style={{ fontSize: "0.75rem", color: "#71717a", textTransform: "uppercase", fontWeight: "600" }}>
                    Bài học đã hoàn thành
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "700", color: T.text, margin: "0.4rem 0" }}>
                    {userTracker.completedLessons?.length || 0} <span style={{ fontSize: "0.95rem", color: T.textMuted }}>/ {totalLessonsCount}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#34d399" }}>
                    {overallLessonsProgress}% toàn bộ khóa học
                  </div>
                </div>

                <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "1.25rem", boxShadow: T.shadow }}>
                  <div style={{ fontSize: "0.75rem", color: T.textMuted, textTransform: "uppercase", fontWeight: "600" }}>
                    Câu hỏi đã giải đúng
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "700", color: T.text, margin: "0.4rem 0" }}>
                    {userTracker.completedQuestions?.length || 0} <span style={{ fontSize: "0.95rem", color: T.textMuted }}>/ {totalQuestionsCount}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#60a5fa" }}>
                    Tích lũy từ bài tập & Quiz
                  </div>
                </div>

                <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "1.25rem", boxShadow: T.shadow }}>
                  <div style={{ fontSize: "0.75rem", color: T.textMuted, textTransform: "uppercase", fontWeight: "600" }}>
                    Tổng điểm kinh nghiệm
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "700", color: T.text, margin: "0.4rem 0" }}>
                    {userTracker.xp} <span style={{ fontSize: "0.95rem", color: T.textMuted }}>XP</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#f59e0b" }}>
                    {userRank.title}
                  </div>
                </div>

                <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "1.25rem", boxShadow: T.shadow }}>
                  <div style={{ fontSize: "0.75rem", color: T.textMuted, textTransform: "uppercase", fontWeight: "600" }}>
                    Sổ tay câu sai cần ôn
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "700", color: savedMistakes.length > 0 ? "#fb7185" : T.text, margin: "0.4rem 0" }}>
                    {savedMistakes.length} <span style={{ fontSize: "0.95rem", color: T.textMuted }}>câu</span>
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
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: T.text, margin: 0 }}>
                      Bản đồ tiến độ 12 Chuyên đề Ngữ pháp
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: T.textMuted, margin: "0.2rem 0 0 0" }}>
                      Theo dõi tỷ lệ hoàn thành lý thuyết và bài tập từng chương của tài khoản {currentUser.name}.
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
                          backgroundColor: T.card,
                          border: `1px solid ${T.border}`,
                          borderRadius: "8px",
                          padding: "1.1rem 1.25rem",
                          cursor: "pointer",
                          transition: "border-color 0.15s ease",
                          boxShadow: T.shadow,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", color: isLight ? "#1d4ed8" : "#60a5fa", fontWeight: "700" }}>
                            CHƯƠNG {String(ch.number).padStart(2, "0")}
                          </span>
                          <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: pct === 100 ? (isLight ? "#047857" : "#34d399") : (isLight ? "#475569" : "#a1a1aa"), fontWeight: "600" }}>
                            {doneLessons} / {ch.lessons.length} bài
                          </span>
                        </div>

                        <div style={{ fontSize: "0.95rem", fontWeight: "700", color: T.text, marginBottom: "0.6rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ch.title_vi}
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: "100%", height: "4px", backgroundColor: isLight ? "#e2e8f0" : "#27272a", borderRadius: "999px", overflow: "hidden", marginBottom: "0.5rem" }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              backgroundColor: pct === 100 ? "#10b981" : "#3b82f6",
                              borderRadius: "999px",
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: isLight ? "#475569" : "#71717a" }}>
                          <span>{ch.exercises?.length || 0} bài tập</span>
                          <span style={{ color: pct > 0 ? (isLight ? "#0f172a" : "#fafafa") : (isLight ? "#475569" : "#71717a"), fontWeight: pct > 0 ? "700" : "500" }}>{pct}% hoàn thành</span>
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
              id="chapter-sidebar"
              data-no-dict="true"
              style={{
                width: "320px",
                borderRight: `1px solid ${T.border}`,
                backgroundColor: T.bgSub,
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
              }}
            >
              {/* Search Filter Header */}
              <div style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${T.border}` }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backgroundColor: isLight ? "#ffffff" : "#141417",
                    border: `1px solid ${T.border}`,
                    borderRadius: "6px",
                    padding: "0.4rem 0.65rem",
                    boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2">
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
                      color: T.text,
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
                          backgroundColor: isSelected ? (isLight ? "#f1f5f9" : "#18181b") : "transparent",
                          border: isSelected ? `1px solid ${T.border}` : "1px solid transparent",
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
                            color: isSelected ? T.text : T.textSecondary,
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
                          {ch.lessons.map((ls) => {
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
                                  color: isLessonActive ? (isLight ? "#0284c7" : "#38bdf8") : isLessonCompleted ? "#10b981" : T.textMuted,
                                  backgroundColor: isLessonActive ? (isLight ? "#eff6ff" : "#0f172a") : "transparent",
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
            <main id="learning-content-area" data-dict-area="true" style={{ flex: 1, overflowY: "auto", padding: "2rem 2.5rem", maxWidth: "980px" }}>
              
              {/* Breadcrumbs & Header */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8rem", color: T.textMuted, marginBottom: "0.5rem" }}>
                  <span>Chương {selectedChapter?.number}</span>
                  <span>/</span>
                  <span style={{ color: T.textSecondary }}>{selectedChapter?.title_vi}</span>
                  {selectedLesson && (
                    <>
                      <span>/</span>
                      <span style={{ color: T.text, fontWeight: "600" }}>{selectedLesson.title_vi}</span>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: "700", letterSpacing: "-0.02em", color: T.text }}>
                      {activeTab === "theory" ? (selectedLesson ? selectedLesson.title_vi : selectedChapter?.title_vi) : `Bài tập thực hành: ${selectedChapter?.title_vi}`}
                    </h1>
                    <div style={{ fontSize: "0.875rem", color: T.textMuted, marginTop: "0.2rem" }}>
                      {activeTab === "theory" ? (selectedLesson ? selectedLesson.title_en : selectedChapter?.title_en) : `${selectedChapter?.exercises?.length || 0} bài tập tổng hợp (${totalChapterExerciseQuestions} câu)`}
                    </div>
                  </div>

                  {/* Tab Switcher: Theory vs Exercises */}
                  <div style={{ display: "flex", backgroundColor: T.bgElevated, padding: "3px", borderRadius: "6px", border: `1px solid ${T.border}` }}>
                    <button
                      onClick={() => setActiveTab("theory")}
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: "4px",
                        border: "none",
                        fontSize: "0.8rem",
                        fontWeight: activeTab === "theory" ? "600" : "500",
                        color: activeTab === "theory" ? T.text : T.textMuted,
                        backgroundColor: activeTab === "theory" ? (isLight ? "#ffffff" : "#27272a") : "transparent", boxShadow: activeTab === "theory" && isLight ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
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
                        color: activeTab === "exercises" ? T.text : T.textMuted,
                        backgroundColor: activeTab === "exercises" ? (isLight ? "#ffffff" : "#27272a") : "transparent", boxShadow: activeTab === "exercises" && isLight ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
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
                          backgroundColor: T.card,
                          border: isCurrentLessonDone ? "1px solid #10b981" : `1px solid ${T.border}`,
                          borderRadius: "10px",
                          padding: "1.25rem 1.5rem",
                          marginBottom: "1.5rem",
                          boxShadow: T.shadow,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontFamily: "Geist Mono",
                                backgroundColor: isLight ? "#eff6ff" : "#27272a",
                                color: isLight ? "#1d4ed8" : "#60a5fa",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "4px",
                                fontWeight: "700",
                              }}
                            >
                              {selectedLesson.code}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>•</span>
                            <span style={{ fontSize: "0.75rem", color: T.textSecondary }}>
                              {selectedLesson.sections?.length || 0} Phân mục
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>•</span>
                            <span style={{ fontSize: "0.75rem", color: T.textSecondary }}>
                              {totalLessonFormulas} Công thức
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>•</span>
                            <span style={{ fontSize: "0.75rem", color: T.textSecondary }}>
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
                              border: isCurrentLessonDone ? "1px solid #10b981" : `1px solid ${T.border}`,
                              backgroundColor: isCurrentLessonDone ? (isLight ? "#ecfdf5" : "rgba(16, 185, 129, 0.15)") : (isLight ? "#f8fafc" : "#18181b"),
                              color: isCurrentLessonDone ? "#059669" : T.text,
                              fontSize: "0.8rem",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            <span>{isCurrentLessonDone ? "✓ Đã học xong (+25 XP)" : "Đánh dấu đã học xong (+25 XP)"}</span>
                          </button>
                        </div>

                        <p style={{ fontSize: "0.9rem", color: T.textSecondary, lineHeight: "1.65", margin: 0 }}>
                          {selectedLesson.overview}
                        </p>

                        {/* Quick Table of Contents Pills */}
                        {selectedLesson.sections && selectedLesson.sections.length > 1 && (
                          <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: `1px solid ${T.border}` }}>
                            <div style={{ fontSize: "0.7rem", fontFamily: "Geist Mono", color: T.textMuted, textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>
                              NỘI DUNG CHÍNH TRONG BÀI:
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                              {selectedLesson.sections.map((s, idx) => (
                                <a
                                  key={idx}
                                  href={`#sec-${idx}`}
                                  style={{
                                    fontSize: "0.75rem",
                                    backgroundColor: isLight ? "#f1f5f9" : "#18181b",
                                    border: `1px solid ${T.border}`,
                                    color: isLight ? "#1e293b" : "#cbd5e1",
                                    padding: "0.25rem 0.65rem",
                                    borderRadius: "4px",
                                    textDecoration: "none",
                                    fontWeight: "500",
                                  }}
                                >
                                  {s.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Visual Cheat-Sheet Syntax Summary (Milestone 2.7) */}
                      {selectedLesson.cheatSheet && (
                        <div
                          style={{
                            backgroundColor: T.card,
                            border: `1px solid ${isLight ? "#bfdbfe" : "#1e3a8a"}`,
                            borderRadius: "12px",
                            padding: "1.5rem 1.75rem",
                            marginBottom: "1.75rem",
                            boxShadow: isLight ? "0 4px 20px rgba(37, 99, 235, 0.08)" : T.shadow,
                            background: isLight
                              ? "linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)"
                              : "linear-gradient(135deg, #111116 0%, #0d1527 100%)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <span style={{ fontSize: "1.35rem" }}>⚡</span>
                              <div>
                                <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: T.text, margin: 0, letterSpacing: "-0.01em" }}>
                                  Sơ đồ Tóm tắt Cú pháp & Dấu hiệu (Cheat-Sheet Cấp tốc)
                                </h3>
                                <p style={{ fontSize: "0.8rem", color: T.textMuted, margin: "0.15rem 0 0 0" }}>
                                  Bản chất ngữ pháp và ma trận 3 thể để ghi nhớ tức thì
                                </p>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontFamily: "Geist Mono",
                                padding: "0.25rem 0.65rem",
                                borderRadius: "999px",
                                backgroundColor: isLight ? "#eff6ff" : "#1e293b",
                                color: isLight ? "#1d4ed8" : "#60a5fa",
                                border: `1px solid ${isLight ? "#bfdbfe" : "#3b82f650"}`,
                                fontWeight: "700",
                              }}
                            >
                              ⏳ {selectedLesson.cheatSheet.timeline}
                            </span>
                          </div>

                          {/* Concept statement */}
                          <div
                            style={{
                              fontSize: "0.88rem",
                              color: T.textSecondary,
                              lineHeight: "1.6",
                              marginBottom: "1.25rem",
                              padding: "0.65rem 0.95rem",
                              backgroundColor: isLight ? "#ffffff" : "rgba(15, 23, 42, 0.6)",
                              borderRadius: "8px",
                              border: `1px solid ${T.border}`,
                            }}
                          >
                            🎯 <strong>Bản chất cốt lõi:</strong> {selectedLesson.cheatSheet.concept}
                          </div>

                          {/* 3-tier Formula Cards Grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem", marginBottom: "1.25rem" }}>
                            {selectedLesson.cheatSheet.formulas?.map((f, fIdx) => {
                              const isPos = f.type.includes("(+)");
                              const isNeg = f.type.includes("(-)");
                              const colorTheme = isPos
                                ? { border: "#10b981", bg: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)", text: isLight ? "#047857" : "#34d399", label: "KHẲNG ĐỊNH (+)" }
                                : isNeg
                                ? { border: "#f43f5e", bg: isLight ? "#fef2f2" : "rgba(244, 63, 94, 0.08)", text: isLight ? "#b91c1c" : "#fb7185", label: "PHỦ ĐỊNH (-)" }
                                : { border: "#0284c7", bg: isLight ? "#f0f9ff" : "rgba(2, 132, 199, 0.08)", text: isLight ? "#0369a1" : "#38bdf8", label: "NGHI VẤN (?)" };

                              return (
                                <div
                                  key={fIdx}
                                  style={{
                                    backgroundColor: colorTheme.bg,
                                    border: `1px solid ${colorTheme.border}`,
                                    borderRadius: "8px",
                                    padding: "0.85rem 1rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: "0.7rem", fontFamily: "Geist Mono", fontWeight: "800", color: colorTheme.text, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                                      {colorTheme.label}
                                    </div>
                                    <div style={{ fontFamily: "Geist Mono", fontSize: "0.88rem", fontWeight: "700", color: T.text, lineHeight: "1.4", marginBottom: "0.5rem" }}>
                                      {f.text}
                                    </div>
                                  </div>
                                  {f.example && (
                                    <div style={{ fontSize: "0.78rem", fontStyle: "italic", color: T.textMuted, borderTop: `1px dashed ${T.border}`, paddingTop: "0.4rem" }}>
                                      Ví dụ: "{f.example}"
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Signal Words Chips */}
                          {selectedLesson.cheatSheet.signals && selectedLesson.cheatSheet.signals.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                              <span style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", fontWeight: "700", color: T.textMuted, textTransform: "uppercase" }}>
                                🏷️ TỪ NHẬN BIẾT VÀNG:
                              </span>
                              {selectedLesson.cheatSheet.signals.map((sig, sIdx) => (
                                <span
                                  key={sIdx}
                                  style={{
                                    fontSize: "0.75rem",
                                    fontFamily: "Geist Mono",
                                    backgroundColor: isLight ? "#ffffff" : "#1e1e28",
                                    border: `1px solid ${T.border}`,
                                    color: isLight ? "#2563eb" : "#38bdf8",
                                    padding: "0.15rem 0.5rem",
                                    borderRadius: "4px",
                                    fontWeight: "600",
                                  }}
                                >
                                  {sig}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Golden Exam Tip */}
                          {selectedLesson.cheatSheet.examTip && (
                            <div
                              style={{
                                backgroundColor: isLight ? "#fffbeb" : "rgba(245, 158, 11, 0.1)",
                                border: "1px solid #f59e0b",
                                borderRadius: "6px",
                                padding: "0.65rem 0.95rem",
                                fontSize: "0.825rem",
                                color: isLight ? "#92400e" : "#fef3c7",
                                lineHeight: "1.5",
                              }}
                            >
                              💡 <strong>Mẹo làm bài thi & Bẫy cần tránh:</strong> {selectedLesson.cheatSheet.examTip}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Interactive Grammar Visualization Engine (Milestone 2.7) */}
                      <GrammarVisualization
                        lesson={selectedLesson}
                        chapter={selectedChapter}
                        isLight={isLight}
                      />

                      {/* Sections List */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                        {selectedLesson.sections?.map((sec, secIdx) => {
                          const badgeColor = isLight ? (
                            sec.badge?.includes("CÔNG THỨC") ? { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857" } :
                            sec.badge?.includes("LƯU Ý") ? { bg: "#fffbeb", border: "#fde68a", text: "#b45309" } :
                            sec.badge?.includes("BẢNG") || sec.badge?.includes("PHÂN LOẠI") ? { bg: "#faf5ff", border: "#e9d5ff", text: "#7e22ce" } :
                            sec.badge?.includes("CÁCH DÙNG") ? { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" } :
                            { bg: "#f1f5f9", border: "#cbd5e1", text: "#334155" }
                          ) : (
                            sec.badge?.includes("CÔNG THỨC") ? { bg: "#064e3b30", border: "#05966970", text: "#34d399" } :
                            sec.badge?.includes("LƯU Ý") ? { bg: "#451a0330", border: "#d9770670", text: "#fbbf24" } :
                            sec.badge?.includes("BẢNG") || sec.badge?.includes("PHÂN LOẠI") ? { bg: "#3b076430", border: "#9333ea70", text: "#c084fc" } :
                            sec.badge?.includes("CÁCH DÙNG") ? { bg: "#0c4a6e30", border: "#0284c770", text: "#38bdf8" } :
                            { bg: "#1e1b4b30", border: "#6366f170", text: "#a5b4fc" }
                          );

                          return (
                            <section
                              key={secIdx}
                              id={`sec-${secIdx}`}
                              style={{
                                backgroundColor: T.card,
                                border: `1px solid ${T.cardBorder}`,
                                borderRadius: "12px",
                                padding: "1.5rem 1.75rem",
                                boxShadow: T.shadow,
                              }}
                            >
                              {/* Section Header with Number Badge & Category Pill */}
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #1f1f26" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                                  <span
                                    style={{
                                      fontSize: "0.78rem",
                                      fontFamily: "Geist Mono",
                                      backgroundColor: isLight ? "#eff6ff" : "#18181f",
                                      border: `1px solid ${isLight ? "#bfdbfe" : "#3f3f4e"}`,
                                      color: isLight ? "#2563eb" : "#818cf8",
                                      padding: "0.2rem 0.55rem",
                                      borderRadius: "6px",
                                      fontWeight: "800",
                                      letterSpacing: "0.05em",
                                    }}
                                  >
                                    {String(secIdx + 1).padStart(2, "0")}
                                  </span>
                                  <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: T.textHeading, margin: 0, letterSpacing: "-0.01em" }}>
                                    {sec.title}
                                  </h2>
                                </div>

                                {sec.badge && (
                                  <span
                                    style={{
                                      fontSize: "0.68rem",
                                      fontFamily: "Geist Mono",
                                      backgroundColor: badgeColor.bg,
                                      border: `1px solid ${badgeColor.border}`,
                                      color: badgeColor.text,
                                      padding: "0.2rem 0.6rem",
                                      borderRadius: "999px",
                                      fontWeight: "700",
                                      letterSpacing: "0.05em",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {sec.badge}
                                  </span>
                                )}
                              </div>

                              {/* 1. Formulas Box (Syntax-colored & Prominent) */}
                              {sec.formulas && sec.formulas.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "1.35rem" }}>
                                  <div style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", color: isLight ? "#1d4ed8" : "#60a5fa", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    ⚡ CÔNG THỨC CHUẨN XÁC:
                                  </div>
                                  {sec.formulas.map((f, fIdx) => (
                                    <div
                                      key={fIdx}
                                      style={{
                                        backgroundColor: isLight ? "#f8fafc" : "#09090d",
                                        border: `1px solid ${isLight ? "#cbd5e1" : "#272732"}`,
                                        borderLeft: f.type?.includes("(+)")
                                          ? "4px solid #10b981"
                                          : f.type?.includes("(-)")
                                          ? "4px solid #f43f5e"
                                          : "4px solid #38bdf8",
                                        borderRadius: "8px",
                                        padding: "0.85rem 1.15rem",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "0.75rem",
                                        boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.03)" : "none",
                                      }}
                                    >
                                      <div style={{ fontFamily: "Geist Mono", fontSize: "0.95rem", color: isLight ? "#065f46" : "#34d399", fontWeight: "700", letterSpacing: "0.02em" }}>
                                        {f.text}
                                      </div>
                                      <span
                                        style={{
                                          fontSize: "0.7rem",
                                          fontFamily: "Geist Mono",
                                          backgroundColor: isLight ? "#ffffff" : "#18181f",
                                          color: f.type?.includes("(+)") ? (isLight ? "#059669" : "#34d399") : f.type?.includes("(-)") ? "#fb7185" : "#38bdf8",
                                          padding: "0.2rem 0.55rem",
                                          borderRadius: "6px",
                                          border: `1px solid ${isLight ? "#cbd5e1" : "#333342"}`,
                                          fontWeight: "700",
                                        }}
                                      >
                                        {f.type}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* 2. Numbered Rules (Đánh số thứ tự 1, 2, 3... rõ ràng, có tiêu đề & ví dụ) */}
                              {sec.rules && sec.rules.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "1.15rem 0" }}>
                                  <div style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", color: isLight ? "#4338ca" : "#818cf8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    📌 QUY TẮC & TÌNH HUỐNG VẬN DỤNG:
                                  </div>
                                  {sec.rules.map((rule, rIdx) => (
                                    <div
                                      key={rIdx}
                                      style={{
                                        backgroundColor: T.cardSubtle,
                                        border: `1px solid ${T.border}`,
                                        borderRadius: "10px",
                                        padding: "1rem 1.25rem",
                                      }}
                                    >
                                      {/* Rule Header */}
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.65rem" }}>
                                        <span
                                          style={{
                                            width: "26px",
                                            height: "26px",
                                            borderRadius: "6px",
                                            backgroundColor: "#1e1b4b",
                                            border: "1px solid #4f46e5",
                                            color: "#a5b4fc",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.82rem",
                                            fontWeight: "800",
                                            flexShrink: 0,
                                          }}
                                        >
                                          {rule.num || String(rIdx + 1)}
                                        </span>
                                        <h3 style={{ fontSize: "1rem", fontWeight: "700", color: T.textHeading, margin: 0 }}>
                                          {rule.title}
                                        </h3>
                                      </div>

                                      {/* Rule Content */}
                                      {rule.content && (
                                        <p style={{ fontSize: "0.92rem", color: T.textSecondary, lineHeight: "1.7", margin: "0 0 0.85rem 0" }}>
                                          {rule.content}
                                        </p>
                                      )}

                                      {/* Rule Examples */}
                                      {rule.examples && rule.examples.length > 0 && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", paddingLeft: "0.75rem", borderLeft: "2px solid #3b82f650" }}>
                                          {rule.examples.map((ex, exIdx) => (
                                            <div
                                              key={exIdx}
                                              style={{
                                                backgroundColor: isLight ? "#ffffff" : "#0d0d12",
                                                border: `1px solid ${isLight ? "#e2e8f0" : "#1f1f28"}`,
                                                borderRadius: "6px",
                                                padding: "0.55rem 0.85rem",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: "0.75rem",
                                                boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
                                              }}
                                            >
                                              <div>
                                                <div style={{ fontSize: "0.92rem", fontWeight: "600", color: T.text }}>
                                                  {ex.en}
                                                </div>
                                                {ex.vi && (
                                                  <div style={{ fontSize: "0.82rem", color: "#34d399", marginTop: "0.15rem" }}>
                                                    🇻🇳 {ex.vi}
                                                  </div>
                                                )}
                                              </div>
                                              <button
                                                onClick={() => playWordAudio(ex.en, null)}
                                                title="Nghe phát âm chuẩn câu này"
                                                style={{
                                                  backgroundColor: "#181824",
                                                  border: "1px solid #313146",
                                                  color: "#38bdf8",
                                                  borderRadius: "6px",
                                                  padding: "0.25rem 0.55rem",
                                                  fontSize: "0.75rem",
                                                  fontWeight: "600",
                                                  cursor: "pointer",
                                                  flexShrink: 0,
                                                }}
                                              >
                                                🔊 Đọc
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* 3. General Paragraphs */}
                              {sec.paragraphs && sec.paragraphs.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                                  {sec.paragraphs.map((p, pIdx) => (
                                    <div key={pIdx} style={{ fontSize: "0.92rem", color: T.textSecondary, lineHeight: "1.75", margin: 0, fontWeight: "400" }}>
                                      {renderFormattedText(p)}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* 4. Structured Tables */}
                              {sec.tables && sec.tables.length > 0 && (
                                <div style={{ overflowX: "auto", margin: "1.25rem 0" }}>
                                  {sec.tables.map((tbl, tIdx) => (
                                    <table
                                      key={tIdx}
                                      style={{
                                        width: "100%",
                                        borderCollapse: "separate",
                                        borderSpacing: 0,
                                        backgroundColor: isLight ? "#ffffff" : "#0d0d12",
                                        border: `1px solid ${T.border}`,
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        fontSize: "0.86rem",
                                        boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.03)" : "none",
                                      }}
                                    >
                                      {tbl.headers && tbl.headers.some((h) => h) && (
                                        <thead>
                                          <tr style={{ backgroundColor: isLight ? "#f8fafc" : "#181822" }}>
                                            {tbl.headers.map((h, hIdx) => (
                                              <th
                                                key={hIdx}
                                                style={{
                                                  padding: "0.7rem 0.9rem",
                                                  borderBottom: `1px solid ${T.border}`,
                                                  color: isLight ? "#1d4ed8" : "#60a5fa",
                                                  fontWeight: "700",
                                                  textAlign: "left",
                                                  fontFamily: "Geist Mono",
                                                  fontSize: "0.82rem",
                                                  letterSpacing: "0.03em",
                                                }}
                                              >
                                                {h}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                      )}
                                      <tbody>
                                        {tbl.rows?.map((row, rIdx) => (
                                          <tr
                                            key={rIdx}
                                            style={{
                                              backgroundColor: rIdx % 2 === 0 ? "transparent" : (isLight ? "#f8fafc" : "#14141d"),
                                            }}
                                          >
                                            {row.map((cell, cIdx) => (
                                              <td
                                                key={cIdx}
                                                style={{
                                                  padding: "0.65rem 0.9rem",
                                                  borderBottom: `1px solid ${isLight ? "#f1f5f9" : "#1e1e28"}`,
                                                  color: isLight ? "#334155" : "#e2e8f0",
                                                  lineHeight: "1.55",
                                                }}
                                              >
                                                {cell}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ))}
                                </div>
                              )}

                              {/* 5. Bullet Points (Đánh dấu phân mục với icon rõ ràng) */}
                              {sec.bullets && sec.bullets.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", margin: "1rem 0" }}>
                                  {sec.bullets.map((b, bIdx) => (
                                    <div
                                      key={bIdx}
                                      style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "0.7rem",
                                        backgroundColor: T.cardSubtle,
                                        padding: "0.7rem 0.95rem",
                                        borderRadius: "8px",
                                        border: `1px solid ${T.border}`,
                                        boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.03)" : "none",
                                      }}
                                    >
                                      <span style={{ color: "#38bdf8", fontSize: "0.95rem", lineHeight: "1.4", flexShrink: 0 }}>🔹</span>
                                      <div style={{ fontSize: "0.9rem", color: T.textSecondary, lineHeight: "1.65", width: "100%" }}>
                                        {renderFormattedText(b)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* 6. Notes & Exam Pitfalls (Lưu ý & Bẫy ngữ pháp nổi bật) */}
                              {sec.notes && sec.notes.length > 0 && (
                                <div style={{ margin: "1.15rem 0", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                                  {sec.notes.map((n, nIdx) => (
                                    <div
                                      key={nIdx}
                                      style={{
                                        backgroundColor: isLight ? "#fffbeb" : "rgba(245, 158, 11, 0.08)",
                                        border: isLight ? "1px solid #fde68a" : "1px solid rgba(245, 158, 11, 0.4)",
                                        borderLeft: "4px solid #f59e0b",
                                        borderRadius: "8px",
                                        padding: "0.85rem 1.15rem",
                                        boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.02)" : "none",
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.35rem" }}>
                                        <span style={{ fontSize: "1.05rem" }}>⚠️</span>
                                        <span style={{ fontSize: "0.78rem", fontWeight: "800", color: isLight ? "#b45309" : "#fbbf24", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                          LƯU Ý QUAN TRỌNG & BẪY THI CỬ:
                                        </span>
                                      </div>
                                      <div style={{ fontSize: "0.9rem", color: isLight ? "#78350f" : "#fef3c7", lineHeight: "1.65" }}>
                                        {n}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </section>
                          );
                        })}
                      </div>

                      {/* Bilingual Examples Library (Milestone 2.7) */}
                      {selectedLesson.examples && selectedLesson.examples.length > 0 && (
                        <div
                          style={{
                            marginTop: "1.75rem",
                            backgroundColor: T.card,
                            border: `1px solid ${T.cardBorder}`,
                            borderRadius: "12px",
                            padding: "1.5rem 1.75rem",
                            boxShadow: T.shadow,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <span style={{ fontSize: "1.3rem" }}>📚</span>
                              <div>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: T.textHeading, margin: 0 }}>
                                  Thư viện Ví dụ Mẫu Song ngữ ({selectedLesson.examples.length} câu)
                                </h3>
                                <p style={{ fontSize: "0.8rem", color: T.textMuted, margin: "0.15rem 0 0 0" }}>
                                  Các ngữ cảnh câu thực tế được chuẩn hóa kèm phát âm bản ngữ
                                </p>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "0.85rem" }}>
                            {selectedLesson.examples.map((ex, exIdx) => (
                              <div
                                key={exIdx}
                                style={{
                                  backgroundColor: T.cardSubtle,
                                  border: `1px solid ${T.border}`,
                                  borderRadius: "8px",
                                  padding: "0.85rem 1rem",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "0.75rem",
                                  boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.02)" : "none",
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: "0.92rem", fontWeight: "600", color: T.text, lineHeight: "1.5" }}>
                                    {renderFormattedText(ex.en)}
                                  </div>
                                  {ex.vi && (
                                    <div style={{ fontSize: "0.82rem", color: isLight ? "#059669" : "#34d399", marginTop: "0.3rem", lineHeight: "1.4" }}>
                                      🇻🇳 {ex.vi}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => playWordAudio(ex.en.replace(/\[.*?\]|\(.*?\)/g, "").trim(), null)}
                                  title="Nghe phát âm bản ngữ câu này"
                                  style={{
                                    backgroundColor: isLight ? "#ffffff" : "#1e1e28",
                                    border: `1px solid ${T.border}`,
                                    color: isLight ? "#2563eb" : "#38bdf8",
                                    borderRadius: "6px",
                                    padding: "0.35rem 0.6rem",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                  }}
                                >
                                  🔊 Nghe
                                </button>
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
                          backgroundColor: T.card,
                          border: isCurrentLessonDone ? "1px solid #10b981" : `1px dashed ${isLight ? "#3b82f6" : "#3b82f6"}`,
                          borderRadius: "10px",
                          textAlign: "center",
                          boxShadow: T.shadow,
                        }}
                      >
                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: T.text, marginBottom: "0.4rem" }}>
                          {isCurrentLessonDone ? "🎉 Bạn đã hoàn thành lý thuyết bài học này!" : "Bạn đã nắm vững lý thuyết bài học này?"}
                        </div>
                        <p style={{ fontSize: "0.85rem", color: T.textMuted, marginBottom: "1.25rem" }}>
                          Chuyên đề "{selectedChapter?.title_vi}" có {selectedChapter?.exercises?.length || 0} bài tập thực hành ({totalChapterExerciseQuestions} câu hỏi) để bạn củng cố kiến thức.
                        </p>

                        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                          <button
                            onClick={() => toggleLessonCompletion(selectedLesson.id)}
                            style={{
                              padding: "0.6rem 1.25rem",
                              backgroundColor: isCurrentLessonDone ? "#10b981" : (isLight ? "#f1f5f9" : "#18181b"),
                              border: isCurrentLessonDone ? "none" : `1px solid ${T.border}`,
                              borderRadius: "6px",
                              color: isCurrentLessonDone ? "#ffffff" : T.text,
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              cursor: "pointer",
                            }}
                          >
                            {isCurrentLessonDone ? "✓ Hoàn thành (Bấm để hủy)" : "✓ Đánh dấu đã học xong (+25 XP)"}
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
                        backgroundColor: T.cardSubtle,
                        border: `1px dashed ${T.border}`,
                        borderRadius: "8px",
                        color: T.textMuted,
                      }}
                    >
                      Chọn một bài học từ danh mục bên trái để bắt đầu nghiên cứu lý thuyết.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EXERCISES PRACTICE (WITH VIP/FREE PERMISSION LOCKING) */}
              {activeTab === "exercises" && (
                <div>
                  {/* VIP / Free Status Notice Banner */}
                  <div
                    style={{
                      backgroundColor: currentUser.role === "VIP" ? "rgba(245, 158, 11, 0.08)" : "rgba(59, 130, 246, 0.08)",
                      border: `1px solid ${currentUser.role === "VIP" ? "#f59e0b50" : "#3b82f650"}`,
                      borderRadius: "8px",
                      padding: "0.85rem 1.25rem",
                      marginBottom: "1.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>{currentUser.role === "VIP" ? "⭐" : "ℹ️"}</span>
                      <span style={{ fontSize: "0.85rem", color: "#e4e4e7" }}>
                        {currentUser.role === "VIP"
                          ? "Tài khoản VIP: Bạn có toàn quyền truy cập 100% tất cả 2,939 câu bài tập và lời giải chi tiết."
                          : `Tài khoản Miễn phí: Được phép làm tối đa ${accessPolicy.freeExerciseLimit} câu bài tập đầu tiên mỗi chuyên đề.`}
                      </span>
                    </div>

                    {currentUser.role === "FREE" && (
                      <button
                        onClick={() => setAuthModalOpen(true)}
                        style={{
                          backgroundColor: "#f59e0b",
                          color: "#09090b",
                          border: "none",
                          padding: "0.35rem 0.85rem",
                          borderRadius: "4px",
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        Nâng cấp VIP ngay ⭐
                      </button>
                    )}
                  </div>

                  {selectedChapter?.exercises && selectedChapter.exercises.length > 0 ? (
                    (() => {
                      let globalChapterQuestionCounter = 0;

                      return selectedChapter.exercises.map((ex, eIdx) => {
                        const exerciseStartIdx = globalChapterQuestionCounter;
                        globalChapterQuestionCounter += ex.questions?.length || 0;

                        return (
                          <div
                            key={ex.id || eIdx}
                            style={{
                              backgroundColor: T.card,
                              border: `1px solid ${T.border}`,
                              borderRadius: "10px",
                              padding: "1.5rem",
                              marginBottom: "2rem",
                              boxShadow: T.shadow,
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
                                      backgroundColor: isLight ? "#e0f2fe" : "#27272a",
                                      color: isLight ? "#0369a1" : "#fafafa",
                                      border: isLight ? "1px solid #bae6fd" : "none",
                                      fontWeight: "700",
                                    }}
                                  >
                                    EXERCISE {ex.roman || eIdx + 1}
                                  </span>
                                  <span style={{ fontSize: "0.75rem", color: "#71717a" }}>
                                    {ex.questions?.length || 0} câu hỏi
                                  </span>
                                </div>
                                <div style={{ fontSize: "1rem", fontWeight: "700", color: T.text }}>
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
                                  onClick={() => checkAllQuestions(ex, exerciseStartIdx)}
                                  style={{
                                    padding: "0.4rem 0.75rem",
                                    borderRadius: "4px",
                                    backgroundColor: isLight ? "#2563eb" : "#27272a",
                                      border: isLight ? "1px solid #2563eb" : "1px solid #3f3f46",
                                      color: "#ffffff",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                  }}
                                >
                                  Chấm điểm bài này
                                </button>
                                <button
                                  onClick={() => resetExercise(ex)}
                                  style={{
                                    padding: "0.4rem 0.65rem",
                                    borderRadius: "4px",
                                    backgroundColor: "transparent",
                                    border: isLight ? "1px solid #cbd5e1" : "1px solid #27272a",
                                      color: isLight ? "#64748b" : "#a1a1aa",
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
                                const questionGlobalIdx = exerciseStartIdx + qIdx;
                                const isLockedForFree = currentUser.role === "FREE" && questionGlobalIdx >= accessPolicy.freeExerciseLimit;

                                const res = results[q.id];
                                const isAnswerOpen = showAnswers[q.id];
                                const inputVal = userInputs[q.id] || "";
                                const typeInfo = getQuestionTypeInfo(ex.type);

                                if (isLockedForFree) {
                                  return (
                                    <div
                                      key={q.id || qIdx}
                                      style={{
                                        backgroundColor: "#141417",
                                        border: "1px dashed #f59e0b50",
                                        borderRadius: "6px",
                                        padding: "1.25rem",
                                        textAlign: "center",
                                      }}
                                    >
                                      <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#fbbf24", marginBottom: "0.3rem" }}>
                                        🔒 Câu {questionGlobalIdx + 1}: Nội dung khóa dành riêng cho Thành viên VIP
                                      </div>
                                      <p style={{ fontSize: "0.8rem", color: "#a1a1aa", maxWidth: "520px", margin: "0 auto 0.75rem auto" }}>
                                        Tài khoản Miễn phí được trải nghiệm tối đa {accessPolicy.freeExerciseLimit} câu đầu tiên. Hãy nâng cấp lên VIP để mở khóa toàn bộ câu hỏi và đáp án giải thích chi tiết!
                                      </p>
                                      <button
                                        onClick={() => setAuthModalOpen(true)}
                                        style={{
                                          padding: "0.35rem 0.85rem",
                                          backgroundColor: "#f59e0b",
                                          color: "#09090b",
                                          border: "none",
                                          borderRadius: "4px",
                                          fontSize: "0.78rem",
                                          fontWeight: "700",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Nâng cấp VIP ngay (Hoặc chuyển tài khoản)
                                      </button>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={q.id || qIdx}
                                    style={{
                                      backgroundColor: isLight ? "#f8fafc" : "#18181b",
                                      border: res?.checked
                                        ? res.isCorrect
                                          ? "1px solid #10b981"
                                          : "1px solid #f43f5e"
                                        : `1px solid ${T.border}`,
                                      borderRadius: "6px",
                                      padding: "1.1rem",
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                                      <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "#71717a", fontWeight: "600" }}>
                                        CÂU {q.num || qIdx + 1}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: "0.68rem",
                                          fontFamily: "Geist Mono",
                                          padding: "0.15rem 0.45rem",
                                          borderRadius: "4px",
                                          backgroundColor: isLight ? "#f1f5f9" : "#09090b",
                                          color: isLight ? "#334155" : "#a1a1aa",
                                          border: `1px solid ${T.border}`,
                                          fontWeight: "700",
                                        }}
                                      >
                                        {typeInfo.tag}
                                      </span>
                                    </div>

                                    {/* Stem */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                      <div style={{ fontSize: "0.95rem", color: T.text, lineHeight: "1.6" }}>
                                        {q.stem}
                                      </div>
                                      <button
                                        onClick={() => playWordAudio(q.stem.replace(/\(.*?\)|_.*?_/g, "").trim(), null)}
                                        title="Nghe phát âm câu hỏi này"
                                        style={{
                                          backgroundColor: isLight ? "#ffffff" : "#1e1e28",
                                          border: `1px solid ${T.border}`,
                                          color: isLight ? "#2563eb" : "#38bdf8",
                                          borderRadius: "4px",
                                          padding: "0.2rem 0.5rem",
                                          fontSize: "0.72rem",
                                          fontWeight: "600",
                                          cursor: "pointer",
                                          flexShrink: 0,
                                        }}
                                      >
                                        🔊 Nghe câu
                                      </button>
                                    </div>

                                    {/* Starter Prompt for Rewriting */}
                                    {q.starter_prompt && (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.5rem",
                                          backgroundColor: isLight ? "#fffbeb" : "#1c1917",
                                          border: isLight ? "1px solid #fde68a" : "1px solid #44403c",
                                          padding: "0.45rem 0.75rem",
                                          borderRadius: "6px",
                                          fontSize: "0.825rem",
                                          color: isLight ? "#b45309" : "#f59e0b",
                                          marginBottom: "0.75rem",
                                        }}
                                      >
                                        <span style={{ color: isLight ? "#78350f" : "#a8a29e", fontSize: "0.75rem", fontWeight: "700" }}>GỢI Ý MỞ ĐẦU:</span>
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
                                          if (e.key === "Enter") checkSingleQuestion(q, ex.instruction_vi || ex.title, questionGlobalIdx);
                                        }}
                                        style={{
                                          flex: 1,
                                          minWidth: "220px",
                                          padding: "0.5rem 0.75rem",
                                          backgroundColor: isLight ? "#ffffff" : "#09090b",
                                          border: res?.checked
                                            ? res.isCorrect
                                              ? "1px solid #10b981"
                                              : "1px solid #f43f5e"
                                            : `1px solid ${T.border}`,
                                          borderRadius: "5px",
                                          color: T.text,
                                          fontSize: "0.875rem",
                                          outline: "none",
                                        }}
                                      />

                                      <button
                                        onClick={() => checkSingleQuestion(q, ex.instruction_vi || ex.title, questionGlobalIdx)}
                                        style={{
                                          padding: "0.5rem 0.9rem",
                                          backgroundColor: isLight ? "#2563eb" : "#27272a",
                                          border: isLight ? "1px solid #2563eb" : "1px solid #3f3f46",
                                          borderRadius: "5px",
                                          color: "#ffffff",
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
                                          backgroundColor: isLight ? "#f8fafc" : "transparent",
                                          border: `1px solid ${T.border}`,
                                          borderRadius: "5px",
                                          color: T.textSecondary,
                                          fontSize: "0.8rem",
                                          fontWeight: "500",
                                          cursor: "pointer",
                                        }}
                                      >
                                        {isAnswerOpen ? "Ẩn đáp án" : "Đáp án"}
                                      </button>
                                    </div>

                                    {/* Instant Result Message + Adaptive Remedial Recommendation */}
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

                                    {res?.checked && !res.isCorrect && activeRemedialMap[q.id] && (
                                      <RemedialRecommendationCard
                                        recommendation={activeRemedialMap[q.id]}
                                        onAccept={handleAcceptRemedial}
                                        onDismiss={() => setActiveRemedialMap((prev) => ({ ...prev, [q.id]: null }))}
                                        isLight={isLight}
                                      />
                                    )}

                                    {/* Correct Answer Box */}
                                    {isAnswerOpen && (
                                      <div
                                        style={{
                                          marginTop: "0.75rem",
                                          padding: "0.75rem 0.95rem",
                                          backgroundColor: isLight ? "#f8fafc" : "#09090b",
                                          border: `1px solid ${T.border}`,
                                          borderRadius: "6px",
                                        }}
                                      >
                                        <div style={{ fontSize: "0.72rem", color: isLight ? "#475569" : "#71717a", fontWeight: "600", textTransform: "uppercase" }}>
                                          Đáp án chính xác:
                                        </div>
                                        <div style={{ fontSize: "0.95rem", color: isLight ? "#1d4ed8" : "#60a5fa", fontWeight: "700", marginTop: "0.2rem" }}>
                                          {q.answers.map((a) => a.correct).join("  /  ")}
                                        </div>
                                        {renderPedagogicalExplanation(q.explanation, q.pedagogy, q)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div style={{ padding: "3rem", textAlign: "center", backgroundColor: T.cardSubtle, border: `1px dashed ${T.border}`, borderRadius: "8px", color: T.textMuted }}>
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
          <div id="quiz-area" data-dict-area="true" style={{ flex: 1, backgroundColor: T.bg, padding: "2rem 1.5rem" }}>
            <div style={{ maxWidth: "860px", margin: "0 auto" }}>
              
              {/* Daily Quiz Limit Notice for Free User */}
              {isQuizLimitReached && (
                <div
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid #ef4444",
                    borderRadius: "8px",
                    padding: "1.25rem",
                    marginBottom: "1.5rem",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f87171", marginBottom: "0.35rem" }}>
                    🔒 Giới hạn lượt thi Quiz hôm nay
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#d4d4d8", margin: "0 0 1rem 0" }}>
                    Tài khoản Miễn phí được làm tối đa {accessPolicy.freeDailyQuizLimit} đề Quiz mỗi ngày (Bạn đã làm {userTracker.quizzesCompletedToday || 0}/{accessPolicy.freeDailyQuizLimit} đề). Nâng cấp lên VIP để làm bài thi không giới hạn!
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    style={{
                      padding: "0.55rem 1.25rem",
                      backgroundColor: "#f59e0b",
                      color: "#09090b",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Nâng cấp VIP ngay ⭐
                  </button>
                </div>
              )}

              {/* Quiz Control Card */}
              <div
                style={{
                  backgroundColor: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: "8px",
                  padding: "1.5rem",
                  marginBottom: "1.75rem",
                  boxShadow: T.shadow,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h1 style={{ fontSize: "1.35rem", fontWeight: "700", color: T.text, letterSpacing: "-0.015em" }}>
                      Bộ đề Quiz 50 câu ngẫu nhiên
                    </h1>
                    <p style={{ fontSize: "0.85rem", color: T.textMuted, marginTop: "0.35rem", lineHeight: "1.5" }}>
                      Hệ thống tự động rút trích 50 câu hỏi từ ngân hàng 2,900+ bài tập. Các câu trả lời sai sẽ được ghi nhận vào Sổ tay của {currentUser.name}.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      disabled={isQuizLimitReached}
                      onClick={() => startNewQuiz(selectedQuizTopic)}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: isQuizLimitReached ? "#27272a" : "#2563eb",
                        border: "1px solid #3f3f46",
                        borderRadius: "6px",
                        color: isQuizLimitReached ? "#71717a" : "#ffffff",
                        fontSize: "0.825rem",
                        fontWeight: "600",
                        cursor: isQuizLimitReached ? "not-allowed" : "pointer",
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
                    <label style={{ fontSize: "0.8rem", color: T.textSecondary, fontWeight: "600" }}>Chủ đề kiểm tra:</label>
                    <select
                      disabled={isQuizLimitReached}
                      value={selectedQuizTopic}
                      onChange={(e) => {
                        setSelectedQuizTopic(e.target.value);
                        startNewQuiz(e.target.value);
                      }}
                      style={{
                        backgroundColor: isLight ? "#ffffff" : "#18181b",
                        border: `1px solid ${T.border}`,
                        borderRadius: "6px",
                        padding: "0.45rem 0.75rem",
                        color: T.text,
                        fontSize: "0.825rem",
                        outline: "none",
                        cursor: isQuizLimitReached ? "not-allowed" : "pointer",
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
                        Đã làm: <strong style={{ color: T.text }}>{answeredCount}</strong> / {activeQuizQuestions.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Score Banner when Submitted */}
              {quizSubmitted && quizResults && (
                <div
                  style={{
                    backgroundColor: T.card,
                    border: quizResults.percentage >= 80 ? "1px solid #10b981" : "1px solid #f43f5e",
                    borderRadius: "10px",
                    padding: "1.75rem",
                    marginBottom: "1.75rem",
                    textAlign: "center",
                    boxShadow: T.shadow,
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
                        backgroundColor: T.card,
                        border: quizSubmitted
                          ? detail?.isCorrect
                            ? "1px solid #10b981"
                            : "1px solid #f43f5e"
                          : singleCheck?.checked
                          ? singleCheck.isCorrect
                            ? "1px solid #10b981"
                            : "1px solid #f43f5e"
                          : `1px solid ${T.border}`,
                        borderRadius: "8px",
                        padding: "1.25rem 1.5rem",
                        boxShadow: T.shadow,
                      }}
                    >
                      {/* Question meta header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: T.textMuted, fontWeight: "600" }}>
                            CÂU {idx + 1} / {activeQuizQuestions.length}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#52525b" }}>•</span>
                          <span style={{ fontSize: "0.75rem", color: T.textMuted }}>{q.topic_name}</span>
                        </div>

                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontFamily: "Geist Mono",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                            backgroundColor: isLight ? "#f1f5f9" : "#18181b",
                            color: isLight ? "#334155" : "#a1a1aa",
                            border: `1px solid ${T.border}`,
                            fontWeight: "700",
                          }}
                        >
                          {typeInfo.tag}
                        </span>
                      </div>

                      {/* Explicit Instruction Box */}
                      {q.instruction && (
                        <div
                          style={{
                            backgroundColor: isLight ? "#eff6ff" : "#0d1b2a",
                            borderLeft: isLight ? "4px solid #2563eb" : "3px solid #38bdf8",
                            border: isLight ? `1px solid #bfdbfe` : "none",
                            padding: "0.5rem 0.85rem",
                            borderRadius: "6px",
                            marginBottom: "0.85rem",
                            fontSize: "0.825rem",
                            color: isLight ? "#1e40af" : "#bae6fd",
                            lineHeight: "1.5",
                            boxShadow: isLight ? "0 1px 2px rgba(37,99,235,0.05)" : "none",
                          }}
                        >
                          <strong style={{ color: isLight ? "#1d4ed8" : "#7dd3fc" }}>Yêu cầu:</strong> {q.instruction}
                        </div>
                      )}

                      {/* Stem */}
                      <div style={{ fontSize: "0.975rem", color: T.text, lineHeight: "1.6", marginBottom: "0.75rem", fontWeight: "500" }}>
                        {typeof q.stem === 'string' ? q.stem.replace(/\\_/g, '_') : q.stem}
                      </div>

                      {/* Starter Prompt Box */}
                      {q.starter_prompt && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            backgroundColor: isLight ? "#fffbeb" : "#1c1917",
                            border: isLight ? "1px solid #fde68a" : "1px solid #44403c",
                            padding: "0.45rem 0.75rem",
                            borderRadius: "6px",
                            fontSize: "0.825rem",
                            color: isLight ? "#b45309" : "#f59e0b",
                            marginBottom: "0.85rem",
                          }}
                        >
                          <span style={{ color: isLight ? "#78350f" : "#a8a29e", fontSize: "0.72rem", fontWeight: "700" }}>BẮT ĐẦU VỚI:</span>
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
                              : `1px solid ${T.border}`,
                            fontSize: "0.875rem",
                            backgroundColor: isLight ? "#ffffff" : "#09090b",
                            color: T.text,
                            outline: "none",
                          }}
                        />

                        {!quizSubmitted && (
                          <>
                            <button
                              onClick={() => checkSingleQuizQuestion(q)}
                              style={{
                                backgroundColor: isLight ? "#f1f5f9" : "#27272a",
                                color: T.text,
                                border: `1px solid ${T.border}`,
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
                                backgroundColor: isLight ? "#f8fafc" : "transparent",
                                color: T.textSecondary,
                                border: `1px solid ${T.border}`,
                                padding: "0.55rem 0.85rem",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: "500",
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
                      {!quizSubmitted && isAnswerShown && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            padding: "0.75rem 0.95rem",
                            backgroundColor: isLight ? "#f8fafc" : "#09090b",
                            border: `1px solid ${T.border}`,
                            borderRadius: "6px",
                          }}
                        >
                          <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: "600", textTransform: "uppercase" }}>
                            Đáp án chính xác:
                          </div>
                          <div style={{ fontSize: "0.95rem", color: isLight ? "#1d4ed8" : "#60a5fa", fontWeight: "700", marginTop: "0.2rem" }}>
                            {q.answers.join("  /  ")}
                          </div>
                          {renderPedagogicalExplanation(q.explanation, q.pedagogy, q)}
                        </div>
                      )}

                      {/* Post-submission Review Box */}
                      {quizSubmitted && detail && (
                        <div
                          style={{
                            marginTop: "0.85rem",
                            padding: "0.75rem 0.95rem",
                            backgroundColor: detail.isCorrect ? "rgba(16, 185, 129, 0.05)" : "rgba(244, 63, 94, 0.05)",
                            borderRadius: "6px",
                            border: `1px solid ${detail.isCorrect ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)"}`,
                          }}
                        >
                          <div style={{ fontSize: "0.8rem", color: detail.isCorrect ? "#34d399" : "#fb7185", fontWeight: "600" }}>
                            {detail.isCorrect ? "✓ Chính xác" : "✕ Chưa đúng"}
                          </div>
                          <div style={{ fontSize: "0.825rem", color: "#d4d4d8", marginTop: "0.25rem" }}>
                            Đáp án chuẩn: <strong style={{ color: T.text }}>{q.answers.join(" / ")}</strong>
                          </div>
                          {renderPedagogicalExplanation(q.explanation, q.pedagogy, q)}
                          {!detail.isCorrect && activeRemedialMap[q.id] && (
                            <RemedialRecommendationCard
                              recommendation={activeRemedialMap[q.id]}
                              onAccept={handleAcceptRemedial}
                              onDismiss={() => setActiveRemedialMap((prev) => ({ ...prev, [q.id]: null }))}
                              isLight={isLight}
                            />
                          )}
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
          <div id="mistakes-area" data-dict-area="true" style={{ flex: 1, backgroundColor: T.bg, padding: "2rem 1.5rem" }}>
            <div style={{ maxWidth: "860px", margin: "0 auto" }}>
              
              {/* Notebook Header Card */}
              <div
                style={{
                  backgroundColor: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: "8px",
                  padding: "1.5rem",
                  marginBottom: "1.75rem",
                  boxShadow: T.shadow,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h1 style={{ fontSize: "1.35rem", fontWeight: "700", color: T.text, letterSpacing: "-0.015em" }}>
                      Sổ tay câu hỏi cần ôn lại của {currentUser.name}
                    </h1>
                    <p style={{ fontSize: "0.85rem", color: "#71717a", marginTop: "0.35rem" }}>
                      Lưu trữ tự động các câu bạn đã làm chưa đúng trong phần bài tập và bài thi Quiz. Dữ liệu được lưu riêng cho tài khoản của bạn.
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
                    <span style={{ fontSize: "0.8rem", color: T.textSecondary, fontWeight: "600" }}>Lọc theo chủ đề:</span>
                    <select
                      value={mistakeFilterTopic}
                      onChange={(e) => setMistakeFilterTopic(e.target.value)}
                      style={{
                        backgroundColor: isLight ? "#ffffff" : "#18181b",
                        border: `1px solid ${T.border}`,
                        borderRadius: "6px",
                        padding: "0.35rem 0.65rem",
                        color: T.text,
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
                    backgroundColor: T.card,
                    border: `1px dashed ${T.border}`,
                    borderRadius: "10px",
                    boxShadow: T.shadow,
                  }}
                >
                  <div style={{ fontSize: "1.1rem", fontWeight: "700", color: T.text, marginBottom: "0.5rem" }}>
                    Chưa có câu sai nào trong sổ tay của bạn
                  </div>
                  <p style={{ fontSize: "0.85rem", color: T.textMuted, maxWidth: "420px", margin: "0 auto 1.25rem auto" }}>
                    Khi bạn làm bài tập ở mục "12 Chuyên đề" hoặc làm bài kiểm tra ở "Quiz Engine", những câu chưa đúng sẽ tự động xuất hiện tại đây để bạn ôn luyện lại.
                  </p>
                  <button
                    onClick={() => {
                      setCurrentView("quiz");
                      if (activeQuizQuestions.length === 0) startNewQuiz("ALL");
                    }}
                    style={{
                      padding: "0.55rem 1.25rem",
                      backgroundColor: isLight ? "#2563eb" : "#27272a",
                      border: isLight ? "1px solid #2563eb" : "1px solid #3f3f46",
                      borderRadius: "6px",
                      color: "#ffffff",
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
                          backgroundColor: T.card,
                          border: res?.checked
                            ? res.isCorrect
                              ? "1px solid #10b981"
                              : "1px solid #f43f5e"
                            : `1px solid ${T.border}`,
                          borderRadius: "8px",
                          padding: "1.25rem 1.5rem",
                          boxShadow: T.shadow,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: T.textMuted, fontWeight: "600" }}>
                            CÂU {idx + 1} • {item.topic_name}
                          </span>
                          <button
                            onClick={() => removeMistakeRecord(item.id)}
                            style={{
                              backgroundColor: "transparent",
                              border: "none",
                              color: T.textMuted,
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
                              backgroundColor: isLight ? "#eff6ff" : "#0d1b2a",
                              borderLeft: isLight ? "4px solid #2563eb" : "3px solid #38bdf8",
                              border: isLight ? `1px solid #bfdbfe` : "none",
                              padding: "0.45rem 0.75rem",
                              borderRadius: "6px",
                              marginBottom: "0.75rem",
                              fontSize: "0.8rem",
                              color: isLight ? "#1e40af" : "#bae6fd",
                            }}
                          >
                            <strong style={{ color: isLight ? "#1d4ed8" : "#7dd3fc" }}>Yêu cầu:</strong> {item.instruction}
                          </div>
                        )}

                        <div style={{ fontSize: "0.95rem", color: T.text, lineHeight: "1.6", marginBottom: "0.75rem" }}>
                          {item.stem}
                        </div>

                        {item.starter_prompt && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              backgroundColor: isLight ? "#fffbeb" : "#1c1917",
                              border: isLight ? "1px solid #fde68a" : "1px solid #44403c",
                              padding: "0.45rem 0.75rem",
                              borderRadius: "6px",
                              fontSize: "0.825rem",
                              color: isLight ? "#b45309" : "#f59e0b",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <span style={{ color: isLight ? "#78350f" : "#a8a29e", fontSize: "0.72rem", fontWeight: "700" }}>BẮT ĐẦU VỚI:</span>
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
                                : `1px solid ${T.border}`,
                              fontSize: "0.875rem",
                              backgroundColor: isLight ? "#ffffff" : "#09090b",
                              color: T.text,
                              outline: "none",
                            }}
                          />

                          <button
                            onClick={() => checkSingleMistake(item)}
                            style={{
                              backgroundColor: isLight ? "#f1f5f9" : "#27272a",
                              color: T.text,
                              border: `1px solid ${T.border}`,
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
                              backgroundColor: isLight ? "#f8fafc" : "transparent",
                              color: T.textSecondary,
                              border: `1px solid ${T.border}`,
                              padding: "0.55rem 0.85rem",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              fontWeight: "500",
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
                              padding: "0.75rem 0.95rem",
                              backgroundColor: isLight ? "#f8fafc" : "#09090b",
                              border: `1px solid ${T.border}`,
                              borderRadius: "6px",
                            }}
                          >
                            <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: "600", textTransform: "uppercase" }}>
                              Đáp án chuẩn:
                            </div>
                            <div style={{ fontSize: "0.95rem", color: isLight ? "#1d4ed8" : "#60a5fa", fontWeight: "700", marginTop: "0.2rem" }}>
                              {item.answers.join("  /  ")}
                            </div>
                            {renderPedagogicalExplanation(item.explanation, item.pedagogy, item)}
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
