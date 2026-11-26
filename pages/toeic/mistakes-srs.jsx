import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import AppShell2026 from "../../components/ui-2026/AppShell2026";
import { KitIcon } from "../../components/ui-2026/KitIcon";
import { ToeicBadge } from "../../components/toeic/ui";
import ToeicFlashcard3D from "../../components/toeic/flashcards/ToeicFlashcard3D";
import FlashcardModuleBrowser from "../../components/toeic/flashcards/FlashcardModuleBrowser";
import ToeicSmartPaywallModal from "../../components/toeic/premium/ToeicSmartPaywallModal";
import useGlobalAuth from "../../hooks/useGlobalAuth";
import useToeicEntitlement from "../../hooks/useToeicEntitlement";
import {
  FREE_FLASHCARD_MODULE_IDS,
  fetchUserFlashcardSrs,
  loadAllFlashcardsForSearch,
  loadFlashcardCrosslinks,
  loadFlashcardManifest,
  loadFlashcardModule,
  submitFlashcardReview,
} from "../../lib/toeic/flashcard-client-store";
import { FSRS_STATES, summarizeFlashcardSrs } from "../../lib/toeic/flashcard-fsrs";
import { FREE_TIER_LIMITS } from "../../lib/toeic/subscription/toeic-entitlement";

const LEGACY_MISTAKE_CARDS = [
  {
    id: "srs_01",
    card_type: "MISTAKE_QUESTION",
    questionId: "ETS2024_T01_Q105",
    stem: "The marketing team is currently _______ new strategies to enhance customer engagement.",
    correct_answer: "B",
    options: { A: "update", B: "updating", C: "updates", D: "updated" },
    explanation_vi:
      "Cấu trúc be + V-ing/V-ed. Theo ngữ cảnh chủ động 'is currently updating', cần dạng V-ing bổ nghĩa.",
    ease_factor: 2.5,
    interval_days: 1,
  },
];

