import React from 'react';
import useToeicEntitlement from '../../../hooks/useToeicEntitlement';
import { ToeicCard, ToeicBadge, ToeicButton } from '../ui';
import ToeicSmartPaywallModal from './ToeicSmartPaywallModal';

/**
 * ToeicFeatureGate Component (Milestone E7.3)
 * Non-invasive Curiosity & Preview Gate.
 * Wraps restricted content with a preview teaser when user is on Free tier.
 * Strict Design Token Discipline: 100% var(--ds-*), zero raw hex.
 */
export default function ToeicFeatureGate({
  featureKey,
  milestoneId,
  title = 'Nội Dung Dành Cho Học Viên VIP',
  description = 'Nâng cấp tài khoản để mở khóa toàn bộ bài luyện chuyên sâu, AI Tutor giải thích chi tiết và phân tích bẫy tư duy.',
  previewContent = null,
  triggerId = 'TRG_01_MILESTONE_LOCKED',
  children
}) {
  const {
    isVip,
    isLoading,
    canAccessMilestone,
    checkFeature,
    isPaywallOpen,
    paywallTrigger,
    paywallContext,
    openPaywall,
    closePaywall
  } = useToeicEntitlement();

  // If loading, render children to avoid layout flash
  if (isLoading) {
    return <>{children}</>;
  }

  // Check access: milestone-based or feature-based
  let hasAccess = isVip;
  if (!hasAccess) {
    if (milestoneId) {
      hasAccess = canAccessMilestone(milestoneId, false);
    } else if (featureKey) {
      const featCheck = checkFeature(featureKey);
      hasAccess = featCheck.allowed;
    }
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Blurred Preview container */}
      <div
        style={{
          filter: 'blur(4px)',
          opacity: 0.35,
          pointerEvents: 'none',
          userSelect: 'none',
          maxHeight: '280px',
          overflow: 'hidden'
        }}
        aria-hidden="true"
      >
        {previewContent || children}
      </div>

      {/* Floating Teaser Overlay Card */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 10
        }}
      >
        <ToeicCard
          style={{
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: 'var(--ds-shadow-lg)',
            border: '1px solid var(--ds-border)',
            backgroundColor: 'var(--ds-surface)'
          }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            <ToeicBadge variant="warning">
              🔒 VIP Premium
            </ToeicBadge>
          </div>

          <h3
            style={{
              fontFamily: 'Google Sans',
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--ds-text)',
              margin: '0 0 0.5rem 0'
            }}
          >
            {title}
          </h3>

          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--ds-text-secondary)',
              lineHeight: 1.5,
              margin: '0 0 1.25rem 0'
            }}
          >
            {description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <ToeicButton
              variant="primary"
              size="md"
              onClick={() => openPaywall(triggerId, { milestoneId, featureKey })}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              }
            >
              Mở Khóa VIP Ngay
            </ToeicButton>
          </div>
        </ToeicCard>
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
