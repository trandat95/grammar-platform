import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AppShell2026 from '../../components/ui-2026/AppShell2026';
import { KitIcon } from '../../components/ui-2026/KitIcon';
import { SectionCardWatermark } from '../../components/ui-2026/EditorialArtwork';
import AiPowerShowcase2026 from '../../components/ui-2026/AiPowerShowcase2026';
import { ToeicCard, ToeicButton, ToeicBadge } from '../../components/toeic/ui';
import ToeicHeroBanner from '../../components/toeic/ToeicHeroBanner';
import taxonomyData from '../../data/toeic/grammar_taxonomy.json';
import useGlobalAuth from '../../hooks/useGlobalAuth';
import useToeicEntitlement from '../../hooks/useToeicEntitlement';
import ToeicSmartPaywallModal from '../../components/toeic/premium/ToeicSmartPaywallModal';

export default function ToeicHubPage() {
  const globalAuth = useGlobalAuth();
  const entitlement = useToeicEntitlement();
  const isVip = entitlement.isVip;
  const [isLight, setIsLight] = useState(true);
  const [targetScore, setTargetScore] = useState(750);
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [hubTab, setHubTab] = useState('modules'); // 'modules' | 'topics' | 'ai'
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [userStats, setUserStats] = useState({
    estimatedScore: 625,
    completedQuestions: 142,
    accuracyRate: 78.5,
    streakDays: 0,
    dictationCompleted: 18
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const uid = globalAuth.currentUser?.id || 'guest';
    const streak = globalAuth.userTracker?.streak || 0;

    // Check saved TOEIC diagnostic score
    const savedDiagnostic = localStorage.getItem(`toeic_diagnostic_${uid}`);
    let score = 625;
    if (savedDiagnostic) {
      try {
        const d = JSON.parse(savedDiagnostic);
        if (d.predictedScore) score = d.predictedScore;
      } catch (e) {}
    }

    // Check answered count
    const savedResponses = localStorage.getItem(`toeic_responses_${uid}`);
    let completedCount = 0;
    if (savedResponses) {
      try {
        completedCount = Object.keys(JSON.parse(savedResponses)).length;
      } catch (e) {}
    }

    setUserStats({
      estimatedScore: score,
      completedQuestions: completedCount > 0 ? completedCount : 142,
      accuracyRate: 78.5,
      streakDays: streak,
      dictationCompleted: 18
    });
  }, [globalAuth.currentUser?.id, globalAuth.userTracker?.streak]);

  const topics = taxonomyData?.topics || [];

  const handleSelectView = (v) => {
    if (v === 'toeic') {
      if (typeof window !== 'undefined' && window.location.pathname !== '/toeic') {
        window.location.href = '/toeic';
      }
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.href = v === 'dashboard' ? '/' : `/?view=${v}`;
    }
  };

  const featureCards = [
    {
      id: 'diagnostic',
      title: 'Kiểm Tra Trình Độ (3 Chặng)',
      desc: '30 câu đo đúng trình độ TOEIC hiện tại và chỉ ra các dạng lỗi bạn hay vướng.',
      badge: '12-15p • Thích ứng',
      badgeVariant: 'primary',
      cta: 'Kiểm Tra Ngay',
      href: '/toeic/diagnostic',
      stats: '3 Chặng',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="12 8 8 12 12 16 16 12 12 8" />
        </svg>
      )
    },
    {
      id: 'practice',
      title: 'Luyện 24 Dạng Bài (Soi Câu X-Ray)',
      desc: 'Đánh dấu từ khóa trước/sau chỗ trống để chọn nhanh và luyện lại câu cùng dạng.',
      badge: '1.451 câu • 24 Chủ Điểm',
      badgeVariant: 'success',
      cta: 'Chọn Dạng Bài',
      href: '/toeic/practice',
      stats: '24 Dạng Bài',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h20M12 2v20" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      )
    },
    {
      id: 'tests',
      title: 'Kho 20 Đề TOEIC New Format 2026',
      desc: '4.000 câu chia đôi màn hình bài đọc, tự động bôi vàng câu chứa đáp án.',
      badge: '20 Đề • 4.000 Câu',
      badgeVariant: 'warning',
      cta: 'Chọn Đề Thi',
      href: '/toeic/tests',
      stats: 'New Format 2026',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      id: 'dictation',
      title: 'Phòng Nghe Chép Chính Tả',
      desc: '540 đoạn nghe ngắn giúp luyện phản xạ tai và nhắc ôn đúng lúc sắp quên.',
      badge: '540 Đoạn Nghe',
      badgeVariant: 'primary',
      cta: 'Vào Phòng Nghe',
      href: '/toeic/dictation',
      stats: 'Part 1-4',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )
    }
  ];

  // 8 Canonical Pedagogical Groups in TOEIC Taxonomy
  const topicGroups = [
    { code: 'ALL', name: `Tất cả (${topics.length || 24} Chủ Điểm)` },
    { code: 'G1_POS', name: '1. Từ Loại & Cụm Từ (4)' },
    { code: 'G2_VERB', name: '2. Động Từ & Thì (5)' },
    { code: 'G3_PRON', name: '3. Đại Từ & Mệnh Đề (2)' },
    { code: 'G4_CONN', name: '4. Giới Từ & Liên Từ (4)' },
    { code: 'G5_MOD', name: '5. Cấu Trúc Nâng Cao (2)' },
    { code: 'G6_VOC_COH', name: '6. Từ Vựng & Part 6 (3)' },
    { code: 'G7_READING', name: '7. Đọc Hiểu Part 7 (2)' },
    { code: 'G8_LISTENING', name: '8. Nghe Hiểu Part 1-4 (2)' }
  ];

  const filteredTopics = selectedGroup === 'ALL'
    ? topics
    : topics.filter(t => t.group_code === selectedGroup || t.category === selectedGroup);

  return (
    <>
      <Head>
        <title>TOEIC AI Adaptive &amp; Practice Hub | GrammarPro.io.vn</title>
        <meta name="description" content="Nền tảng luyện thi TOEIC thích ứng với 4.000 câu hỏi chuẩn hóa, Sentence X-Ray và Dictation Studio 540 tracks tại grammarpro.io.vn." />
      </Head>

      <AppShell2026
        activeView="toeic"
        toeicSubView="hub"
        onSelectView={handleSelectView}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle="TOEIC AI Test & Practice Hub"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container">

            {/* COMPACT USER-FOCUSED HERO BANNER */}
            <ToeicHeroBanner
              initialTargetScore={targetScore}
              onTargetChange={setTargetScore}
              showStats={true}
              compact={true}
              isLight={isLight}
            />

            {/* USER-CENTERED 3-TAB HUB SWITCHER (shadcn/ui & ant-design-mobile CapsuleTabs pattern) */}
            <div className="toeic-hub-tabs" role="tablist" aria-label="Phân khu TOEIC AI Hub">
              <button
                type="button"
                role="tab"
                aria-selected={hubTab === 'modules'}
                onClick={() => setHubTab('modules')}
                className={`toeic-hub-tab-btn ${hubTab === 'modules' ? 'is-active' : ''}`}
              >
                <KitIcon name="bolt" size={14} />
                <span>Lộ Trình &amp; Luyện Ngay</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={hubTab === 'topics'}
                onClick={() => setHubTab('topics')}
                className={`toeic-hub-tab-btn ${hubTab === 'topics' ? 'is-active' : ''}`}
              >
                <KitIcon name="target" size={14} />
                <span>24 Dạng Bài Hay Thi</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={hubTab === 'ai'}
                onClick={() => setHubTab('ai')}
                className={`toeic-hub-tab-btn ${hubTab === 'ai' ? 'is-active' : ''}`}
              >
                <KitIcon name="sparkles" size={14} />
                <span>Công Nghệ AI</span>
              </button>
            </div>

            {/* TAB 1: CORE LEARNING & EXAM MODULES (4 Focused Cards) */}
            {hubTab === 'modules' && (
              <div style={{ marginBottom: '2rem' }}>
                <div className="toeic-grid-2" style={{ gap: '1rem' }}>
                  {featureCards.map(fc => {
                    const wmKind =
                      fc.id === 'diagnostic'
                        ? 'toeic-diag'
                        : fc.id === 'practice'
                        ? 'toeic-xray'
                        : fc.id === 'tests'
                        ? 'toeic-tests'
                        : 'toeic-dictation';
                    return (
                    <Link key={fc.id} href={fc.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="toeic-card toeic-card-interactive" style={{ position: 'relative', overflow: 'hidden', height: '100%', padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <SectionCardWatermark kind={wmKind} />
                        <div style={{ position: 'relative', zIndex: 2, paddingRight: '72px' }}>
                          <div className="toeic-flex-between" style={{ marginBottom: '0.6rem' }}>
                            <span style={{ color: 'var(--ds-accent)' }}>{fc.icon}</span>
                            <ToeicBadge variant={fc.badgeVariant}>{fc.badge}</ToeicBadge>
                          </div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.3rem 0', color: 'var(--ds-text)' }}>
                            {fc.title}
                          </h3>
                          <p style={{ fontSize: '0.83rem', color: 'var(--ds-text-secondary)', lineHeight: 1.45, margin: 0 }}>
                            {fc.desc}
                          </p>
                        </div>

                        <div style={{ position: 'relative', zIndex: 2, paddingTop: '0.65rem', borderTop: '1px solid var(--ds-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>
                            {fc.stats}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ds-accent)', whiteSpace: 'nowrap' }}>
                            {fc.cta} &rarr;
                          </span>
                        </div>
                      </div>
                    </Link>
                    );
                  })}
                </div>

                {/* Quick Jump Strip: 1,000 New TOEIC Flashcards FSRS-4.5 */}
                <div
                  className="toeic-card"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    marginTop: '1rem',
                    padding: '1rem 1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    borderColor: 'var(--ds-accent-border)',
                    background: 'linear-gradient(135deg, var(--ds-card) 0%, var(--ds-accent-bg) 100%)',
                  }}
                >
                  <div style={{ position: 'relative', zIndex: 2, maxWidth: '580px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <KitIcon name="books" size={16} color="var(--ds-accent)" />
                      <span style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--ds-text)' }}>
                        Kho 1,000 Từ Vựng New TOEIC &amp; Flashcard 3D (FSRS-4.5)
                      </span>
                      <ToeicBadge variant="primary">10 Modules · 50 Chủ Đề</ToeicBadge>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ds-text-secondary)', lineHeight: 1.45 }}>
                      Thẻ lật 3D kèm ảnh 4 lớp offline, phát âm Mỹ, bài điền khuyết Cloze và tự động đồng bộ từ các câu làm sai.
                    </div>
                  </div>
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link
                      href="/toeic/mistakes-srs?tab=browse"
                      className="toeic-btn toeic-btn-primary"
                      style={{ textDecoration: 'none', fontSize: '0.82rem', padding: '0.55rem 1rem' }}
                    >
                      Học 1,000 Từ Vựng &rarr;
                    </Link>
                    <Link
                      href="/toeic/mistakes-srs?tab=due"
                      className="toeic-btn toeic-btn-secondary"
                      style={{ textDecoration: 'none', fontSize: '0.82rem', padding: '0.55rem 0.9rem' }}
                    >
                      Ôn FSRS Hôm Nay
                    </Link>
                  </div>
                </div>

                {/* Quick Jump Strip to 24 Topics */}
                <div
                  className="toeic-card"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    marginTop: '1rem',
                    padding: '0.9rem 1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <SectionCardWatermark kind="toeic-fast" />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.92rem', fontWeight: 800, color: 'var(--ds-text)' }}>
                      <KitIcon name="target" size={15} color="var(--ds-accent)" />
                      <span>Luyện nhanh theo 24 Dạng Bài Hay Ra Thi</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ds-text-muted)' }}>
                      Làm thử miễn phí 4 câu cho mỗi dạng bài — tập trung đúng chỗ bạn hay mất điểm.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="toeic-btn toeic-btn-primary"
                    onClick={() => setHubTab('topics')}
                    style={{ position: 'relative', zIndex: 2, fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                  >
                    Xem 24 Dạng Bài &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: 24 TOPICS (Compact Progressive Disclosure) */}
            {hubTab === 'topics' && (
              <div id="topics" style={{ marginBottom: '2.5rem' }}>
                <div className="toeic-flex-between" style={{ marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--ds-text-muted)', fontWeight: 600 }}>
                    <KitIcon name={isVip ? 'crown' : 'bolt'} size={14} color={isVip ? 'var(--ds-warning)' : 'var(--ds-accent)'} />
                    <span>
                      {isVip
                        ? 'VIP: Đã mở toàn bộ 24 chủ điểm (450–990+)'
                        : 'Tài khoản Miễn phí: Mở 4 câu dùng thử cho mỗi chủ điểm 550+'}
                    </span>
                  </div>
                  {!isVip && (
                    <button
                      type="button"
                      onClick={() => entitlement.openPaywall('TRG_08_GRAMMAR_TARGET_550')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.6rem',
                        border: '1px solid var(--ds-warning)',
                        backgroundColor: 'var(--ds-warning-bg, rgba(234, 88, 12, 0.08))',
                        color: 'var(--ds-warning)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <KitIcon name="crown" size={13} />
                      <span>Mở Khóa VIP</span>
                    </button>
                  )}
                </div>

                {/* Horizontal Scrollable Category Chips */}
                <div className="toeic-chip-scroll">
                  {topicGroups.map(grp => (
                    <button
                      key={grp.code}
                      type="button"
                      className={`toeic-target-chip ${selectedGroup === grp.code ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedGroup(grp.code);
                        if (grp.code !== 'ALL') setShowAllTopics(true);
                      }}
                    >
                      {grp.name}
                    </button>
                  ))}
                </div>

                {/* Compact Topics Grid (Default capped at 6 items when ALL is selected) */}
                <div className="toeic-grid-3" style={{ gap: '0.85rem' }}>
                  {(selectedGroup === 'ALL' && !showAllTopics ? filteredTopics.slice(0, 6) : filteredTopics).map((top, idx) => {
                    const targetScoreBand = parseInt(top.target_score_band || 450, 10);
                    const isTopicFree = targetScoreBand < 550;
                    const canAccess = isVip || isTopicFree;

                    return (
                      <Link
                        key={top.id || idx}
                        href={`/toeic/practice/${top.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div
                          className="toeic-topic-card"
                          style={{
                            padding: '0.95rem 1.05rem',
                            minHeight: 'auto',
                            gap: '0.6rem',
                            cursor: 'pointer',
                            borderColor: canAccess ? 'var(--ds-card-border)' : 'var(--ds-border)'
                          }}
                        >
                          <div className="toeic-flex-between">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <ToeicBadge variant="muted">
                                Band {top.target_score_band || '450+'}
                              </ToeicBadge>
                              {!canAccess && (
                                <ToeicBadge variant="warning">
                                  4 câu thử
                                </ToeicBadge>
                              )}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--ds-text-muted)' }}>
                              {top.recommended_time_sec || 15}s/câu
                            </span>
                          </div>

                          <div className="toeic-topic-name" style={{ fontSize: '0.95rem', margin: 0 }}>
                            {top.name_vi}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid var(--ds-border-subtle)' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--ds-text-muted)' }}>
                              {top.name_en}
                            </span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: canAccess ? 'var(--ds-accent)' : 'var(--ds-warning)', whiteSpace: 'nowrap' }}>
                              {canAccess ? 'Luyện ngay →' : 'Thử 4 câu →'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {selectedGroup === 'ALL' && filteredTopics.length > 6 && (
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="toeic-btn toeic-btn-secondary"
                      onClick={() => setShowAllTopics(prev => !prev)}
                      style={{ fontSize: '0.84rem', padding: '0.55rem 1.25rem' }}
                    >
                      {showAllTopics ? 'Thu gọn danh sách ▴' : `Xem tất cả ${filteredTopics.length} chủ điểm ▾`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AI TECHNOLOGY SHOWCASE (On-Demand Progressive Disclosure) */}
            {hubTab === 'ai' && (
              <div style={{ marginBottom: '2rem' }}>
                <AiPowerShowcase2026
                  compact={true}
                  onNavigateVip={() => entitlement.openPaywall('TRG_01_MILESTONE_LOCKED')}
                />
              </div>
            )}

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
