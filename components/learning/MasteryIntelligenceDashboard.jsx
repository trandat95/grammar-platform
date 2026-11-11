import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { Badge, Button, Alert, Progress, Skeleton } from "../design-system";

/**
 * Computes polygon vertices for SVG 12-axis Mastery Radar Chart
 */
function buildRadarPoints(values = [], radius = 92, cx = 135, cy = 125) {
  const n = Math.max(3, values.length);
  return values
    .map((val, idx) => {
      const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
      const r = (Math.max(8, Math.min(100, Number(val || 0))) / 100) * radius;
      return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
    })
    .join(" ");
}

/**
 * Milestone 2.9.2, 2.9.5, 2.9.6 & 2.9.7:
 * Continuous Adaptive Learning & 12-Topic Mastery Intelligence Dashboard
 */
export default function MasteryIntelligenceDashboard({
  userId = null,
  authToken = null,
  userTracker = {},
  isLight = false,
  onStartAdaptivePractice,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const T = getThemeTokens(isLight);

  const loadMasteryIntelligence = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const url = userId ? `/api/learning/mastery?user_id=${encodeURIComponent(userId)}` : "/api/learning/mastery";
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      }
    } catch (err) {
      console.warn("Mastery intelligence load warning:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, authToken]);

  useEffect(() => {
    loadMasteryIntelligence();
  }, [loadMasteryIntelligence]);

  // 14-Day Activity Heatmap from userTracker.activeDays
  const heatmapDays = useMemo(() => {
    const activeSet = new Set(userTracker?.activeDays || []);
    const list = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      list.push({ date: iso, dayNum: d.getDate(), active: activeSet.has(iso) });
    }
    return list;
  }, [userTracker?.activeDays]);

  if (loading) {
    return (
      <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "1.2rem" }}>
        <Skeleton height="22px" width="260px" style={{ marginBottom: "0.75rem" }} />
        <Skeleton height="140px" width="100%" />
      </div>
    );
  }

  if (!data) return null;

  const {
    twelveTopicMastery = [],
    forgettingCurve = {},
    personalRecommendations = [],
    analyticsIntelligence = {},
    dailyReview = {},
  } = data;

  const checkpoints = forgettingCurve.checkpoints || [];
  const curvePolyline = checkpoints
    .map((cp, idx) => {
      const x = 28 + idx * 58;
      const val = cp.observedRetention !== null ? cp.observedRetention : cp.predictedRetention;
      const y = 108 - (Math.max(20, Math.min(100, val)) / 100) * 86;
      return `${x},${y.toFixed(1)}`;
    })
    .join(" ");

  const radarValues = twelveTopicMastery.map((t) => t.mastery_score);
  const stateBreakdown = dailyReview.stateBreakdown || {};

  return (
    <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "1.25rem", boxShadow: T.shadow }}>
      {/* Header & Adaptive Launch Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.85rem", marginBottom: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "1.1rem" }} aria-hidden="true">📡</span>
            <h3 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 800, color: T.textHeading }}>
              Phân tích Thành thạo 12 Chuyên đề &amp; Đường cong Quên lãng (Milestone 2.9)
            </h3>
            <Badge tone="accent" isLight={isLight}>
              6-Factor Anti-Gaming
            </Badge>
          </div>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: T.textMuted }}>
            Kết hợp Accuracy, Consistency, Retention, Difficulty, Recency &amp; Topic Coverage để phân biệt hiểu bản chất với học vẹt.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button variant="secondary" size="sm" isLight={isLight} onClick={loadMasteryIntelligence}>
            ↻ Làm mới
          </Button>
          {onStartAdaptivePractice && (
            <Button
              variant="primary"
              size="sm"
              isLight={isLight}
              onClick={() => onStartAdaptivePractice({ mode: "adaptive", count: 20 })}
            >
              🎯 Luyện Đề Thích Ứng (50/30/20)
            </Button>
          )}
        </div>
      </div>

      {/* Personalized Actionable Recommendation */}
      {personalRecommendations.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem", marginBottom: "1.15rem" }}>
          {personalRecommendations.slice(0, 2).map((rec) => (
            <Alert
              key={rec.id}
              tone={rec.priority === "HIGH" ? "warning" : "info"}
              title={rec.title}
              isLight={isLight}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: T.textSecondary }}>{rec.description}</span>
                {onStartAdaptivePractice && (
                  <Button
                    variant="secondary"
                    size="sm"
                    isLight={isLight}
                    onClick={() =>
                      onStartAdaptivePractice({
                        mode: rec.chapter_number ? "manual_review" : "adaptive",
                        topicId: rec.chapter_number,
                        count: 15,
                      })
                    }
                  >
                    {rec.ctaLabel} ➔
                  </Button>
                )}
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.7rem", marginBottom: "1.15rem" }}>
        <div style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "10px", padding: "0.75rem" }}>
          <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: 700 }}>Mastery Trung bình</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: T.accent }}>{analyticsIntelligence.overallMastery ?? 0}%</div>
        </div>
        <div style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "10px", padding: "0.75rem" }}>
          <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: 700 }}>Short-term Learning</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: T.textHeading }}>{forgettingCurve.shortTermLearning ?? 0}%</div>
        </div>
        <div style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "10px", padding: "0.75rem" }}>
          <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: 700 }}>Long-term Retention (≥14d)</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: T.success }}>{forgettingCurve.longTermRetention ?? 0}%</div>
        </div>
        <div style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "10px", padding: "0.75rem" }}>
          <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: 700 }}>Consistency / Velocity (7d)</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: T.warning }}>
            {forgettingCurve.consistencyIndex ?? 0}% • {analyticsIntelligence.learningVelocity7d ?? 0} câu
          </div>
        </div>
      </div>

      {/* Main Split: 12-Topic Radar + Chapter Bars | Forgetting Curve + Memory States + Heatmap */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1rem" }}>
        {/* Left: 12-Topic Radar & Bars */}
        <div style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "12px", padding: "0.95rem" }}>
          <div style={{ fontSize: "0.84rem", fontWeight: 800, color: T.textHeading, marginBottom: "0.6rem" }}>
            🎯 Bản đồ Radar 12 Chuyên đề
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.65rem" }}>
            <svg
              width="270"
              height="245"
              viewBox="0 0 270 245"
              role="img"
              aria-label="Biểu đồ Radar mức độ thành thạo 12 chuyên đề ngữ pháp"
            >
              {[25, 50, 75, 100].map((ring) => (
                <polygon
                  key={ring}
                  points={buildRadarPoints(new Array(12).fill(ring))}
                  fill="none"
                  stroke={T.border}
                  strokeWidth="1"
                  strokeDasharray={ring === 100 ? "none" : "3,3"}
                />
              ))}
              {twelveTopicMastery.map((ch, idx) => {
                const angle = (Math.PI * 2 * idx) / 12 - Math.PI / 2;
                const x2 = 135 + 110 * Math.cos(angle);
                const y2 = 125 + 110 * Math.sin(angle);
                return (
                  <text
                    key={ch.chapter_number}
                    x={x2}
                    y={y2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={T.textMuted}
                    fontSize="10"
                    fontWeight="700"
                  >
                    C{ch.chapter_number}
                  </text>
                );
              })}
              {radarValues.length >= 3 && (
                <polygon
                  points={buildRadarPoints(radarValues)}
                  fill={T.accentBg}
                  stroke={T.accent}
                  strokeWidth="2"
                />
              )}
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", maxHeight: "230px", overflowY: "auto" }}>
            {twelveTopicMastery.map((ch) => (
              <div key={ch.chapter_number} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: T.text }}>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <strong>Ch.{ch.chapter_number}:</strong> {ch.chapter_title_vi}
                    </span>
                    <span style={{ fontWeight: 700, color: ch.mastery_score >= 75 ? T.success : ch.mastery_score >= 40 ? T.warning : T.textMuted }}>
                      {ch.mastery_score}% ({ch.tier})
                    </span>
                  </div>
                  <Progress
                    value={ch.mastery_score}
                    tone={ch.mastery_score >= 75 ? "success" : ch.mastery_score >= 40 ? "warning" : "accent"}
                    isLight={isLight}
                    height={5}
                  />
                </div>
                {onStartAdaptivePractice && (
                  <Button
                    variant="secondary"
                    size="sm"
                    isLight={isLight}
                    onClick={() => onStartAdaptivePractice({ mode: "manual_review", topicId: ch.chapter_number, count: 15 })}
                    style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", minHeight: "26px" }}
                  >
                    Ôn tập
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Forgetting Curve, 5-State Memory Breakdown & 14-Day Heatmap */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "12px", padding: "0.95rem" }}>
            <div style={{ fontSize: "0.84rem", fontWeight: 800, color: T.textHeading, marginBottom: "0.5rem" }}>
              📉 Đường cong Quên lãng (1 → 3 → 7 → 14 → 30 ngày)
            </div>
            <svg width="100%" viewBox="0 0 295 130" role="img" aria-label="Biểu đồ đường cong quên lãng 5 mốc thời gian">
              <line x1="25" y1="22" x2="25" y2="108" stroke={T.border} strokeWidth="1" />
              <line x1="25" y1="108" x2="275" y2="108" stroke={T.border} strokeWidth="1" />
              {curvePolyline && (
                <polyline fill="none" stroke={T.success} strokeWidth="2.5" points={curvePolyline} />
              )}
              {checkpoints.map((cp, idx) => {
                const x = 28 + idx * 58;
                const val = cp.observedRetention !== null ? cp.observedRetention : cp.predictedRetention;
                const y = 108 - (Math.max(20, Math.min(100, val)) / 100) * 86;
                return (
                  <g key={cp.day}>
                    <circle cx={x} cy={y} r="4" fill={T.accent} />
                    <text x={x} y={y - 8} textAnchor="middle" fill={T.text} fontSize="9.5" fontWeight="700">
                      {val}%
                    </text>
                    <text x={x} y="122" textAnchor="middle" fill={T.textMuted} fontSize="9.5">
                      {cp.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 5-State Memory Machine Pills */}
          <div style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "12px", padding: "0.9rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: T.textHeading, marginBottom: "0.55rem" }}>
              🧩 Trạng thái Ghi nhớ Câu hỏi (5-State Memory Machine)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {[
                { key: "Learning", tone: "warning" },
                { key: "Review", tone: "accent" },
                { key: "Relearning", tone: "danger" },
                { key: "Mastered", tone: "success" },
              ].map((st) => (
                <Badge key={st.key} tone={st.tone} isLight={isLight}>
                  {st.key}: {stateBreakdown[st.key] || 0}
                </Badge>
              ))}
            </div>
          </div>

          {/* 14-Day Activity Heatmap */}
          <div style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "12px", padding: "0.9rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: T.textHeading, marginBottom: "0.55rem" }}>
              🔥 Bản đồ Hoạt động 14 Ngày (Activity Heatmap)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: "4px" }}>
              {heatmapDays.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.active ? "Có học tập" : "Chưa hoạt động"}`}
                  style={{
                    height: "24px",
                    borderRadius: "4px",
                    backgroundColor: d.active ? T.success : T.card,
                    border: `1px solid ${d.active ? T.successBorder : T.borderSubtle}`,
                    color: d.active ? "#ffffff" : T.textMuted,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {d.dayNum}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