export default function MistakesSrsPage({ initialTab = "due" }) {
  const router = useRouter();
  const globalAuth = useGlobalAuth();
  const entitlement = useToeicEntitlement();
  const isVip = entitlement.isVip;
  const uid = globalAuth.currentUser?.id || "guest";
  const authToken = globalAuth.activeAuthToken || null;
  const userRole = globalAuth.currentUser?.role || "FREE";

  const [isLight, setIsLight] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab); // 'due' | 'browse' | 'mistakes'
  const [onlyMistakeLinked, setOnlyMistakeLinked] = useState(false);

  const [manifest, setManifest] = useState(null);
  const [crosslinks, setCrosslinks] = useState({});
  const [srsRecords, setSrsRecords] = useState([]);
  const [activeDeckCards, setActiveDeckCards] = useState([]);
  const [activeModuleId, setActiveModuleId] = useState("M01");
  const [activeTopicId, setActiveTopicId] = useState(1);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const cardOpenTimeRef = useRef(Date.now());

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? "" : cur));
    }, 3200);
  }, []);

  const srsMap = useMemo(() => {
    const m = new Map();
    for (const r of srsRecords) m.set(Number(r.flashcard_id), r);
    return m;
  }, [srsRecords]);

  const srsSummary = useMemo(() => summarizeFlashcardSrs(srsRecords, 1000), [srsRecords]);

  // Initial load: Manifest + Crosslinks + User FSRS Records
  useEffect(() => {
    if (globalAuth.isLoading) return;
    let mounted = true;
    setLoading(true);

    Promise.all([
      loadFlashcardManifest(),
      loadFlashcardCrosslinks(),
      fetchUserFlashcardSrs({ userId: uid, authToken }),
    ])
      .then(async ([mf, xl, srsRes]) => {
        if (!mounted) return;
        setManifest(mf);
        setCrosslinks(xl?.flashcardToQuestions || {});
        setSrsRecords(srsRes.records || []);

        const qTab = String(router.query.tab || "");
        const qMod = String(router.query.module || "M01").toUpperCase();
        const qTopic = router.query.topic ? Number(router.query.topic) : null;
        const qCardCode = router.query.card ? String(router.query.card).toUpperCase() : null;
        const qCardId = router.query.cardId ? Number(router.query.cardId) : null;

        if (qTab === "browse" || qTab === "due" || qTab === "mistakes") {
          setActiveTab(qTab);
        } else if (qCardCode || qCardId || qTopic) {
          setActiveTab("due");
        }

        // Determine initial deck cards
        let targetModId = qMod;
        let targetTopicId = qTopic;

        if (qCardCode || qCardId) {
          const hit = (mf.index || []).find(
            (x) => (qCardCode && x.code === qCardCode) || (qCardId && Number(x.id) === qCardId)
          );
          if (hit) {
            targetModId = hit.module_id;
            targetTopicId = hit.topic_id;
          }
        }

        setActiveModuleId(targetModId);
        if (targetTopicId) setActiveTopicId(targetTopicId);

        // If user has due cards (especially mistake-linked), prioritize hydrating them
        const nowMs = Date.now();
        const dueRecords = (srsRes.records || [])
          .filter((r) => new Date(r.due_at || 0).getTime() <= nowMs)
          .sort((a, b) => {
            const pA = a.srs_state === FSRS_STATES.RELEARNING ? 0 : a.srs_state === FSRS_STATES.LEARNING ? 1 : 2;
            const pB = b.srs_state === FSRS_STATES.RELEARNING ? 0 : b.srs_state === FSRS_STATES.LEARNING ? 1 : 2;
            if (pA !== pB) return pA - pB;
            return new Date(a.due_at || 0).getTime() - new Date(b.due_at || 0).getTime();
          });

        if (dueRecords.length > 0 && !qTopic && !qCardCode && !qCardId) {
          const allCards = await loadAllFlashcardsForSearch();
          if (!mounted) return;
          const cardMap = new Map(allCards.map((c) => [Number(c.id), c]));
          const hydratedDue = dueRecords.map((r) => cardMap.get(Number(r.flashcard_id))).filter(Boolean);
          setActiveDeckCards(hydratedDue);
          setCurrentIndex(0);
        } else {
          const modPayload = await loadFlashcardModule(targetModId);
          if (!mounted) return;
          let cards = modPayload.flashcards || [];
          if (targetTopicId) {
            cards = cards.filter((c) => Number(c.topic_id) === Number(targetTopicId));
          } else {
            // Default to Topic 1 (20 cards) for focused session
            const firstTopic = cards[0]?.topic_id;
            if (firstTopic) {
              setActiveTopicId(firstTopic);
              cards = cards.filter((c) => Number(c.topic_id) === Number(firstTopic));
            }
          }
          if (!isVip && !FREE_FLASHCARD_MODULE_IDS.has(targetModId)) {
            cards = cards.slice(0, 3);
          }
          setActiveDeckCards(cards);
          if (qCardCode || qCardId) {
            const idx = cards.findIndex(
              (c) => (qCardCode && c.code === qCardCode) || (qCardId && Number(c.id) === qCardId)
            );
            setCurrentIndex(idx >= 0 ? idx : 0);
          } else {
            setCurrentIndex(0);
          }
        }
      })
      .catch(() => {
        showToast("Không thể tải bộ thẻ Flashcard. Vui lòng thử lại.");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          cardOpenTimeRef.current = Date.now();
        }
      });

    return () => {
      mounted = false;
    };
  }, [globalAuth.isLoading, uid, authToken, isVip, router.query.tab, router.query.module, router.query.topic, router.query.card, router.query.cardId, showToast]);

  // Load saved mistake questions from localStorage (combined with fallback)
  const mistakeQuestionCards = useMemo(() => {
    if (typeof window === "undefined") return LEGACY_MISTAKE_CARDS;
    try {
      const saved = JSON.parse(localStorage.getItem(`toeic_responses_${uid}`) || "{}");
      const wrongEntries = Object.entries(saved).filter(([, v]) => v && v.isCorrect === false);
      if (wrongEntries.length === 0) return LEGACY_MISTAKE_CARDS;
      return LEGACY_MISTAKE_CARDS;
    } catch {
      return LEGACY_MISTAKE_CARDS;
    }
  }, [uid]);

  const displayedDeck = useMemo(() => {
    if (activeTab === "mistakes") return mistakeQuestionCards;
    if (!onlyMistakeLinked) return activeDeckCards;
    return activeDeckCards.filter((c) => {
      const rec = srsMap.get(Number(c.id));
      return (
        rec &&
        (rec.source_context === "MISTAKE_AUTO_QUEUE" ||
          rec.source_context === "EXAM_REMEDIATION" ||
          rec.source_context === "XRAY_SAVE")
      );
    });
  }, [activeTab, activeDeckCards, onlyMistakeLinked, srsMap, mistakeQuestionCards]);

  const currentCard = displayedDeck[currentIndex] || null;

  const handleOpenTopicDeck = async (modId, topicId, jumpCardId = null) => {
    setLoading(true);
    try {
      const modPayload = await loadFlashcardModule(modId);
      let cards = (modPayload.flashcards || []).filter((c) => Number(c.topic_id) === Number(topicId));
      if (!isVip && !FREE_FLASHCARD_MODULE_IDS.has(modId)) {
        cards = cards.slice(0, 3);
      }
      setActiveModuleId(modId);
      setActiveTopicId(topicId);
      setActiveDeckCards(cards);
      const idx = jumpCardId ? cards.findIndex((c) => Number(c.id) === Number(jumpCardId)) : 0;
      setCurrentIndex(idx >= 0 ? idx : 0);
      setIsFlipped(false);
      setOnlyMistakeLinked(false);
      setActiveTab("due");
      cardOpenTimeRef.current = Date.now();
    } catch {
      showToast("Lỗi tải chủ đề từ vựng.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartDueQueue = async (mistakeOnly = false) => {
    setLoading(true);
    try {
      const nowMs = Date.now();
      const dueRecs = srsRecords.filter((r) => {
        const isDue = new Date(r.due_at || 0).getTime() <= nowMs;
        if (!isDue) return false;
        if (!mistakeOnly) return true;
        return (
          r.source_context === "MISTAKE_AUTO_QUEUE" ||
          r.source_context === "EXAM_REMEDIATION" ||
          r.source_context === "XRAY_SAVE"
        );
      });

      if (dueRecs.length === 0) {
        // Fallback to M01 Topic 1 if user hasn't queued cards yet
        await handleOpenTopicDeck("M01", 1);
        showToast(
          mistakeOnly
            ? "Chưa có thẻ từ lỗi sai đến hạn. Hiển thị Topic 01 (Contracts) để bắt đầu!"
            : "Hôm nay chưa có thẻ cũ đến hạn — bắt đầu học Topic 01 (Contracts)!"
        );
        return;
      }

      const allCards = await loadAllFlashcardsForSearch();
      const cardMap = new Map(allCards.map((c) => [Number(c.id), c]));
      const ordered = dueRecs
        .sort((a, b) => new Date(a.due_at || 0).getTime() - new Date(b.due_at || 0).getTime())
        .map((r) => cardMap.get(Number(r.flashcard_id)))
        .filter(Boolean);

      setActiveDeckCards(ordered);
      setCurrentIndex(0);
      setIsFlipped(false);
      setOnlyMistakeLinked(mistakeOnly);
      setActiveTab("due");
      cardOpenTimeRef.current = Date.now();
    } finally {
      setLoading(false);
    }
  };

  const handleRateCard = async (rating) => {
    if (!currentCard) return;

    if (currentCard.card_type === "MISTAKE_QUESTION") {
      setIsFlipped(false);
      setCurrentIndex((prev) => (prev + 1 < displayedDeck.length ? prev + 1 : 0));
      return;
    }

    const elapsedMs = Date.now() - cardOpenTimeRef.current;
    const existingRec = srsMap.get(Number(currentCard.id)) || null;
    const res = await submitFlashcardReview({
      userId: uid,
      authToken,
      role: userRole,
      flashcard: currentCard,
      existingRecord: existingRec,
      rating,
      responseTimeMs: elapsedMs,
    });

    if (res.requiresUpgrade) {
      entitlement.openPaywall("TRG_09_TOEIC_FLASHCARD_1000", {
        trackedCount: srsRecords.length,
        limit: FREE_TIER_LIMITS.maxSrsCards,
      });
      return;
    }

    if (res.record) {
      setSrsRecords((prev) => {
        const next = prev.filter((r) => Number(r.flashcard_id) !== Number(res.record.flashcard_id));
        return [...next, res.record];
      });
    }

    setIsFlipped(false);
    cardOpenTimeRef.current = Date.now();

    if (currentIndex < displayedDeck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      showToast("Hoàn thành lượt ôn tập bộ thẻ này! Dữ liệu FSRS-4.5 đã được lưu.");
      setCurrentIndex(0);
    }
  };

  const handleSaveNote = async (card, noteText) => {
    const existingRec = srsMap.get(Number(card.id)) || null;
    const res = await submitFlashcardReview({
      userId: uid,
      authToken,
      role: userRole,
      flashcard: card,
      existingRecord: existingRec,
      rating: existingRec?.last_rating || 3,
      personalNote: noteText,
    });
    if (res.record) {
      setSrsRecords((prev) => {
        const next = prev.filter((r) => Number(r.flashcard_id) !== Number(res.record.flashcard_id));
        return [...next, res.record];
      });
      showToast("Đã lưu ghi chú mẹo nhớ cá nhân!");
    }
  };

  // Keyboard Shortcuts: Space to flip, 1-4 to rate FSRS-4.5, Left/Right arrows to navigate
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space" && currentCard) {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        handleRateCard(Number(e.key));
      } else if (e.key === "ArrowRight" && displayedDeck.length > 0) {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % displayedDeck.length);
      } else if (e.key === "ArrowLeft" && displayedDeck.length > 0) {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + displayedDeck.length) % displayedDeck.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleSelectView = (v) => {
    if (v === "toeic") {
      if (typeof window !== "undefined" && window.location.pathname !== "/toeic") {
        window.location.href = "/toeic";
      }
      return;
    }
    if (typeof window !== "undefined") {
      window.location.href = v === "dashboard" ? "/" : `/?view=${v}`;
    }
  };

  return (
    <>
      <Head>
        <title>Kho 1,000 Flashcard New TOEIC &amp; Ôn Tập FSRS-4.5 | GrammarPro</title>
        <meta
          name="description"
          content="Học 1,000 từ vựng New TOEIC (10 Modules, 50 Chủ đề) với thẻ lật 3D, hình ảnh 4 lớp offline fallback và thuật toán FSRS-4.5."
        />
      </Head>

      <AppShell2026
        activeView="toeic"
        toeicSubView="srs"
        onSelectView={handleSelectView}
        isLight={isLight}
        onToggleTheme={() => setIsLight((prev) => !prev)}
        currentChapterTitle="1,000 Flashcard TOEIC (FSRS-4.5)"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container" style={{ maxWidth: "860px" }}>
            {/* Top Bar */}
            <div className="toeic-flex-between" style={{ marginBottom: "1rem", flexWrap: "wrap", gap: "0.65rem" }}>
              <Link
                href="/toeic"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  color: "var(--ds-accent)",
                  textDecoration: "none",
                }}
              >
                <span>&larr; Quay lại TOEIC Hub</span>
              </Link>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                <ToeicBadge variant={isVip ? "success" : "muted"} icon={isVip ? "crown" : "book"}>
                  {isVip
                    ? "VIP · Mở khóa 1,000 thẻ FSRS"
                    : `Miễn phí: ${srsSummary.tracked}/${FREE_TIER_LIMITS.maxSrsCards} thẻ đang theo dõi`}
                </ToeicBadge>
              </div>
            </div>

            {/* Toast Notification */}
            {toastMsg && (
              <div
                role="status"
                style={{
                  marginBottom: "0.9rem",
                  padding: "0.7rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid var(--ds-success-border)",
                  backgroundColor: "var(--ds-success-bg)",
                  color: "var(--ds-success)",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <KitIcon name="check-circle" size={16} />
                <span>{toastMsg}</span>
              </div>
            )}

            {/* FSRS-4.5 Mastery Summary Strip */}
            <div className="toeic-grid-4" style={{ gap: "0.6rem", marginBottom: "1rem" }}>
              <button
                type="button"
                onClick={() => handleStartDueQueue(false)}
                className="toeic-card"
                style={{ padding: "0.75rem 0.85rem", textAlign: "left", cursor: "pointer" }}
              >
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ds-text-muted)" }}>
                  Cần ôn hôm nay
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--ds-accent)" }}>
                  {srsSummary.dueNow}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStartDueQueue(true)}
                className="toeic-card"
                style={{ padding: "0.75rem 0.85rem", textAlign: "left", cursor: "pointer" }}
              >
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ds-text-muted)" }}>
                  Từ câu làm sai
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--ds-danger)" }}>
                  {srsSummary.mistakeLinkedDue}
                </div>
              </button>

              <div className="toeic-card" style={{ padding: "0.75rem 0.85rem" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ds-text-muted)" }}>
                  Đang nhớ (REVIEW)
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--ds-success)" }}>
                  {srsSummary.REVIEW}
                </div>
              </div>

              <div className="toeic-card" style={{ padding: "0.75rem 0.85rem" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ds-text-muted)" }}>
                  Còn lại (1,000 từ)
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--ds-text-heading)" }}>
                  {srsSummary.NEW}
                </div>
              </div>
            </div>

            {/* 3-Tab Switcher */}
            <div className="toeic-hub-tabs" role="tablist" aria-label="Chế độ Flashcard TOEIC" style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "due"}
                onClick={() => setActiveTab("due")}
                className={`toeic-hub-tab-btn ${activeTab === "due" ? "is-active" : ""}`}
              >
                <KitIcon name="refresh" size={14} />
                <span>Học Thẻ 3D ({displayedDeck.length})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "browse"}
                onClick={() => setActiveTab("browse")}
                className={`toeic-hub-tab-btn ${activeTab === "browse" ? "is-active" : ""}`}
              >
                <KitIcon name="books" size={14} />
                <span>10 Modules · 50 Chủ Đề</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "mistakes"}
                onClick={() => {
                  setActiveTab("mistakes");
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={`toeic-hub-tab-btn ${activeTab === "mistakes" ? "is-active" : ""}`}
              >
                <KitIcon name="danger" size={14} />
                <span>Câu Ngữ Pháp Sai ({mistakeQuestionCards.length})</span>
              </button>
            </div>

            {/* MAIN CONTENT */}
            {loading ? (
              <div className="toeic-card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--ds-text-muted)" }}>
                  Đang nạp bộ 1,000 Flashcard New TOEIC &amp; lịch FSRS-4.5...
                </p>
              </div>
            ) : activeTab === "browse" && manifest ? (
              <FlashcardModuleBrowser
                modules={manifest.modules || []}
                topics={manifest.topics || []}
                slimIndex={manifest.index || []}
                srsMap={srsMap}
                activeModuleId={activeModuleId}
                activeTopicId={activeTopicId}
                isVip={isVip}
                onSelectTopicDeck={(mId, tId) => handleOpenTopicDeck(mId, tId)}
                onSelectCardInDeck={(item) => handleOpenTopicDeck(item.module_id, item.topic_id, item.id)}
                onOpenPaywall={() => entitlement.openPaywall("TRG_09_TOEIC_FLASHCARD_1000")}
              />
            ) : currentCard ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                {/* Deck Controls & Progress */}
                <div className="toeic-flex-between" style={{ flexWrap: "wrap", gap: "0.5rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--ds-text-secondary)" }}>
                  <span>
                    Thẻ {currentIndex + 1} / {displayedDeck.length}
                    {currentCard.topic_name_vi ? ` · ${currentCard.topic_name_vi}` : ""}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {activeTab === "due" && (
                      <button
                        type="button"
                        onClick={() => {
                          setOnlyMistakeLinked((prev) => !prev);
                          setCurrentIndex(0);
                          setIsFlipped(false);
                        }}
                        className={`toeic-target-chip ${onlyMistakeLinked ? "active" : ""}`}
                        style={{ padding: "0.25rem 0.65rem", fontSize: "0.74rem" }}
                      >
                        {onlyMistakeLinked ? "Đang lọc: Từ câu sai" : "Lọc thẻ từ câu sai"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentIndex((prev) => (prev - 1 + displayedDeck.length) % displayedDeck.length);
                      }}
                      style={{
                        minWidth: "36px",
                        height: "36px",
                        borderRadius: "0.55rem",
                        border: "1px solid var(--ds-border)",
                        backgroundColor: "var(--ds-card)",
                        color: "var(--ds-text)",
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                      aria-label="Thẻ trước"
                    >
                      &larr;
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentIndex((prev) => (prev + 1) % displayedDeck.length);
                      }}
                      style={{
                        minWidth: "36px",
                        height: "36px",
                        borderRadius: "0.55rem",
                        border: "1px solid var(--ds-border)",
                        backgroundColor: "var(--ds-card)",
                        color: "var(--ds-text)",
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                      aria-label="Thẻ tiếp theo"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>

                {/* 3D Flashcard */}
                <ToeicFlashcard3D
                  card={currentCard}
                  srsRecord={currentCard.id ? srsMap.get(Number(currentCard.id)) || null : null}
                  relatedQuestions={currentCard.id ? crosslinks[String(currentCard.id)] || [] : []}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped((prev) => !prev)}
                  onRate={handleRateCard}
                  onSaveNote={handleSaveNote}
                  canEditNote={activeTab !== "mistakes"}
                />

                {/* Preview CTA banner if Free user browsing Module M03-M10 */}
                {!isVip &&
                  activeTab === "due" &&
                  currentCard.module_id &&
                  !FREE_FLASHCARD_MODULE_IDS.has(currentCard.module_id) && (
                    <div
                      className="toeic-card"
                      style={{
                        padding: "0.85rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.6rem",
                        borderColor: "var(--ds-warning-border)",
                        backgroundColor: "var(--ds-warning-bg)",
                      }}
                    >
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ds-warning)" }}>
                        Đang xem thử 3 từ đầu của Module {currentCard.module_id}. Nâng cấp VIP để mở trọn 20 từ/chủ đề!
                      </span>
                      <button
                        type="button"
                        onClick={() => entitlement.openPaywall("TRG_09_TOEIC_FLASHCARD_1000")}
                        style={{
                          border: "none",
                          borderRadius: "0.55rem",
                          padding: "0.45rem 0.9rem",
                          backgroundColor: "var(--ds-btn-warning)",
                          color: "var(--ds-text-on-accent)",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Mở Khóa VIP &rarr;
                      </button>
                    </div>
                  )}
              </div>
            ) : (
              <div className="toeic-card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
                <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ds-text)", marginBottom: "0.9rem" }}>
                  {onlyMistakeLinked
                    ? "Chưa có thẻ từ vựng nào được thêm từ câu làm sai."
                    : "Không có thẻ nào trong bộ lọc này."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOnlyMistakeLinked(false);
                    setActiveTab("browse");
                  }}
                  className="toeic-btn toeic-btn-primary"
                >
                  Chọn từ 10 Modules / 50 Chủ đề &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        <ToeicSmartPaywallModal
          isOpen={entitlement.paywallState?.isOpen}
          onClose={entitlement.closePaywall}
          triggerId={entitlement.paywallState?.triggerId || "TRG_09_TOEIC_FLASHCARD_1000"}
          context={entitlement.paywallState?.context || {}}
        />
      </AppShell2026>
    </>
  );
}
