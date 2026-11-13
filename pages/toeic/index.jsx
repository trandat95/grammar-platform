import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AppShell2026 from '../../components/ui-2026/AppShell2026';
import { ToeicCard, ToeicButton, ToeicBadge } from '../../components/toeic/ui';

export default function ToeicHubPage() {
  const [isLight, setIsLight] = useState(true);
  const [targetScore, setTargetScore] = useState(750);
  const [topics, setTopics] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [userStats, setUserStats] = useState({
    estimatedScore: 625,
    completedQuestions: 142,
    accuracyRate: 78.5,
    streakDays: 5,
    dictationCompleted: 18
  });

  useEffect(() => {
    // Load topics from taxonomy API
    fetch('/api/toeic/practice/drill?topicId=GRM_POS_NOUN&limit=1')
      .then(res => res.json())
      .then(() => {
        // Load full taxonomy safely
        import('../../data/toeic/grammar_taxonomy.json')
          .then(m => {
            setTopics(m.default?.topics || m.topics || []);
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  const featureCards = [
    {
      id: 'diagnostic',
      title: 'Bài Kiểm Tra Thích Ứng (3 Chặng)',
      desc: '30 câu chẩn đoán chính xác điểm TOEIC (IRT 3PL), vẽ biểu đồ Radar 6 trục và phát hiện 15 mẫu lỗi tư duy nhận thức.',
      badge: '12-15 phút • AI Adaptive',
      badgeVariant: 'primary',
      cta: 'Bắt Đầu Kiểm Tra',
      href: '/toeic/diagnostic',
      stats: '3 Chặng • IRT 3PL EAP',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      stats: '24 Chủ Điểm • Lời giải 3 bước',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h20M12 2v20" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      )
    },
    {
      id: 'tests',
      title: 'Kho 20 Đề Thi Chuẩn ETS 2024 & 2026',
      desc: '4.000 câu hỏi chia đôi màn hình Split-Passage Reader, cuộn độc lập và tự động tìm dẫn chứng Auto-Highlight.',
      badge: '20 Đề Thi • 4.000 Câu',
      badgeVariant: 'warning',
      cta: 'Chọn Đề Luyện Thi',
      href: '/toeic/tests',
      stats: 'ETS 2024 & ETS 2026',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      id: 'dictation',
      title: 'Phòng Nghe Chép Chính Tả (Dictation)',
      desc: '540 tracks luyện nghe chép từ ETS 2026 với ô điền từ cloze, kiểm tra tức thì phím Space/Enter và sóng âm thanh.',
      badge: '540 Tracks • ETS 2026',
      badgeVariant: 'primary',
      cta: 'Vào Phòng Nghe',
      href: '/toeic/dictation',
      stats: 'Sóng âm • 0.8x - 1.2x',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )
    },
    {
      id: 'srs',
      title: 'Sổ Tay Câu Sai & Từ Vựng (SRS)',
      desc: 'Ôn tập câu làm sai và từ vựng trọng tâm theo chu kỳ ngắt quãng SM-2 (1 - 3 - 7 - 14 ngày) với thẻ lật 3D.',
      badge: 'Spaced Repetition • SM-2',
      badgeVariant: 'danger',
      cta: 'Mở Sổ Tay Ôn Tập',
      href: '/toeic/mistakes-srs',
      stats: '15 Mẫu lỗi tư duy',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      )
    }
  ];

  // Group topics into 6 logical pedagogical categories
  const topicGroups = [
    { code: 'ALL', name: 'Tất cả (24 Chủ Điểm)' },
    { code: 'RADAR_POS', name: '1. Từ Loại & Cụm Từ' },
    { code: 'RADAR_VERB', name: '2. Động Từ & Thì' },
    { code: 'RADAR_CLAUSE', name: '3. Mệnh Đề & Liên Từ' },
    { code: 'RADAR_ADVANCED', name: '4. Cấu Trúc Nâng Cao' },
    { code: 'RADAR_READING', name: '5. Đọc Hiểu Part 6 & 7' },
    { code: 'RADAR_LISTENING', name: '6. Nghe Hiểu Part 1 - 4' }
  ];

  const filteredTopics = selectedGroup === 'ALL'
    ? topics
    : topics.filter(t => t.group_code === selectedGroup);

  return (
    <>
      <Head>
        <title>TOEIC AI Adaptive & Practice Hub | Grammar Engine 2026</title>
        <meta name="description" content="Nền tảng luyện thi TOEIC thích ứng với 4.000 câu hỏi chuẩn hóa, Sentence X-Ray và Dictation Studio 540 tracks." />
      </Head>

      <AppShell2026
        activeView="study"
        onSelectView={(v) => {
          if (v === 'dashboard') window.location.href = '/';
          else if (v === 'vip') window.location.href = '/';
          else if (v === 'gamification') window.location.href = '/';
        }}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle="TOEIC AI Test & Practice Hub"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container">

            {/* HERO BANNER (Milestone U2.1) */}
            <div className="toeic-card-hero" style={{ marginBottom: '2rem' }}>
              <div className="toeic-hero-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Hệ Thống Luyện Thi TOEIC Thích Ứng Bằng AI • V3.0</span>
              </div>

              <h1 className="toeic-hero-title">
                Chinh Phục TOEIC Với Trí Tuệ Nhân Tạo &amp; Sentence X-Ray
              </h1>

              <p className="toeic-hero-desc">
                4.000 câu hỏi thực tế được giải mã cấu trúc quang phổ Sentence X-Ray, thuật toán <strong>IRT 3PL</strong> ước lượng chính xác năng lực, và lộ trình <strong>7 Milestones</strong> tự động khắc phục 15 mẫu lỗi tư duy nhận thức.
              </p>

              {/* Target Band Selector */}
              <div className="toeic-target-wrap">
                <span className="toeic-target-label">Mục tiêu của bạn:</span>
                {[500, 650, 750, 850, 990].map(score => (
                  <button
                    key={score}
                    type="button"
                    className={`toeic-target-chip ${targetScore === score ? 'active' : ''}`}
                    onClick={() => setTargetScore(score)}
                  >
                    Target {score}+
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <Link href="/toeic/diagnostic" style={{ textDecoration: 'none' }}>
                  <ToeicButton size="lg" variant="primary" icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  }>
                    Làm Bài Test Chẩn Đoán (15 Phút)
                  </ToeicButton>
                </Link>

                <a href="#topics" style={{ textDecoration: 'none' }}>
                  <ToeicButton size="lg" variant="secondary" icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  }>
                    Khám Phá 24 Chủ Điểm
                  </ToeicButton>
                </a>
              </div>

              {/* Learning Stats Strip (Zone 1) */}
              <div className="toeic-stat-row">
                <div className="toeic-stat-card">
                  <div className="toeic-stat-val">{userStats.estimatedScore}</div>
                  <div className="toeic-stat-lbl">Điểm Dự Đoán (IRT)</div>
                </div>
                <div className="toeic-stat-card">
                  <div className="toeic-stat-val">{targetScore}</div>
                  <div className="toeic-stat-lbl">Mục Tiêu Đặt Ra</div>
                </div>
                <div className="toeic-stat-card">
                  <div className="toeic-stat-val">{userStats.completedQuestions}</div>
                  <div className="toeic-stat-lbl">Câu Đã Làm ({userStats.accuracyRate}%)</div>
                </div>
                <div className="toeic-stat-card">
                  <div className="toeic-stat-val">🔥 {userStats.streakDays}d</div>
                  <div className="toeic-stat-lbl">Chuỗi Học Liên Tục</div>
                </div>
              </div>
            </div>

            {/* BENTO FEATURE CARDS - ZONE 2 */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div className="toeic-flex-between" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'Google Sans', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                    Các Phân Hệ Học &amp; Luyện Thi
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-muted)', margin: 0 }}>
                    Được thiết kế đồng bộ theo chuẩn sư phạm ETS V3.0
                  </p>
                </div>
              </div>

              <div className="toeic-grid-3">
                {featureCards.map(fc => (
                  <Link key={fc.id} href={fc.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="toeic-card toeic-card-interactive" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div className="toeic-flex-between" style={{ marginBottom: '1rem' }}>
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

                      <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--ds-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>
                          {fc.stats}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ds-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
                  <h2 style={{ fontFamily: 'Google Sans', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
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
                {filteredTopics.map((top, idx) => (
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
                ))}
              </div>
            </div>

          </div>
        </div>
      </AppShell2026>
    </>
  );
}
