import React, { useState } from 'react';
import { PAYWALL_TRIGGERS, recordPaywallImpression } from '../../../lib/toeic/subscription/paywall-trigger-manager';
import { ToeicBadge } from '../ui';

/**
 * ToeicSmartPaywallModal Component (Milestone E7.7)
 * EdTech Bento Grid 2026 Paywall Modal with Ethical FOMO,
 * feature comparison, and transparent pricing tiers consistent with platform VIP subscription plans.
 * Strict Design Token Discipline: var(--ds-*).
 */
export default function ToeicSmartPaywallModal({
  isOpen = false,
  onClose,
  triggerId = 'TRG_01_MILESTONE_LOCKED',
  context = {}
}) {
  const [selectedPlan, setSelectedPlan] = useState('VIP_YEARLY'); // Canonical default: VIP_YEARLY (79k)

  if (!isOpen) return null;

  const triggerInfo = PAYWALL_TRIGGERS[triggerId] || PAYWALL_TRIGGERS.TRG_01_MILESTONE_LOCKED;

  // Track impression on open
  recordPaywallImpression(triggerId);

  // Exact consistency with Supabase subscription_plans table & MonetizationHub.jsx
  const plans = [
    {
      id: 'VIP_MONTHLY',
      name: '1 Tháng',
      price: '29.000đ',
      period: '/tháng',
      subtext: 'Linh hoạt luyện thi cấp tốc',
      isPopular: false
    },
    {
      id: 'VIP_QUARTERLY',
      name: '3 Tháng',
      price: '49.000đ',
      period: '/3 tháng',
      subtext: 'Chỉ ~16k/tháng • Bứt phá',
      isPopular: false
    },
    {
      id: 'VIP_YEARLY',
      name: '1 Năm',
      price: '79.000đ',
      period: '/năm',
      subtext: 'Chỉ ~6.5k/tháng • Tiết kiệm 84%',
      isPopular: true
    },
    {
      id: 'VIP_LIFETIME',
      name: 'Trọn Đời',
      price: '109.000đ',
      period: 'thanh toán 1 lần',
      subtext: 'Sở hữu vĩnh viễn kho ETS 2026+',
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
          maxWidth: '720px',
          maxHeight: '92vh',
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
          <p style={{ fontSize: '0.9rem', color: 'var(--ds-text-secondary)', margin: '0 auto', maxWidth: '540px', lineHeight: 1.5 }}>
            {triggerInfo.teaser}
          </p>
        </div>

        {/* 4 PLAN CARDS GRID (CONSISTENT WITH PLATFORM PRICING) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
            gap: '0.65rem',
            marginBottom: '1.5rem'
          }}
        >
          {plans.map((p) => {
            const isSelected = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                style={{
                  padding: '1.25rem 0.75rem',
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
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
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
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ds-accent)', margin: '0.35rem 0 0.15rem 0' }}>
                  {p.price}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ds-text-muted)' }}>
                  {p.period}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ds-text-secondary)', marginTop: '0.5rem', lineHeight: 1.3 }}>
                  {p.subtext}
                </div>
              </div>
            );
          })}
        </div>

        {/* VALUE COMPARISON TABLE (CLEAR FREE VS VIP BOUNDARIES) */}
        <div style={{ padding: '1rem', borderRadius: '1rem', backgroundColor: 'var(--ds-bg-elevated)', border: '1px solid var(--ds-border)', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ds-text)', marginBottom: '0.75rem' }}>
            Đặc quyền VIP trọn gói so với Miễn Phí:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem' }}>
            {[
              { feat: '24 Chủ Điểm Ngữ Pháp & Kỹ Năng', free: 'Target dưới 550', vip: 'Mở trọn 24 Chủ Điểm (Band 450 - 990+)' },
              { feat: 'Phòng Nghe Chép Chính Tả ETS', free: '1 Test (Test 01)', vip: 'Trọn bộ 10 Tests (540 tracks Part 1-4)' },
              { feat: 'Kho 20 Đề Thi Chuẩn ETS 2024 & 2026', free: '2 Đề (ETS 2024 Test 01 & 02)', vip: 'Full 20 Đề (4.000 câu Part 5, 6, 7)' },
              { feat: 'Cây Lộ Trình 7 Milestones Cá Nhân Hóa', free: '2 Trạm đầu', vip: 'Mở trọn 7 Trạm' },
              { feat: 'Hỏi Đáp AI Gia Sư Sư Phạm (RAG)', free: '3 câu / ngày', vip: 'Không giới hạn 24/7' },
              { feat: 'Phân Tích Bẫy Đề & Twin Remediation', free: '1 câu tương đương', vip: 'Không giới hạn' }
            ].map((row, idx) => (
              <div key={idx} className="toeic-flex-between" style={{ padding: '0.25rem 0', borderBottom: idx < 5 ? '1px dashed var(--ds-border)' : 'none' }}>
                <span style={{ color: 'var(--ds-text)', fontWeight: 500 }}>{row.feat}</span>
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
            🛡️ Kích hoạt tức thì • Thanh toán qua SePay VietQR / Thẻ / MoMo • Không tự động gia hạn ngầm
          </p>
        </div>
      </div>
    </div>
  );
}
