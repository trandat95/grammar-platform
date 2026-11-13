import React, { useMemo } from 'react';

/**
 * DiagnosticRadarDashboard Component (Milestone E3)
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
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* 1. SCORE HERO BANNER */}
      <div
        className="rounded-2xl p-6 sm:p-8 border shadow-sm transition-all"
        style={{
          backgroundColor: 'var(--ds-surface)',
          borderColor: 'var(--ds-border)'
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                 style={{ backgroundColor: 'var(--ds-primary-subtle)', color: 'var(--ds-primary)' }}>
              <span>🎯 Kết Quả Đánh Giá Năng Lực AI (IRT 3PL)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
              Điểm TOEIC Dự Đoán: <span style={{ color: 'var(--ds-primary)' }}>{predictedScore}</span> / 990
            </h2>
            <p className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
              Mục tiêu của bạn: <strong style={{ color: 'var(--ds-text-primary)' }}>{targetScore}</strong> • Độ chính xác toàn bài: <strong>{overallAccuracy}%</strong>
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl border text-center"
                 style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}>
              <div className="text-xs font-medium" style={{ color: 'var(--ds-text-muted)' }}>Tốc độ Part 5</div>
              <div className="text-xl sm:text-2xl font-bold mt-1"
                   style={{ color: avgPart5TimeSec <= 15 ? 'var(--ds-success)' : 'var(--ds-warning)' }}>
                {avgPart5TimeSec}s <span className="text-xs font-normal">/câu</span>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>
                {avgPart5TimeSec <= 15 ? '✓ Chuẩn phản xạ' : '⚠️ Cần tăng tốc'}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl border text-center"
                 style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}>
              <div className="text-xs font-medium" style={{ color: 'var(--ds-text-muted)' }}>Tiến độ Mục tiêu</div>
              <div className="text-xl sm:text-2xl font-bold mt-1" style={{ color: 'var(--ds-primary)' }}>
                {scoreProgressPct}%
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>
                Còn {Math.max(0, targetScore - predictedScore)} điểm
              </div>
            </div>
          </div>
        </div>

        {/* Target Progress Bar */}
        <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--ds-border)' }}>
          <div className="flex justify-between text-xs font-medium mb-1.5" style={{ color: 'var(--ds-text-secondary)' }}>
            <span>Nền tảng xuất phát: {predictedScore} điểm</span>
            <span>Mục tiêu: {targetScore} điểm</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ds-surface-secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${scoreProgressPct}%`,
                backgroundColor: 'var(--ds-primary)'
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. GRID: 6-AXIS RADAR CHART & TOP 3 FOCUS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* RADAR CHART (5 cols) */}
        <div
          className="lg:col-span-5 rounded-2xl p-6 border shadow-sm flex flex-col items-center"
          style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}
        >
          <div className="w-full mb-4">
            <h3 className="font-bold text-lg" style={{ color: 'var(--ds-text-primary)' }}>
              Bản Đồ Năng Lực 6 Trục
            </h3>
            <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
              Đánh giá theo % thông thạo & trọng số xuất hiện trong đề thi ETS
            </p>
          </div>

          {/* SVG Radar */}
          <div className="w-full max-w-[320px] aspect-square relative flex items-center justify-center">
            <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
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
                fill="var(--ds-primary)"
                fillOpacity="0.25"
                stroke="var(--ds-primary)"
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
                  fill="var(--ds-primary)"
                  stroke="var(--ds-surface)"
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
                      className="text-[11px] font-semibold"
                      fill="var(--ds-text-primary)"
                    >
                      {label}
                    </text>
                    <text
                      x={lx}
                      y={ly + 12}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[10px] font-bold"
                      fill="var(--ds-primary)"
                    >
                      {score}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full mt-4 pt-4 border-t flex items-center justify-between text-xs"
               style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-muted)' }}>
            <span>Thang đo: 0% → 100% Thông thạo</span>
            {onViewRoadmap && (
              <button
                type="button"
                onClick={onViewRoadmap}
                className="font-semibold underline hover:opacity-80"
                style={{ color: 'var(--ds-primary)' }}
              >
                Xem Lộ Trình 7 Trạm →
              </button>
            )}
          </div>
        </div>

        {/* TOP 3 FOCUS CARDS (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg" style={{ color: 'var(--ds-text-primary)' }}>
                Top 3 Chủ Điểm Cần Focus Ngay
              </h3>
              <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                Sắp xếp theo Chỉ Số Ưu Tiên Tập Trung (Focus Priority Index - FPI)
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: 'var(--ds-warning-subtle)', color: 'var(--ds-warning)' }}>
              ⚡ Ưu tiên cao nhất
            </span>
          </div>

          {topFocusTopics.map((topic, idx) => {
            const isSlow = topic.speed_status === 'SLOW_ACCURATE';
            const isWeak = topic.speed_status === 'WEAK' || topic.mastery_score < 50;

            return (
              <div
                key={topic.grammar_topic_id || idx}
                className="rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md"
                style={{
                  backgroundColor: 'var(--ds-surface)',
                  borderColor: 'var(--ds-border)'
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: 'var(--ds-primary-subtle)', color: 'var(--ds-primary)' }}>
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-base" style={{ color: 'var(--ds-text-primary)' }}>
                        {topic.topic_name_vi || topic.grammar_topic_id}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{ backgroundColor: 'var(--ds-surface-secondary)', color: 'var(--ds-text-secondary)' }}>
                        Band {topic.target_score_band || 500}+
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs pt-1" style={{ color: 'var(--ds-text-muted)' }}>
                      <span>Thông thạo: <strong style={{ color: 'var(--ds-text-primary)' }}>{topic.mastery_score || 0}%</strong></span>
                      <span>•</span>
                      <span>Trọng số đề thi: <strong>{topic.weight_in_toeic || 2.0}%</strong></span>
                      <span>•</span>
                      <span>FPI: <strong style={{ color: 'var(--ds-primary)' }}>{topic.focus_priority_index || 0}</strong></span>
                    </div>
                  </div>

                  {/* Status Tag */}
                  <div className="self-start sm:self-auto">
                    {isSlow ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1"
                            style={{ backgroundColor: 'var(--ds-warning-subtle)', color: 'var(--ds-warning)' }}>
                        ⏱️ Phản xạ chậm ({topic.avg_time_sec || 20}s)
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1"
                            style={{ backgroundColor: 'var(--ds-danger-subtle)', color: 'var(--ds-danger)' }}>
                        ⚠️ Cần củng cố lý thuyết
                      </span>
                    )}
                  </div>
                </div>

                {/* Drill CTA Button */}
                <div className="mt-4 pt-3 border-t flex items-center justify-between"
                     style={{ borderColor: 'var(--ds-border)' }}>
                  <span className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                    {isSlow ? 'Luyện tốc độ phản xạ qua Sentence X-Ray' : 'Khắc phục các bẫy ngữ pháp thường gặp'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onStartTopicDrill && onStartTopicDrill(topic.grammar_topic_id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95"
                    style={{
                      backgroundColor: 'var(--ds-primary)',
                      color: 'var(--ds-surface)'
                    }}
                  >
                    <span>⚡ Luyện Ngay 15 Câu</span>
                    <span>→</span>
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
          className="rounded-2xl p-6 border shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg" style={{ color: 'var(--ds-text-primary)' }}>
                Chẩn Đoán 15 Mã Lỗi Tư Duy Nhận Thức
              </h3>
              <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                Các điểm nghẽn tư duy khiến bạn mất điểm trong bài thi vừa qua
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: 'var(--ds-danger-subtle)', color: 'var(--ds-danger)' }}>
              Phát hiện {detectedErrorPatterns.length} mẫu lỗi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {detectedErrorPatterns.slice(0, 6).map((err, i) => (
              <div
                key={err.code || i}
                className="p-4 rounded-xl border space-y-1.5 transition-all hover:border-[var(--ds-primary)]"
                style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--ds-danger-subtle)', color: 'var(--ds-danger)' }}>
                    {err.code}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--ds-text-muted)' }}>
                    Mắc {err.occurrence_count} lần
                  </span>
                </div>
                <h4 className="font-semibold text-sm" style={{ color: 'var(--ds-text-primary)' }}>
                  {err.name_vi}
                </h4>
                <p className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
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
