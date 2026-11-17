import React from "react";
import TextInputRenderer from "./TextInputRenderer";

/**
 * MultiBlankRenderer:
 * Safely renders a text input for multi-blank inline choice paragraphs
 * (e.g. `(many/ much)1 ... (plenty/ plenty of)2 ...`) without altering
 * canonical answers[] or single-string scoring contracts.
 */
export default function MultiBlankRenderer(props) {
  return (
    <div>
      <div
        style={{
          marginBottom: "0.55rem",
          padding: "0.4rem 0.7rem",
          borderRadius: "var(--ds-radius-md, 8px)",
          backgroundColor: "var(--ds-bg-elevated)",
          border: "1px solid var(--ds-border-subtle)",
          fontSize: "0.76rem",
          color: "var(--ds-text-muted)",
          lineHeight: "1.45",
        }}
      >
        Câu nhiều chỗ trống — nhập lần lượt các đáp án (phân tách bằng dấu &ldquo;-&rdquo; hoặc khoảng trắng).
      </div>
      <TextInputRenderer
        {...props}
        placeholder="Nhập lần lượt các đáp án (ví dụ: many - plenty of)..."
      />
    </div>
  );
}
