import React from 'react';
import { ToeicBadge, ToeicButton } from './ui';

/**
 * MilestoneSkillTree Component (Milestone E3, Section 5.4 & U3.4)
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
      <div className="toeic-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ds-text-secondary)', margin: 0 }}>
          Chưa có dữ liệu lộ trình. Hãy hoàn thành bài kiểm tra chẩn đoán đầu vào để AI khởi tạo lộ trình cá nhân hóa!
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1060px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* HEADER */}
      <div className="toeic-flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'var(--ds-text)', letterSpacing: '-0.02em' }}>
            Lộ Trình Vượt Trạm 7 Milestones Cá Nhân Hóa
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--ds-text-secondary)', margin: 0 }}>
            Hệ thống tự động tinh chỉnh theo điểm yếu thực tế và miễn học các trạm bạn đã nắm vững
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ds-success)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ds-success)' }} />
            Đã hoàn thành
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ds-accent)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ds-accent)' }} />
            Đang học
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ds-text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ds-border)' }} />
            Chưa mở khóa
          </span>
        </div>
      </div>

      {/* 7 STATIONS TIMELINE / TREE */}
      <div className="toeic-timeline-wrap">
        {milestones.map((ms, index) => {
          const isCompleted = ms.status === 'COMPLETED';
          const isInProgress = ms.status === 'IN_PROGRESS';
          const isLocked = ms.status === 'LOCKED';

          const injectedTopics = ms.injected_weak_topic_ids_json || [];
          const focusTopics = ms.focus_topic_ids || [];
          const progressPct = Math.min(100, Math.round(((ms.completed_drill_questions || 0) / (ms.required_drill_questions || 48)) * 100));

          return (
            <div key={ms.milestone_id || index} style={{ position: 'relative' }}>
              {/* NODE ICON / BULLET */}
              <div className={`toeic-timeline-node ${isCompleted ? 'completed' : isInProgress ? 'in-progress' : ''}`}>
                {isCompleted ? '✓' : ms.milestone_order || index + 1}
              </div>

              {/* CARD CONTAINER */}
              <div
                className="toeic-card"
                style={{
                  padding: '1.5rem',
                  border: isInProgress ? '1.5px solid var(--ds-accent)' : '1px solid var(--ds-border)',
                  boxShadow: isInProgress ? '0 4px 16px rgba(37,99,235,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                  opacity: isLocked ? 0.75 : 1.0
                }}
              >
                <div className="toeic-flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <ToeicBadge variant={isCompleted ? 'success' : isInProgress ? 'primary' : 'muted'}>
                        {isCompleted ? 'Trạm Đã Đạt' : isInProgress ? 'Trạm Hiện Tại' : 'Chưa Mở Khóa'}
                      </ToeicBadge>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '0.35rem',
                          backgroundColor: 'var(--ds-bg-elevated)',
                          color: 'var(--ds-text-secondary)'
                        }}
                      >
                        Mục tiêu Band {ms.target_band_score}+
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--ds-text)' }}>
                      Trạm {ms.milestone_order || index + 1}: {ms.title_vi}
                    </h3>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {isInProgress && (
                      <button
                        type="button"
                        onClick={() => onStartDrill && onStartDrill(ms)}
                        className="toeic-btn toeic-btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                      >
                        ⚡ Luyện Trạm Này
                      </button>
                    )}

                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => onStartBossGate && onStartBossGate(ms)}
                        className="toeic-btn toeic-btn-secondary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                      >
                        <span>🏆 Thi Vượt Trạm Boss Gate</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* TOPICS & WEAKNESS INJECTION TAGS */}
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--ds-border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-text-muted)', marginBottom: '0.5rem' }}>
                    Chủ điểm trọng tâm của trạm:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {focusTopics.map((tid, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '0.35rem',
                          border: '1px solid var(--ds-border)',
                          backgroundColor: 'var(--ds-bg-elevated)',
                          color: 'var(--ds-text)',
                          fontFamily: 'monospace',
                          fontWeight: 600
                        }}
                      >
                        {tid}
                      </span>
                    ))}

                    {/* Injected Weak Topics Badges */}
                    {injectedTopics.map((wid, i) => (
                      <span
                        key={`inj_${i}`}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '0.35rem',
                          border: '1px solid var(--ds-danger-border)',
                          backgroundColor: 'var(--ds-danger-bg)',
                          color: 'var(--ds-danger)',
                          fontFamily: 'monospace',
                          fontWeight: 700
                        }}
                      >
                        🎯 Điểm yếu bổ trợ: {wid}
                      </span>
                    ))}
                  </div>
                </div>

                {/* PROGRESS BAR & CRITERIA */}
                <div
                  className="toeic-flex-between"
                  style={{
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--ds-border)',
                    fontSize: '0.8rem',
                    color: 'var(--ds-text-secondary)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>Tiến độ luyện tập:</span>
                    <div style={{ width: '120px', height: '8px', borderRadius: '9999px', backgroundColor: 'var(--ds-bg-elevated)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '9999px',
                          width: `${progressPct}%`,
                          backgroundColor: isCompleted ? 'var(--ds-success)' : 'var(--ds-accent)',
                          transition: 'width 0.6s ease'
                        }}
                      />
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--ds-text)' }}>
                      {ms.completed_drill_questions || 0} / {ms.required_drill_questions || 48} câu
                    </span>
                  </div>

                  {ms.boss_gate_criteria && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
                      Boss Gate: {ms.boss_gate_criteria.question_count} câu • Tối đa {Math.round(ms.boss_gate_criteria.max_time_sec / 60)} phút • Độ chính xác &ge; {ms.boss_gate_criteria.min_accuracy_pct}%
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
