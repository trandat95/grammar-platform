import React, { useState } from 'react';
import { ToeicBadge, ToeicButton } from './ui';
import useToeicEntitlement from '../../hooks/useToeicEntitlement';
import ToeicSmartPaywallModal from './premium/ToeicSmartPaywallModal';

/**
 * MilestoneSkillTree Component (Milestones E3 & E7)
 * Renders the 7-Milestone Skill Tree with personal weakness injection,
 * drill progress counters, Boss Gate evaluation checkpoints,
 * and Locked Progression with Ethical FOMO for Free users.
 * Strict Design Token Discipline: var(--ds-*).
 */
export default function MilestoneSkillTree({
  milestones = [],
  onStartDrill,
  onStartBossGate
}) {
  const {
    isVip,
    canAccessMilestone,
    isPaywallOpen,
    paywallTrigger,
    paywallContext,
    openPaywall,
    closePaywall
  } = useToeicEntitlement();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', fontWeight: 700, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ds-success)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ds-success)' }} />
            Đã hoàn thành
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ds-accent)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ds-accent)' }} />
            Đang học
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ds-warning)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ds-warning)' }} />
            VIP Premium
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

          // Entitlement check: Can this user access this milestone?
          const hasAccess = canAccessMilestone(ms.milestone_id, isCompleted);
          const isVipLocked = !hasAccess;

          const injectedTopics = ms.injected_weak_topic_ids_json || [];
          const focusTopics = ms.focus_topic_ids || [];
          const progressPct = Math.min(100, Math.round(((ms.completed_drill_questions || 0) / (ms.required_drill_questions || 48)) * 100));

          return (
            <div key={ms.milestone_id || index} style={{ position: 'relative' }}>
              {/* NODE ICON / BULLET */}
              <div
                className={`toeic-timeline-node ${
                  isCompleted ? 'completed' : isVipLocked ? 'vip-locked' : isInProgress ? 'in-progress' : ''
                }`}
                style={
                  isVipLocked
                    ? { borderColor: 'var(--ds-warning)', color: 'var(--ds-warning)' }
                    : {}
                }
              >
                {isCompleted ? '✓' : isVipLocked ? '🔒' : ms.milestone_order || index + 1}
              </div>

              {/* CARD CONTAINER */}
              <div
                className="toeic-card"
                style={{
                  padding: '1.5rem',
                  border: isVipLocked
                    ? '1.5px dashed var(--ds-warning)'
                    : isInProgress
                    ? '1.5px solid var(--ds-accent)'
                    : '1px solid var(--ds-border)',
                  boxShadow: isInProgress
                    ? 'var(--ds-shadow-md)'
                    : 'var(--ds-shadow-sm)',
                  opacity: isLocked && !isVipLocked ? 0.75 : 1.0,
                  backgroundColor: isVipLocked
                    ? 'var(--ds-surface)'
                    : 'var(--ds-card)'
                }}
              >
                <div className="toeic-flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <ToeicBadge
                        variant={
                          isCompleted
                            ? 'success'
                            : isVipLocked
                            ? 'warning'
                            : isInProgress
                            ? 'primary'
                            : 'muted'
                        }
                      >
                        {isCompleted
                          ? 'Trạm Đã Đạt'
                          : isVipLocked
                          ? '🔒 VIP Premium'
                          : isInProgress
                          ? 'Trạm Hiện Tại'
                          : 'Chưa Mở Khóa'}
                      </ToeicBadge>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--ds-radius-sm)',
                          backgroundColor: 'var(--ds-bg-elevated)',
                          color: 'var(--ds-text-secondary)',
                          border: '1px solid var(--ds-border-subtle)'
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
                    {isVipLocked ? (
                      <button
                        type="button"
                        onClick={() =>
                          openPaywall('TRG_01_MILESTONE_LOCKED', {
                            milestoneId: ms.milestone_id,
                            title: ms.title_vi
                          })
                        }
                        className="toeic-btn toeic-btn-warning"
                        style={{
                          padding: '0.45rem 1rem',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span>✨ Mở Khóa VIP Trạm Này</span>
                      </button>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                {/* TOPICS & WEAKNESS INJECTION TAGS */}
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--ds-border-subtle)' }}>
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
                          borderRadius: 'var(--ds-radius-sm)',
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
                          borderRadius: 'var(--ds-radius-sm)',
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
                    borderTop: '1px solid var(--ds-border-subtle)',
                    fontSize: '0.8rem',
                    color: 'var(--ds-text-secondary)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>Tiến độ luyện tập:</span>
                    <div style={{ width: '120px', height: '8px', borderRadius: 'var(--ds-radius-full)', backgroundColor: 'var(--ds-bg-elevated)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 'var(--ds-radius-full)',
                          width: `${progressPct}%`,
                          backgroundColor: isCompleted ? 'var(--ds-success)' : isVipLocked ? 'var(--ds-warning)' : 'var(--ds-accent)',
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

      {/* Mount Smart Paywall Modal */}
      <ToeicSmartPaywallModal
        isOpen={isPaywallOpen}
        onClose={closePaywall}
        triggerId={paywallTrigger}
        context={paywallContext}
      />
    </div>
  );
}
