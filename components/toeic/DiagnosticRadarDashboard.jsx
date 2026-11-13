import React, { useMemo } from 'react';
import { ToeicBadge, ToeicButton } from './ui';

/**
 * DiagnosticRadarDashboard Component (Milestone E3 & U3.4)
 * Displays Predicted TOEIC Score Hero, 6-Axis Capability Radar,
 * Top 3 Focus Cards (FPI sorted), and Cognitive Error Pattern Diagnostics.
 * Strict Design Token Discipline: var(--ds-*) CSS variables.
 */
export default function DiagnosticRadarDashboard({
  diagnosticResult,
  onStartTopicDrill,
  onViewRoadmap
}) {
  if (!diagnosticResult) return null;

  const {
    predictedScore = 450,
    targetScore = 650,
    radarAxes = {},
    topFocusTopics = [],
    detectedErrorPatterns = [],
    avgPart5TimeSec = 14.5,
    overallAccuracy = 60.0
  } = diagnosticResult;

  // 6 Radar Axes Configuration
  const axisConfig = [
    { key: 'G1_POS', label: 'Từ loại (POS)', angle: 0 },
    { key: 'G2_VERB', label: 'Động từ & Thì', angle: 60 },
    { key: 'G3_PRON', label: 'Đại từ', angle: 120 },
    { key: 'G4_CONN', label: 'Liên từ & Giới từ', angle: 180 },
    { key: 'G5_MOD', label: 'Bổ ngữ & Đảo ngữ', angle: 240 },
    { key: 'G6_VOC_COH', label: 'Từ vựng & Mạch văn', angle: 300 }
  ];

  // Calculate SVG Radar Points (center: 150, 150, radius: 100)
  const radarSvgData = useMemo(() => {
    const cx = 150;
    const cy = 150;
    const maxRadius = 100;

    const points = axisConfig.map(({ key, angle }) => {
      const score = Math.max(10, Math.min(100, Number(radarAxes[key]) || 35));
      const rad = (angle - 90) * (Math.PI / 180);
      const r = (score / 100) * maxRadius;
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
        score,
        key
      };
    });

    const polygonPointsStr = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const webLevels = [0.25, 0.5, 0.75, 1.0].map(level => {
      return axisConfig.map(({ angle }) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const r = level * maxRadius;
        return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`;
      }).join(' ');
    });

    return { cx, cy, maxRadius, points, polygonPointsStr, webLevels };
  }, [radarAxes]);

  const scoreProgressPct = Math.min(100, Math.max(10, Math.round((predictedScore / targetScore) * 100)));

  return (
    <div style={{ width: '100%', maxWidth: '1060px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. SCORE HERO BANNER */}
      <div
        className="toeic-card"
        style={{
          padding: '1.75rem',
          borderRadius: '1.25rem',
          backgroundColor: 'var(--ds-card)',
          borderColor: 'var(--ds-card-border)'
        }}
      >
        <div className="toeic-flex-between" style={{ flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ToeicBadge variant="primary">
                🎯 Kết Quả Đánh Giá Năng Lực AI (IRT 3PL)
              </ToeicBadge>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--ds-text)', letterSpacing: '-0.02em' }}>
              Điểm TOEIC Dự Đoán: <span style={{ color: 'var(--ds-accent)' }}>{predictedScore}</span> / 990
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--ds-text-secondary)', margin: 0 }}>
              Mục tiêu của bạn: <strong style={{ color: 'var(--ds-text)' }}>{targetScore}</strong> • Độ chính xác toàn bài: <strong>{overallAccuracy}%</strong>
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--ds-border)',
                backgroundColor: 'var(--ds-bg-elevated)',
                textAlign: 'center',
                minWidth: '110px'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>Tốc độ Part 5</div>
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  marginTop: '0.2rem',
                  color: avgPart5TimeSec <= 15 ? 'var(--ds-success)' : 'var(--ds-warning)'
                }}
              >
                {avgPart5TimeSec}s <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/câu</span>
              </div>
              <div style={{ fontSize: '0.7rem', marginTop: '0.15rem', color: 'var(--ds-text-muted)' }}>
                {avgPart5TimeSec <= 15 ? '✓ Chuẩn phản xạ' : '⚠️ Cần tăng tốc'}
              </div>
            </div>

            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--ds-border)',
                backgroundColor: 'var(--ds-bg-elevated)',
                textAlign: 'center',
                minWidth: '110px'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>Tiến độ Mục tiêu</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--ds-accent)' }}>
                {scoreProgressPct}%
              </div>
              <div style={{ fontSize: '0.7rem', marginTop: '0.15rem', color: 'var(--ds-text-muted)' }}>
                Còn {Math.max(0, targetScore - predictedScore)} điểm
              </div>
            </div>
          </div>
        </div>

        {/* Target Progress Bar */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--ds-border)' }}>
          <div className="toeic-flex-between" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ds-text-secondary)', marginBottom: '0.4rem' }}>
            <span>Nền tảng xuất phát: {predictedScore} điểm</span>
            <span>Mục tiêu: {targetScore} điểm</span>
          </div>
          <div style={{ width: '100%', height: '10px', borderRadius: '9999px', backgroundColor: 'var(--ds-bg-elevated)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${scoreProgressPct}%`,
                height: '100%',
                borderRadius: '9999px',
                backgroundColor: 'var(--ds-accent)',
                transition: 'width 0.8s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. GRID: 6-AXIS RADAR CHART & TOP 3 FOCUS CARDS */}
      <div className="toeic-bento-grid" style={{ alignItems: 'start' }}>
        {/* RADAR CHART (5 cols) */}
        <div className="toeic-col-5">
          <div className="toeic-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--ds-text)' }}>
                Bản Đồ Năng Lực 6 Trục
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', margin: 0 }}>
                Đánh giá theo % thông thạo &amp; trọng số xuất hiện trong đề thi ETS
              </p>
            </div>

            {/* SVG Radar */}
            <div style={{ width: '100%', maxWidth: '300px', aspectRatio: '1/1', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 300 300" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Web Background Lines */}
                {radarSvgData.webLevels.map((lvlPoints, i) => (
                  <polygon
                    key={i}
                    points={lvlPoints}
                    fill="none"
                    stroke="var(--ds-border)"
                    strokeWidth="1"
                    strokeDasharray={i === 3 ? 'none' : '3,3'}
                  />
                ))}

                {/* Axis Rays */}
                {axisConfig.map(({ angle }, i) => {
                  const rad = (angle - 90) * (Math.PI / 180);
                  const x2 = radarSvgData.cx + radarSvgData.maxRadius * Math.cos(rad);
                  const y2 = radarSvgData.cy + radarSvgData.maxRadius * Math.sin(rad);
                  return (
                    <line
                      key={i}
                      x1={radarSvgData.cx}
                      y1={radarSvgData.cy}
                      x2={x2}
                      y2={y2}
                      stroke="var(--ds-border)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Data Polygon */}
                <polygon
                  points={radarSvgData.polygonPointsStr}
                  fill="var(--ds-accent)"
                  fillOpacity="0.25"
                  stroke="var(--ds-accent)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {radarSvgData.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="var(--ds-accent)"
                    stroke="var(--ds-card)"
                    strokeWidth="1.5"
                  />
                ))}

                {/* Axis Labels */}
                {axisConfig.map(({ key, label, angle }, i) => {
                  const rad = (angle - 90) * (Math.PI / 180);
                  const labelRadius = radarSvgData.maxRadius + 24;
                  const lx = radarSvgData.cx + labelRadius * Math.cos(rad);
                  const ly = radarSvgData.cy + labelRadius * Math.sin(rad);
                  const score = Math.round(Number(radarAxes[key]) || 0);

                  return (
                    <g key={i}>
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontSize: '11px', fontWeight: 600 }}
                        fill="var(--ds-text)"
                      >
                        {label}
                      </text>
                      <text
                        x={lx}
                        y={ly + 13}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontSize: '10px', fontWeight: 800 }}
                        fill="var(--ds-accent)"
                      >
                        {score}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div
              className="toeic-flex-between"
              style={{
                width: '100%',
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--ds-border)',
                fontSize: '0.75rem',
                color: 'var(--ds-text-muted)'
              }}
            >
              <span>Thang đo: 0% &rarr; 100% Thông thạo</span>
              {onViewRoadmap && (
                <button
                  type="button"
                  onClick={onViewRoadmap}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontWeight: 700,
                    color: 'var(--ds-accent)',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Xem Lộ Trình 7 Trạm &rarr;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TOP 3 FOCUS CARDS (7 cols) */}
        <div className="toeic-col-7" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="toeic-flex-between" style={{ flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--ds-text)' }}>
                Top 3 Chủ Điểm Cần Focus Ngay
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', margin: 0 }}>
                Sắp xếp theo Chỉ Số Ưu Tiên Tập Trung (Focus Priority Index - FPI)
              </p>
            </div>
            <ToeicBadge variant="warning">
              ⚡ Ưu tiên cao nhất
            </ToeicBadge>
          </div>

          {topFocusTopics.map((topic, idx) => {
            const isSlow = topic.speed_status === 'SLOW_ACCURATE';

            return (
              <div
                key={topic.grammar_topic_id || idx}
                className="toeic-card"
                style={{ padding: '1.25rem' }}
              >
                <div className="toeic-flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        backgroundColor: 'var(--ds-accent-bg)',
                        color: 'var(--ds-accent)'
                      }}
                    >
                      {idx + 1}
                    </span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--ds-text)' }}>
                      {topic.topic_name_vi || topic.grammar_topic_id}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.35rem',
                        backgroundColor: 'var(--ds-bg-elevated)',
                        color: 'var(--ds-text-secondary)',
                        fontWeight: 600
                      }}
                    >
                      Band {topic.target_score_band || 500}+
                    </span>
                  </div>

                  {/* Status Tag */}
                  <div>
                    {isSlow ? (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontWeight: 700,
                          backgroundColor: 'var(--ds-warning-bg)',
                          color: 'var(--ds-warning)'
                        }}
                      >
                        ⏱️ Phản xạ chậm ({topic.avg_time_sec || 20}s)
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontWeight: 700,
                          backgroundColor: 'var(--ds-danger-bg)',
                          color: 'var(--ds-danger)'
                        }}
                      >
                        ⚠️ Cần củng cố lý thuyết
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--ds-text-muted)', marginBottom: '0.85rem' }}>
                  <span>Thông thạo: <strong style={{ color: 'var(--ds-text)' }}>{topic.mastery_score || 0}%</strong></span>
                  <span>•</span>
                  <span>Trọng số đề thi: <strong>{topic.weight_in_toeic || 2.0}%</strong></span>
                  <span>•</span>
                  <span>FPI: <strong style={{ color: 'var(--ds-accent)' }}>{topic.focus_priority_index || 0}</strong></span>
                </div>

                {/* Drill CTA Button */}
                <div
                  className="toeic-flex-between"
                  style={{
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--ds-border)',
                    fontSize: '0.8rem',
                    color: 'var(--ds-text-secondary)'
                  }}
                >
                  <span>
                    {isSlow ? 'Luyện tốc độ phản xạ qua Sentence X-Ray' : 'Khắc phục các bẫy ngữ pháp thường gặp'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onStartTopicDrill && onStartTopicDrill(topic.grammar_topic_id)}
                    className="toeic-btn toeic-btn-sm toeic-btn-primary"
                  >
                    <span>⚡ Luyện Ngay 15 Câu &rarr;</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. COGNITIVE ERROR PATTERN DIAGNOSIS PANEL */}
      {detectedErrorPatterns.length > 0 && (
        <div
          className="toeic-card"
          style={{ padding: '1.5rem' }}
        >
          <div className="toeic-flex-between" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--ds-text)' }}>
                Chẩn Đoán 15 Mẫu Lỗi Tư Duy Nhận Thức
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', margin: 0 }}>
                Các điểm nghẽn tư duy khiến bạn mất điểm trong bài thi vừa qua
              </p>
            </div>
            <ToeicBadge variant="danger">
              Phát hiện {detectedErrorPatterns.length} mẫu lỗi
            </ToeicBadge>
          </div>

          <div className="toeic-grid-2" style={{ gap: '0.75rem' }}>
            {detectedErrorPatterns.slice(0, 6).map((err, i) => (
              <div
                key={err.code || i}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--ds-border)',
                  backgroundColor: 'var(--ds-bg-elevated)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <div className="toeic-flex-between">
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '0.35rem',
                      backgroundColor: 'var(--ds-danger-bg)',
                      color: 'var(--ds-danger)'
                    }}
                  >
                    {err.code}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>
                    Mắc {err.occurrence_count} lần
                  </span>
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--ds-text)' }}>
                  {err.name_vi}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--ds-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {err.remediation_action_vi || err.description_vi}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
