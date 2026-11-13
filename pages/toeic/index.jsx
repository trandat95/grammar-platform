import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AppShell2026 from '../../components/ui-2026/AppShell2026';
import { ToeicCard, ToeicButton, ToeicBadge } from '../../components/toeic/ui';
import ToeicHeroBanner from '../../components/toeic/ToeicHeroBanner';
import taxonomyData from '../../data/toeic/grammar_taxonomy.json';
import useGlobalAuth from '../../hooks/useGlobalAuth';

export default function ToeicHubPage() {
  const globalAuth = useGlobalAuth();
  const [isLight, setIsLight] = useState(true);
  const [targetScore, setTargetScore] = useState(750);
  const [selectedGroup, setSelectedGroup] = useState('ALL');
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
      title: 'Bài Kiểm Tra Thích Ứng (3 Chặng)',
      desc: '30 câu chẩn đoán chính xác điểm TOEIC (IRT 3PL), vẽ biểu đồ Radar 6 trục và phát hiện 15 mẫu lỗi tư duy nhận thức.',
      badge: '12-15 phút • AI Adaptive',
      badgeVariant: 'primary',
      cta: 'Bắt Đầu Kiểm Tra',
      href: '/toeic/diagnostic',
      stats: '3 Chặng • IRT 3PL',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="12 8 8 12 12 16 16 12 12 8" />
        </svg>
      )
    },
    {
      id: 'practice',
      title: 'Luyện 24 Chủ Điểm (Sentence X-Ray)',
      desc: 'Tô sáng neo ngữ pháp trước/sau ô trống, phân tích họ từ loại, bẫy thường gặp và Twin-Questions tức thì.',
      badge: '920 câu • Part 5 & 6',
      badgeVariant: 'success',
      cta: 'Luyện X-Ray Ngay',
      href: '/toeic/practice/GRM_POS_NOUN',
      stats: '24 Chủ Điểm',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h20M12 2v20" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      )
    },
    {
      id: 'tests',
      title: 'Kho 20 Đề Thi Chuẩn ETS 2024 & 2026',
      desc: '4.000 câu hỏi chia đôi màn hình Split-Passage Reader, cuộn độc lập và tự động đối chiếu dẫn chứng Auto-Highlight.',
      badge: '20 Đề Thi • 4.000 Câu',
      badgeVariant: 'warning',
      cta: 'Chọn Đề Luyện Thi',
      href: '/toeic/tests',
      stats: 'ETS 2024 & 2026',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      id: 'dictation',
      title: 'Phòng Nghe Chép Chính Tả (Dictation)',
      desc: '540 tracks luyện nghe chép từ ETS 2026 với ô điền cloze, kiểm tra tức thì phím Space/Enter và Spaced Repetition.',
      badge: '540 Tracks • ETS 2026',
      badgeVariant: 'primary',
      cta: 'Vào Phòng Nghe',
      href: '/toeic/dictation',
      stats: '540 Audio Tracks',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
        <title>TOEIC AI Adaptive & Practice Hub | Grammar Engine 2026</title>
        <meta name="description" content="Nền tảng luyện thi TOEIC thích ứng với 4.000 câu hỏi chuẩn hóa, Sentence X-Ray và Dictation Studio 540 tracks." />
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

            {/* TOEIC AI HERO BANNER (With Artistic Background & Quick Access) */}
            <ToeicHeroBanner
              initialTargetScore={targetScore}
              onTargetChange={setTargetScore}
              showStats={true}
            />

            {/* BENTO FEATURE CARDS - ZONE 2 (Clean 2x2 or 4-col Grid) */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div className="toeic-flex-between" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'Google Sans', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                    Các Phân Hệ Học &amp; Luyện Thi
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-muted)', margin: 0 }}>
                    Được thiết kế đồng bộ theo chuẩn sư phạm ETS V3.0
                  </p>
                </div>
              </div>

              <div className="toeic-grid-2" style={{ gap: '1.25rem' }}>
                {featureCards.map(fc => (
                  <Link key={fc.id} href={fc.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="toeic-card toeic-card-interactive" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div className="toeic-flex-between" style={{ marginBottom: '0.85rem' }}>
                          <span style={{ color: 'var(--ds-accent)' }}>{fc.icon}</span>
                          <ToeicBadge variant={fc.badgeVariant}>{fc.badge}</ToeicBadge>
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--ds-text)' }}>
                          {fc.title}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                          {fc.desc}
                        </p>
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--ds-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-text-muted)', backgroundColor: 'var(--ds-bg-elevated)', padding: '0.2rem 0.55rem', borderRadius: 'var(--ds-radius-sm)', border: '1px solid var(--ds-border-subtle)', whiteSpace: 'nowrap' }}>
                          {fc.stats}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ds-accent)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                          {fc.cta} &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 24 TOPIC DISCOVERY - ZONE 3 (Milestone U2.3) */}
            <div id="topics" style={{ marginBottom: '3rem' }}>
              <div className="toeic-flex-between" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'Google Sans', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                    24 Chủ Điểm Ngữ Pháp &amp; Kỹ Năng Trọng Tâm
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-muted)', margin: 0 }}>
                    Soi sáng cấu trúc ngữ pháp quang phổ Sentence X-Ray và bẫy tư duy
                  </p>
                </div>
              </div>

              {/* Topic Category Filter Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {topicGroups.map(grp => (
                  <button
                    key={grp.code}
                    type="button"
                    className={`toeic-target-chip ${selectedGroup === grp.code ? 'active' : ''}`}
                    onClick={() => setSelectedGroup(grp.code)}
                  >
                    {grp.name}
                  </button>
                ))}
              </div>

              {/* Topics Grid */}
              <div className="toeic-grid-3">
                {filteredTopics.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', width: '100%', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ds-text)' }}>
                      Chưa có chủ điểm trong nhóm này
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--ds-text-secondary)', marginTop: '0.25rem', marginBottom: '1rem' }}>
                      Hãy chọn nhóm chủ điểm khác hoặc xem toàn bộ 24 chủ điểm trọng tâm.
                    </div>
                    <button
                      type="button"
                      className="toeic-target-chip active"
                      onClick={() => setSelectedGroup('ALL')}
                    >
                      Xem Tất Cả 24 Chủ Điểm
                    </button>
                  </div>
                ) : (
                  filteredTopics.map((top, idx) => (
                    <Link
                      key={top.id || idx}
                      href={`/toeic/practice/${top.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="toeic-topic-card">
                        <div>
                          <div className="toeic-flex-between" style={{ marginBottom: '0.5rem' }}>
                            <ToeicBadge variant="muted">
                              Target {top.target_score_band || '450+'}
                            </ToeicBadge>
                            <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
                              {top.recommended_time_sec || 15}s/câu
                            </span>
                          </div>
                          <div className="toeic-topic-name">{top.name_vi}</div>
                          <div className="toeic-topic-desc">{top.theory_summary_vi || top.name_en}</div>
                        </div>

                        <div>
                          <div className="toeic-topic-meta">
                            <span>Độ thông thạo (Mastery)</span>
                            <span style={{ fontWeight: 700, color: 'var(--ds-accent)' }}>75%</span>
                          </div>
                          <div className="toeic-progress-bar">
                            <div className="toeic-progress-fill" style={{ width: '75%' }} />
                          </div>
                          <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ds-accent)' }}>
                              Luyện X-Ray &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </AppShell2026>
    </>
  );
}
