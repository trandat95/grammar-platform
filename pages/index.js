import Head from "next/head";
import { useState, useEffect, useMemo, useRef } from "react";
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
import MasteryIntelligenceDashboard from "../components/learning/MasteryIntelligenceDashboard";
import AcademicRichText, { stripMarkdownFormatting } from "../components/learning/AcademicRichText";
import AcademicSectionBody from "../components/learning/AcademicSectionBody";
import { buildAdaptiveQuestionSet } from "../lib/learning/adaptive-question-engine";
import GamificationHub, { prefetchGamificationData } from "../components/gamification/GamificationHub";
import LeaderboardPanel from "../components/gamification/LeaderboardPanel";
import GamificationCelebrationModal from "../components/gamification/GamificationCelebrationModal";
import MonetizationHub, { prefetchMonetizationData, invalidateMonetizationClientCache } from "../components/monetization/MonetizationHub";
import SmartPaywallModal from "../components/monetization/SmartPaywallModal";
import AccountProfileCard from "../components/auth/AccountProfileCard";
import GrammarDiagnosticEngine from "../components/diagnostic/GrammarDiagnosticEngine";
import AdminOverviewPanel from "../components/admin/AdminOverviewPanel";
import AdminMonetizationPanel from "../components/admin/AdminMonetizationPanel";
import PedagogicalQualityDashboard from "../components/admin/PedagogicalQualityDashboard";
import StepUpConfirmModal from "../components/admin/StepUpConfirmModal";
import AppShell2026 from "../components/ui-2026/AppShell2026";
import FocusTrapModal2026 from "../components/ui-2026/FocusTrapModal2026";
import KitIcon from "../components/ui-2026/KitIcon";
import { BANNER_PATHS, CHAPTER_ICON_MAP } from "../components/ui-2026/assetMap";
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
  resetPasswordWithSupabase,
  resendConfirmationWithSupabase,
  updatePasswordWithSupabase,
  onSupabaseAuthStateChange,
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
  const [authTab, setAuthTab] = useState("login"); // 'login' | 'register' | 'forgot' | 'reset'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authUnconfirmedEmail, setAuthUnconfirmedEmail] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showSwitchAuthForm, setShowSwitchAuthForm] = useState(false);

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
  const [dashboardZone, setDashboardZone] = useState("today"); // 'today' | 'analytics' | 'all'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedRulesMap, setExpandedRulesMap] = useState({});

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

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", isLight ? "light" : "dark");
    } catch (e) {}
  }, [isLight]);

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
  const [adaptiveQuizMeta, setAdaptiveQuizMeta] = useState(null);
  const [adaptiveLoading, setAdaptiveLoading] = useState(false);
  const questionFocusTimestampsRef = useRef({});

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
  const [gamificationCelebration, setGamificationCelebration] = useState(null);
  const [gamificationPreferences, setGamificationPreferences] = useState({
    leaderboard_visibility: "public",
    reduced_motion: false,
  });
  const [smartPaywall, setSmartPaywall] = useState({ open: false, context: null, preview: null });
  const [paywallPsych, setPaywallPsych] = useState({});
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

    const unsubscribe = onSupabaseAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        if (session?.access_token) setActiveAuthToken(session.access_token);
        setAuthError("");
        setAuthSuccess("");
        setAuthPassword("");
        setAuthConfirmPassword("");
        setAuthTab("reset");
        setAuthModalOpen(true);
      } else if (event === "SIGNED_IN" && session?.access_token) {
        setActiveAuthToken(session.access_token);
      }
    });

    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      if (hash.includes("type=recovery") || search.includes("type=recovery")) {
        setAuthError("");
        setAuthSuccess("");
        setAuthTab("reset");
        setAuthModalOpen(true);
      }
    }

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
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

  // Reconcile existing tracker XP to Supabase Leaderboard on authenticated load
  useEffect(() => {
    if (!currentUser?.id || currentUser.isGuest || !activeAuthToken || !userTracker?.xp) return;
    const tzOffsetMinutes = -new Date().getTimezoneOffset();
    fetch("/api/gamification/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeAuthToken}`,
      },
      body: JSON.stringify({
        action: "record_xp_activity",
        user_id: currentUser.id,
        idempotency_key: `reconcile_${currentUser.id}_${userTracker.xp}`,
        source_type: "tracker_reconcile",
        xp_amount: 0,
        min_xp_floor: Number(userTracker.xp || 0),
        streak: Number(userTracker.streak || 1),
        tzOffsetMinutes,
      }),
    })
      .then((res) => {
        if (res.ok) window.dispatchEvent(new Event("ge:leaderboard-refresh"));
      })
      .catch(() => {});
  }, [currentUser?.id, currentUser?.isGuest, activeAuthToken, userTracker?.xp]);

  // Background idle prefetch for Thành tích & Nâng cấp VIP tabs (eliminates Skeleton wait on click)
  useEffect(() => {
    if (!currentUser?.id) return;
    const targetUserId = !currentUser.isGuest && currentUser.id !== "guest" ? currentUser.id : null;
    const timer = setTimeout(() => {
      prefetchGamificationData({ userId: targetUserId, authToken: activeAuthToken });
      prefetchMonetizationData({ userId: targetUserId, authToken: activeAuthToken });
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentUser?.id, currentUser?.isGuest, activeAuthToken]);

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
    setAuthSuccess("");
    setAuthUnconfirmedEmail("");
    const email = authEmail.trim();
    const password = authPassword;

    if (!email || !password) {
      setAuthError("Vui lòng nhập đầy đủ email và mật khẩu!");
      return;
    }

    setAuthSubmitting(true);
    try {
      // 1. Authenticate with Supabase Auth (GoTrue)
      const data = await signInWithSupabase(email, password);
      if (data?.session?.access_token) {
        setActiveAuthToken(data.session.access_token);
      }
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

      if (/email not confirmed|email_not_confirmed/i.test(`${authErr?.message || ""} ${authErr?.code || ""}`)) {
        setAuthUnconfirmedEmail(email);
        setAuthError(
          `Tài khoản "${email}" chưa được xác thực email trên Supabase. Vui lòng mở link xác nhận trong hộp thư (kiểm tra cả Spam), bấm "Gửi lại email xác nhận" bên dưới, hoặc dùng "Quên mật khẩu?" để xác thực nhanh.`
        );
        return;
      }

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
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = (authUnconfirmedEmail || authEmail).trim();
    if (!targetEmail) return;
    setAuthSubmitting(true);
    setAuthError("");
    setAuthSuccess("");
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
      await resendConfirmationWithSupabase(targetEmail, redirectTo);
      setAuthUnconfirmedEmail("");
      setAuthSuccess(
        `✅ Đã gửi lại email xác nhận tới ${targetEmail}. Vui lòng mở Hộp thư đến (hoặc Spam) và bấm vào link xác thực rồi đăng nhập lại.`
      );
    } catch (err) {
      setAuthError(err?.message || "Không thể gửi lại email xác nhận. Vui lòng thử lại sau!");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthUnconfirmedEmail("");
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
    if (password !== authConfirmPassword) {
      setAuthError("Mật khẩu xác nhận không khớp! Vui lòng nhập 2 lần giống nhau.");
      return;
    }

    setAuthSubmitting(true);
    try {
      // 1. Register on Supabase Auth Cloud (instant session when Confirm email is disabled)
      const data = await signUpWithSupabase(email, password, name);
      if (data?.session?.access_token) {
        setActiveAuthToken(data.session.access_token);
      }
      if (data?.user) {
        if (!data.session && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setAuthError(`Email "${email}" đã được đăng ký trước đó. Vui lòng chuyển sang tab Đăng nhập hoặc dùng Quên mật khẩu!`);
          return;
        }
        const newUser = {
          id: data.user.id,
          name: name,
          email: email,
          role: "FREE",
          status: "ACTIVE",
          createdAt: getTodayDateStr(),
        };
        const updatedUsers = [newUser, ...usersList.filter((u) => u.id !== newUser.id)];
        persistUsersList(updatedUsers);
        if (data.session) {
          setCurrentUser(newUser);
          localStorage.setItem("grammar_active_user_id", newUser.id);
          setAuthModalOpen(false);
          setAuthTab("login");
          setAuthName("");
          setAuthEmail("");
          setAuthPassword("");
          setAuthConfirmPassword("");
          triggerXpGain(50, `Chào mừng bạn mới ${newUser.name} (+50 XP)!`);
          logActivity(data.user.id, email, "REGISTER", { full_name: name });
        } else {
          setAuthUnconfirmedEmail(email);
          setAuthSuccess(
            `✅ Đã tạo tài khoản "${email}". Tuy nhiên Supabase vẫn đang BẬT "Confirm email" nên bạn cần bấm link xác nhận trong email trước khi đăng nhập (hoặc tắt "Confirm email" tại Auth > Providers > Email trên Supabase Dashboard để đăng ký mới vào thẳng luôn).`
          );
          setAuthConfirmPassword("");
          setAuthTab("login");
        }
        return;
      }
    } catch (err) {
      console.warn("Supabase signup error:", err.message);
      const isNetworkErr =
        /failed to fetch|networkerror|network request failed/i.test(err?.message || "");
      if (!isNetworkErr) {
        setAuthError(err?.message || "Không thể tạo tài khoản. Vui lòng kiểm tra lại email!");
        return;
      }
      // Fallback local registration only if offline
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
      setAuthTab("login");
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthConfirmPassword("");
      triggerXpGain(50, `Chào mừng ${localNewUser.name} (+50 XP)!`);
      logActivity(localNewUser.id, email, "REGISTER", { full_name: name, offline: true });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    const email = authEmail.trim();
    if (!email) {
      setAuthError("Vui lòng nhập email tài khoản cần khôi phục mật khẩu!");
      return;
    }

    setAuthSubmitting(true);
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
      await resetPasswordWithSupabase(email, redirectTo);
      setAuthSuccess(
        `✅ Đã gửi liên kết khôi phục mật khẩu tới ${email}. Vui lòng mở Hộp thư đến (hoặc mục Thư rác/Spam) và nhấn vào link để đặt mật khẩu mới.`
      );
    } catch (err) {
      setAuthError(err?.message || "Không thể gửi email khôi phục mật khẩu. Vui lòng thử lại sau!");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!authPassword || authPassword.length < 6) {
      setAuthError("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    if (authPassword !== authConfirmPassword) {
      setAuthError("Mật khẩu xác nhận không khớp!");
      return;
    }

    setAuthSubmitting(true);
    try {
      await updatePasswordWithSupabase(authPassword);
      const session = await getActiveSession();
      if (session?.access_token) setActiveAuthToken(session.access_token);
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        const restoredUser = {
          id: session.user.id,
          name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email.split("@")[0],
          email: session.user.email,
          role: profile?.role || session.user.user_metadata?.role || "FREE",
          status: profile?.status || "ACTIVE",
          createdAt: profile?.created_at ? profile.created_at.split("T")[0] : getTodayDateStr(),
        };
        setCurrentUser(restoredUser);
        localStorage.setItem("grammar_active_user_id", restoredUser.id);
      }
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", window.location.pathname);
      }
      setAuthPassword("");
      setAuthConfirmPassword("");
      setAuthModalOpen(false);
      setAuthTab("login");
      triggerXpGain(0, "✅ Đã đặt lại mật khẩu mới thành công!");
    } catch (err) {
      setAuthError(err?.message || "Liên kết khôi phục đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại yêu cầu Quên mật khẩu.");
    } finally {
      setAuthSubmitting(false);
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
    setActiveAuthToken(null);
    invalidateMonetizationClientCache();
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

  const syncServerXpActivity = async ({
    sourceType,
    xpAmount = 0,
    idempotencyKey,
    minXpFloor = 0,
    streak = 1,
    metadata = {},
  }) => {
    if (!currentUser?.id || currentUser.isGuest || !activeAuthToken) return;
    try {
      const tzOffsetMinutes = -new Date().getTimezoneOffset();
      const res = await fetch("/api/gamification/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeAuthToken}`,
        },
        body: JSON.stringify({
          action: "record_xp_activity",
          user_id: currentUser.id,
          idempotency_key: idempotencyKey,
          source_type: sourceType,
          xp_amount: xpAmount,
          min_xp_floor: minXpFloor,
          streak,
          tzOffsetMinutes,
          metadata,
        }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event("ge:leaderboard-refresh"));
      }
    } catch {}
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
      const next = {
        ...prev,
        xp: prev.xp + xpGain,
        completedLessons: nextList,
      };
      if (!isDone && currentUser?.id && !currentUser.isGuest) {
        upsertTracker(currentUser.id, next).catch(() => {});
        syncServerXpActivity({
          sourceType: "lesson_completed",
          xpAmount: 25,
          idempotencyKey: `lesson_${lessonId}`,
          minXpFloor: next.xp,
          streak: next.streak || 1,
          metadata: { lesson_id: lessonId },
        });
      }
      return next;
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

      const next = {
        ...prev,
        xp: prev.xp + (alreadyDone ? 0 : xpReward),
        completedQuestions: nextQuestions,
        dailyGoal: {
          targetQuestions: prev.dailyGoal?.targetQuestions || 10,
          solvedToday: todaySolved,
          date: today,
        },
      };
      if (!alreadyDone && currentUser?.id && !currentUser.isGuest) {
        upsertTracker(currentUser.id, next).catch(() => {});
        syncServerXpActivity({
          sourceType: isQuiz ? "quiz_question_correct" : "exercise_question_correct",
          xpAmount: xpReward,
          idempotencyKey: `q_${questionId}`,
          minXpFloor: next.xp,
          streak: next.streak || 1,
          metadata: { question_id: questionId, is_quiz: isQuiz },
        });
      }
      return next;
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

  const handleServerGamificationOutcome = (gam) => {
    if (!gam) return;
    if (gam.levelState?.totalXp !== undefined) {
      setUserTracker((prev) => ({
        ...prev,
        xp: Number(gam.levelState.totalXp),
        streak: Number(gam.streakState?.current_streak ?? prev.streak),
      }));
    }
    if (
      gam.leveledUp ||
      gam.streakState?.milestone_reached ||
      (gam.newlyUnlockedAchievements && gam.newlyUnlockedAchievements.length > 0)
    ) {
      setGamificationCelebration(gam);
    }
  };

  const handleServerEntitlementSync = (ent) => {
    if (!ent?.effectiveRole) return;
    setCurrentUser((prev) => {
      if (!prev || prev.isGuest || prev.role === "ADMIN") return prev;
      if (prev.role === ent.effectiveRole) return prev;
      const updated = { ...prev, role: ent.effectiveRole };
      try {
        localStorage.setItem("grammar_active_user", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const openContextualSmartPaywall = async (triggerKey = "vip_feature_click", preview = null) => {
    if (currentUser?.role === "VIP" || currentUser?.role === "ADMIN") return;
    if (currentUser?.isGuest || !currentUser?.id) {
      setSmartPaywall({
        open: true,
        context: {
          variantKey: "progress_anchored",
          config: {
            trigger_key: triggerKey,
            title_vi: preview?.title || "Mở khóa Hệ sinh thái Ngữ pháp Cá nhân hóa VIP",
            subtitle_vi: "Đăng ký tài khoản miễn phí để nâng cấp VIP và mở khóa trọn bộ 2,939 câu hỏi, AI Coach & Lộ trình cá nhân hóa.",
          },
        },
        preview,
      });
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(activeAuthToken ? { Authorization: `Bearer ${activeAuthToken}` } : {}),
      };
      fetch("/api/monetization/overview", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "track_event",
          user_id: currentUser.id,
          event_name: "VIP_FEATURE_CLICKED",
          metadata: { triggerKey },
        }),
      }).catch(() => {});

      const [pwRes, ovRes] = await Promise.all([
        fetch("/api/monetization/overview", {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "check_paywall", user_id: currentUser.id, trigger_key: triggerKey }),
        }),
        fetch(`/api/monetization/overview?user_id=${encodeURIComponent(currentUser.id)}`, {
          headers: activeAuthToken ? { Authorization: `Bearer ${activeAuthToken}` } : {},
        }),
      ]);
      const pwJson = await pwRes.json();
      const ovJson = await ovRes.json();
      if (ovJson?.psychology) setPaywallPsych(ovJson.psychology);

      if (pwJson?.shouldShow) {
        setSmartPaywall({ open: true, context: pwJson, preview });
      } else {
        setCurrentView("vip");
      }
    } catch {
      setCurrentView("vip");
    }
  };

  useEffect(() => {
    const onOpenVipPaywall = (evt) => {
      openContextualSmartPaywall(
        "vip_feature_click",
        evt?.detail?.preview || {
          title: "Mở khóa Phân tích Nâng cao 5 Bước (VIP)",
          description: "Xem trọn vẹn ngoại lệ ngữ pháp, bẫy đề thi và chiến thuật loại trừ nhanh.",
        }
      );
    };
    window.addEventListener("ge:open-vip-paywall", onOpenVipPaywall);
    return () => window.removeEventListener("ge:open-vip-paywall", onOpenVipPaywall);
  }, [currentUser?.id, currentUser?.role, activeAuthToken]);

  const syncQuestionMastery = (question, isCorrect, errorCategory = null) => {
    if (!question?.id || !currentUser?.id || currentUser.isGuest) return;
    const startedAt = questionFocusTimestampsRef.current?.[question.id];
    const responseTimeMs = startedAt ? Math.max(500, Math.min(180000, Date.now() - startedAt)) : 3500;
    if (startedAt) {
      delete questionFocusTimestampsRef.current[question.id];
    }
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
        response_time_ms: responseTimeMs,
        idempotency_key: StorageAdapter.generateUUIDv4(),
      }),
    })
      .then((res) => res.json())
      .then((json) => handleServerGamificationOutcome(json?.gamification))
      .catch(() => {});
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
            backgroundColor: "var(--ds-card-subtle)",
            border: `1px solid ${"var(--ds-border)"}`,
            borderLeft: "3px solid var(--ds-accent)",
            borderRadius: "6px",
            padding: "0.45rem 0.75rem",
            margin: "0.25rem 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.45rem", flex: 1 }}>
            <span
              style={{
                fontSize: "0.68rem",
                fontFamily: "var(--font-sans)",
                backgroundColor: "var(--ds-accent-bg)",
                color: "var(--ds-accent)",
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
              backgroundColor: "var(--ds-card)",
              border: `1px solid ${T.border}`,
              color: "var(--ds-accent)",
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

    return <AcademicRichText text={str} />;
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

    const hasVipAccess = !currentUser?.isGuest && (currentUser?.role === "VIP" || currentUser?.role === "ADMIN");

    return (
      <StructuredExplanation
        explanation={structured}
        questionId={question?.id || structured?.question_id}
        userId={currentUser?.id}
        hasVipAccess={hasVipAccess}
        onUpgradeVip={() =>
          openContextualSmartPaywall("vip_feature_click", {
            title: "Mở khóa Giải thích Nâng cao 5 Bước (VIP)",
            description: "Xem trọn vẹn ngoại lệ ngữ pháp, phân tích bẫy đề thi và chiến thuật loại trừ nhanh cho 2,939 câu hỏi.",
          })
        }
        isLight={isLight}
      />
    );
  };

  // --- Study Exercise Handlers with Permission Check ---
  const markQuestionInteractionStart = (questionId) => {
    if (questionId && !questionFocusTimestampsRef.current[questionId]) {
      questionFocusTimestampsRef.current[questionId] = Date.now();
    }
  };

  const handleInputChange = (questionId, value) => {
    markQuestionInteractionStart(questionId);
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

    setAdaptiveQuizMeta(null);
    setActiveQuizQuestions(selected);
    setQuizAnswers({});
    setQuizResults(null);
    setQuizSubmitted(false);
    setQuizSingleChecks({});
    setQuizShowAnswers({});
  };

  const startAdaptivePractice = async ({ mode = "adaptive", topicId = null, count = 20 } = {}) => {
    if (isQuizLimitReached) {
      alert(
        `Bạn đã hoàn thành giới hạn ${accessPolicy.freeDailyQuizLimit} lượt Quiz hôm nay của gói Miễn phí. Hãy nâng cấp lên VIP để làm bài không giới hạn!`
      );
      return;
    }

    setAdaptiveLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(activeAuthToken ? { Authorization: `Bearer ${activeAuthToken}` } : {}),
      };
      const res = await fetch("/api/learning/adaptive-mix", {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: !currentUser?.isGuest ? currentUser?.id : null,
          mode,
          topicId,
          count,
          completedQuestionIds: userTracker?.completedQuestions || [],
        }),
      });
      const json = await res.json();
      let resultQuestions = json?.questions;
      let meta = json;
      if (!res.ok || !Array.isArray(resultQuestions) || resultQuestions.length === 0) {
        meta = buildAdaptiveQuestionSet({
          count,
          targetTopicId: topicId,
          mode,
          completedQuestionIds: userTracker?.completedQuestions || [],
        });
        resultQuestions = meta.questions;
      }

      setActiveQuizQuestions(resultQuestions || []);
      setAdaptiveQuizMeta({
        mode: meta.mode || mode,
        topicId,
        preferredDifficulty: meta.preferredDifficulty || "Adaptive",
        breakdown: meta.breakdown || {},
      });
      setQuizAnswers({});
      setQuizResults(null);
      setQuizSubmitted(false);
      setQuizSingleChecks({});
      setQuizShowAnswers({});
      setCurrentView("quiz");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      const fallback = buildAdaptiveQuestionSet({
        count,
        targetTopicId: topicId,
        mode,
        completedQuestionIds: userTracker?.completedQuestions || [],
      });
      setActiveQuizQuestions(fallback.questions || []);
      setAdaptiveQuizMeta({
        mode: fallback.mode || mode,
        topicId,
        preferredDifficulty: fallback.preferredDifficulty || "Adaptive",
        breakdown: fallback.breakdown || {},
      });
      setQuizAnswers({});
      setQuizResults(null);
      setQuizSubmitted(false);
      setQuizSingleChecks({});
      setQuizShowAnswers({});
      setCurrentView("quiz");
    } finally {
      setAdaptiveLoading(false);
    }
  };

  const handleQuizAnswerChange = (qId, val) => {
    markQuestionInteractionStart(qId);
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
      fetch("/api/learning/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(activeAuthToken ? { Authorization: `Bearer ${activeAuthToken}` } : {}),
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          events: [
            {
              event_type: "QUIZ_COMPLETED",
              idempotency_key: StorageAdapter.generateUUIDv4(),
              payload: {
                mode: adaptiveQuizMeta?.mode || "standard",
                topic: selectedQuizTopic,
                score: correctCount,
                total: activeQuizQuestions.length,
                percentage: Math.round((correctCount / activeQuizQuestions.length) * 100),
              },
            },
          ],
        }),
      })
        .then((res) => res.json())
        .then((json) => handleServerGamificationOutcome(json?.gamification))
        .catch(() => {});
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
        tagColor: "var(--ds-warning)",
        tagBg: "var(--ds-warning-bg)",
        tagBorder: "var(--ds-warning-border)",
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
            tagColor: "var(--ds-accent)",
            tagBg: "var(--ds-accent-bg)",
            tagBorder: "var(--ds-accent-border)",
          };
        }
      }
    }

    return {
      chapter: previewData.chapters[0],
      lesson: previewData.chapters[0].lessons[0],
      reason: "Xuất sắc! Bạn đã hoàn thành toàn bộ 53 bài học. Hãy làm đề Quiz 50 câu để duy trì phong độ!",
      tag: "LUYỆN TẬP NÂNG CAO",
      tagColor: "var(--ds-success)",
      tagBg: "var(--ds-success-bg)",
      tagBorder: "var(--ds-success-border)",
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

  const chapterSidebarContent = (
    <>
      <div style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${T.border}` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: T.inputBg,
            border: `1px solid ${T.border}`,
            borderRadius: "8px",
            padding: "0.4rem 0.65rem",
          }}
        >
          <KitIcon name="tool-search" size={14} />
          <input
            type="text"
            value={chapterSearch}
            onChange={(e) => setChapterSearch(e.target.value)}
            placeholder="Lọc 12 chuyên đề..."
            aria-label="Lọc 12 chuyên đề"
            className="ds-focusable"
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
              type="button"
              onClick={() => setChapterSearch("")}
              aria-label="Xóa bộ lọc"
              style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "0.85rem" }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0.6rem 0.5rem" }}>
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: "700",
            color: T.textMuted,
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
          const chapterNum = Number(ch.number || 1);
          const chIcon = CHAPTER_ICON_MAP[chapterNum] || CHAPTER_ICON_MAP[1];

          return (
            <div key={ch.id} style={{ marginBottom: "0.3rem" }}>
              <button
                type="button"
                onClick={() => handleSelectChapter(ch)}
                className="ds-focusable"
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.48rem 0.6rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: isSelected ? T.accentBg : "transparent",
                  border: isSelected ? `1px solid ${T.accentBorder}` : "1px solid transparent",
                  transition: "all 0.12s ease",
                  gap: "0.6rem",
                }}
              >
                <img src={chIcon} alt="" width={24} height={24} aria-hidden="true" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: isSelected ? T.textHeading : T.textSecondary,
                    fontWeight: isSelected ? "700" : "500",
                    flex: 1,
                    lineHeight: 1.35,
                  }}
                >
                  {ch.title_vi}
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontFamily: "var(--font-sans)",
                    color: T.textMuted,
                    flexShrink: 0,
                  }}
                >
                  {ch.lessons?.length || 0}b
                </span>
              </button>

              {isSelected && ch.lessons && ch.lessons.length > 0 && (
                <div
                  style={{
                    marginLeft: "1.45rem",
                    paddingLeft: "0.55rem",
                    borderLeft: `1px solid ${T.borderSubtle}`,
                    marginTop: "0.25rem",
                    marginBottom: "0.45rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {ch.lessons.map((ls) => {
                    const isLessonActive = selectedLesson?.id === ls.id;
                    const isLessonCompleted = userTracker.completedLessons?.includes(ls.id);

                    return (
                      <button
                        key={ls.id}
                        type="button"
                        data-lesson-item="true"
                        onClick={() => {
                          setSelectedLessonId(ls.id);
                          setActiveTab("theory");
                        }}
                        className="ds-focusable"
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "0.38rem 0.55rem",
                          borderRadius: "6px",
                          fontSize: "0.775rem",
                          color: isLessonActive ? T.accent : isLessonCompleted ? T.success : T.textMuted,
                          backgroundColor: isLessonActive ? T.accentBg : "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: isLessonActive ? "700" : "500",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "0.45rem",
                        }}
                      >
                        <span className="ge-lesson-title-clamp" style={{ flex: 1 }}>
                          {isLessonCompleted ? "✓ " : ""}
                          {ls.title_vi}
                        </span>
                        <span
                          style={{
                            fontSize: "0.66rem",
                            color: T.textMuted,
                            fontFamily: "var(--font-sans)",
                            flexShrink: 0,
                          }}
                        >
                          {ls.sections?.length || 0}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div data-theme={isLight ? "light" : "dark"} className={isLight ? "theme-light" : "theme-dark"}>
      <Head>
        <title>Grammar Engine — Nền tảng Ngữ pháp Tiếng Anh Toàn diện</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Text:wght@400;500;700&family=Google+Sans:wght@400;500;600;700&display=swap"
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
          background-color: var(--ds-bg);
          color: var(--ds-text);
          font-family: "Google Sans Text", "Google Sans", "Product Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          transition: background-color 0.15s ease, color 0.15s ease;
          overflow-x: clip;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: "Google Sans", "Product Sans", "Google Sans Text", -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .theme-light input, .theme-light select, .theme-light textarea {
          background-color: #ffffff !important;
          color: var(--ds-text) !important;
          border-color: var(--ds-border) !important;
        }
        .theme-light input::placeholder, .theme-light textarea::placeholder {
          color: var(--ds-text-muted) !important;
        }
        input, button, select, textarea {
          font-family: inherit;
        }
        ::placeholder {
          color: var(--ds-text-muted);
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: var(--ds-bg);
        }
        ::-webkit-scrollbar-thumb {
          background: var(--ds-border);
          border-radius: 999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--ds-border-strong);
        }
        code, kbd, pre {
          font-family: "Google Sans Text", "Google Sans", "Product Sans", -apple-system, BlinkMacSystemFont, sans-serif;
          font-variant-numeric: tabular-nums;
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
          background-color: var(--ds-card-subtle);
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
            bottom: "4.75rem",
            right: "1.25rem",
            zIndex: 1400,
            backgroundColor: T.card,
            border: `1px solid ${T.successBorder}`,
            boxShadow: T.shadowElevated,
            color: T.text,
            padding: "0.75rem 1.25rem",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <span style={{ fontSize: "1.2rem" }} aria-hidden="true">⚡</span>
          <div>
            <div style={{ fontWeight: "700", color: T.success, fontSize: "0.95rem" }}>
              {xpToast.message}
            </div>
            <div style={{ fontSize: "0.75rem", color: T.textMuted }}>Điểm kinh nghiệm đã cộng</div>
          </div>
        </div>
      )}

      {/* Auth Modal (WCAG 2.2 AA FocusTrapModal2026) */}
      <FocusTrapModal2026
        id="auth-modal"
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setShowSwitchAuthForm(false);
          setAuthError("");
          setAuthSuccess("");
        }}
        title={
          !currentUser.isGuest && !showSwitchAuthForm && authTab !== "reset"
            ? "Hồ sơ Tài khoản, Gói VIP & Thành tích"
            : authTab === "login"
            ? "Đăng nhập tài khoản"
            : authTab === "register"
            ? "Đăng ký thành viên"
            : authTab === "forgot"
            ? "Khôi phục mật khẩu"
            : "Đặt lại mật khẩu mới"
        }
        maxWidth={!currentUser.isGuest && !showSwitchAuthForm && authTab !== "reset" ? "580px" : "460px"}
        padding="24px"
      >
        {!currentUser.isGuest && !showSwitchAuthForm && authTab !== "reset" ? (
          <AccountProfileCard
            currentUser={currentUser}
            authToken={activeAuthToken}
            completedLessonsCount={(userTracker?.completedLessons || []).length}
            totalLessonsCount={53}
            userTracker={userTracker}
            savedMistakesCount={savedMistakes.length}
            savedVocabCount={savedVocab.length}
            isLight={isLight}
            onEntitlementSync={handleServerEntitlementSync}
            onOpenVipHub={() => {
              setAuthModalOpen(false);
              setCurrentView("vip");
            }}
            onOpenGamificationHub={() => {
              setAuthModalOpen(false);
              setCurrentView("gamification");
            }}
            onSwitchAccount={() => {
              setAuthError("");
              setAuthSuccess("");
              setAuthTab("login");
              setShowSwitchAuthForm(true);
            }}
            onLogout={handleLogout}
          />
        ) : (
          <>
            {!currentUser.isGuest && showSwitchAuthForm && authTab !== "reset" && (
              <div style={{ marginBottom: "0.9rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSwitchAuthForm(false);
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className="ds-focusable"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: T.accent,
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  ← Quay lại Hồ sơ ({currentUser.name})
                </button>
              </div>
            )}

        {authError && (
          <div style={{ padding: "0.65rem 0.85rem", backgroundColor: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: "6px", color: T.danger, fontSize: "0.84rem", marginBottom: "1rem", lineHeight: 1.45 }}>
            <div>{authError}</div>
            {authUnconfirmedEmail && (
              <div style={{ marginTop: "0.55rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={authSubmitting}
                  onClick={handleResendConfirmation}
                  className="ds-focusable"
                  style={{
                    padding: "0.35rem 0.7rem",
                    backgroundColor: T.accentBg,
                    border: `1px solid ${T.accentBorder}`,
                    color: T.accent,
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    cursor: authSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  📧 Gửi lại email xác nhận ({authUnconfirmedEmail})
                </button>
              </div>
            )}
          </div>
        )}

        {authSuccess && (
          <div style={{ padding: "0.65rem 0.85rem", backgroundColor: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: "6px", color: T.success, fontSize: "0.84rem", marginBottom: "1rem", lineHeight: 1.45 }}>
            {authSuccess}
          </div>
        )}

        {(authTab === "login" || authTab === "register") && (
          <div style={{ display: "flex", backgroundColor: T.bgElevated, padding: "3px", borderRadius: "6px", marginBottom: "1.25rem" }}>
            <button
              type="button"
              onClick={() => { setAuthTab("login"); setAuthError(""); setAuthSuccess(""); setAuthConfirmPassword(""); }}
              className="ds-focusable"
              style={{
                flex: 1,
                padding: "0.4rem",
                borderRadius: "4px",
                border: "none",
                fontSize: "0.825rem",
                fontWeight: authTab === "login" ? "700" : "500",
                backgroundColor: authTab === "login" ? T.card : "transparent",
                color: authTab === "login" ? T.text : T.textMuted,
                boxShadow: authTab === "login" ? T.shadow : "none",
                cursor: "pointer",
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab("register"); setAuthError(""); setAuthSuccess(""); setAuthConfirmPassword(""); }}
              className="ds-focusable"
              style={{
                flex: 1,
                padding: "0.4rem",
                borderRadius: "4px",
                border: "none",
                fontSize: "0.825rem",
                fontWeight: authTab === "register" ? "700" : "500",
                backgroundColor: authTab === "register" ? T.card : "transparent",
                color: authTab === "register" ? T.text : T.textMuted,
                boxShadow: authTab === "register" ? T.shadow : "none",
                cursor: "pointer",
              }}
            >
              Đăng ký mới
            </button>
          </div>
        )}

        {authTab === "forgot" ? (
          <form onSubmit={handleForgotPassword}>
            <p style={{ margin: "0 0 0.9rem", fontSize: "0.82rem", color: T.textSecondary, lineHeight: 1.5 }}>
              Nhập email tài khoản đã đăng ký. Hệ thống sẽ gửi đường dẫn đặt lại mật khẩu trực tiếp qua email cho bạn.
            </p>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.35rem", fontWeight: "600" }}>
                Email khôi phục:
              </label>
              <input
                type="email"
                required
                value={authEmail}
                placeholder="name@example.com"
                onChange={(e) => setAuthEmail(e.target.value)}
                className="ds-focusable"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  backgroundColor: T.inputBg,
                  border: `1px solid ${T.border}`,
                  borderRadius: "6px",
                  color: T.text,
                  fontSize: "0.875rem",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={authSubmitting}
              className="ds-btn ds-focusable"
              style={{
                width: "100%",
                padding: "0.65rem",
                backgroundColor: "var(--ds-btn-primary)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: authSubmitting ? "not-allowed" : "pointer",
                opacity: authSubmitting ? 0.75 : 1,
              }}
            >
              {authSubmitting ? "Đang gửi email..." : "Gửi link khôi phục mật khẩu"}
            </button>
            <div style={{ marginTop: "0.85rem", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => { setAuthTab("login"); setAuthError(""); setAuthSuccess(""); }}
                className="ds-focusable"
                style={{
                  background: "none",
                  border: "none",
                  color: T.accent,
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </form>
        ) : authTab === "reset" ? (
          <form onSubmit={handleResetPassword}>
            <p style={{ margin: "0 0 0.9rem", fontSize: "0.82rem", color: T.textSecondary, lineHeight: 1.5 }}>
              Vui lòng nhập mật khẩu mới (tối thiểu 6 ký tự) để hoàn tất khôi phục tài khoản.
            </p>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.35rem", fontWeight: "600" }}>
                Mật khẩu mới:
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={authPassword}
                placeholder="Tối thiểu 6 ký tự"
                onChange={(e) => setAuthPassword(e.target.value)}
                className="ds-focusable"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  backgroundColor: T.inputBg,
                  border: `1px solid ${T.border}`,
                  borderRadius: "6px",
                  color: T.text,
                  fontSize: "0.875rem",
                }}
              />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.35rem", fontWeight: "600" }}>
                Nhập lại mật khẩu mới:
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={authConfirmPassword}
                placeholder="Xác nhận mật khẩu mới"
                onChange={(e) => setAuthConfirmPassword(e.target.value)}
                className="ds-focusable"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  backgroundColor: T.inputBg,
                  border: `1px solid ${T.border}`,
                  borderRadius: "6px",
                  color: T.text,
                  fontSize: "0.875rem",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={authSubmitting}
              className="ds-btn ds-focusable"
              style={{
                width: "100%",
                padding: "0.65rem",
                backgroundColor: "var(--ds-btn-primary)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: authSubmitting ? "not-allowed" : "pointer",
                opacity: authSubmitting ? 0.75 : 1,
              }}
            >
              {authSubmitting ? "Đang lưu mật khẩu..." : "Lưu mật khẩu mới"}
            </button>
            <div style={{ marginTop: "0.85rem", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => { setAuthTab("login"); setAuthError(""); setAuthSuccess(""); }}
                className="ds-focusable"
                style={{
                  background: "none",
                  border: "none",
                  color: T.textMuted,
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        ) : (
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
                  className="ds-focusable"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    backgroundColor: T.inputBg,
                    border: `1px solid ${T.border}`,
                    borderRadius: "6px",
                    color: T.text,
                    fontSize: "0.875rem",
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
                className="ds-focusable"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  backgroundColor: T.inputBg,
                  border: `1px solid ${T.border}`,
                  borderRadius: "6px",
                  color: T.text,
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <div style={{ marginBottom: authTab === "register" ? "1rem" : "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label style={{ fontSize: "0.8rem", color: T.textSecondary, fontWeight: "600" }}>
                  Mật khẩu:
                </label>
                {authTab === "login" && (
                  <button
                    type="button"
                    onClick={() => { setAuthTab("forgot"); setAuthError(""); setAuthSuccess(""); setAuthConfirmPassword(""); }}
                    className="ds-focusable"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: T.accent,
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={authTab === "register" ? 6 : undefined}
                value={authPassword}
                placeholder={authTab === "register" ? "Tối thiểu 6 ký tự" : "••••••••"}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="ds-focusable"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  backgroundColor: T.inputBg,
                  border: `1px solid ${T.border}`,
                  borderRadius: "6px",
                  color: T.text,
                  fontSize: "0.875rem",
                }}
              />
            </div>

            {authTab === "register" && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.35rem", fontWeight: "600" }}>
                  Nhập lại mật khẩu:
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authConfirmPassword}
                  placeholder="Nhập lại mật khẩu giống ở trên"
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  className="ds-focusable"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    backgroundColor: T.inputBg,
                    border: `1px solid ${
                      authConfirmPassword.length > 0
                        ? authPassword === authConfirmPassword
                          ? T.successBorder
                          : T.dangerBorder
                        : T.border
                    }`,
                    borderRadius: "6px",
                    color: T.text,
                    fontSize: "0.875rem",
                  }}
                />
                {authConfirmPassword.length > 0 && (
                  <div
                    style={{
                      marginTop: "0.35rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: authPassword === authConfirmPassword ? T.success : T.danger,
                    }}
                  >
                    {authPassword === authConfirmPassword
                      ? "✓ Hai mật khẩu đã khớp"
                      : "⚠ Mật khẩu nhập lại chưa khớp"}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="ds-btn ds-focusable"
              style={{
                width: "100%",
                padding: "0.65rem",
                backgroundColor: "var(--ds-btn-primary)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: authSubmitting ? "not-allowed" : "pointer",
                opacity: authSubmitting ? 0.75 : 1,
              }}
            >
              {authSubmitting
                ? "Đang xử lý..."
                : authTab === "login"
                ? "Đăng nhập ngay"
                : "Tạo tài khoản học tập"}
            </button>
          </form>
        )}
          </>
        )}
      </FocusTrapModal2026>

      {/* Admin: Modal Add New User (WCAG FocusTrapModal2026) */}
      <FocusTrapModal2026
        id="new-user-modal"
        isOpen={newUserModalOpen}
        onClose={() => setNewUserModalOpen(false)}
        title="Thêm người dùng mới vào hệ thống"
        maxWidth="460px"
        padding="24px"
      >
        <form onSubmit={handleCreateNewUserByAdmin}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.3rem" }}>Họ tên:</label>
            <input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="ds-focusable"
              style={{ width: "100%", padding: "0.5rem", backgroundColor: T.inputBg, border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.3rem" }}>Email:</label>
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="ds-focusable"
              style={{ width: "100%", padding: "0.5rem", backgroundColor: T.inputBg, border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.3rem" }}>Mật khẩu:</label>
            <input
              type="password"
              required
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="ds-focusable"
              style={{ width: "100%", padding: "0.5rem", backgroundColor: T.inputBg, border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: T.textSecondary, marginBottom: "0.3rem" }}>Quyền tài khoản:</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="ds-focusable"
              style={{ width: "100%", padding: "0.5rem", backgroundColor: T.inputBg, border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text }}
            >
              <option value="FREE">FREE (Miễn phí - Giới hạn 10 câu/chương &amp; 2 quiz)</option>
              <option value="VIP">VIP (Toàn quyền 2,900+ câu &amp; không giới hạn)</option>
              <option value="ADMIN">ADMIN (Quản trị viên hệ thống)</option>
            </select>
          </div>

          <button
            type="submit"
            className="ds-btn ds-focusable"
            style={{ width: "100%", padding: "0.65rem", backgroundColor: "var(--ds-btn-success)", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}
          >
            Tạo tài khoản ngay
          </button>
        </form>
      </FocusTrapModal2026>

      {/* ============================================================== */}
      {/* DICTIONARY POPUP (CLICK TRA TỪ NHANH + PHIÊN ÂM IPA + AUDIO)  */}
      {/* ============================================================== */}
      {dictPopup.open && (
        <div
          id="dict-popup"
          data-no-dict="true"
          style={{
            position: "fixed",
            left: `${dictPopup.x}px`,
            top: `${dictPopup.y}px`,
            width: "330px",
            backgroundColor: "var(--ds-card)",
            border: "1px solid var(--ds-accent-border)",
            boxShadow: "var(--ds-shadow-lg)",
            borderRadius: "14px",
            zIndex: 1300,
            padding: "1rem 1.15rem",
            color: "var(--ds-text)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header: Word + POS Badge + Close */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--ds-accent)", letterSpacing: "-0.01em" }}>
                {dictPopup.word}
              </h3>
              {dictPopup.partOfSpeech && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontFamily: "var(--font-sans)",
                    backgroundColor: "var(--ds-accent-bg)",
                    color: "var(--ds-accent)",
                    border: "1px solid var(--ds-accent-border)",
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
              type="button"
              aria-label="Đóng cửa sổ tra từ"
              onClick={() => setDictPopup((prev) => ({ ...prev, open: false }))}
              className="ds-focusable"
              style={{
                background: "none",
                border: "none",
                color: "var(--ds-text-muted)",
                fontSize: "1.1rem",
                cursor: "pointer",
                padding: "0.1rem 0.3rem",
                lineHeight: 1,
                borderRadius: "4px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Content / Loading state */}
          {dictPopup.loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "1.25rem 0", color: "var(--ds-text-muted)", fontSize: "0.85rem" }}>
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
                  backgroundColor: "var(--ds-card-subtle)",
                  border: "1px solid var(--ds-border-subtle)",
                  borderRadius: "8px",
                  padding: "0.45rem 0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--ds-text-muted)", fontWeight: "700" }}>IPA:</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--ds-accent)", fontWeight: "700" }}>
                    {dictPopup.phonetic || `/${dictPopup.word}/`}
                  </span>
                </div>

                {/* Audio Speaker Button */}
                <button
                  type="button"
                  onClick={() => playWordAudio(dictPopup.word, dictPopup.audioUrl)}
                  disabled={dictPopup.isPlayingAudio}
                  title="Nghe phát âm chuẩn tiếng Anh (Audio API)"
                  className="ds-focusable"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    backgroundColor: dictPopup.isPlayingAudio ? "var(--ds-btn-primary)" : "var(--ds-accent-bg)",
                    border: "1px solid var(--ds-accent-border)",
                    color: dictPopup.isPlayingAudio ? "#ffffff" : "var(--ds-accent)",
                    borderRadius: "6px",
                    padding: "0.25rem 0.55rem",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  <KitIcon name="tool-audio" size={14} />
                  <span>{dictPopup.isPlayingAudio ? "Đang đọc..." : "Nghe phát âm"}</span>
                </button>
              </div>

              {/* Vietnamese Meaning Box */}
              <div
                style={{
                  backgroundColor: "var(--ds-success-bg)",
                  border: "1px solid var(--ds-success-border)",
                  borderRadius: "8px",
                  padding: "0.65rem 0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ fontSize: "0.7rem", color: "var(--ds-success)", fontWeight: "700", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Nghĩa tiếng Việt
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--ds-text-heading)", lineHeight: 1.35 }}>
                  {dictPopup.vietnamese}
                </div>
                {dictPopup.detailedMeanings.length > 0 && dictPopup.detailedMeanings[0].meanings.length > 1 && (
                  <div style={{ marginTop: "0.35rem", fontSize: "0.75rem", color: "var(--ds-text-secondary)" }}>
                    Từ đồng nghĩa: {dictPopup.detailedMeanings[0].meanings.slice(1, 4).join(", ")}
                  </div>
                )}
              </div>

              {/* English Definition (if available) */}
              {dictPopup.englishDefinition && (
                <div style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)", lineHeight: 1.4, marginBottom: "0.75rem", fontStyle: "italic", borderLeft: "2px solid var(--ds-border)", paddingLeft: "0.5rem" }}>
                  &ldquo;{dictPopup.englishDefinition}&rdquo;
                </div>
              )}

              {/* Footer Toolbar: Save Vocab + Cambridge Link */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: "1px solid var(--ds-border-subtle)", gap: "0.5rem" }}>
                {(() => {
                  const isSaved = savedVocab.some((v) => v.word.toLowerCase() === dictPopup.word.toLowerCase());
                  return (
                    <button
                      type="button"
                      onClick={() => toggleSaveWord(dictPopup)}
                      className="ds-focusable"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        backgroundColor: isSaved ? "var(--ds-warning-bg)" : "var(--ds-bg-elevated)",
                        border: isSaved ? "1px solid var(--ds-warning-border)" : "1px solid var(--ds-border)",
                        color: isSaved ? "var(--ds-warning)" : "var(--ds-text-secondary)",
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
                    color: "var(--ds-text-muted)",
                    textDecoration: "none",
                    padding: "0.3rem 0.5rem",
                    borderRadius: "6px",
                    backgroundColor: "var(--ds-card-subtle)",
                    border: "1px solid var(--ds-border-subtle)",
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
      <FocusTrapModal2026
        id="vocab-modal"
        isOpen={vocabModalOpen}
        onClose={() => setVocabModalOpen(false)}
        maxWidth="680px"
        padding="20px"
        headerLeft={
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: "9px",
                backgroundColor: "var(--ds-accent-bg)",
                border: "1px solid var(--ds-accent-border)",
                color: "var(--ds-accent)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <KitIcon name="tool-vocab" size={18} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.08rem", fontWeight: 700, color: "var(--ds-text-heading)" }}>
                Sổ tay từ vựng của {currentUser.name}
              </h3>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ds-text-muted)" }}>
                Lưu trữ các từ đã tra cứu, phiên âm IPA và audio phát âm
              </p>
            </div>
          </div>
        }
      >
        {/* Filter Search Input */}
        <div style={{ paddingBottom: "0.85rem", borderBottom: "1px solid var(--ds-border-subtle)", marginBottom: "0.85rem" }}>
          <input
            type="text"
            value={vocabSearchFilter}
            onChange={(e) => setVocabSearchFilter(e.target.value)}
            placeholder="Tìm kiếm trong sổ từ vựng..."
            aria-label="Tìm kiếm trong sổ từ vựng"
            style={{
              width: "100%",
              height: "38px",
              padding: "0 0.85rem",
              backgroundColor: "var(--ds-bg-elevated)",
              border: "1px solid var(--ds-border)",
              borderRadius: "8px",
              fontSize: "0.85rem",
              color: "var(--ds-text)",
              outline: "none",
            }}
          />
        </div>

        {/* Words List */}
        <div style={{ maxHeight: "52vh", overflowY: "auto", paddingRight: "0.25rem" }}>
          {(() => {
            const filtered = savedVocab.filter(
              (v) =>
                v.word.toLowerCase().includes(vocabSearchFilter.toLowerCase()) ||
                (v.vietnamese && v.vietnamese.toLowerCase().includes(vocabSearchFilter.toLowerCase()))
            );

            if (filtered.length === 0) {
              return (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--ds-text-muted)" }}>
                  <div style={{ display: "inline-flex", padding: "0.75rem", borderRadius: "12px", backgroundColor: "var(--ds-accent-bg)", color: "var(--ds-accent)", marginBottom: "0.75rem" }}>
                    <KitIcon name="tool-vocab" size={28} />
                  </div>
                  <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--ds-text-heading)", marginBottom: "0.45rem" }}>
                    Chưa có từ vựng nào trong sổ
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--ds-text-muted)", maxWidth: "380px", margin: "0 auto", lineHeight: 1.5 }}>
                    Khi học lý thuyết hoặc giải bài tập, bạn chỉ cần click trực tiếp vào bất kỳ từ tiếng Anh nào để tra nghĩa, nghe phát âm và bấm &ldquo;Lưu vào Sổ từ&rdquo;.
                  </p>
                </div>
              );
            }

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "var(--ds-card-subtle)",
                      border: "1px solid var(--ds-border)",
                      borderRadius: "10px",
                      padding: "0.85rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ds-accent)" }}>
                          {item.word}
                        </span>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--ds-cyan)" }}>
                          {item.phonetic}
                        </span>
                        {item.partOfSpeech && (
                          <span
                            style={{
                              fontSize: "0.65rem",
                              backgroundColor: "var(--ds-bg-elevated)",
                              border: "1px solid var(--ds-border)",
                              color: "var(--ds-text-muted)",
                              padding: "0.05rem 0.35rem",
                              borderRadius: "4px",
                            }}
                          >
                            {item.partOfSpeech}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ds-success)" }}>
                        {item.vietnamese}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => playWordAudio(item.word, item.audioUrl)}
                        title="Nghe phát âm"
                        className="ds-focusable"
                        style={{
                          backgroundColor: "var(--ds-accent-bg)",
                          border: "1px solid var(--ds-accent-border)",
                          color: "var(--ds-accent)",
                          borderRadius: "6px",
                          padding: "0.35rem 0.65rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <KitIcon name="tool-audio" size={14} />
                        <span>Nghe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSaveWord(item)}
                        title="Xóa khỏi sổ từ vựng"
                        aria-label={`Xóa từ ${item.word}`}
                        className="ds-focusable"
                        style={{
                          backgroundColor: "var(--ds-danger-bg)",
                          border: "1px solid var(--ds-danger-border)",
                          color: "var(--ds-danger)",
                          borderRadius: "6px",
                          padding: "0.35rem 0.6rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Xóa
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
            marginTop: "1rem",
            paddingTop: "0.85rem",
            borderTop: "1px solid var(--ds-border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--ds-text-muted)" }}>
            Tổng cộng: <strong style={{ color: "var(--ds-text-heading)" }}>{savedVocab.length}</strong> từ vựng
          </span>
          <button
            type="button"
            onClick={() => setVocabModalOpen(false)}
            className="ds-focusable"
            style={{
              backgroundColor: "var(--ds-btn-primary)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.45rem 1.1rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
        </div>
      </FocusTrapModal2026>

      {/* Main Content Layout (2026 Responsive 5-Hub Shell) */}
      <AppShell2026
        activeView={currentView}
        onSelectView={setCurrentView}
        currentUser={currentUser}
        userTracker={userTracker}
        savedMistakesCount={savedMistakes.length}
        savedVocabCount={savedVocab.length}
        syncState={syncState}
        onTriggerSync={() => SyncManager.triggerSync()}
        onPullRemote={() => SyncManager.pullRemoteChanges()}
        dictSearchInput={dictSearchInput}
        onDictSearchChange={setDictSearchInput}
        onDictSearchSubmit={(val) => triggerLookup(val, null, null)}
        dictEnabled={dictEnabled}
        onToggleDict={() => setDictEnabled(!dictEnabled)}
        isLight={isLight}
        onToggleTheme={toggleTheme}
        onOpenVocabModal={() => setVocabModalOpen(true)}
        onOpenAuthModal={() => {
          setShowSwitchAuthForm(false);
          setAuthTab("login");
          setAuthModalOpen(true);
        }}
        onPrefetchView={(hubId) => {
          const uid = !currentUser?.isGuest && currentUser?.id !== "guest" ? currentUser?.id : null;
          if (hubId === "gamification") prefetchGamificationData({ userId: uid, authToken: activeAuthToken });
          if (hubId === "vip") prefetchMonetizationData({ userId: uid, authToken: activeAuthToken });
        }}
        onStartQuizIfEmpty={() => {
          if (activeQuizQuestions.length === 0) startNewQuiz("ALL");
        }}
        currentChapterTitle={`Chương ${String(selectedChapter?.number || 1).padStart(2, "0")}: ${selectedChapter?.title_vi || ""}`}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebarCollapse={() => setSidebarCollapsed((p) => !p)}
        sidebarContent={currentView === "study" ? chapterSidebarContent : null}
      >

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
                  border: `1px solid ${"var(--ds-danger-border)"}`,
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
                        fontFamily: "var(--font-sans)",
                        backgroundColor: "var(--ds-success-bg)",
                        color: "var(--ds-success)",
                        border: `1px solid ${"var(--ds-success-border)"}`,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                        fontWeight: "700",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--ds-success)" }} />
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
                      backgroundColor: "var(--ds-bg-elevated)",
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
                      backgroundColor: "var(--ds-btn-success)",
                      color: "#ffffff",
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
                    <span style={{ color: "var(--ds-accent)", fontWeight: "700" }}>{adminStats.freeCount} Free</span>
                    <span>•</span>
                    <span style={{ color: "var(--ds-warning)", fontWeight: "700" }}>{adminStats.vipCount} VIP</span>
                    <span>•</span>
                    <span style={{ color: "var(--ds-danger)", fontWeight: "700" }}>{adminStats.adminCount} Admin</span>
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
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--ds-success)" }}>
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
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--ds-warning)" }}>
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
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--ds-accent)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
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
                        backgroundColor: isActive ? ("var(--ds-card)") : "transparent",
                        border: isActive ? `1px solid ${T.border}` : "1px solid transparent",
                        borderRadius: "8px",
                        color: isActive ? "var(--ds-text-heading)" : "var(--ds-text-muted)",
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
                <>
                  <AdminOverviewPanel
                    authHeaders={adminAuthHeaders}
                    isLight={isLight}
                    onNavigateTab={setAdminActiveTab}
                  />
                  <AdminMonetizationPanel authToken={activeAuthToken} isLight={isLight} />
                </>
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
                          backgroundColor: "var(--ds-card)",
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
                              backgroundColor: adminRoleFilter === r ? ("var(--ds-accent-bg)") : ("var(--ds-bg-elevated)"),
                              color: adminRoleFilter === r ? ("var(--ds-accent)") : T.textMuted,
                              border: `1px solid ${adminRoleFilter === r ? ("var(--ds-accent-border)") : T.border}`,
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
                              backgroundColor: adminStatusFilter === s ? ("var(--ds-success-bg)") : ("var(--ds-bg-elevated)"),
                              color: adminStatusFilter === s ? ("var(--ds-success)") : T.textMuted,
                              border: `1px solid ${adminStatusFilter === s ? ("var(--ds-success-border)") : T.border}`,
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
                                      <span style={{ fontSize: "0.68rem", backgroundColor: "var(--ds-accent-bg)", padding: "0.1rem 0.35rem", borderRadius: "3px", color: "var(--ds-accent)", fontWeight: "700" }}>
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
                                      fontFamily: "var(--font-sans)",
                                      fontWeight: "700",
                                      padding: "0.2rem 0.55rem",
                                      borderRadius: "4px",
                                      backgroundColor:
                                        u.role === "ADMIN" ? ("var(--ds-danger-bg)")
                                        : u.role === "VIP" ? ("var(--ds-warning-bg)")
                                        : ("var(--ds-accent-bg)"),
                                      color:
                                        u.role === "ADMIN" ? ("var(--ds-danger)")
                                        : u.role === "VIP" ? ("var(--ds-warning)")
                                        : ("var(--ds-accent)"),
                                      border: `1px solid ${
                                        u.role === "ADMIN" ? ("var(--ds-danger-border)")
                                        : u.role === "VIP" ? ("var(--ds-warning-border)")
                                        : ("var(--ds-accent-border)")
                                      }`,
                                    }}
                                  >
                                    {u.role === "ADMIN" ? "🛡️ ADMIN" : u.role === "VIP" ? "⭐ VIP" : "👤 FREE"}
                                  </span>
                                </td>

                                <td style={{ padding: "0.85rem 0.5rem" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                      <span style={{ fontSize: "0.75rem", color: "var(--ds-warning)", fontWeight: "700" }}>
                                        🔥 {u.tracker?.streak || 1} ngày
                                      </span>
                                      <span style={{ fontSize: "0.75rem", color: "var(--ds-accent)", fontWeight: "700" }}>
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
                                      color: u.status === "ACTIVE" ? ("var(--ds-success)") : ("var(--ds-danger)"),
                                      fontWeight: "700",
                                    }}
                                  >
                                    {u.status === "ACTIVE" ? "✓ Hoạt động" : "✕ Đã khóa"}
                                  </span>
                                </td>

                                <td style={{ padding: "0.85rem 0.5rem", fontSize: "0.75rem", color: T.textMuted, fontFamily: "var(--font-sans)" }}>
                                  {u.createdAt}
                                </td>

                                <td style={{ padding: "0.85rem 0.5rem", textAlign: "right" }}>
                                  <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                    {u.role !== "VIP" && u.role !== "ADMIN" && (
                                      <button
                                        onClick={() => handleUpdateUserRole(u.id, "VIP")}
                                        style={{
                                          padding: "0.3rem 0.65rem",
                                          backgroundColor: "var(--ds-warning-bg)",
                                          border: `1px solid ${"var(--ds-warning-border)"}`,
                                          color: "var(--ds-warning)",
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
                                          backgroundColor: "var(--ds-bg-elevated)",
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
                                          backgroundColor: u.status === "ACTIVE" ? ("var(--ds-danger-bg)") : ("var(--ds-success-bg)"),
                                          border: `1px solid ${u.status === "ACTIVE" ? ("var(--ds-danger-border)") : ("var(--ds-success-border)")}`,
                                          color: u.status === "ACTIVE" ? ("var(--ds-danger)") : ("var(--ds-success)"),
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
                        style={{ padding: "0.55rem 0.85rem", backgroundColor: "var(--ds-card)", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text, width: "180px", fontSize: "0.9rem" }}
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
                        style={{ padding: "0.55rem 0.85rem", backgroundColor: "var(--ds-card)", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text, width: "180px", fontSize: "0.9rem" }}
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
                        style={{ padding: "0.55rem 0.85rem", backgroundColor: "var(--ds-card)", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text, width: "150px", fontSize: "0.9rem" }}
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
                        style={{ padding: "0.55rem 0.85rem", backgroundColor: "var(--ds-card)", border: `1px solid ${T.border}`, borderRadius: "6px", color: T.text, width: "150px", fontSize: "0.9rem" }}
                      />
                      <div style={{ fontSize: "0.72rem", color: T.textMuted, marginTop: "0.25rem" }}>Mặc định: 50 sự kiện/lần</div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        padding: "0.6rem 1.6rem",
                        backgroundColor: "var(--ds-btn-primary)",
                        color: "#ffffff",
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
                          backgroundColor: "var(--ds-card)",
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
                          backgroundColor: "var(--ds-bg-elevated)",
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
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-sans)", color: T.textMuted, whiteSpace: "nowrap" }}>
                                  {dateStr}
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.78rem", fontWeight: "600", color: T.text }}>
                                  {log.admin_id ? log.admin_id.substring(0, 8) : "admin"}
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem" }}>
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      fontFamily: "var(--font-sans)",
                                      fontWeight: "700",
                                      padding: "0.15rem 0.5rem",
                                      borderRadius: "4px",
                                      backgroundColor:
                                        log.action_type === "BAN_USER" ? ("var(--ds-danger-bg)")
                                        : log.action_type === "UNBAN_USER" ? ("var(--ds-success-bg)")
                                        : log.action_type === "UPDATE_USER_ROLE" ? ("var(--ds-accent-bg)")
                                        : ("var(--ds-warning-bg)"),
                                      color:
                                        log.action_type === "BAN_USER" ? ("var(--ds-danger)")
                                        : log.action_type === "UNBAN_USER" ? ("var(--ds-success)")
                                        : log.action_type === "UPDATE_USER_ROLE" ? ("var(--ds-accent)")
                                        : ("var(--ds-warning)"),
                                      border: `1px solid ${
                                        log.action_type === "BAN_USER" ? ("var(--ds-danger-border)")
                                        : log.action_type === "UNBAN_USER" ? ("var(--ds-success-border)")
                                        : log.action_type === "UPDATE_USER_ROLE" ? ("var(--ds-accent-border)")
                                        : ("var(--ds-warning-border)")
                                      }`,
                                    }}
                                  >
                                    {log.action_type}
                                  </span>
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-sans)", color: T.textSecondary }}>
                                  {log.target_type}: {log.target_id?.substring(0, 12)}
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.72rem", fontFamily: "var(--font-sans)", color: T.textMuted }}>
                                  <div style={{ maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {log.before_state && (
                                      <span style={{ textDecoration: "line-through", marginRight: "0.4rem", color: "var(--ds-danger)" }}>
                                        {JSON.stringify(log.before_state)}
                                      </span>
                                    )}
                                    <span>→</span>
                                    {log.after_state && (
                                      <span style={{ marginLeft: "0.4rem", color: "var(--ds-success)" }}>
                                        {JSON.stringify(log.after_state)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontSize: "0.72rem", fontFamily: "var(--font-sans)", color: T.textMuted }}>
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
                        backgroundColor: "var(--ds-bg-elevated)",
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
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-sans)", color: T.textMuted, whiteSpace: "nowrap" }}>
                                  {dateStr}
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.8rem", fontWeight: "600", color: T.text }}>
                                  {log.user_email || log.user_id?.substring(0, 8)}
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem" }}>
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      fontFamily: "var(--font-sans)",
                                      fontWeight: "700",
                                      padding: "0.15rem 0.5rem",
                                      borderRadius: "4px",
                                      backgroundColor:
                                        log.action_type === "LOGIN" ? ("var(--ds-success-bg)")
                                        : log.action_type === "LOGOUT" ? ("var(--ds-danger-bg)")
                                        : log.action_type === "SUBMIT_QUIZ" ? ("var(--ds-warning-bg)")
                                        : log.action_type === "STUDY_LESSON" ? ("var(--ds-accent-bg)")
                                        : ("var(--ds-purple-bg)"),
                                      color:
                                        log.action_type === "LOGIN" ? ("var(--ds-success)")
                                        : log.action_type === "LOGOUT" ? ("var(--ds-danger)")
                                        : log.action_type === "SUBMIT_QUIZ" ? ("var(--ds-warning)")
                                        : log.action_type === "STUDY_LESSON" ? ("var(--ds-accent)")
                                        : ("var(--ds-purple)"),
                                    }}
                                  >
                                    {log.action_type}
                                  </span>
                                </td>
                                <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.75rem", color: T.textMuted, fontFamily: "var(--font-sans)" }}>
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

        <GamificationCelebrationModal
          celebration={gamificationCelebration}
          onClose={() => setGamificationCelebration(null)}
          isLight={isLight}
          reducedMotion={gamificationPreferences.reduced_motion}
        />

        <SmartPaywallModal
          isOpen={smartPaywall.open}
          onClose={() => setSmartPaywall((p) => ({ ...p, open: false }))}
          onDismiss={(tKey) => {
            if (!currentUser?.isGuest && currentUser?.id) {
              fetch("/api/monetization/overview", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(activeAuthToken ? { Authorization: `Bearer ${activeAuthToken}` } : {}),
                },
                body: JSON.stringify({
                  action: "check_paywall",
                  user_id: currentUser.id,
                  trigger_key: tKey,
                  action_taken: "dismissed",
                }),
              }).catch(() => {});
            }
          }}
          paywallContext={smartPaywall.context}
          psychology={paywallPsych}
          abVariant={smartPaywall.context?.variantKey || "control"}
          featurePreview={smartPaywall.preview}
          isGuest={Boolean(currentUser?.isGuest || !currentUser?.id || currentUser?.id === "guest")}
          onOpenFullPricing={() => setCurrentView("vip")}
          onRequireRegister={() => {
            setAuthError("");
            setAuthSuccess("Vui lòng đăng ký tài khoản mới (hoặc chuyển sang Đăng nhập) để nâng cấp gói VIP.");
            setAuthTab("register");
            setShowSwitchAuthForm(false);
            setAuthModalOpen(true);
          }}
          isLight={isLight}
        />

        {/* ============================================================== */}
        {/* VIEW 7: INTELLIGENT MONETIZATION & VIP HUB (MILESTONE 2.12)    */}
        {/* ============================================================== */}
        {currentView === "vip" && (
          <div style={{ flex: 1, backgroundColor: T.bg, padding: "2rem 1.5rem" }}>
            <div style={{ maxWidth: "1020px", margin: "0 auto" }}>
              <MonetizationHub
                userId={!currentUser?.isGuest && currentUser?.id !== "guest" ? currentUser?.id : null}
                authToken={!currentUser?.isGuest ? activeAuthToken : null}
                isLight={isLight}
                onEntitlementSync={handleServerEntitlementSync}
                onRequireLogin={() => {
                  setAuthError("");
                  setAuthSuccess("");
                  setAuthTab("login");
                  setShowSwitchAuthForm(false);
                  setAuthModalOpen(true);
                }}
                onRequireRegister={() => {
                  setAuthError("");
                  setAuthSuccess("Vui lòng đăng ký tài khoản mới (hoặc chuyển sang Đăng nhập) để thanh toán nâng cấp VIP.");
                  setAuthTab("register");
                  setShowSwitchAuthForm(false);
                  setAuthModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 6: INTELLIGENT GAMIFICATION & LEADERBOARD (MILESTONE 2.10)*/}
        {/* ============================================================== */}
        {currentView === "gamification" && (
          <div style={{ flex: 1, backgroundColor: T.bg, padding: "2rem 1.5rem" }}>
            <div style={{ maxWidth: "1020px", margin: "0 auto" }}>
              <GamificationHub
                userId={!currentUser?.isGuest ? currentUser?.id : null}
                authToken={activeAuthToken}
                isLight={isLight}
                onPreferencesChange={setGamificationPreferences}
                onStartAdaptivePractice={startAdaptivePractice}
              />
            </div>
          </div>
        )}

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
                className="ge-hero-banner-card"
                style={{
                  padding: "1.65rem 1.85rem",
                  marginBottom: "1.25rem",
                }}
              >
                <img
                  src={BANNER_PATHS.dashboard}
                  alt=""
                  aria-hidden="true"
                  className="ge-hero-banner-bg"
                />
                <div className="ge-hero-banner-scrim" />
                <div
                  className="ge-hero-banner-content"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1.5rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <div className="ge-streak-orb" aria-hidden="true">
                        <span className="ge-streak-flame-live" style={{ fontSize: "1.55rem" }}>🔥</span>
                      </div>
                      <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--ds-text-heading)", margin: 0 }}>
                        Chuỗi học tập {userTracker.streak} ngày liên tiếp của {currentUser.name}!
                      </h1>
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "var(--ds-text-muted)", margin: "0 0 1rem 0", maxWidth: "560px" }}>
                      Duy trì thói quen học mỗi ngày để mở khóa huy hiệu và làm chủ toàn bộ 12 chuyên đề ngữ pháp.
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          backgroundColor: "var(--ds-bg-elevated)",
                          border: "1px solid var(--ds-border)",
                          color: "var(--ds-text)",
                          fontSize: "0.78rem",
                          padding: "0.25rem 0.65rem",
                          borderRadius: "6px",
                          fontWeight: "600",
                        }}
                      >
                        {userRank.badge} • Cấp {userRank.level} ({userRank.title})
                      </span>

                      <span style={{ fontSize: "0.78rem", color: "var(--ds-text-muted)" }}>
                        Mục tiêu cấp tiếp theo: <strong style={{ color: "var(--ds-accent)" }}>{userTracker.xp} / {userRank.nextXp} XP</strong>
                      </span>

                      {currentUser.role === "FREE" && (
                        <button
                          type="button"
                          onClick={() => openContextualSmartPaywall("vip_feature_click", { title: "Toàn quyền 2,939 Bài tập & Lộ trình VIP", description: "Mở khóa bài tập không giới hạn, Đề thích ứng & Báo cáo Radar 12 chuyên đề." })}
                          className="ds-focusable"
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--ds-warning)",
                            backgroundColor: "var(--ds-warning-bg)",
                            border: "1px solid var(--ds-warning-border)",
                            padding: "0.24rem 0.55rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          ⚡ Nâng cấp VIP để mở khóa không giới hạn
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 7-Day Mini Calendar */}
                  <div
                    style={{
                      backgroundColor: "var(--ds-card)",
                      border: "1px solid var(--ds-border)",
                      padding: "1rem 1.2rem",
                      borderRadius: "10px",
                      boxShadow: "var(--ds-shadow-sm)",
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-muted)", textTransform: "uppercase", marginBottom: "0.75rem", textAlign: "center" }}>
                      LỊCH HOẠT ĐỘNG 7 NGÀY
                    </div>
                    <div style={{ display: "flex", gap: "0.55rem" }}>
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
                          <span style={{ fontSize: "0.68rem", color: d.isToday ? "var(--ds-text-heading)" : "var(--ds-text-muted)", fontWeight: d.isToday ? "700" : "500" }}>
                            {d.dayName}
                          </span>
                          <div
                            className={d.isActive ? "ge-streak-day-active" : undefined}
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: d.isActive ? "var(--ds-btn-warning)" : "var(--ds-bg-elevated)",
                              color: d.isActive ? "#ffffff" : "var(--ds-text-muted)",
                              fontSize: "0.88rem",
                              fontWeight: "700",
                              border: d.isToday ? "2px solid var(--ds-accent)" : "1px solid var(--ds-border-subtle)",
                            }}
                          >
                            {d.isActive ? <span className="ge-streak-flame-live">🔥</span> : d.dayNum}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Zone A / Zone B Bento Switcher */}
              <div className="ge-bento-zone-tabs">
                <div className="ge-bento-zone-pills" role="tablist" aria-label="Phân vùng Tổng quan">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={dashboardZone === "today"}
                    onClick={() => setDashboardZone("today")}
                    className={`ge-bento-zone-btn ds-focusable ${dashboardZone === "today" ? "is-active" : ""}`}
                  >
                    Hôm nay &amp; Mục tiêu
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={dashboardZone === "analytics"}
                    onClick={() => setDashboardZone("analytics")}
                    className={`ge-bento-zone-btn ds-focusable ${dashboardZone === "analytics" ? "is-active" : ""}`}
                  >
                    Phân tích &amp; 12 Chuyên đề
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={dashboardZone === "all"}
                    onClick={() => setDashboardZone("all")}
                    className={`ge-bento-zone-btn ds-focusable ${dashboardZone === "all" ? "is-active" : ""}`}
                  >
                    Hiển thị tất cả
                  </button>
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--ds-text-muted)" }}>
                  {overallLessonsProgress}% hoàn thành • {totalLessonsCount} bài học
                </span>
              </div>

              {/* ZONE A: TODAY FOCUS & MICRO-ACTION */}
              {dashboardZone !== "analytics" && (
                <div>
                  {/* 1. PRIORITY #1: DIAGNOSTIC PLACEMENT ASSESSMENT & PERSONALIZED ROADMAP */}
                  <div
                    style={{
                      backgroundColor: "var(--ds-accent-bg)",
                      border: "1px solid var(--ds-accent-border)",
                      borderRadius: "12px",
                      padding: "1.35rem 1.65rem",
                      marginBottom: "1.35rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1.15rem",
                      boxShadow: "var(--ds-shadow-sm)",
                    }}
                  >
                    <div style={{ flex: "1 1 480px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "9999px",
                            backgroundColor: "var(--ds-indigo-bg)",
                            color: "var(--ds-indigo)",
                            border: "1px solid var(--ds-indigo-border)",
                          }}
                        >
                          🎯 Đánh Giá Đầu Vào &amp; Cá Nhân Hóa Lộ Trình
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>
                          30 câu trắc nghiệm • 15-20 phút
                        </span>
                      </div>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--ds-text-heading)", margin: "0 0 0.3rem 0" }}>
                        Chưa biết xuất phát điểm ngữ pháp của bạn ở đâu?
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--ds-text-secondary)", margin: 0, lineHeight: 1.45 }}>
                        Làm bài kiểm tra chẩn đoán để hệ thống xác định chính xác năng lực, phát hiện các điểm yếu chí mạng và xây dựng lộ trình học tập đo ni đóng giày cho riêng bạn.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentView("diagnostic")}
                      className="ds-focusable"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "0.6rem",
                        backgroundColor: "var(--ds-btn-primary)",
                        color: "#ffffff",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "var(--ds-shadow-sm)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span>Khám phá trình độ ngay</span>
                      <span>➔</span>
                    </button>
                  </div>

                  {/* 2. 4 ANALYTICS METRICS SNAPSHOT GRID */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(205px, 1fr))", gap: "0.9rem", marginBottom: "1.35rem" }}>
                    <div style={{ backgroundColor: "var(--ds-card)", border: "1px solid var(--ds-border)", borderRadius: "10px", padding: "1.1rem 1.2rem", boxShadow: "var(--ds-shadow-sm)" }}>
                      <div style={{ fontSize: "0.73rem", color: "var(--ds-text-muted)", textTransform: "uppercase", fontWeight: "700" }}>
                        Bài học đã hoàn thành
                      </div>
                      <div style={{ fontSize: "1.65rem", fontWeight: "800", color: "var(--ds-text-heading)", margin: "0.35rem 0" }}>
                        {userTracker.completedLessons?.length || 0} <span style={{ fontSize: "0.92rem", color: "var(--ds-text-muted)" }}>/ {totalLessonsCount}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--ds-success)", fontWeight: "600" }}>
                        {overallLessonsProgress}% toàn bộ khóa học
                      </div>
                    </div>

                    <div style={{ backgroundColor: "var(--ds-card)", border: "1px solid var(--ds-border)", borderRadius: "10px", padding: "1.1rem 1.2rem", boxShadow: "var(--ds-shadow-sm)" }}>
                      <div style={{ fontSize: "0.73rem", color: "var(--ds-text-muted)", textTransform: "uppercase", fontWeight: "700" }}>
                        Câu hỏi đã giải đúng
                      </div>
                      <div style={{ fontSize: "1.65rem", fontWeight: "800", color: "var(--ds-text-heading)", margin: "0.35rem 0" }}>
                        {userTracker.completedQuestions?.length || 0} <span style={{ fontSize: "0.92rem", color: "var(--ds-text-muted)" }}>/ {totalQuestionsCount}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--ds-accent)", fontWeight: "600" }}>
                        Tích lũy từ bài tập &amp; Quiz
                      </div>
                    </div>

                    <div style={{ backgroundColor: "var(--ds-card)", border: "1px solid var(--ds-border)", borderRadius: "10px", padding: "1.1rem 1.2rem", boxShadow: "var(--ds-shadow-sm)" }}>
                      <div style={{ fontSize: "0.73rem", color: "var(--ds-text-muted)", textTransform: "uppercase", fontWeight: "700" }}>
                        Tổng điểm kinh nghiệm
                      </div>
                      <div style={{ fontSize: "1.65rem", fontWeight: "800", color: "var(--ds-text-heading)", margin: "0.35rem 0" }}>
                        {userTracker.xp} <span style={{ fontSize: "0.92rem", color: "var(--ds-text-muted)" }}>XP</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--ds-warning)", fontWeight: "600" }}>
                        {userRank.title}
                      </div>
                    </div>

                    <div style={{ backgroundColor: "var(--ds-card)", border: "1px solid var(--ds-border)", borderRadius: "10px", padding: "1.1rem 1.2rem", boxShadow: "var(--ds-shadow-sm)" }}>
                      <div style={{ fontSize: "0.73rem", color: "var(--ds-text-muted)", textTransform: "uppercase", fontWeight: "700" }}>
                        Sổ tay câu sai cần ôn
                      </div>
                      <div style={{ fontSize: "1.65rem", fontWeight: "800", color: savedMistakes.length > 0 ? "var(--ds-danger)" : "var(--ds-text-heading)", margin: "0.35rem 0" }}>
                        {savedMistakes.length} <span style={{ fontSize: "0.92rem", color: "var(--ds-text-muted)" }}>câu</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentView("mistakes")}
                        className="ds-focusable"
                        style={{ fontSize: "0.78rem", color: "var(--ds-danger)", cursor: "pointer", textDecoration: "underline", background: "none", border: "none", padding: 0, fontWeight: "600" }}
                      >
                        Xem và luyện lại ngay →
                      </button>
                    </div>
                  </div>

                  {/* 3. TWO-COLUMN STUDY FOCUS: DAILY LESSON + SPACED REPETITION */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                      gap: "1.15rem",
                      alignItems: "stretch",
                      marginBottom: "1.35rem",
                    }}
                  >
                    {/* SMART DAILY RECOMMENDATION CARD */}
                    <div
                      style={{
                        backgroundColor: "var(--ds-card)",
                        border: "1px solid var(--ds-accent-border)",
                        borderRadius: "12px",
                        padding: "1.35rem 1.5rem",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "var(--ds-shadow-sm)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.45rem", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontFamily: "var(--font-sans)",
                              backgroundColor: dailyRecommendation.tagBg || "var(--ds-accent-bg)",
                              color: dailyRecommendation.tagColor || "var(--ds-accent)",
                              border: `1px solid ${dailyRecommendation.tagBorder || "var(--ds-accent-border)"}`,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                              fontWeight: "700",
                            }}
                          >
                            {dailyRecommendation.tag}
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "var(--ds-accent)", fontWeight: "600" }}>Đề xuất học hôm nay</span>
                        </div>

                        <h2 style={{ fontSize: "1.22rem", fontWeight: "800", color: "var(--ds-text-heading)", margin: "0.35rem 0" }}>
                          Chương {dailyRecommendation.chapter.number}: {dailyRecommendation.lesson ? dailyRecommendation.lesson.title_vi : dailyRecommendation.chapter.title_vi}
                        </h2>

                        <p style={{ fontSize: "0.85rem", color: "var(--ds-text-muted)", margin: "0.2rem 0 1rem 0", lineHeight: 1.45 }}>
                          {dailyRecommendation.reason}
                        </p>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={startRecommendedLesson}
                          className="ds-focusable"
                          style={{
                            padding: "0.6rem 1.35rem",
                            backgroundColor: "var(--ds-btn-primary)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "0.86rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "var(--ds-shadow-md)",
                            marginBottom: "1rem",
                          }}
                        >
                          Bắt đầu học ngay hôm nay →
                        </button>

                        {/* Daily Goal Progress Bar */}
                        <div style={{ paddingTop: "0.9rem", borderTop: "1px solid var(--ds-border-subtle)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                            <span style={{ color: "var(--ds-text-muted)" }}>
                              🎯 Mục tiêu hàng ngày: <strong style={{ color: "var(--ds-text-heading)" }}>{userTracker.dailyGoal?.solvedToday || 0}</strong> / {userTracker.dailyGoal?.targetQuestions || 10} câu bài tập
                            </span>
                            <span style={{ color: "var(--ds-success)", fontFamily: "var(--font-sans)", fontWeight: "700" }}>
                              {Math.min(100, Math.round(((userTracker.dailyGoal?.solvedToday || 0) / (userTracker.dailyGoal?.targetQuestions || 10)) * 100))}%
                            </span>
                          </div>
                          <div className="ge-energy-bar-track" style={{ width: "100%", height: "8px", backgroundColor: "var(--ds-bg-elevated)" }}>
                            <div
                              className="ge-energy-bar-fill"
                              style={{
                                width: `${Math.min(100, Math.round(((userTracker.dailyGoal?.solvedToday || 0) / (userTracker.dailyGoal?.targetQuestions || 10)) * 100))}%`,
                                height: "100%",
                                backgroundColor: "var(--ds-btn-success)",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MILESTONE 2.5: SPACED REPETITION & KNOWLEDGE GRAPH MASTERY PANEL */}
                    <SpacedRepetitionPanel
                      userId={!currentUser?.isGuest ? currentUser?.id : null}
                      authToken={activeAuthToken}
                      hasVipAccess={!currentUser?.isGuest && (currentUser?.role === "VIP" || currentUser?.role === "ADMIN")}
                      isLight={isLight}
                      onOpenLessonByCode={openLessonByCode}
                    />
                  </div>

                  {/* 4. HOME LEADERBOARD SHOWCASE (LIVE RANKING & ENERGY) */}
                  <div style={{ marginBottom: "1.75rem" }}>
                    <LeaderboardPanel
                      userId={!currentUser?.isGuest ? currentUser?.id : null}
                      authToken={activeAuthToken}
                      isLight={isLight}
                      compact={true}
                      onOpenFullAchievements={() => setCurrentView("gamification")}
                    />
                  </div>
                </div>
              )}

              {/* ZONE B: ANALYTICS & 12-CHAPTER MASTERY MAP */}
              {dashboardZone !== "today" && (
                <div>
                  {/* MILESTONE 2.9: CONTINUOUS ADAPTIVE LEARNING & 12-TOPIC MASTERY INTELLIGENCE */}
                  <div style={{ marginBottom: "1.75rem" }}>
                    <MasteryIntelligenceDashboard
                      userId={!currentUser?.isGuest ? currentUser?.id : null}
                      authToken={activeAuthToken}
                      userTracker={userTracker}
                      isLight={isLight}
                      onStartAdaptivePractice={startAdaptivePractice}
                    />
                  </div>

                  {/* 12 Chapters Mastery Map */}
                  <div style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
                      <div>
                        <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--ds-text-heading)", margin: 0 }}>
                          Bản đồ tiến độ 12 Chuyên đề Ngữ pháp
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--ds-text-muted)", margin: "0.2rem 0 0 0" }}>
                          Theo dõi tỷ lệ hoàn thành lý thuyết và bài tập từng chương của tài khoản {currentUser.name}.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                      {previewData.chapters.map((ch) => {
                        const doneLessons = ch.lessons.filter((l) => userTracker.completedLessons?.includes(l.id)).length;
                        const pct = Math.round((doneLessons / ch.lessons.length) * 100);
                        const chIcon = CHAPTER_ICON_MAP[Number(ch.number)] || CHAPTER_ICON_MAP[1];

                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => {
                              handleSelectChapter(ch);
                              setCurrentView("study");
                            }}
                            className="ds-focusable"
                            style={{
                              textAlign: "left",
                              backgroundColor: "var(--ds-card)",
                              border: "1px solid var(--ds-border)",
                              borderRadius: "10px",
                              padding: "1.1rem 1.25rem",
                              cursor: "pointer",
                              transition: "border-color 0.15s ease",
                              boxShadow: "var(--ds-shadow-sm)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", fontSize: "0.72rem", fontFamily: "var(--font-sans)", color: "var(--ds-accent)", fontWeight: "700" }}>
                                <img src={chIcon} alt="" width={20} height={20} aria-hidden="true" />
                                CHƯƠNG {String(ch.number).padStart(2, "0")}
                              </span>
                              <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-sans)", color: pct === 100 ? "var(--ds-success)" : "var(--ds-text-muted)", fontWeight: "600" }}>
                                {doneLessons} / {ch.lessons.length} bài
                              </span>
                            </div>

                            <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--ds-text-heading)", marginBottom: "0.6rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {ch.title_vi}
                            </div>

                            {/* Progress Bar */}
                            <div style={{ width: "100%", height: "4px", backgroundColor: "var(--ds-bg-elevated)", borderRadius: "999px", overflow: "hidden", marginBottom: "0.5rem" }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: "100%",
                                  backgroundColor: pct === 100 ? "var(--ds-btn-success)" : "var(--ds-btn-primary)",
                                  borderRadius: "999px",
                                }}
                              />
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>
                              <span>{ch.exercises?.length || 0} bài tập</span>
                              <span style={{ color: pct > 0 ? "var(--ds-text-heading)" : "var(--ds-text-muted)", fontWeight: pct > 0 ? "700" : "500" }}>{pct}% hoàn thành</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: STUDY MODE (12 CHAPTERS & LESSONS EXPLORER)             */}
        {/* ============================================================== */}
        {currentView === "study" && (
          <>
              
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
                    <h1 className="ge-lesson-title-clamp" style={{ fontSize: "1.6rem", fontWeight: "700", letterSpacing: "-0.02em", color: "var(--ds-text-heading)" }}>
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
                        backgroundColor: activeTab === "theory" ? ("var(--ds-card)") : "transparent", boxShadow: activeTab === "theory" && isLight ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
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
                        backgroundColor: activeTab === "exercises" ? ("var(--ds-card)") : "transparent", boxShadow: activeTab === "exercises" && isLight ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
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
                          border: isCurrentLessonDone ? "1px solid var(--ds-success)" : `1px solid ${T.border}`,
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
                                fontFamily: "var(--font-sans)",
                                backgroundColor: "var(--ds-accent-bg)",
                                color: "var(--ds-accent)",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "4px",
                                fontWeight: "700",
                              }}
                            >
                              {selectedLesson.code}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>•</span>
                            <span style={{ fontSize: "0.75rem", color: T.textSecondary }}>
                              {selectedLesson.sections?.length || 0} Phân mục
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>•</span>
                            <span style={{ fontSize: "0.75rem", color: T.textSecondary }}>
                              {totalLessonFormulas} Công thức
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>•</span>
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
                              border: isCurrentLessonDone ? "1px solid var(--ds-success)" : `1px solid ${T.border}`,
                              backgroundColor: isCurrentLessonDone ? ("var(--ds-success-bg)") : ("var(--ds-bg-elevated)"),
                              color: isCurrentLessonDone ? "var(--ds-success)" : T.text,
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
                            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-sans)", color: T.textMuted, textTransform: "uppercase", marginBottom: "0.55rem", letterSpacing: "0.05em", fontWeight: "700" }}>
                              MỤC LỤC NỘI DUNG ({selectedLesson.sections.length} PHẦN):
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                              {selectedLesson.sections.map((s, idx) => (
                                <a
                                  key={idx}
                                  href={`#sec-${idx}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById(`sec-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                    fontSize: "0.76rem",
                                    backgroundColor: "var(--ds-bg-elevated)",
                                    border: `1px solid ${T.border}`,
                                    color: "var(--ds-text-secondary)",
                                    padding: "0.3rem 0.65rem",
                                    borderRadius: "6px",
                                    textDecoration: "none",
                                    fontWeight: "600",
                                  }}
                                >
                                  <span style={{ color: "var(--ds-accent)", fontWeight: "800" }}>
                                    {String(idx + 1).padStart(2, "0")}.
                                  </span>
                                  <span>{stripMarkdownFormatting(s.title)}</span>
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
                            border: `1px solid ${"var(--ds-accent-border)"}`,
                            borderRadius: "12px",
                            padding: "1.5rem 1.75rem",
                            marginBottom: "1.75rem",
                            boxShadow: isLight ? "0 4px 20px rgba(37, 99, 235, 0.08)" : T.shadow,
                            background: "linear-gradient(135deg, var(--ds-card) 0%, var(--ds-accent-bg) 100%)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <span style={{ fontSize: "1.35rem" }}>⚡</span>
                              <div>
                                <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: T.text, margin: 0, letterSpacing: "-0.01em" }}>
                                  Tóm tắt nhanh: Công thức &amp; Dấu hiệu nhận biết
                                </h3>
                                <p style={{ fontSize: "0.8rem", color: T.textMuted, margin: "0.15rem 0 0 0" }}>
                                  Công thức khẳng định, phủ định, nghi vấn và dấu hiệu nhận biết trọng tâm
                                </p>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontFamily: "var(--font-sans)",
                                padding: "0.25rem 0.65rem",
                                borderRadius: "999px",
                                backgroundColor: "var(--ds-accent-bg)",
                                color: "var(--ds-accent)",
                                border: `1px solid ${"var(--ds-accent-border)"}`,
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
                              backgroundColor: "var(--ds-card)",
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
                                ? { border: "var(--ds-success-border)", bg: "var(--ds-success-bg)", text: "var(--ds-success)", label: "KHẲNG ĐỊNH (+)" }
                                : isNeg
                                ? { border: "var(--ds-danger-border)", bg: "var(--ds-danger-bg)", text: "var(--ds-danger)", label: "PHỦ ĐỊNH (-)" }
                                : { border: "var(--ds-accent-border)", bg: "var(--ds-accent-bg)", text: "var(--ds-accent)", label: "NGHI VẤN (?)" };

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
                                    <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-sans)", fontWeight: "800", color: colorTheme.text, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                                      {colorTheme.label}
                                    </div>
                                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.88rem", fontWeight: "700", color: T.text, lineHeight: "1.4", marginBottom: "0.5rem" }}>
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
                              <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-sans)", fontWeight: "700", color: T.textMuted, textTransform: "uppercase" }}>
                                🏷️ TỪ NHẬN BIẾT VÀNG:
                              </span>
                              {selectedLesson.cheatSheet.signals.map((sig, sIdx) => (
                                <span
                                  key={sIdx}
                                  style={{
                                    fontSize: "0.75rem",
                                    fontFamily: "var(--font-sans)",
                                    backgroundColor: "var(--ds-card)",
                                    border: `1px solid ${T.border}`,
                                    color: "var(--ds-accent)",
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
                                backgroundColor: "var(--ds-warning-bg)",
                                border: "1px solid var(--ds-warning)",
                                borderRadius: "6px",
                                padding: "0.65rem 0.95rem",
                                fontSize: "0.825rem",
                                color: "var(--ds-warning)",
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
                            sec.badge?.includes("CÔNG THỨC") ? { bg: "var(--ds-success-bg)", border: "var(--ds-success-border)", text: "var(--ds-success)" } :
                            sec.badge?.includes("LƯU Ý") ? { bg: "var(--ds-warning-bg)", border: "var(--ds-warning-border)", text: "var(--ds-warning)" } :
                            sec.badge?.includes("BẢNG") || sec.badge?.includes("PHÂN LOẠI") ? { bg: "var(--ds-purple-bg)", border: "var(--ds-purple-border)", text: "var(--ds-purple)" } :
                            sec.badge?.includes("CÁCH DÙNG") ? { bg: "var(--ds-accent-bg)", border: "var(--ds-accent-border)", text: "var(--ds-accent)" } :
                            { bg: "var(--ds-bg-elevated)", border: "var(--ds-border)", text: "var(--ds-text-secondary)" }
                          ) : (
                            sec.badge?.includes("CÔNG THỨC") ? { bg: "var(--ds-success-bg)", border: "var(--ds-success-border)", text: "var(--ds-success)" } :
                            sec.badge?.includes("LƯU Ý") ? { bg: "var(--ds-warning-bg)", border: "var(--ds-warning-border)", text: "var(--ds-warning)" } :
                            sec.badge?.includes("BẢNG") || sec.badge?.includes("PHÂN LOẠI") ? { bg: "var(--ds-purple-bg)", border: "var(--ds-purple-border)", text: "var(--ds-purple)" } :
                            sec.badge?.includes("CÁCH DÙNG") ? { bg: "var(--ds-accent-bg)", border: "var(--ds-accent-border)", text: "var(--ds-accent)" } :
                            { bg: "var(--ds-indigo-bg)", border: "var(--ds-indigo-border)", text: "var(--ds-indigo)" }
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
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--ds-border-subtle)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                                  <span
                                    style={{
                                      fontSize: "0.78rem",
                                      fontFamily: "var(--font-sans)",
                                      backgroundColor: "var(--ds-accent-bg)",
                                      border: `1px solid ${"var(--ds-accent-border)"}`,
                                      color: "var(--ds-accent)",
                                      padding: "0.2rem 0.55rem",
                                      borderRadius: "6px",
                                      fontWeight: "800",
                                      letterSpacing: "0.05em",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {String(secIdx + 1).padStart(2, "0")}
                                  </span>
                                  <h2 style={{ fontSize: "1.12rem", fontWeight: "700", color: T.textHeading, margin: 0, letterSpacing: "-0.01em", lineHeight: "1.4" }}>
                                    <AcademicRichText text={sec.title} multiline={false} />
                                  </h2>
                                </div>

                                {sec.badge && (
                                  <span
                                    style={{
                                      fontSize: "0.68rem",
                                      fontFamily: "var(--font-sans)",
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

                              <AcademicSectionBody
                                sec={sec}
                                secIdx={secIdx}
                                lessonId={selectedLesson?.id}
                                isLight={isLight}
                                expandedRulesMap={expandedRulesMap}
                                setExpandedRulesMap={setExpandedRulesMap}
                                playWordAudio={playWordAudio}
                              />
                            </section>
                          );
                        })}
                      </div>

                      {/* Bilingual Examples Library (Milestone 2.7) */}
                      {selectedLesson.examples && selectedLesson.examples.length > 0 && (() => {
                        const lessonExKey = `lesson-ex-${selectedLesson.id || "ls"}`;
                        const isLibExpanded = Boolean(expandedRulesMap[lessonExKey]);
                        const allExamples = selectedLesson.examples;
                        const visibleLibExamples = isLibExpanded || allExamples.length <= 8 ? allExamples : allExamples.slice(0, 8);
                        return (
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
                                <h3 style={{ fontSize: "1.08rem", fontWeight: "700", color: T.textHeading, margin: 0 }}>
                                  Thư viện Ví dụ Mẫu ({allExamples.length} câu)
                                </h3>
                                <p style={{ fontSize: "0.8rem", color: T.textMuted, margin: "0.15rem 0 0 0" }}>
                                  Ngữ cảnh câu thực tế được chuẩn hóa kèm phát âm bản ngữ
                                </p>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.75rem" }}>
                            {visibleLibExamples.map((ex, exIdx) => (
                              <div
                                key={exIdx}
                                style={{
                                  backgroundColor: T.cardSubtle,
                                  border: `1px solid ${T.border}`,
                                  borderRadius: "8px",
                                  padding: "0.75rem 0.95rem",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "0.75rem",
                                  boxShadow: isLight ? "var(--ds-shadow-sm)" : "none",
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: "0.91rem", fontWeight: "600", color: T.text, lineHeight: "1.5" }}>
                                    <AcademicRichText text={ex.en} />
                                  </div>
                                  {ex.vi && (
                                    <div style={{ fontSize: "0.81rem", color: "var(--ds-success)", marginTop: "0.28rem", lineHeight: "1.4" }}>
                                      🇻🇳 {ex.vi}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => playWordAudio(String(ex.en || "").replace(/\[.*?\]|\(.*?\)/g, "").trim(), null)}
                                  title="Nghe phát âm bản ngữ câu này"
                                  style={{
                                    backgroundColor: "var(--ds-card)",
                                    border: `1px solid ${T.border}`,
                                    color: "var(--ds-accent)",
                                    borderRadius: "6px",
                                    padding: "0.3rem 0.55rem",
                                    fontSize: "0.74rem",
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

                          {allExamples.length > 8 && (
                            <div style={{ marginTop: "1rem", textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRulesMap((prev) => ({
                                    ...prev,
                                    [lessonExKey]: !prev[lessonExKey],
                                  }))
                                }
                                style={{
                                  padding: "0.45rem 1rem",
                                  borderRadius: "8px",
                                  border: "1px solid var(--ds-accent-border)",
                                  backgroundColor: "var(--ds-accent-bg)",
                                  color: "var(--ds-accent)",
                                  fontSize: "0.8rem",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                }}
                              >
                                {isLibExpanded ? "Thu gọn thư viện ví dụ ▴" : `Xem toàn bộ ${allExamples.length} ví dụ mẫu ▾`}
                              </button>
                            </div>
                          )}
                        </div>
                        );
                      })()}

                      {/* Bottom Completion & Practice Bar */}
                      <div
                        style={{
                          marginTop: "2rem",
                          padding: "1.75rem",
                          backgroundColor: T.card,
                          border: isCurrentLessonDone ? "1px solid var(--ds-success)" : `1px dashed ${isLight ? "var(--ds-accent)" : "var(--ds-accent)"}`,
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
                              backgroundColor: isCurrentLessonDone ? "var(--ds-btn-success)" : "var(--ds-bg-elevated)",
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
                              backgroundColor: "var(--ds-btn-primary)",
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
                      border: `1px solid ${currentUser.role === "VIP" ? "var(--ds-warning-border)" : "var(--ds-accent-border)"}`,
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
                      <span style={{ fontSize: "0.85rem", color: T.text, fontWeight: 500 }}>
                        {currentUser.role === "VIP"
                          ? "Tài khoản VIP: Bạn có toàn quyền truy cập 100% tất cả 2,939 câu bài tập và lời giải chi tiết."
                          : `Tài khoản Miễn phí: Được phép làm tối đa ${accessPolicy.freeExerciseLimit} câu bài tập đầu tiên mỗi chuyên đề.`}
                      </span>
                    </div>

                    {currentUser.role === "FREE" && (
                      <button
                        onClick={() => openContextualSmartPaywall("vip_feature_click", { title: "Mở khóa 100% Bài tập Chuyên đề", description: "Không còn bị giới hạn 10 câu mỗi chương. Học và sửa lỗi chi tiết toàn bộ 2,939 câu." })}
                        style={{
                          backgroundColor: "var(--ds-btn-warning)",
                          color: "#ffffff",
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
                                      fontFamily: "var(--font-sans)",
                                      padding: "0.15rem 0.45rem",
                                      borderRadius: "4px",
                                      backgroundColor: "var(--ds-accent-bg)",
                                      color: "var(--ds-accent)",
                                      border: "1px solid var(--ds-accent-border)",
                                      fontWeight: "700",
                                    }}
                                  >
                                    EXERCISE {ex.roman || eIdx + 1}
                                  </span>
                                  <span style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>
                                    {ex.questions?.length || 0} câu hỏi
                                  </span>
                                </div>
                                <div style={{ fontSize: "1rem", fontWeight: "700", color: T.text }}>
                                  {ex.instruction_vi || ex.title}
                                </div>
                                {ex.instruction_vi && ex.title && (
                                  <div style={{ fontSize: "0.825rem", color: "var(--ds-text-muted)", marginTop: "0.2rem" }}>
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
                                    backgroundColor: "var(--ds-btn-primary)",
                                      border: "1px solid var(--ds-btn-primary)",
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
                                    border: "1px solid var(--ds-border)",
                                      color: "var(--ds-text-muted)",
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
                                        backgroundColor: T.bgElevated,
                                        border: `1px dashed ${T.warningBorder}`,
                                        borderRadius: "8px",
                                        padding: "1.25rem",
                                        textAlign: "center",
                                      }}
                                    >
                                      <div style={{ fontSize: "0.9rem", fontWeight: "700", color: T.warning, marginBottom: "0.3rem" }}>
                                        🔒 Câu {questionGlobalIdx + 1}: Nội dung khóa dành riêng cho Thành viên VIP
                                      </div>
                                      <p style={{ fontSize: "0.8rem", color: T.textSecondary, maxWidth: "520px", margin: "0 auto 0.75rem auto", lineHeight: 1.5 }}>
                                        Tài khoản Miễn phí được trải nghiệm tối đa {accessPolicy.freeExerciseLimit} câu đầu tiên. Hãy nâng cấp lên VIP để mở khóa toàn bộ câu hỏi và đáp án giải thích chi tiết!
                                      </p>
                                      <button
                                        onClick={() => openContextualSmartPaywall("vip_feature_click", { title: `Mở khóa Câu ${questionGlobalIdx + 1} & Toàn bộ Chuyên đề`, description: "Truy cập không giới hạn kho 2,939 câu kèm lời giải sư phạm 5 trường." })}
                                        style={{
                                          padding: "0.45rem 1rem",
                                          backgroundColor: T.accent,
                                          color: "#ffffff",
                                          border: "none",
                                          borderRadius: "6px",
                                          fontSize: "0.8rem",
                                          fontWeight: "700",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Nâng cấp VIP ngay ➔
                                      </button>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={q.id || qIdx}
                                    style={{
                                      backgroundColor: "var(--ds-bg-elevated)",
                                      border: res?.checked
                                        ? res.isCorrect
                                          ? "1px solid var(--ds-success)"
                                          : "1px solid var(--ds-danger)"
                                        : `1px solid ${T.border}`,
                                      borderRadius: "6px",
                                      padding: "1.1rem",
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                                      <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-muted)", fontWeight: "600" }}>
                                        CÂU {q.num || qIdx + 1}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: "0.68rem",
                                          fontFamily: "var(--font-sans)",
                                          padding: "0.15rem 0.45rem",
                                          borderRadius: "4px",
                                          backgroundColor: "var(--ds-bg-elevated)",
                                          color: "var(--ds-text-secondary)",
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
                                          backgroundColor: "var(--ds-card)",
                                          border: `1px solid ${T.border}`,
                                          color: "var(--ds-accent)",
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
                                          backgroundColor: "var(--ds-warning-bg)",
                                          border: "1px solid var(--ds-warning-border)",
                                          padding: "0.45rem 0.75rem",
                                          borderRadius: "6px",
                                          fontSize: "0.825rem",
                                          color: "var(--ds-warning)",
                                          marginBottom: "0.75rem",
                                        }}
                                      >
                                        <span style={{ color: "var(--ds-warning)", fontSize: "0.75rem", fontWeight: "700" }}>GỢI Ý MỞ ĐẦU:</span>
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
                                          backgroundColor: "var(--ds-card)",
                                          border: res?.checked
                                            ? res.isCorrect
                                              ? "1px solid var(--ds-success)"
                                              : "1px solid var(--ds-danger)"
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
                                          backgroundColor: "var(--ds-btn-primary)",
                                          border: "1px solid var(--ds-btn-primary)",
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
                                          backgroundColor: "var(--ds-card-subtle)",
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
                                          color: res.isCorrect ? "var(--ds-success)" : "var(--ds-danger)",
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
                                          backgroundColor: "var(--ds-card-subtle)",
                                          border: `1px solid ${T.border}`,
                                          borderRadius: "6px",
                                        }}
                                      >
                                        <div style={{ fontSize: "0.72rem", color: "var(--ds-text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                                          Đáp án chính xác:
                                        </div>
                                        <div style={{ fontSize: "0.95rem", color: "var(--ds-accent)", fontWeight: "700", marginTop: "0.2rem" }}>
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
            </>
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
                    border: "1px solid var(--ds-danger)",
                    borderRadius: "8px",
                    padding: "1.25rem",
                    marginBottom: "1.5rem",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--ds-danger)", marginBottom: "0.35rem" }}>
                    🔒 Giới hạn lượt thi Quiz hôm nay
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--ds-text-secondary)", margin: "0 0 1rem 0" }}>
                    Tài khoản Miễn phí được làm tối đa {accessPolicy.freeDailyQuizLimit} đề Quiz mỗi ngày (Bạn đã làm {userTracker.quizzesCompletedToday || 0}/{accessPolicy.freeDailyQuizLimit} đề). Nâng cấp lên VIP để làm bài thi không giới hạn!
                  </p>
                  <button
                    onClick={() => openContextualSmartPaywall("milestone_100_q", { title: "Luyện Thi Quiz & Đề Thích Ứng Không Giới Hạn", description: "Gỡ bỏ giới hạn Quiz trong ngày và sử dụng bộ trộn đề 50/30/20 không giới hạn." })}
                    style={{
                      padding: "0.55rem 1.25rem",
                      backgroundColor: "var(--ds-btn-warning)",
                      color: "#ffffff",
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

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    <button
                      disabled={isQuizLimitReached || adaptiveLoading}
                      onClick={() => startAdaptivePractice({ mode: "adaptive", count: 20 })}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: isQuizLimitReached ? T.border : T.accent,
                        border: `1px solid ${T.accent}`,
                        borderRadius: "6px",
                        color: isQuizLimitReached ? T.textMuted : "#ffffff",
                        fontSize: "0.825rem",
                        fontWeight: "700",
                        cursor: isQuizLimitReached || adaptiveLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {adaptiveLoading ? "Đang trộn đề..." : "🎯 Đề Thích Ứng (50/30/20)"}
                    </button>

                    <button
                      disabled={isQuizLimitReached}
                      onClick={() => startNewQuiz(selectedQuizTopic)}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: isQuizLimitReached ? "var(--ds-bg-active)" : "var(--ds-btn-primary)",
                        border: "1px solid var(--ds-border-strong)",
                        borderRadius: "6px",
                        color: isQuizLimitReached ? "var(--ds-text-muted)" : "#ffffff",
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
                          backgroundColor: "var(--ds-btn-success)",
                          border: "none",
                          borderRadius: "6px",
                          color: "#ffffff",
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

                {adaptiveQuizMeta && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      backgroundColor: T.bgElevated,
                      border: `1px solid ${T.borderSubtle}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.6rem",
                      fontSize: "0.8rem",
                    }}
                  >
                    <span style={{ color: T.textHeading, fontWeight: "700" }}>
                      {adaptiveQuizMeta.mode === "manual_review"
                        ? `🎯 Chế độ Ôn tập Chuyên đề #${adaptiveQuizMeta.topicId}`
                        : `🧠 Đề Thích Ứng 50/30/20 (${adaptiveQuizMeta.preferredDifficulty || "Adaptive"})`}
                    </span>
                    <span style={{ color: T.textMuted }}>
                      Weak: <strong style={{ color: T.warning }}>{adaptiveQuizMeta.breakdown?.weakCount ?? 0}</strong> • SR Review:{" "}
                      <strong style={{ color: T.accent }}>{adaptiveQuizMeta.breakdown?.reviewCount ?? 0}</strong> • Challenge:{" "}
                      <strong style={{ color: T.success }}>{adaptiveQuizMeta.breakdown?.challengeCount ?? 0}</strong>
                    </span>
                  </div>
                )}

                {/* Topic Selector & Progress Bar */}
                <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--ds-border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
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
                        backgroundColor: "var(--ds-card)",
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
                      <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-muted)" }}>
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
                    border: quizResults.percentage >= 80 ? "1px solid var(--ds-success)" : "1px solid var(--ds-danger)",
                    borderRadius: "10px",
                    padding: "1.75rem",
                    marginBottom: "1.75rem",
                    textAlign: "center",
                    boxShadow: T.shadow,
                  }}
                >
                  <div style={{ fontSize: "0.8rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    KẾT QUẢ ĐÁNH GIÁ
                  </div>
                  <div
                    style={{
                      fontSize: "2.25rem",
                      fontWeight: "700",
                      color: quizResults.percentage >= 80 ? "var(--ds-success)" : "var(--ds-danger)",
                      margin: "0.4rem 0",
                    }}
                  >
                    {quizResults.score} / {quizResults.total}
                    <span style={{ fontSize: "1.1rem", color: "var(--ds-text-muted)", marginLeft: "0.5rem" }}>
                      ({quizResults.percentage}%)
                    </span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--ds-text-muted)" }}>
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
                            ? "1px solid var(--ds-success)"
                            : "1px solid var(--ds-danger)"
                          : singleCheck?.checked
                          ? singleCheck.isCorrect
                            ? "1px solid var(--ds-success)"
                            : "1px solid var(--ds-danger)"
                          : `1px solid ${T.border}`,
                        borderRadius: "8px",
                        padding: "1.25rem 1.5rem",
                        boxShadow: T.shadow,
                      }}
                    >
                      {/* Question meta header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-sans)", color: T.textMuted, fontWeight: "600" }}>
                            CÂU {idx + 1} / {activeQuizQuestions.length}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>•</span>
                          <span style={{ fontSize: "0.75rem", color: T.textMuted }}>{q.topic_name}</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                          {q.adaptive_bucket && (
                            <span
                              style={{
                                fontSize: "0.66rem",
                                fontWeight: "700",
                                padding: "0.15rem 0.45rem",
                                borderRadius: "9999px",
                                backgroundColor: T.bgElevated,
                                color: T.accent,
                                border: `1px solid ${T.borderSubtle}`,
                              }}
                            >
                              {q.adaptive_bucket}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontFamily: "var(--font-sans)",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px",
                              backgroundColor: "var(--ds-bg-elevated)",
                              color: "var(--ds-text-secondary)",
                              border: `1px solid ${T.border}`,
                              fontWeight: "700",
                            }}
                          >
                            {typeInfo.tag}
                          </span>
                        </div>
                      </div>

                      {/* Explicit Instruction Box */}
                      {q.instruction && (
                        <div
                          style={{
                            backgroundColor: "var(--ds-accent-bg)",
                            borderLeft: "4px solid var(--ds-accent)",
                            border: "1px solid var(--ds-accent-border)",
                            padding: "0.5rem 0.85rem",
                            borderRadius: "6px",
                            marginBottom: "0.85rem",
                            fontSize: "0.825rem",
                            color: "var(--ds-accent)",
                            lineHeight: "1.5",
                            boxShadow: isLight ? "0 1px 2px rgba(37,99,235,0.05)" : "none",
                          }}
                        >
                          <strong style={{ color: "var(--ds-accent)" }}>Yêu cầu:</strong> {q.instruction}
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
                            backgroundColor: "var(--ds-warning-bg)",
                            border: "1px solid var(--ds-warning-border)",
                            padding: "0.45rem 0.75rem",
                            borderRadius: "6px",
                            fontSize: "0.825rem",
                            color: "var(--ds-warning)",
                            marginBottom: "0.85rem",
                          }}
                        >
                          <span style={{ color: "var(--ds-warning)", fontSize: "0.72rem", fontWeight: "700" }}>BẮT ĐẦU VỚI:</span>
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
                                ? "1px solid var(--ds-success)"
                                : "1px solid var(--ds-danger)"
                              : `1px solid ${T.border}`,
                            fontSize: "0.875rem",
                            backgroundColor: "var(--ds-card)",
                            color: T.text,
                            outline: "none",
                          }}
                        />

                        {!quizSubmitted && (
                          <>
                            <button
                              onClick={() => checkSingleQuizQuestion(q)}
                              style={{
                                backgroundColor: "var(--ds-bg-elevated)",
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
                                backgroundColor: "var(--ds-card-subtle)",
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
                            color: singleCheck.isCorrect ? "var(--ds-success)" : "var(--ds-danger)",
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
                            backgroundColor: "var(--ds-card-subtle)",
                            border: `1px solid ${T.border}`,
                            borderRadius: "6px",
                          }}
                        >
                          <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: "600", textTransform: "uppercase" }}>
                            Đáp án chính xác:
                          </div>
                          <div style={{ fontSize: "0.95rem", color: "var(--ds-accent)", fontWeight: "700", marginTop: "0.2rem" }}>
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
                          <div style={{ fontSize: "0.8rem", color: detail.isCorrect ? "var(--ds-success)" : "var(--ds-danger)", fontWeight: "600" }}>
                            {detail.isCorrect ? "✓ Chính xác" : "✕ Chưa đúng"}
                          </div>
                          <div style={{ fontSize: "0.825rem", color: "var(--ds-text-secondary)", marginTop: "0.25rem" }}>
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
                      backgroundColor: "var(--ds-btn-success)",
                      color: "#ffffff",
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
                    <p style={{ fontSize: "0.85rem", color: "var(--ds-text-muted)", marginTop: "0.35rem" }}>
                      Lưu trữ tự động các câu bạn đã làm chưa đúng trong phần bài tập và bài thi Quiz. Dữ liệu được lưu riêng cho tài khoản của bạn.
                    </p>
                  </div>

                  {savedMistakes.length > 0 && (
                    <button
                      onClick={clearAllMistakes}
                      style={{
                        padding: "0.45rem 0.85rem",
                        backgroundColor: "transparent",
                        border: "1px solid var(--ds-danger)",
                        color: "var(--ds-danger)",
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
                  <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--ds-border-subtle)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.8rem", color: T.textSecondary, fontWeight: "600" }}>Lọc theo chủ đề:</span>
                    <select
                      value={mistakeFilterTopic}
                      onChange={(e) => setMistakeFilterTopic(e.target.value)}
                      style={{
                        backgroundColor: "var(--ds-card)",
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
                      backgroundColor: "var(--ds-btn-primary)",
                      border: "1px solid var(--ds-btn-primary)",
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
                              ? "1px solid var(--ds-success)"
                              : "1px solid var(--ds-danger)"
                            : `1px solid ${T.border}`,
                          borderRadius: "8px",
                          padding: "1.25rem 1.5rem",
                          boxShadow: T.shadow,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-sans)", color: T.textMuted, fontWeight: "600" }}>
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
                              backgroundColor: "var(--ds-accent-bg)",
                              borderLeft: "4px solid var(--ds-accent)",
                              border: "1px solid var(--ds-accent-border)",
                              padding: "0.45rem 0.75rem",
                              borderRadius: "6px",
                              marginBottom: "0.75rem",
                              fontSize: "0.8rem",
                              color: "var(--ds-accent)",
                            }}
                          >
                            <strong style={{ color: "var(--ds-accent)" }}>Yêu cầu:</strong> {item.instruction}
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
                              backgroundColor: "var(--ds-warning-bg)",
                              border: "1px solid var(--ds-warning-border)",
                              padding: "0.45rem 0.75rem",
                              borderRadius: "6px",
                              fontSize: "0.825rem",
                              color: "var(--ds-warning)",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <span style={{ color: "var(--ds-warning)", fontSize: "0.72rem", fontWeight: "700" }}>BẮT ĐẦU VỚI:</span>
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
                                  ? "1px solid var(--ds-success)"
                                  : "1px solid var(--ds-danger)"
                                : `1px solid ${T.border}`,
                              fontSize: "0.875rem",
                              backgroundColor: "var(--ds-card)",
                              color: T.text,
                              outline: "none",
                            }}
                          />

                          <button
                            onClick={() => checkSingleMistake(item)}
                            style={{
                              backgroundColor: "var(--ds-bg-elevated)",
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
                              backgroundColor: "var(--ds-card-subtle)",
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
                              color: res.isCorrect ? "var(--ds-success)" : "var(--ds-danger)",
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
                              backgroundColor: "var(--ds-card-subtle)",
                              border: `1px solid ${T.border}`,
                              borderRadius: "6px",
                            }}
                          >
                            <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: "600", textTransform: "uppercase" }}>
                              Đáp án chuẩn:
                            </div>
                            <div style={{ fontSize: "0.95rem", color: "var(--ds-accent)", fontWeight: "700", marginTop: "0.2rem" }}>
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
      </AppShell2026>
    </div>
  );
}
