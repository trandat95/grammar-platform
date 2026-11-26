import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { KitIcon } from "../../ui-2026/KitIcon";
import { ToeicBadge } from "../ui";
import { buildClientOfflineFlashcardSvgDataUri } from "../../../lib/toeic/flashcard-client-store";
import { FSRS_STATES, previewAllRatings } from "../../../lib/toeic/flashcard-fsrs";

const SRS_STATE_BADGES = {
  [FSRS_STATES.NEW]: { label: "Từ mới", variant: "muted" },
  [FSRS_STATES.LEARNING]: { label: "Đang học", variant: "warning" },
  [FSRS_STATES.REVIEW]: { label: "Đang nhớ", variant: "success" },
  [FSRS_STATES.RELEARNING]: { label: "Cần ôn lại", variant: "danger" },
};

const SOURCE_LABELS = {
  MISTAKE_AUTO_QUEUE: "Từ câu làm sai",
  EXAM_REMEDIATION: "Từ đề thi TOEIC",
  XRAY_SAVE: "Đã lưu từ X-Ray",
};

export default function ToeicFlashcard3D({
  card,
  srsRecord = null,
  relatedQuestions = [],
  isFlipped = false,
  onFlip,
  onRate,
  onSaveNote,
  canEditNote = true,
}) {
  const [imgSrc, setImgSrc] = useState("");
  const [preferSvgCard, setPreferSvgCard] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [studyMode, setStudyMode] = useState("flashcard"); // 'flashcard' | 'cloze'
  const [clozeInput, setClozeInput] = useState("");
  const [clozeChecked, setClozeChecked] = useState(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const audioRef = useRef(null);

  const isVocabCard = card && card.card_type !== "MISTAKE_QUESTION";

  const fallbackSvg = useMemo(() => {
    if (!isVocabCard) return "";
    return buildClientOfflineFlashcardSvgDataUri(card);
  }, [card, isVocabCard]);

  useEffect(() => {
    if (!isVocabCard) return;
    const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;
    const preferred = srsRecord?.custom_image_url || card?.visual_media?.cdn_thumbnail_url;
    setImgSrc(!isOffline && preferred ? preferred : fallbackSvg);
    setClozeInput("");
    setClozeChecked(null);
    setNoteOpen(false);
    setNoteDraft(srsRecord?.personal_mnemonic_note || "");
  }, [card?.id, srsRecord?.custom_image_url, srsRecord?.personal_mnemonic_note, fallbackSvg, isVocabCard]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const ratingPreviews = useMemo(() => {
    if (!isVocabCard) {
      return { 1: "1 ngày", 2: "3 ngày", 3: "7 ngày", 4: "14 ngày" };
    }
    return previewAllRatings(srsRecord, card?.spaced_repetition_defaults || {});
  }, [isVocabCard, srsRecord, card?.spaced_repetition_defaults]);

  if (!card) return null;

  const playAudioFallback = (url) => {
    if (!url || typeof Audio === "undefined") {
      setIsSpeaking(false);
      return;
    }
    try {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      audio.play().catch(() => setIsSpeaking(false));
    } catch {
      setIsSpeaking(false);
    }
  };

  const playPronunciation = (e, text, fallbackUrl) => {
    if (e) e.stopPropagation();
    if (!text) return;
    setIsSpeaking(true);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.92;
        const voices = window.speechSynthesis.getVoices() || [];
        const usVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("en-us"));
        if (usVoice) utterance.voice = usVoice;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => playAudioFallback(fallbackUrl);
        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        // Fallback below
      }
    }
    playAudioFallback(fallbackUrl);
  };

  const handleCheckCloze = (e) => {
    e.stopPropagation();
    const cleanGuess = clozeInput.trim().toLowerCase();
    const targetWord = String(card.word || "").trim().toLowerCase();
    const headWord = targetWord.split(/\s+/)[0];
    if (!cleanGuess) return;
    // Strict match: exact target word, or headword for multi-word phrasal verbs (e.g. "abide" for "abide by" when "by" is outside blank)
    const isHit =
      cleanGuess === targetWord ||
      (targetWord.includes(" ") && cleanGuess === headWord);
    setClozeChecked(isHit ? "correct" : "wrong");
  };

  if (!isVocabCard) {
    // Legacy Mistake Question Card view preserved seamlessly inside the same 3D perspective shell
    return (
      <div className="toeic-flashcard-perspective">
        <div
          onClick={() => onFlip && onFlip()}
          className={`toeic-flashcard-inner ${isFlipped ? "is-flipped" : ""}`}
        >
          <div className="toeic-flashcard-front">
            <div className="toeic-fc-body" style={{ justifyContent: "space-between" }}>
              <div className="toeic-flex-between">
                <ToeicBadge variant="danger" icon="danger">
                  Câu Hỏi Từng Làm Sai
                </ToeicBadge>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>
                  <KitIcon name="refresh" size={13} />
                  <span>Chạm để lật đáp án</span>
                </span>
              </div>
              <div style={{ textAlign: "left", maxWidth: "600px", margin: "1rem auto", width: "100%" }}>
                <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ds-text)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  {card.stem}
                </p>
                <div className="toeic-grid-2 toeic-srs-options" style={{ gap: "0.5rem" }}>
                  {Object.entries(card.options || {}).map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        padding: "0.7rem 0.9rem",
                        minHeight: "46px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        borderRadius: "0.6rem",
                        border: "1px solid var(--ds-border)",
                        backgroundColor: "var(--ds-bg-elevated)",
                        fontSize: "0.88rem",
                      }}
                    >
                      <strong>({k})</strong> {v}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>
                Khoảng cách ôn tập: {card.interval_days || 1} ngày
              </div>
            </div>
          </div>

          <div className="toeic-flashcard-back">
            <div className="toeic-fc-body" style={{ justifyContent: "space-between" }}>
              <div className="toeic-flex-between">
                <ToeicBadge variant="success" icon="check-circle">
                  Đáp án đúng: ({card.correct_answer})
                </ToeicBadge>
                <span style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>
                  Chọn mức độ nhớ bên dưới
                </span>
              </div>
              <div style={{ textAlign: "left", maxWidth: "600px", margin: "auto", width: "100%" }}>
                <p style={{ fontSize: "0.94rem", color: "var(--ds-text)", lineHeight: 1.65 }}>
                  {card.explanation_vi}
                </p>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>
                Ease Factor: {card.ease_factor || 2.5}
              </div>
            </div>
          </div>
        </div>

        {isFlipped && onRate && (
          <div style={{ marginTop: "1rem" }}>
            <RatingBar previews={ratingPreviews} onRate={onRate} />
          </div>
        )}
      </div>
    );
  }

  const srsState = srsRecord?.srs_state || FSRS_STATES.NEW;
  const stateBadge = SRS_STATE_BADGES[srsState] || SRS_STATE_BADGES.NEW;
  const sourceBadgeLabel = srsRecord?.source_context ? SOURCE_LABELS[srsRecord.source_context] : null;
  const synonymsList = Array.isArray(card.synonyms)
    ? card.synonyms
    : String(card.synonyms_str || card.synonyms || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="toeic-flashcard-perspective">
        <div
          onClick={() => onFlip && onFlip()}
          className={`toeic-flashcard-inner ${isFlipped ? "is-flipped" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={isFlipped ? `Thẻ ${card.word} mặt sau` : `Thẻ ${card.word} mặt trước, bấm để lật`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target === e.currentTarget && onFlip) {
              e.preventDefault();
              onFlip();
            }
          }}
        >
          {/* ================= FRONT FACE ================= */}
          <div className="toeic-flashcard-front">
            {/* 4-Layer Visual Media Header */}
            <div className="toeic-fc-media-wrap">
              <img
                src={preferSvgCard ? fallbackSvg : imgSrc || fallbackSvg}
                alt={`${card.word} - ${card.visual_media?.visual_scene_keywords || ""}`}
                onError={() => {
                  if (imgSrc !== fallbackSvg) {
                    setImgSrc(fallbackSvg);
                  }
                }}
                className="toeic-fc-media-img"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="toeic-fc-media-scrim" />

              {/* Top Left Badge: Module & Topic */}
              <span
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  left: "0.75rem",
                  padding: "0.28rem 0.7rem",
                  borderRadius: "999px",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "var(--ds-text-on-accent)",
                  backgroundColor: card.visual_media?.theme_color_hex || "var(--ds-accent)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
              >
                {card.code} · {card.topic_name_vi}
              </span>

              {/* Top Right Badge: TOEIC Band & CEFR */}
              <span
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  right: "0.75rem",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--ds-text-on-accent)",
                  backgroundColor: "rgba(15, 23, 42, 0.72)",
                  backdropFilter: "blur(6px)",
                }}
              >
                Band {card.toeic_score_band} ({card.cefr_level})
              </span>

              {/* Bottom Left Status Pill */}
              <div
                style={{
                  position: "absolute",
                  bottom: "0.65rem",
                  left: "0.75rem",
                  right: "0.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "var(--ds-text-on-accent)",
                    backgroundColor: "rgba(15, 23, 42, 0.58)",
                    padding: "0.18rem 0.55rem",
                    borderRadius: "0.45rem",
                    maxWidth: "68%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {card.visual_media?.visual_scene_keywords}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreferSvgCard((p) => !p);
                    }}
                    style={{
                      border: "none",
                      borderRadius: "0.45rem",
                      padding: "0.2rem 0.5rem",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: "var(--ds-text-on-accent)",
                      backgroundColor: "rgba(15, 23, 42, 0.72)",
                      cursor: "pointer",
                    }}
                    title="Chuyển giữa ảnh chủ đề và thẻ đồ họa riêng theo từ"
                  >
                    {preferSvgCard ? "Ảnh chủ đề" : "Thẻ SVG riêng"}
                  </button>
                  <ToeicBadge variant={stateBadge.variant}>
                    {stateBadge.label}
                  </ToeicBadge>
                </div>
              </div>
            </div>

            {/* Front Body: Mode Toggle + Word/Cloze + Audio */}
            <div className="toeic-fc-body">
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.45rem" }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    padding: "0.2rem",
                    borderRadius: "999px",
                    backgroundColor: "var(--ds-bg-elevated)",
                    border: "1px solid var(--ds-border)",
                    gap: "0.2rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setStudyMode("flashcard")}
                    style={{
                      border: "none",
                      borderRadius: "999px",
                      padding: "0.25rem 0.7rem",
                      fontSize: "0.73rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      backgroundColor: studyMode === "flashcard" ? "var(--ds-accent)" : "transparent",
                      color: studyMode === "flashcard" ? "var(--ds-text-on-accent)" : "var(--ds-text-secondary)",
                    }}
                  >
                    Xem Thẻ Từ
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyMode("cloze")}
                    style={{
                      border: "none",
                      borderRadius: "999px",
                      padding: "0.25rem 0.7rem",
                      fontSize: "0.73rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      backgroundColor: studyMode === "cloze" ? "var(--ds-accent)" : "transparent",
                      color: studyMode === "cloze" ? "var(--ds-text-on-accent)" : "var(--ds-text-secondary)",
                    }}
                  >
                    Thử Thách Điền Từ (Ẩn đáp án)
                  </button>
                </div>

                {sourceBadgeLabel && (
                  <ToeicBadge variant="warning" icon="bolt">
                    {sourceBadgeLabel}
                    {srsRecord?.source_question_id ? ` · ${srsRecord.source_question_id}` : ""}
                  </ToeicBadge>
                )}
              </div>

              {studyMode === "flashcard" ? (
                <>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <h2
                        style={{
                          fontSize: "clamp(1.75rem, 4vw, 2.35rem)",
                          fontWeight: 800,
                          margin: 0,
                          color: "var(--ds-text-heading)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {card.word}
                      </h2>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "0.45rem",
                          backgroundColor: "var(--ds-accent-bg)",
                          color: "var(--ds-accent)",
                          border: "1px solid var(--ds-accent-border)",
                        }}
                      >
                        {card.part_of_speech}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: "0.35rem",
                        fontSize: "1.02rem",
                        color: "var(--ds-text-secondary)",
                        fontFamily: "'Noto Sans', 'Segoe UI', 'Lucida Sans Unicode', sans-serif",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {card.ipa_us}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => playPronunciation(e, card.word, card.audio_google_tts_url)}
                      style={{
                        marginTop: "0.65rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.45rem 0.95rem",
                        minHeight: "40px",
                        borderRadius: "999px",
                        border: "1px solid var(--ds-accent-border)",
                        backgroundColor: isSpeaking ? "var(--ds-accent)" : "var(--ds-accent-bg)",
                        color: isSpeaking ? "var(--ds-text-on-accent)" : "var(--ds-accent)",
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      <KitIcon name="tool-audio" size={15} />
                      <span>{isSpeaking ? "Đang phát âm..." : "Nghe phát âm chuẩn Mỹ"}</span>
                    </button>
                  </div>

                  {/* Contextual Sentence Preview (No pointless input when word is visible) */}
                  <div className="toeic-fc-cloze-box">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.35rem",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "var(--ds-text-muted)",
                        marginBottom: "0.35rem",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                        <KitIcon name="bulb" size={13} />
                        <span>Ngữ cảnh trong đề TOEIC</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStudyMode("cloze");
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "var(--ds-accent)",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Thử điền từ &rarr;
                      </button>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.92rem",
                        fontStyle: "italic",
                        lineHeight: 1.55,
                        color: "var(--ds-text)",
                      }}
                    >
                      &ldquo;{card.example_en}&rdquo;
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* CLOZE RECALL MODE: Target word is hidden until answered or flipped */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <h2
                        style={{
                          fontSize: "clamp(1.6rem, 3.6vw, 2.1rem)",
                          fontWeight: 800,
                          margin: 0,
                          color: clozeChecked === "correct" ? "var(--ds-success)" : "var(--ds-accent)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {clozeChecked === "correct" ? card.word : "[ _______ ]"}
                      </h2>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "0.45rem",
                          backgroundColor: "var(--ds-accent-bg)",
                          color: "var(--ds-accent)",
                          border: "1px solid var(--ds-accent-border)",
                        }}
                      >
                        {card.part_of_speech}
                      </span>
                    </div>

                    <div style={{ marginTop: "0.45rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--ds-text)" }}>
                      Gợi ý nghĩa: <span style={{ color: "var(--ds-accent)" }}>{card.meaning_vi}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => playPronunciation(e, card.word, card.audio_google_tts_url)}
                      style={{
                        marginTop: "0.55rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.4rem 0.9rem",
                        minHeight: "38px",
                        borderRadius: "999px",
                        border: "1px solid var(--ds-accent-border)",
                        backgroundColor: isSpeaking ? "var(--ds-accent)" : "var(--ds-accent-bg)",
                        color: isSpeaking ? "var(--ds-text-on-accent)" : "var(--ds-accent)",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      <KitIcon name="tool-audio" size={14} />
                      <span>{isSpeaking ? "Đang phát..." : "Nghe gợi ý phát âm"}</span>
                    </button>
                  </div>

                  <div className="toeic-fc-cloze-box" onClick={(e) => e.stopPropagation()}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "var(--ds-text-muted)",
                        marginBottom: "0.35rem",
                      }}
                    >
                      <KitIcon name="target" size={13} />
                      <span>Điền từ tiếng Anh phù hợp vào chỗ trống</span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.92rem",
                        fontStyle: "italic",
                        lineHeight: 1.55,
                        color: "var(--ds-text)",
                      }}
                    >
                      &ldquo;{card.cloze_sentence_en}&rdquo;
                    </p>

                    <div style={{ display: "flex", gap: "0.45rem", marginTop: "0.6rem", alignItems: "center" }}>
                      <input
                        type="text"
                        value={clozeInput}
                        onChange={(e) => {
                          setClozeInput(e.target.value);
                          if (clozeChecked) setClozeChecked(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCheckCloze(e);
                        }}
                        placeholder="Nhập từ tiếng Anh..."
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: "40px",
                          padding: "0 0.7rem",
                          borderRadius: "0.55rem",
                          border: `1.5px solid ${
                            clozeChecked === "correct"
                              ? "var(--ds-success)"
                              : clozeChecked === "wrong"
                              ? "var(--ds-danger)"
                              : "var(--ds-border)"
                          }`,
                          backgroundColor: "var(--ds-card)",
                          color: "var(--ds-text)",
                          fontSize: "16px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleCheckCloze}
                        style={{
                          height: "40px",
                          padding: "0 0.85rem",
                          borderRadius: "0.55rem",
                          border: "none",
                          backgroundColor: "var(--ds-accent)",
                          color: "var(--ds-text-on-accent)",
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Kiểm tra
                      </button>
                    </div>
                    {clozeChecked && (
                      <div
                        style={{
                          marginTop: "0.45rem",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: clozeChecked === "correct" ? "var(--ds-success)" : "var(--ds-danger)",
                        }}
                      >
                        {clozeChecked === "correct"
                          ? `Chính xác! Đáp án: ${card.word} (${card.ipa_us})`
                          : `Chưa đúng! Gợi ý bắt đầu bằng "${card.word.slice(0, 2)}..." hoặc chạm để lật thẻ.`}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: "var(--ds-text-muted)",
                  paddingTop: "0.25rem",
                }}
              >
                <span>{card.module_name_vi}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontWeight: 700, color: "var(--ds-accent)" }}>
                  <KitIcon name="refresh" size={13} />
                  <span>Chạm để lật xem nghĩa</span>
                  <span className="toeic-fc-kbd-hint">(Space)</span>
                </span>
              </div>
            </div>
          </div>

          {/* ================= BACK FACE ================= */}
          <div className="toeic-flashcard-back">
            <div className="toeic-fc-body" style={{ textAlign: "left", justifyContent: "space-between" }}>
              {/* Top Row */}
              <div className="toeic-flex-between" style={{ flexWrap: "wrap", gap: "0.4rem" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                  <ToeicBadge variant="primary" icon="check-circle">
                    {card.word} · {card.part_of_speech}
                  </ToeicBadge>
                  <span style={{ fontFamily: "'Noto Sans', 'Segoe UI', 'Lucida Sans Unicode', sans-serif", fontSize: "0.84rem", color: "var(--ds-text-secondary)" }}>
                    {card.ipa_us}
                  </span>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "var(--ds-text-muted)" }}>
                  <KitIcon name="refresh" size={13} />
                  <span>Lật lại</span>
                </span>
              </div>

              {/* Vietnamese Meaning & English Definition */}
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", color: "var(--ds-accent)", letterSpacing: "0.04em" }}>
                  Nghĩa Tiếng Việt &amp; Định Nghĩa Chuẩn
                </div>
                <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--ds-text-heading)", margin: "0.2rem 0 0.3rem 0", lineHeight: 1.3 }}>
                  {card.meaning_vi}
                </h3>
                <p style={{ fontSize: "0.86rem", color: "var(--ds-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  {card.definition_en}
                </p>
              </div>

              {/* Collocation Highlight Box */}
              <div className="toeic-fc-colloc-box">
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.74rem", fontWeight: 800, color: "var(--ds-warning)" }}>
                  <KitIcon name="pin" size={14} />
                  <span>Cụm từ cố định hay thi Part 5–7 (Collocation)</span>
                </div>
                <div style={{ marginTop: "0.25rem", fontSize: "0.98rem", fontWeight: 800, color: "var(--ds-text-heading)" }}>
                  {card.collocation}
                </div>
              </div>

              {/* Bilingual TOEIC Context Example */}
              <div className="toeic-fc-example-box">
                <div className="toeic-flex-between" style={{ marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", color: "var(--ds-text-muted)" }}>
                    Ví dụ ngữ cảnh New TOEIC
                  </span>
                  <button
                    type="button"
                    onClick={(e) => playPronunciation(e, card.example_en, card.audio_google_tts_url)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      border: "none",
                      background: "transparent",
                      color: "var(--ds-accent)",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <KitIcon name="tool-audio" size={14} />
                    <span>Nghe cả câu</span>
                  </button>
                </div>
                <p style={{ margin: "0 0 0.3rem 0", fontSize: "0.94rem", fontWeight: 600, color: "var(--ds-text)", lineHeight: 1.55 }}>
                  {card.example_en}
                </p>
                <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--ds-text-secondary)", lineHeight: 1.5 }}>
                  &rarr; {card.example_vi}
                </p>
              </div>

              {/* Synonyms (Part 7 Paraphrasing) */}
              {synonymsList.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.76rem", fontWeight: 800, color: "var(--ds-text-muted)" }}>
                    Từ đồng nghĩa (Part 7):
                  </span>
                  {synonymsList.map((syn) => (
                    <span
                      key={syn}
                      style={{
                        padding: "0.22rem 0.6rem",
                        borderRadius: "0.45rem",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        backgroundColor: "var(--ds-bg-elevated)",
                        border: "1px solid var(--ds-border)",
                        color: "var(--ds-text)",
                      }}
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              )}

              {/* Step 4 Back-Link: Related Grammar/TOEIC Questions */}
              {relatedQuestions.length > 0 && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "var(--ds-accent-bg)",
                    border: "1px solid var(--ds-accent-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--ds-accent)" }}>
                    <KitIcon name="link" size={14} />
                    <span>Gặp từ này trong {relatedQuestions.length} câu hỏi TOEIC thực tế</span>
                  </div>
                  <Link
                    href={`/toeic/practice/${encodeURIComponent(relatedQuestions[0].topic_id || "VOC_COLLOCATION")}`}
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: 800,
                      color: "var(--ds-accent)",
                      textDecoration: "underline",
                    }}
                  >
                    Luyện dạng bài liên quan &rarr;
                  </Link>
                </div>
              )}

              {/* Optional Personal Mnemonic Note */}
              {canEditNote && onSaveNote && (
                <div onClick={(e) => e.stopPropagation()}>
                  {!noteOpen ? (
                    <button
                      type="button"
                      onClick={() => setNoteOpen(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        border: "none",
                        background: "transparent",
                        color: "var(--ds-text-muted)",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <KitIcon name="edit" size={13} />
                      <span>
                        {srsRecord?.personal_mnemonic_note
                          ? `Ghi chú mẹo nhớ: "${srsRecord.personal_mnemonic_note}"`
                          : "Thêm ghi chú mẹo nhớ cá nhân"}
                      </span>
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Nhập mẹo nhớ riêng cho từ này..."
                        style={{
                          flex: 1,
                          height: "36px",
                          padding: "0 0.65rem",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--ds-border)",
                          backgroundColor: "var(--ds-card)",
                          color: "var(--ds-text)",
                          fontSize: "16px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onSaveNote(card, noteDraft);
                          setNoteOpen(false);
                        }}
                        style={{
                          height: "36px",
                          padding: "0 0.75rem",
                          borderRadius: "0.5rem",
                          border: "none",
                          backgroundColor: "var(--ds-accent)",
                          color: "var(--ds-text-on-accent)",
                          fontSize: "0.76rem",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Lưu
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Footer FSRS Stats */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                  fontSize: "0.72rem",
                  color: "var(--ds-text-muted)",
                  borderTop: "1px solid var(--ds-border)",
                  paddingTop: "0.55rem",
                }}
              >
                <span>
                  FSRS-4.5 · Độ ổn định (S): {Number(srsRecord?.stability || card.spaced_repetition_defaults?.initial_stability || 1).toFixed(1)}d
                  {" · "}Độ khó (D): {Number(srsRecord?.difficulty || card.spaced_repetition_defaults?.initial_difficulty || 5).toFixed(1)}
                </span>
                <span>Lượt ôn: {srsRecord?.reps || 0} · Quên: {srsRecord?.lapses || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 FSRS-4.5 Rating Buttons (Shown when card is flipped) */}
      {isFlipped && onRate && <RatingBar previews={ratingPreviews} onRate={onRate} />}
    </div>
  );
}

function RatingBar({ previews, onRate }) {
  const buttons = [
    {
      rating: 1,
      title: "Quên rồi",
      kbd: "1",
      interval: previews[1],
      border: "var(--ds-danger-border)",
      bg: "var(--ds-danger-bg)",
      color: "var(--ds-danger)",
    },
    {
      rating: 2,
      title: "Hơi khó",
      kbd: "2",
      interval: previews[2],
      border: "var(--ds-warning-border)",
      bg: "var(--ds-warning-bg)",
      color: "var(--ds-warning)",
    },
    {
      rating: 3,
      title: "Nhớ tốt",
      kbd: "3",
      interval: previews[3],
      border: "var(--ds-accent-border)",
      bg: "var(--ds-accent-bg)",
      color: "var(--ds-accent)",
    },
    {
      rating: 4,
      title: "Rất dễ",
      kbd: "4",
      interval: previews[4],
      border: "var(--ds-success-border)",
      bg: "var(--ds-success-bg)",
      color: "var(--ds-success)",
    },
  ];

  return (
    <div className="toeic-fc-rating-grid" style={{ animation: "toeicFadeIn 0.2s ease-out" }}>
      {buttons.map((b) => (
        <button
          key={b.rating}
          type="button"
          onClick={() => onRate(b.rating)}
          className="toeic-fc-rating-btn"
          style={{
            border: `1.5px solid ${b.border}`,
            backgroundColor: b.bg,
            color: b.color,
          }}
        >
          <div style={{ fontSize: "0.86rem" }}>
            {b.title}{" "}
            <span className="toeic-fc-kbd-hint" style={{ opacity: 0.8 }}>
              ({b.kbd})
            </span>
          </div>
          <div style={{ fontSize: "0.74rem", fontWeight: 600, marginTop: "0.18rem", opacity: 0.92 }}>
            {b.interval}
          </div>
        </button>
      ))}
    </div>
  );
}
