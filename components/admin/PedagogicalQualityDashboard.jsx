import React, { useState, useEffect, useCallback } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { DIFFICULTY_LEVELS, validateExplanation } from "../../lib/explanation/explanation.schema";

/**
 * Milestone 2.5.8 & 2.5.12: Pedagogical Quality & Explanation Governance Dashboard
 * - Inspect student feedback & flagged error reports grouped by question
 * - Batch ingest all 2,939 structured explanations into Supabase in 1 click
 * - Edit 5-field JSON explanations with schema validation and publish incremented versions
 */
export default function PedagogicalQualityDashboard({ authHeaders = {}, isLight = false }) {
  const [summary, setSummary] = useState(null);
  const [questionGroups, setQuestionGroups] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'flagged' | 'critical'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ingestBanner, setIngestBanner] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);

  // Selected question for live JSON editor
  const [manualQid, setManualQid] = useState("");
  const [editorLoading, setEditorLoading] = useState(false);
  const [editingQid, setEditingQid] = useState("");
  const [editingMeta, setEditingMeta] = useState(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [saveMessage, setSaveMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const T = getThemeTokens(isLight);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const minReports = filterMode === "critical" ? 3 : filterMode === "flagged" ? 1 : 0;
      const res = await fetch(`/api/admin/explanations/feedback-summary?minReports=${minReports}`, {
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setSummary(json.summary || null);
      setQuestionGroups(json.questionGroups || []);
      setRecentReports(json.recentReports || []);
    } catch (e) {
      setError(e.message || "Không thể tải báo cáo chất lượng sư phạm.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, filterMode]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleBatchIngest = async () => {
    setIsIngesting(true);
    setIngestBanner(null);
    try {
      const res = await fetch("/api/admin/explanations/batch-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Batch ingest failed.");
      }
      setIngestBanner({
        ok: true,
        text: `Đã đồng bộ thành công ${json.processed} lời giải 5-field và ${json.conceptLinksProcessed} liên kết Knowledge Graph (lỗi schema: ${json.invalidSkipped}).`,
      });
      fetchSummary();
    } catch (e) {
      setIngestBanner({ ok: false, text: e.message });
    } finally {
      setIsIngesting(false);
    }
  };

  const openEditorForQuestion = async (qid) => {
    const cleanId = (qid || "").trim();
    if (!cleanId) return;
    setEditorLoading(true);
    setSaveMessage(null);
    setEditingQid(cleanId);
    try {
      const res = await fetch(`/api/admin/explanations/${encodeURIComponent(cleanId)}`, {
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không tìm thấy câu hỏi.");
      }
      setEditingMeta({ question: json.question, conceptId: json.conceptId, source: json.source });
      const expl = json.explanation;
      const editablePayload = {
        question_id: expl.question_id || cleanId,
        topic_id: expl.topic_id || json.question?.topic_id || "general",
        difficulty: expl.difficulty || DIFFICULTY_LEVELS.INTERMEDIATE,
        signal: expl.signal,
        rule: expl.rule,
        translation: expl.translation,
        common_mistakes: expl.common_mistakes,
        exam_tips: expl.exam_tips,
      };
      setJsonDraft(JSON.stringify(editablePayload, null, 2));
    } catch (e) {
      setSaveMessage({ ok: false, text: e.message });
    } finally {
      setEditorLoading(false);
    }
  };

  const handlePublishEditedExplanation = async () => {
    setSaveMessage(null);
    let parsed;
    try {
      parsed = JSON.parse(jsonDraft);
    } catch (e) {
      setSaveMessage({ ok: false, text: `JSON không hợp lệ: ${e.message}` });
      return;
    }

    const validation = validateExplanation(parsed);
    if (!validation.isValid) {
      setSaveMessage({ ok: false, text: `Vi phạm 5-field contract: ${validation.errors.join(" | ")}` });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/explanations/${encodeURIComponent(editingQid)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(parsed),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể lưu phiên bản mới.");
      }
      setSaveMessage({
        ok: true,
        text: `Đã xuất bản lời giải chuẩn mới (Version v${json.version}) và ghi Audit Log bất biến!`,
      });
      fetchSummary();
    } catch (e) {
      setSaveMessage({ ok: false, text: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header & Batch Ingest */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.02rem", fontWeight: "800", color: T.textHeading }}>
            🎓 Kiểm duyệt Sư phạm & Chất lượng Lời giải (Milestone 2.5)
          </h3>
          <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.78rem", color: T.textMuted }}>
            Quản lý Feedback học viên, đồng bộ 2,939 lời giải 5-field lên PostgreSQL & phát hành bản sửa đổi theo Version.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBatchIngest}
          disabled={isIngesting}
          style={{
            backgroundColor: T.accent,
            border: "none",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "0.52rem 0.95rem",
            fontSize: "0.8rem",
            fontWeight: "700",
            cursor: isIngesting ? "wait" : "pointer",
          }}
        >
          {isIngesting ? "⏳ Đang đồng bộ 2,939 câu..." : "🚀 Đồng bộ 2,939 Lời Giải lên Supabase"}
        </button>
      </div>

      {ingestBanner && (
        <div
          style={{
            backgroundColor: ingestBanner.ok ? T.successBg : T.dangerBg,
            border: `1px solid ${ingestBanner.ok ? T.successBorder : T.dangerBorder}`,
            color: ingestBanner.ok ? T.success : T.danger,
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            fontSize: "0.82rem",
            fontWeight: "600",
          }}
        >
          {ingestBanner.text}
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: T.dangerBg,
            border: `1px solid ${T.dangerBorder}`,
            color: T.danger,
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            fontSize: "0.82rem",
            fontWeight: "600",
          }}
        >
          {error}
        </div>
      )}

      {/* KPI Strip */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem" }}>
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "10px", padding: "0.8rem" }}>
            <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: "700" }}>Lời giải DB / Tổng Ngân hàng</div>
            <div style={{ fontSize: "1.25rem", fontWeight: "800", color: T.accent, marginTop: "0.2rem" }}>
              {summary.ingestedExplanationsCount} / {summary.totalQuizQuestions}
            </div>
          </div>
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "10px", padding: "0.8rem" }}>
            <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: "700" }}>Tỷ lệ Helpful</div>
            <div style={{ fontSize: "1.25rem", fontWeight: "800", color: T.success, marginTop: "0.2rem" }}>
              {summary.helpfulRatePercent}% ({summary.helpfulCount}/{summary.totalFeedback})
            </div>
          </div>
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "10px", padding: "0.8rem" }}>
            <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: "700" }}>Số Báo lỗi cần xử lý</div>
            <div style={{ fontSize: "1.25rem", fontWeight: "800", color: summary.reportErrorCount > 0 ? T.danger : T.textHeading, marginTop: "0.2rem" }}>
              {summary.reportErrorCount}
            </div>
          </div>
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "10px", padding: "0.8rem" }}>
            <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: "700" }}>Concept Mapping Graph</div>
            <div style={{ fontSize: "1.25rem", fontWeight: "800", color: T.warning, marginTop: "0.2rem" }}>
              {summary.mappedConceptsCount} links
            </div>
          </div>
        </div>
      )}

      {/* Filter + Direct Question ID Lookup */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.65rem" }}>
        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "Tất cả Feedback" },
            { id: "flagged", label: "🚩 Bị báo lỗi (≥ 1)" },
            { id: "critical", label: "🔥 Nghiêm trọng (≥ 3)" },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilterMode(btn.id)}
              style={{
                backgroundColor: filterMode === btn.id ? T.accentBg : T.bgElevated,
                border: `1px solid ${filterMode === btn.id ? T.accentBorder : T.border}`,
                color: filterMode === btn.id ? T.accent : T.textSecondary,
                borderRadius: "8px",
                padding: "0.38rem 0.72rem",
                fontSize: "0.76rem",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            openEditorForQuestion(manualQid);
          }}
          style={{ display: "flex", gap: "0.4rem" }}
        >
          <input
            type="text"
            value={manualQid}
            onChange={(e) => setManualQid(e.target.value)}
            placeholder="Nhập Question UUID để sửa trực tiếp..."
            style={{
              backgroundColor: T.inputBg,
              border: `1px solid ${T.inputBorder}`,
              borderRadius: "8px",
              padding: "0.38rem 0.65rem",
              fontSize: "0.76rem",
              color: T.text,
              minWidth: "235px",
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: T.bgElevated,
              border: `1px solid ${T.border}`,
              color: T.textHeading,
              borderRadius: "8px",
              padding: "0.38rem 0.72rem",
              fontSize: "0.76rem",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Mở Editor
          </button>
        </form>
      </div>

      {/* Main Split: Question Feedback List & Editor */}
      <div style={{ display: "grid", gridTemplateColumns: editingQid ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr", gap: "1rem" }}>
        <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "12px", padding: "0.9rem", overflowX: "auto" }}>
          <h4 style={{ margin: "0 0 0.65rem 0", fontSize: "0.86rem", fontWeight: "800", color: T.textHeading }}>
            Danh sách Câu hỏi theo Phản hồi ({questionGroups.length})
          </h4>
          {loading ? (
            <div style={{ fontSize: "0.82rem", color: T.textMuted, padding: "1rem 0" }}>Đang tải dữ liệu...</div>
          ) : questionGroups.length === 0 ? (
            <div style={{ fontSize: "0.82rem", color: T.textMuted, padding: "1rem 0" }}>
              Chưa có phản hồi lỗi nào khớp bộ lọc. Bạn có thể dán trực tiếp Question UUID ở ô phía trên để kiểm tra hoặc chỉnh sửa bất kỳ câu hỏi nào.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `1px solid ${T.border}`, color: T.textMuted }}>
                  <th style={{ padding: "0.45rem" }}>Câu hỏi / Chuyên đề</th>
                  <th style={{ padding: "0.45rem" }}>Helpful / Lỗi</th>
                  <th style={{ padding: "0.45rem" }}>Ghi chú gần nhất</th>
                  <th style={{ padding: "0.45rem" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {questionGroups.map((g) => (
                  <tr key={g.question_id} style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                    <td style={{ padding: "0.5rem 0.45rem", maxWidth: "280px" }}>
                      <div style={{ fontWeight: "700", color: T.text }}>{g.stem_preview}</div>
                      <div style={{ fontSize: "0.7rem", color: T.textMuted, marginTop: "0.15rem" }}>
                        {g.topic_name} {g.concept_id ? `• ${g.concept_id}` : ""}
                      </div>
                    </td>
                    <td style={{ padding: "0.5rem 0.45rem", whiteSpace: "nowrap" }}>
                      <span style={{ color: T.success, fontWeight: "700" }}>👍 {g.helpfulCount}</span>
                      {" / "}
                      <span style={{ color: g.reportCount > 0 ? T.danger : T.textMuted, fontWeight: "800" }}>🚩 {g.reportCount}</span>
                    </td>
                    <td style={{ padding: "0.5rem 0.45rem", color: T.textSecondary, maxWidth: "200px" }}>
                      {g.latestComment || "—"}
                    </td>
                    <td style={{ padding: "0.5rem 0.45rem" }}>
                      <button
                        type="button"
                        onClick={() => openEditorForQuestion(g.question_id)}
                        style={{
                          backgroundColor: T.accentBg,
                          border: `1px solid ${T.accentBorder}`,
                          color: T.accent,
                          borderRadius: "6px",
                          padding: "0.28rem 0.55rem",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        Sửa JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {recentReports.length > 0 && (
            <div style={{ marginTop: "1rem", borderTop: `1px solid ${T.borderSubtle}`, paddingTop: "0.75rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "800", color: T.textMuted, marginBottom: "0.4rem" }}>
                Báo cáo Lỗi gần đây
              </div>
              {recentReports.slice(0, 5).map((r) => (
                <div key={r.id} style={{ fontSize: "0.74rem", color: T.textSecondary, padding: "0.25rem 0" }}>
                  <span style={{ color: T.danger, fontWeight: "700" }}>[{r.error_category}]</span>{" "}
                  {r.stem_preview} {r.comment ? `— "${r.comment}"` : ""}
                </div>
              ))}
            </div>
          )}
        </div>

        {editingQid && (
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.accentBorder}`, borderRadius: "12px", padding: "0.95rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <div>
                <div style={{ fontSize: "0.86rem", fontWeight: "800", color: T.textHeading }}>
                  ✏️ Trình biên tập 5-Field Pedagogical JSON
                </div>
                <div style={{ fontSize: "0.72rem", color: T.textMuted }}>
                  ID: <code>{editingQid}</code> {editingMeta?.conceptId ? `• Concept: ${editingMeta.conceptId}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingQid("")}
                style={{
                  backgroundColor: T.bgElevated,
                  border: `1px solid ${T.border}`,
                  color: T.textSecondary,
                  borderRadius: "6px",
                  padding: "0.25rem 0.55rem",
                  fontSize: "0.74rem",
                  cursor: "pointer",
                }}
              >
                Đóng
              </button>
            </div>

            {editingMeta?.question && (
              <div
                style={{
                  backgroundColor: T.bgElevated,
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: "8px",
                  padding: "0.55rem 0.7rem",
                  fontSize: "0.76rem",
                  color: T.text,
                  marginBottom: "0.65rem",
                }}
              >
                <strong>Đề bài:</strong> {editingMeta.question.stem}
              </div>
            )}

            {editorLoading ? (
              <div style={{ fontSize: "0.8rem", color: T.textMuted, padding: "1rem 0" }}>Đang tải JSON...</div>
            ) : (
              <>
                <textarea
                  value={jsonDraft}
                  onChange={(e) => setJsonDraft(e.target.value)}
                  rows={16}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: T.codeBg,
                    border: `1px solid ${T.inputBorder}`,
                    borderRadius: "8px",
                    padding: "0.65rem",
                    color: T.text,
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    lineHeight: 1.45,
                  }}
                />
                {saveMessage && (
                  <div
                    style={{
                      marginTop: "0.55rem",
                      backgroundColor: saveMessage.ok ? T.successBg : T.dangerBg,
                      border: `1px solid ${saveMessage.ok ? T.successBorder : T.dangerBorder}`,
                      color: saveMessage.ok ? T.success : T.danger,
                      borderRadius: "8px",
                      padding: "0.5rem 0.7rem",
                      fontSize: "0.76rem",
                      fontWeight: "600",
                    }}
                  >
                    {saveMessage.text}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.65rem" }}>
                  <button
                    type="button"
                    onClick={handlePublishEditedExplanation}
                    disabled={isSaving}
                    style={{
                      backgroundColor: T.success,
                      border: "none",
                      color: "#ffffff",
                      borderRadius: "8px",
                      padding: "0.5rem 0.95rem",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      cursor: isSaving ? "wait" : "pointer",
                    }}
                  >
                    {isSaving ? "Đang xuất bản..." : "💾 Xuất bản Phiên bản Mới"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
