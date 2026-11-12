import React from "react";

/**
 * AcademicRichText
 * Parses sanitized academic grammar text (**bold**, *italic*, ***bold-italic***,
 * `code`, ~~strikethrough~~, [NOT ...] warning tags, and line breaks) into crisp
 * semantic JSX without leaking raw markdown asterisks.
 * Uses CSS design-system tokens exclusively (zero hardcoded hex colors).
 */

const TOKEN_REGEX =
  /(\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|~~[^~\n]+~~|\[NOT\s+[^\]\n]+\])/g;

function normalizeInlineMarkdown(input) {
  if (!input || typeof input !== "string") return "";
  let s = input;

  // Replace Private-Use-Area PDF Wingdings arrows with proper Unicode arrows
  s = s.replace(/\uf0ae/g, "→").replace(/\uf03d\uf03e|\uf03e|\uf03d/g, "⇔");

  // Fix split bold-italic tokens like "***1.* TOO**" -> "**1. TOO**"
  s = s.replace(/\*\*\*([^*]+?)\.\*\s*([^*]+?)\*\*/g, "**$1. $2**");

  // Fix broken spaces inside italic/bold pairs like "*(có* *thật)*" -> "*(có thật)*"
  s = s.replace(/\*([^*\n]+)\*\s+\*([^*\n]+)\*/g, "*$1 $2*");
  s = s.replace(/\*\*([^*\n]+)\*\*\s+\*\*([^*\n]+)\*\*/g, "**$1 $2**");

  // Clean stray multiple asterisks (>=4)
  s = s.replace(/\*{4,}/g, "**");

  return s;
}

function stripUnpairedAsterisks(text) {
  if (!text || typeof text !== "string" || !text.includes("*")) return text;
  // Remove standalone leading/trailing unpaired ** or * left over from OCR splits
  let out = text.replace(/(^|\s)\*{1,3}(\s|$)/g, "$1$2");
  // Remove any remaining lone '*' or '**' inside segments not matched by TOKEN_REGEX
  out = out.replace(/\*+/g, "");
  return out;
}

export function stripMarkdownFormatting(text) {
  if (!text || typeof text !== "string") return text || "";
  return normalizeInlineMarkdown(text)
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function renderInlineLine(line, lineKey) {
  const normalized = normalizeInlineMarkdown(line);
  const parts = [];
  let lastIndex = 0;
  let match;
  TOKEN_REGEX.lastIndex = 0;

  while ((match = TOKEN_REGEX.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      parts.push(stripUnpairedAsterisks(normalized.slice(lastIndex, match.index)));
    }
    const token = match[0];
    const k = `${lineKey}-${match.index}`;

    if (token.startsWith("***") && token.endsWith("***")) {
      parts.push(
        <strong key={k} style={{ fontWeight: 700, fontStyle: "italic", color: "var(--ds-text-heading)" }}>
          {stripUnpairedAsterisks(token.slice(3, -3))}
        </strong>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={k} style={{ fontWeight: 700, color: "var(--ds-text-heading)" }}>
          {stripUnpairedAsterisks(token.slice(2, -2))}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={k} style={{ fontStyle: "italic", fontWeight: 600, color: "var(--ds-accent)" }}>
          {stripUnpairedAsterisks(token.slice(1, -1))}
        </em>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={k}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.88em",
            fontWeight: 700,
            backgroundColor: "var(--ds-bg-elevated)",
            border: "1px solid var(--ds-border)",
            borderRadius: "4px",
            padding: "0.05rem 0.35rem",
            color: "var(--ds-accent)",
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      parts.push(
        <span
          key={k}
          style={{
            textDecoration: "line-through",
            color: "var(--ds-danger)",
            fontWeight: 600,
            margin: "0 2px",
          }}
        >
          {token.slice(2, -2)}
        </span>
      );
    } else if (token.startsWith("[NOT") && token.endsWith("]")) {
      parts.push(
        <span
          key={k}
          style={{
            backgroundColor: "var(--ds-danger-bg)",
            border: "1px solid var(--ds-danger-border)",
            color: "var(--ds-danger)",
            padding: "0.08rem 0.35rem",
            borderRadius: "4px",
            fontSize: "0.78em",
            fontWeight: 700,
            margin: "0 4px",
          }}
        >
          ⚠️ {token.slice(1, -1)}
        </span>
      );
    }

    lastIndex = TOKEN_REGEX.lastIndex;
  }

  if (lastIndex < normalized.length) {
    parts.push(stripUnpairedAsterisks(normalized.slice(lastIndex)));
  }

  return parts;
}

export default function AcademicRichText({ text, multiline = true }) {
  if (text === null || text === undefined) return null;
  if (typeof text !== "string") return text;

  const lines = multiline ? text.split(/\n+/) : [text];
  if (lines.length === 1) {
    return <>{renderInlineLine(lines[0], "l0")}</>;
  }

  return (
    <>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <br />}
          {renderInlineLine(line, `l${idx}`)}
        </React.Fragment>
      ))}
    </>
  );
}
