import React, { useState } from 'react';
import Head from 'next/head';
import AppShell2026 from '../../components/ui-2026/AppShell2026';
import DictationStudio from '../../components/toeic/DictationStudio';
import useToeicEntitlement from '../../hooks/useToeicEntitlement';
import ToeicSmartPaywallModal from '../../components/toeic/premium/ToeicSmartPaywallModal';

export default function DictationPage() {
  const [isLight, setIsLight] = useState(true);
  const [selectedTestNum, setSelectedTestNum] = useState(1);
  const entitlement = useToeicEntitlement();
  const isVip = entitlement.isVip;

  const handleTestChange = (e) => {
    const targetVal = parseInt(e.target.value, 10);
    if (!isVip && targetVal > 1) {
      entitlement.openPaywall('TRG_05_DICTATION_PART34', { requestedTest: targetVal });
      return;
    }
    setSelectedTestNum(targetVal);
  };

  return (
    <>
      <Head>
        <title>Phòng Nghe Chép Chính Tả (Dictation Studio 540 Tracks) | Grammar Engine</title>
        <meta name="description" content="Luyện nghe chép chính tả 540 tracks từ ETS 2026 với cloze inputs và kiểm tra tức thì." />
      </Head>

      <AppShell2026
        activeView="toeic"
        toeicSubView="dictation"
        onSelectView={(v) => {
          if (v === 'toeic') {
            if (typeof window !== 'undefined' && window.location.pathname !== '/toeic') {
              window.location.href = '/toeic';
            }
            return;
          }
          if (typeof window !== 'undefined') {
            window.location.href = v === 'dashboard' ? '/' : `/?view=${v}`;
          }
        }}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle="Dictation Studio ETS 2026"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container">
            <div className="toeic-flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <a
                href="/toeic"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--ds-accent)',
                  textDecoration: 'none'
                }}
              >
                <span>&larr; Quay lại TOEIC Hub</span>
              </a>

              {/* TEST SELECTOR WITH FREE VS VIP ACCESS CONTROL */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {!isVip && (
                  <span
                    onClick={() => entitlement.openPaywall('TRG_05_DICTATION_PART34')}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--ds-warning)',
                      backgroundColor: 'var(--ds-warning-bg, rgba(234, 88, 12, 0.08))',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--ds-warning)',
                      cursor: 'pointer'
                    }}
                  >
                    Free: Chỉ mở Test 01 • Nâng cấp VIP 🔒
                  </span>
                )}
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>Chọn Test:</span>
                <select
                  value={selectedTestNum}
                  onChange={handleTestChange}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--ds-border)',
                    backgroundColor: 'var(--ds-card)',
                    color: 'var(--ds-text)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const testNum = i + 1;
                    const isLocked = !isVip && testNum > 1;
                    return (
                      <option key={testNum} value={testNum}>
                        ETS 2026 Test {String(testNum).padStart(2, '0')}{isLocked ? ' 🔒 (VIP)' : (testNum === 1 && !isVip ? ' (Miễn phí)' : '')}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <DictationStudio
              series="ETS2026"
              testNum={selectedTestNum}
            />
          </div>
        </div>

        {/* PAYWALL TRIGGER MODAL */}
        <ToeicSmartPaywallModal
          isOpen={entitlement.isPaywallOpen}
          onClose={entitlement.closePaywall}
          triggerId={entitlement.activeTriggerId}
          context={entitlement.paywallContext}
        />
      </AppShell2026>
    </>
  );
}
