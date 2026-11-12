import React, { useState } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { Button, Input, Badge, Alert } from "../design-system";
import { AVATAR_PATHS } from "../ui-2026/assetMap";

const QUICK_PROMPTS = [
  "Hôm nay nên dành 20 phút học bài nào?",
  "Tại sao tôi hay sai ở chuyên đề yếu nhất?",
  "Tôi đã sẵn sàng lên B2 chưa?",
];

/**
 * Milestone 2.8.10: Conversational AI Learning Advisor Widget
 * Calls POST /api/ai-advisor/ask with strict deterministic Scorer + DAG Knowledge Graph Guardrails.
 */
export default function AiAdvisorDrawer({
  currentUser = null,
  authToken = null,
  scoreResult = null,
  onNavigateToLesson,
  isLight = false,
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState("");
  const T = getThemeTokens(isLight);

  const handleAsk = async (promptText) => {
    const cleanPrompt = (promptText ?? question).trim();
    if (!cleanPrompt || isAsking) return;
    setError("");
    setIsAsking(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };
      const res = await fetch("/api/ai-advisor/ask", {
        method: "POST",
        headers,
        body: JSON.stringify({
          question_text: cleanPrompt,
          user_id: !currentUser?.isGuest ? currentUser?.id : null,
          score_result: scoreResult,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setMessages((prev) => [
        {
          id: `adv_${Date.now()}`,
          question: cleanPrompt,
          answer: json.answer,
          providerMode: json.providerMode,
          suggestedLessons: json.suggestedLessons || [],
          rootCause: json.rootCause || null,
        },
        ...prev,
      ]);
      setQuestion("");
    } catch (e) {
      setError(e.message || "Không thể kết nối tới AI Learning Advisor.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: T.card,
        border: `1px solid ${T.accentBorder}`,
        borderRadius: "14px",
        padding: "1.25rem 1.4rem",
        boxShadow: T.shadow,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={AVATAR_PATHS[1]}
              alt="Cố vấn Anh Quốc"
              width={36}
              height={36}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${T.card}`,
                boxShadow: T.shadow,
              }}
            />
            <img
              src={AVATAR_PATHS[3]}
              alt="Cố vấn Hoa Kỳ"
              width={36}
              height={36}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${T.card}`,
                marginLeft: "-10px",
                boxShadow: T.shadow,
              }}
            />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: T.textHeading }}>
              Cố vấn Học tập AI (AI Study Coach)
            </h3>
            <div style={{ fontSize: "0.75rem", color: T.textMuted }}>
              Phân tích nguyên nhân gốc rễ &amp; gợi ý bài học chuẩn 100% từ dữ liệu thực tế (Zero Hallucination Guardrails)
            </div>
          </div>
        </div>
        <Badge tone="accent" isLight={isLight}>DAG Grounded</Badge>
      </div>

      {/* Quick Starter Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "0.85rem" }}>
        {QUICK_PROMPTS.map((q) => (
          <Button
            key={q}
            variant="secondary"
            size="sm"
            isLight={isLight}
            disabled={isAsking}
            onClick={() => handleAsk(q)}
          >
            💬 {q}
          </Button>
        ))}
      </div>

      {/* Custom Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        style={{ display: "flex", gap: "0.55rem", alignItems: "flex-start", flexWrap: "wrap" }}
      >
        <div style={{ flex: "1 1 260px" }}>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Hỏi AI Coach (VD: Tại sao tôi hay sai Bị động hoặc Điều kiện?)..."
            isLight={isLight}
            aria-label="Câu hỏi cho AI Learning Advisor"
          />
        </div>
        <Button type="submit" variant="primary" isLight={isLight} isLoading={isAsking}>
          Hỏi Cố vấn
        </Button>
      </form>

      {error && (
        <div style={{ marginTop: "0.75rem" }}>
          <Alert tone="danger" isLight={isLight}>
            {error}
          </Alert>
        </div>
      )}

      {/* Replies */}
      {messages.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                backgroundColor: T.bgElevated,
                border: `1px solid ${T.borderSubtle}`,
                borderRadius: "10px",
                padding: "0.95rem 1.05rem",
              }}
            >
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: T.accent, marginBottom: "0.45rem" }}>
                Bạn hỏi: &ldquo;{m.question}&rdquo;
              </div>
              <div style={{ fontSize: "0.85rem", color: T.text, lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {m.answer}
              </div>

              {m.suggestedLessons.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "0.75rem", paddingTop: "0.65rem", borderTop: `1px dashed ${T.borderSubtle}` }}>
                  {m.suggestedLessons.map((ls) => (
                    <Button
                      key={ls.lesson_code}
                      variant="secondary"
                      size="sm"
                      isLight={isLight}
                      onClick={() => onNavigateToLesson && onNavigateToLesson(ls.chapter_number, ls.lesson_id)}
                    >
                      📖 {ls.role}: Ch.{ls.chapter_number} — {ls.title_vi} ➔
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
