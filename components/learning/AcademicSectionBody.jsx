import React from "react";
import AcademicRichText from "./AcademicRichText";
import KitIcon from "../ui-2026/KitIcon";

/**
 * Heuristic detector for pure English example lines inside general paragraphs
 * (no Vietnamese diacritics, >= 3 words, not an English syntax formula or heading).
 */
const VIET_DIACRITIC_RE =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

function isEnglishExampleParagraph(line) {
  if (!line || typeof line !== "string") return false;
  const trimmed = line.trim();
  if (!trimmed || VIET_DIACRITIC_RE.test(trimmed)) return false;
  if (trimmed.startsWith("**") || trimmed.startsWith("Ví dụ") || trimmed.startsWith("Example")) return false;
  // Exclude pure grammar formulas containing '+' or '=>' without natural verbs/punctuation
  if (trimmed.includes(" + ") && !/[.!?]$/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  return words.length >= 3 && /[a-zA-Z]{2,}/.test(trimmed);
}

export default function AcademicSectionBody({
  sec,
  secIdx,
  lessonId,
  isLight,
  expandedRulesMap,
  setExpandedRulesMap,
  playWordAudio,
}) {
  const formulas = sec.formulas || [];
  const rules = sec.rules || [];
  const paragraphs = sec.paragraphs || [];
  const tables = sec.tables || [];
  const rawBullets = sec.bullets || [];
  const notes = sec.notes || [];

  // Separate real explanatory bullets from standalone "Ví dụ:" lines so we don't nest boxes
  const narrativeBullets = [];
  const bulletExamples = [];
  rawBullets.forEach((b) => {
    const trimmed = String(b || "").trim();
    if (/^(Ví dụ|Example|Ex)\s*:/i.test(trimmed)) {
      const cleaned = trimmed.replace(/^(Ví dụ|Example|Ex)\s*:\s*/i, "").trim();
      if (cleaned) bulletExamples.push(cleaned);
    } else if (trimmed) {
      narrativeBullets.push(trimmed);
    }
  });

  const secExamplesKey = `sec-ex-${lessonId || "ls"}-${secIdx}`;
  const isSecExExpanded = Boolean(expandedRulesMap?.[secExamplesKey]);
  const visibleBulletExamples =
    isSecExExpanded || bulletExamples.length <= 4 ? bulletExamples : bulletExamples.slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
      {/* 1. Narrative Paragraphs (Vietnamese explanations + styled inline English example lines) */}
      {paragraphs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {paragraphs.map((p, pIdx) => {
            const isExPrefix = /^(Ví dụ|Example|Ex)\s*:/i.test(p.trim());
            const isEngSample = isExPrefix || isEnglishExampleParagraph(p);

            if (isEngSample) {
              const cleanEn = p.replace(/^(Ví dụ|Example|Ex)\s*:\s*/i, "").trim();
              const audioText = cleanEn.replace(/\[.*?\]|\(.*?\)/g, "").replace(/\*/g, "").trim();
              return (
                <div
                  key={pIdx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    backgroundColor: "var(--ds-card-subtle)",
                    border: "1px solid var(--ds-border-subtle)",
                    borderLeft: "3px solid var(--ds-accent)",
                    borderRadius: "6px",
                    padding: "0.5rem 0.8rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.55rem", flex: 1 }}>
                    <span
                      style={{
                        fontSize: "0.66rem",
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        color: "var(--ds-accent)",
                        backgroundColor: "var(--ds-accent-bg)",
                        border: "1px solid var(--ds-accent-border)",
                        padding: "0.08rem 0.35rem",
                        borderRadius: "4px",
                        flexShrink: 0,
                      }}
                    >
                      EX
                    </span>
                    <span style={{ fontSize: "0.91rem", fontWeight: 500, color: "var(--ds-text)", lineHeight: 1.55 }}>
                      <AcademicRichText text={cleanEn} />
                    </span>
                  </div>
                  {audioText && (
                    <button
                      type="button"
                      onClick={() => playWordAudio(audioText, null)}
                      title="Nghe phát âm mẫu"
                      className="ds-focusable"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.28rem",
                        backgroundColor: "var(--ds-card)",
                        border: "1px solid var(--ds-border)",
                        color: "var(--ds-accent)",
                        borderRadius: "5px",
                        padding: "0.22rem 0.55rem",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <KitIcon name="tool-audio" size={12} />
                      <span>Đọc</span>
                    </button>
                  )}
                </div>
              );
            }

            return (
              <p
                key={pIdx}
                style={{
                  fontSize: "0.93rem",
                  color: "var(--ds-text-secondary)",
                  lineHeight: 1.72,
                  margin: 0,
                }}
              >
                <AcademicRichText text={p} />
              </p>
            );
          })}
        </div>
      )}

      {/* 2. Formulas Box (Syntax-colored & Deduplicated) */}
      {formulas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontFamily: "var(--font-sans)",
              color: "var(--ds-accent)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            ⚡ CÔNG THỨC CHUẨN XÁC
          </div>
          {formulas.map((f, fIdx) => {
            const formulaKindClass = f.type?.includes("(+)")
              ? "is-pos"
              : f.type?.includes("(-)")
              ? "is-neg"
              : "is-q";
            const badgeKindColor = f.type?.includes("(+)")
              ? "var(--ds-formula-pos)"
              : f.type?.includes("(-)")
              ? "var(--ds-formula-neg)"
              : "var(--ds-formula-q)";
            return (
              <div
                key={fIdx}
                className={`ge-formula-box ${formulaKindClass}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  boxShadow: "var(--ds-shadow-sm)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.95rem",
                    color: "var(--ds-success)",
                    fontWeight: 700,
                    letterSpacing: "0.015em",
                  }}
                >
                  <AcademicRichText text={f.text} multiline={false} />
                </div>
                {f.type && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontFamily: "var(--font-sans)",
                      backgroundColor: "var(--ds-card)",
                      color: badgeKindColor,
                      padding: "0.2rem 0.55rem",
                      borderRadius: "6px",
                      border: "1px solid var(--ds-border)",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {f.type}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Numbered Pedagogical Rules (Sequential 1, 2, 3...) */}
      {rules.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontFamily: "var(--font-sans)",
              color: "var(--ds-indigo)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            📌 QUY TẮC & TÌNH HUỐNG VẬN DỤNG
          </div>
          {rules.map((rule, rIdx) => {
            const ruleKey = `${lessonId || "ls"}-${secIdx}-${rIdx}`;
            const examples = rule.examples || [];
            const isExpanded = Boolean(expandedRulesMap?.[ruleKey]);
            const visibleExamples = isExpanded || examples.length <= 4 ? examples : examples.slice(0, 4);

            return (
              <div
                key={rIdx}
                style={{
                  backgroundColor: "var(--ds-card-subtle)",
                  border: "1px solid var(--ds-border)",
                  borderRadius: "10px",
                  padding: "0.95rem 1.15rem",
                }}
              >
                {/* Rule Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", marginBottom: rule.content || examples.length > 0 ? "0.55rem" : 0 }}>
                  <span
                    style={{
                      minWidth: "24px",
                      height: "24px",
                      padding: "0 0.35rem",
                      borderRadius: "6px",
                      backgroundColor: "var(--ds-indigo-bg)",
                      border: "1px solid var(--ds-indigo-border)",
                      color: "var(--ds-indigo)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    {rule.num || String(rIdx + 1)}
                  </span>
                  <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: "var(--ds-text-heading)", margin: 0, lineHeight: 1.45 }}>
                    <AcademicRichText text={rule.title} multiline={false} />
                  </h3>
                </div>

                {/* Rule Content */}
                {rule.content && (
                  <p style={{ fontSize: "0.91rem", color: "var(--ds-text-secondary)", lineHeight: 1.68, margin: "0 0 0.7rem 0" }}>
                    <AcademicRichText text={rule.content} />
                  </p>
                )}

                {/* Rule Examples */}
                {examples.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.45rem",
                      marginTop: "0.35rem",
                      paddingLeft: "0.75rem",
                      borderLeft: "2px solid var(--ds-accent-border)",
                    }}
                  >
                    {visibleExamples.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        style={{
                          backgroundColor: "var(--ds-card)",
                          border: "1px solid var(--ds-border-subtle)",
                          borderRadius: "6px",
                          padding: "0.5rem 0.8rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          boxShadow: "var(--ds-shadow-sm)",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.91rem", fontWeight: 600, color: "var(--ds-text)", lineHeight: 1.45 }}>
                            <AcademicRichText text={ex.en} />
                          </div>
                          {ex.vi && (
                            <div style={{ fontSize: "0.81rem", color: "var(--ds-success)", marginTop: "0.18rem", lineHeight: 1.4 }}>
                              🇻🇳 {ex.vi}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => playWordAudio(String(ex.en || "").replace(/\[.*?\]|\(.*?\)/g, "").trim(), null)}
                          title="Nghe phát âm chuẩn câu này"
                          className="ds-focusable"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            backgroundColor: "var(--ds-accent-bg)",
                            border: "1px solid var(--ds-accent-border)",
                            color: "var(--ds-accent)",
                            borderRadius: "6px",
                            padding: "0.26rem 0.55rem",
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          <KitIcon name="tool-audio" size={12} />
                          <span>Đọc</span>
                        </button>
                      </div>
                    ))}

                    {examples.length > 4 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRulesMap((prev) => ({
                            ...prev,
                            [ruleKey]: !prev[ruleKey],
                          }))
                        }
                        className="ds-focusable"
                        style={{
                          alignSelf: "flex-start",
                          marginTop: "0.15rem",
                          padding: "0.3rem 0.7rem",
                          borderRadius: "6px",
                          border: "1px solid var(--ds-accent-border)",
                          backgroundColor: "var(--ds-accent-bg)",
                          color: "var(--ds-accent)",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {isExpanded ? "Thu gọn ví dụ ▴" : `Xem thêm ${examples.length - 4} ví dụ ▾`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Narrative Explanatory Bullets */}
      {narrativeBullets.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {narrativeBullets.map((b, bIdx) => (
            <li
              key={bIdx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.65rem",
                backgroundColor: "var(--ds-card-subtle)",
                padding: "0.65rem 0.9rem",
                borderRadius: "8px",
                border: "1px solid var(--ds-border)",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "999px",
                  backgroundColor: "var(--ds-accent)",
                  marginTop: "0.52rem",
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: "0.91rem", color: "var(--ds-text-secondary)", lineHeight: 1.65, width: "100%" }}>
                <AcademicRichText text={b} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 5. Structured Academic Tables */}
      {tables.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>
          {tables.map((tbl, tIdx) => (
            <div key={tIdx} style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid var(--ds-border)" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  backgroundColor: "var(--ds-card)",
                  fontSize: "0.87rem",
                }}
              >
                {tbl.headers && tbl.headers.some((h) => h) && (
                  <thead>
                    <tr style={{ backgroundColor: "var(--ds-bg-elevated)" }}>
                      {tbl.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          style={{
                            padding: "0.7rem 0.95rem",
                            borderBottom: "1px solid var(--ds-border)",
                            borderRight: hIdx < tbl.headers.length - 1 ? "1px solid var(--ds-border-subtle)" : "none",
                            color: "var(--ds-accent)",
                            fontWeight: 800,
                            textAlign: "left",
                            fontFamily: "var(--font-sans)",
                            fontSize: "0.78rem",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}
                        >
                          <AcademicRichText text={h} multiline={false} />
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
                        backgroundColor: rIdx % 2 === 0 ? "var(--ds-card)" : "var(--ds-card-subtle)",
                      }}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            padding: "0.65rem 0.95rem",
                            borderBottom: rIdx < tbl.rows.length - 1 ? "1px solid var(--ds-border-subtle)" : "none",
                            borderRight: cIdx < row.length - 1 ? "1px solid var(--ds-border-subtle)" : "none",
                            color: cIdx === 0 ? "var(--ds-text)" : "var(--ds-text-secondary)",
                            fontWeight: cIdx === 0 ? 600 : 400,
                            lineHeight: 1.55,
                            verticalAlign: "top",
                          }}
                        >
                          <AcademicRichText text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* 6. Consolidated Section Examples (2-column compact academic grid) */}
      {bulletExamples.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--ds-card-subtle)",
            border: "1px solid var(--ds-border)",
            borderRadius: "10px",
            padding: "0.85rem 1rem",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 800,
              color: "var(--ds-accent)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "0.6rem",
            }}
          >
            💬 VÍ DỤ MINH HỌA ({bulletExamples.length})
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "0.55rem",
            }}
          >
            {visibleBulletExamples.map((exText, idx) => {
              const audioText = exText.replace(/\[.*?\]|\(.*?\)/g, "").replace(/\*/g, "").trim();
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "var(--ds-card)",
                    border: "1px solid var(--ds-border-subtle)",
                    borderLeft: "3px solid var(--ds-accent)",
                    borderRadius: "6px",
                    padding: "0.5rem 0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.6rem",
                  }}
                >
                  <span style={{ fontSize: "0.89rem", fontWeight: 500, color: "var(--ds-text)", lineHeight: 1.5 }}>
                    <AcademicRichText text={exText} />
                  </span>
                  {audioText && (
                    <button
                      type="button"
                      onClick={() => playWordAudio(audioText, null)}
                      title="Nghe phát âm mẫu"
                      className="ds-focusable"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        backgroundColor: "var(--ds-accent-bg)",
                        border: "1px solid var(--ds-accent-border)",
                        color: "var(--ds-accent)",
                        borderRadius: "5px",
                        padding: "0.2rem 0.5rem",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <KitIcon name="tool-audio" size={12} />
                      <span>Nghe</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {bulletExamples.length > 4 && (
            <button
              type="button"
              onClick={() =>
                setExpandedRulesMap((prev) => ({
                  ...prev,
                  [secExamplesKey]: !prev[secExamplesKey],
                }))
              }
              className="ds-focusable"
              style={{
                marginTop: "0.65rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--ds-accent-border)",
                backgroundColor: "var(--ds-card)",
                color: "var(--ds-accent)",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isSecExExpanded ? "Thu gọn ví dụ ▴" : `Xem thêm ${bulletExamples.length - 4} ví dụ ▾`}
            </button>
          )}
        </div>
      )}

      {/* 7. Notes & Exam Pitfalls */}
      {notes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {notes.map((n, nIdx) => (
            <div
              key={nIdx}
              style={{
                backgroundColor: "var(--ds-warning-bg)",
                border: "1px solid var(--ds-warning-border)",
                borderLeft: "4px solid var(--ds-warning)",
                borderRadius: "8px",
                padding: "0.8rem 1.05rem",
                boxShadow: isLight ? "var(--ds-shadow-sm)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "1rem" }}>⚠️</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "var(--ds-warning)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  LƯU Ý QUAN TRỌNG &amp; BẪY THI CỬ
                </span>
              </div>
              <div style={{ fontSize: "0.9rem", color: "var(--ds-text)", lineHeight: 1.62 }}>
                <AcademicRichText text={n} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
