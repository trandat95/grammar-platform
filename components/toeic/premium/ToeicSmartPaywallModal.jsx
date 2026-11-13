import React, { useState } from 'react';
import { PAYWALL_TRIGGERS, recordPaywallImpression } from '../../../lib/toeic/subscription/paywall-trigger-manager';
import { ToeicBadge, ToeicButton } from '../ui';

/**
 * ToeicSmartPaywallModal Component (Milestone E7.7)
 * EdTech Bento Grid 2026 Paywall Modal with Ethical FOMO,
 * feature comparison, and transparent pricing tiers.
 * Strict Design Token Discipline: var(--ds-*).
 */
export default function ToeicSmartPaywallModal({
  isOpen = false,
  onClose,
  triggerId = 'TRG_01_MILESTONE_LOCKED',
  context = {}
}) {
  const [selectedPlan, setSelectedPlan] = useState('ANNUAL'); // 'MONTHLY' | 'ANNUAL' | 'LIFETIME'

  if (!isOpen) return null;

  const triggerInfo = PAYWALL_TRIGGERS[triggerId] || PAYWALL_TRIGGERS.TRG_01_MILESTONE_LOCKED;

  // Track impression on open
  recordPaywallImpression(triggerId);

  const plans = [
    {
      id: 'MONTHLY',
      name: '1 Tháng',
      price: '199.000đ',
      period: '/tháng',
      subtext: 'Linh hoạt luyện thi cấp tốc',
      isPopular: false
    },
    {
      id: 'ANNUAL',
      name: '1 Năm (Khuyên Dùng)',
      price: '990.000đ',
      period: '/năm',
      subtext: 'Chỉ ~82k/tháng • Tiết kiệm 58%',
      isPopular: true
    },
    {
      id: 'LIFETIME',
      name: 'Trọn Đời',
      price: '1.890.000đ',
      period: 'thanh toán 1 lần',
      subtext: 'Sở hữu vĩnh viễn mọi bản cập nhật ETS 2026+',
      isPopular: false
    }
  ];

  const handleUpgradeClick = () => {
    if (typeof window !== 'undefined') {
      window.location.href = `/?view=vip&selectedPlan=${selectedPlan}&source=toeic_${triggerId}`;
    }
  };

  return (
    <div className="toeic-drawer-overlay" style={{ alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div
        className="toeic-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          borderRadius: '1.5rem',
          backgroundColor: 'var(--ds-card)',
          borderColor: 'var(--ds-card-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid var(--ds-border)',
            backgroundColor: 'var(--ds-bg-elevated)',
            color: 'var(--ds-text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.9rem'
          }}
          title="Đóng (Escape)"
        >
          ✕
        </button>

        {/* HERO HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <ToeicBadge variant="primary">
              {triggerInfo.badge}
            </ToeicBadge>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--ds-text)', letterSpacing: '-0.02em' }}>
            {triggerInfo.title}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--ds-text-secondary)', margin: '0 auto', maxWidth: '520px', lineHeight: 1.5 }}>
            {triggerInfo.teaser}
          </p>
        </div>

        {/* 3 PLAN CARDS GRID */}
        <div className="toeic-grid-3" style={{ gap: '0.75rem', marginBottom: '1.5rem' }}>
          {plans.map((p) => {
            const isSelected = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                style={{
                  padding: '1.25rem 1rem',
                  borderRadius: '1rem',
                  border: isSelected ? '2px solid var(--ds-accent)' : '1px solid var(--ds-border)',
                  backgroundColor: isSelected ? 'var(--ds-accent-bg)' : 'var(--ds-card)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.isPopular && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'var(--ds-accent)',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.6rem',
                      borderRadius: '9999px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    PHỔ BIẾN NHẤT
                  </span>
                )}

                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ds-text)' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ds-accent)', margin: '0.35rem 0 0.15rem 0' }}>
                  {p.price}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ds-text-muted)' }}>
                  {p.period}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ds-text-secondary)', marginTop: '0.5rem', lineHeight: 1.3 }}>
                  {p.subtext}
                </div>
              </div>
            );
          })}
        </div>

        {/* VALUE COMPARISON TABLE */}
        <div style={{ padding: '1rem', borderRadius: '1rem', backgroundColor: 'var(--ds-bg-elevated)', border: '1px solid var(--ds-border)', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ds-text)', marginBottom: '0.75rem' }}>
            Đặc quyền VIP trọn gói so với Miễn Phí:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
            {[
              { feat: 'Cây Lộ Trình 7 Milestones Cá Nhân Hóa', free: '2 Trạm đầu', vip: 'Mở trọn 7 Trạm' },
              { feat: 'Kho 20 Đề Thi Chuẩn ETS 2024 & 2026', free: 'Part 5 cơ bản', vip: 'Full Part 5, 6, 7 (4.000 câu)' },
              { feat: 'Hỏi Đáp AI Gia Sư Sư Phạm (RAG)', free: '3 câu / ngày', vip: 'Không giới hạn 24/7' },
              { feat: 'Phòng Nghe Chép Chính Tả ETS', free: '50 tracks', vip: '540 tracks (Part 1, 2, 3, 4)' },
              { feat: 'Phân Tích Bẫy Đề & Twin Remediation', free: '1 câu tương đương', vip: 'Không giới hạn' }
            ].map((row, idx) => (
              <div key={idx} className="toeic-flex-between" style={{ padding: '0.25rem 0', borderBottom: idx < 4 ? '1px dashed var(--ds-border)' : 'none' }}>
                <span style={{ color: 'var(--ds-text)' }}>{row.feat}</span>
                <div style={{ display: 'flex', gap: '1rem', textAlign: 'right' }}>
                  <span style={{ color: 'var(--ds-text-muted)' }}>{row.free}</span>
                  <span style={{ color: 'var(--ds-success)', fontWeight: 700 }}>✓ {row.vip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRIMARY CTA & GUARANTEE */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleUpgradeClick}
            className="toeic-btn toeic-btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 800, borderRadius: '0.85rem' }}
          >
            Nâng Cấp Gói VIP Ngay &rarr;
          </button>

          <p style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
            🛡️ Kích hoạt tức thì • Bảo mật qua VNPay / MoMo / Thẻ ngân hàng • Không tự động gia hạn ngầm
          </p>
        </div>
      </div>
    </div>
  );
}
