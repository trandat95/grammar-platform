import React from "react";
import QuestionAudio from "./QuestionAudio";

const TYPE_LABELS = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  FILL_IN_THE_BLANKS: "Điền vào chỗ trống",
  COMPLETE_SENTENCES: "Hoàn thành câu",
  SENTENCE_TRANSFORMATION: "Chuyển đổi câu",
  REWRITE_SENTENCES: "Viết lại câu",
  SHORT_ANSWER: "Trả lời ngắn",
  MATCHING: "Nối / Xác định",
  TRANSLATION: "Dịch câu",
  SENTENCE_ARRANGEMENT: "Sắp xếp câu",
  ERROR_CORRECTION: "Tìm & sửa lỗi",
  WORD_FORMATION: "Biến đổi từ loại",
};

export function formatQuestionStem(stem) {
  return typeof stem === "string" ? stem.replace(/\\_/g, "_") : String(stem ?? "");
}

export default function QuestionStem({
  question,
  displayNumber,
  fallbackType = "",
  resolvedMode = "text_input",
  onListen = null,
  attempts = 0,
}) {
  if (!question) return null;

  const numLabel = displayNumber ?? question.num ?? 1;
  const rawType = String(question.type || fallbackType || "").toUpperCase();
  const typeLabel = TYPE_LABELS[rawType] || rawType || "Bài tập";
  const stemText = formatQuestionStem(question.stem);
  const starterPrompt = question.starter_prompt ? String(question.starter_prompt).trim() : "";

  return (
    <div style={{ marginBottom: "var(--ds-space-3, 12px)" }}>
      {/* Header Row: Question Number + Type Badge + Attempts */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "0.55rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: "700",
              color: "var(--ds-text-heading)",
            }}
          >
            Câu {numLabel}
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: "700",
              padding: "0.15rem 0.55rem",
              borderRadius: "var(--ds-radius-full, 9999px)",
              backgroundColor:
                resolvedMode === "multiple_choice"
                  ? "var(--ds-accent-bg)"
                  : "var(--ds-bg-elevated)",
              color:
                resolvedMode === "multiple_choice"
                  ? "var(--ds-accent)"
                  : "var(--ds-text-secondary)",
              border:
                resolvedMode === "multiple_choice"
                  ? "1px solid var(--ds-accent-border)"
                  : "1px solid var(--ds-border)",
            }}
          >
            {typeLabel}
          </span>
          {attempts > 0 && (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: "600",
                color: "var(--ds-text-muted)",
              }}
            >
              • Lần thử: {attempts}
            </span>
          )}
        </div>

        <QuestionAudio stem={stemText} question={question} onListen={onListen} />
      </div>

      {/* Optional Instruction Box */}
      {question.instruction && (
        <div
          style={{
            backgroundColor: "var(--ds-accent-bg)",
            border: "1px solid var(--ds-accent-border)",
            borderLeft: "4px solid var(--ds-accent)",
            padding: "0.5rem 0.85rem",
            borderRadius: "var(--ds-radius-md, 8px)",
            marginBottom: "0.75rem",
            fontSize: "0.825rem",
            color: "var(--ds-accent)",
            lineHeight: "1.5",
            overflowWrap: "anywhere",
          }}
        >
          <strong>Yêu cầu:</strong> {question.instruction}
        </div>
      )}

      {/* Stem Text — safely wraps long passages up to 749+ chars at 320px..1440px */}
      <div
        style={{
          fontSize: "0.975rem",
          color: "var(--ds-text)",
          lineHeight: "1.65",
          fontWeight: "500",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          maxWidth: "100%",
        }}
      >
        {stemText}
      </div>

      {/* Optional Starter Prompt Box */}
      {starterPrompt && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
            backgroundColor: "var(--ds-warning-bg)",
            border: "1px solid var(--ds-warning-border)",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--ds-radius-md, 8px)",
            fontSize: "0.825rem",
            color: "var(--ds-warning)",
            marginTop: "0.65rem",
          }}
        >
          <span style={{ fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.02em" }}>
            GỢI Ý MỞ ĐẦU:
          </span>
          <span style={{ fontWeight: "600", overflowWrap: "anywhere" }}>
            &ldquo;{starterPrompt}...&rdquo;
          </span>
        </div>
      )}
    </div>
  );
}
