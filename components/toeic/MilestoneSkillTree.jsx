import React from 'react';

/**
 * MilestoneSkillTree Component (Milestone E3 & Section 5.4)
 * Renders the 7-Milestone Skill Tree with personal weakness injection,
 * drill progress counters, and Boss Gate evaluation checkpoints.
 * Strict Design Token Discipline: var(--ds-*).
 */
export default function MilestoneSkillTree({
  milestones = [],
  onStartDrill,
  onStartBossGate
}) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="rounded-2xl p-8 border text-center"
           style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}>
        <p className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
          Chưa có dữ liệu lộ trình. Hãy hoàn thành bài kiểm tra chẩn đoán đầu vào để AI khởi tạo lộ trình cá nhân hóa!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
            Lộ Trình Vượt Trạm 7 Milestones Cá Nhân Hóa
          </h2>
          <p className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
            Hệ thống tự động tinh chỉnh theo điểm yếu thực tế và miễn học các trạm bạn đã nắm vững
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--ds-success)' }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--ds-success)' }} />
            Đã hoàn thành
          </span>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--ds-primary)' }}>
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--ds-primary)' }} />
            Đang học
          </span>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--ds-text-muted)' }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--ds-border)' }} />
            Chưa mở khóa
          </span>
        </div>
      </div>

      {/* 7 STATIONS TIMELINE / TREE */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-[var(--ds-border)]">
        {milestones.map((ms, index) => {
          const isCompleted = ms.status === 'COMPLETED';
          const isInProgress = ms.status === 'IN_PROGRESS';
          const isLocked = ms.status === 'LOCKED';

          const injectedTopics = ms.injected_weak_topic_ids_json || [];
          const focusTopics = ms.focus_topic_ids || [];
          const progressPct = Math.min(100, Math.round(((ms.completed_drill_questions || 0) / (ms.required_drill_questions || 48)) * 100));

          return (
            <div key={ms.milestone_id || index} className="relative group">
              {/* NODE ICON / BULLET */}
              <div
                className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shadow-sm ${
                  isInProgress ? 'ring-4 ring-[var(--ds-primary-subtle)]' : ''
                }`}
                style={{
                  backgroundColor: isCompleted
                    ? 'var(--ds-success)'
                    : isInProgress
                    ? 'var(--ds-primary)'
                    : 'var(--ds-surface)',
                  borderColor: isCompleted
                    ? 'var(--ds-success)'
                    : isInProgress
                    ? 'var(--ds-primary)'
                    : 'var(--ds-border)',
                  color: isCompleted || isInProgress ? 'var(--ds-surface)' : 'var(--ds-text-muted)'
                }}
              >
                {isCompleted ? '✓' : ms.milestone_order || index + 1}
              </div>

              {/* CARD CONTAINER */}
              <div
                className={`rounded-2xl p-5 sm:p-6 border transition-all ${
                  isInProgress ? 'shadow-md border-[var(--ds-primary)]' : 'shadow-sm'
                }`}
                style={{
                  backgroundColor: 'var(--ds-surface)',
                  borderColor: isInProgress ? 'var(--ds-primary)' : 'var(--ds-border)',
                  opacity: isLocked ? 0.75 : 1.0
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: isCompleted
                                ? 'var(--ds-success-subtle)'
                                : isInProgress
                                ? 'var(--ds-primary-subtle)'
                                : 'var(--ds-surface-secondary)',
                              color: isCompleted
                                ? 'var(--ds-success)'
                                : isInProgress
                                ? 'var(--ds-primary)'
                                : 'var(--ds-text-muted)'
                            }}>
                        {isCompleted ? 'Trạm Đã Đạt' : isInProgress ? 'Trạm Hiện Tại' : 'Chưa Mở Khóa'}
                      </span>

                      <span className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--ds-surface-secondary)', color: 'var(--ds-text-secondary)' }}>
                        Mục tiêu Band {ms.target_band_score}+
                      </span>
                    </div>

                    <h3 className="text-lg font-bold" style={{ color: 'var(--ds-text-primary)' }}>
                      Trạm {ms.milestone_order || index + 1}: {ms.title_vi}
                    </h3>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    {isInProgress && (
                      <button
                        type="button"
                        onClick={() => onStartDrill && onStartDrill(ms)}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:opacity-90 active:scale-95"
                        style={{
                          backgroundColor: 'var(--ds-primary)',
                          color: 'var(--ds-surface)'
                        }}
                      >
                        ⚡ Luyện Trạm Này
                      </button>
                    )}

                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => onStartBossGate && onStartBossGate(ms)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:bg-[var(--ds-surface-secondary)] active:scale-95 flex items-center gap-1.5"
                        style={{
                          borderColor: 'var(--ds-border)',
                          color: 'var(--ds-text-primary)'
                        }}
                      >
                        <span>🏆 Thi Vượt Trạm Boss Gate</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* TOPICS & WEAKNESS INJECTION TAGS */}
                <div className="mt-4 pt-3 border-t space-y-2" style={{ borderColor: 'var(--ds-border)' }}>
                  <div className="text-xs font-medium" style={{ color: 'var(--ds-text-muted)' }}>
                    Chủ điểm trọng tâm của trạm:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {focusTopics.map((tid, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg border font-mono font-medium"
                        style={{
                          backgroundColor: 'var(--ds-surface-secondary)',
                          borderColor: 'var(--ds-border)',
                          color: 'var(--ds-text-primary)'
                        }}
                      >
                        {tid}
                      </span>
                    ))}

                    {/* Injected Weak Topics Badges */}
                    {injectedTopics.map((wid, i) => (
                      <span
                        key={`inj_${i}`}
                        className="text-xs px-2.5 py-1 rounded-lg border font-mono font-bold flex items-center gap-1"
                        style={{
                          backgroundColor: 'var(--ds-danger-subtle)',
                          borderColor: 'var(--ds-danger)',
                          color: 'var(--ds-danger)'
                        }}
                      >
                        <span>🎯 Điểm yếu bổ trợ: {wid}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* PROGRESS BAR & CRITERIA */}
                <div className="mt-4 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                     style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-secondary)' }}>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span>Tiến độ luyện tập:</span>
                    <div className="w-28 sm:w-36 h-2 rounded-full overflow-hidden"
                         style={{ backgroundColor: 'var(--ds-surface-secondary)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: isCompleted ? 'var(--ds-success)' : 'var(--ds-primary)'
                        }}
                      />
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                      {ms.completed_drill_questions || 0} / {ms.required_drill_questions || 48} câu
                    </span>
                  </div>

                  {ms.boss_gate_criteria && (
                    <div className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
                      Boss Gate: {ms.boss_gate_criteria.question_count} câu • Tối đa {Math.round(ms.boss_gate_criteria.max_time_sec / 60)} phút • Độ chính xác ≥ {ms.boss_gate_criteria.min_accuracy_pct}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
