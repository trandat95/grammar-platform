import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AppShell2026 from '../../../components/ui-2026/AppShell2026';
import { ToeicCard, ToeicButton, ToeicBadge } from '../../../components/toeic/ui';

export default function TestsCatalogPage() {
  const [isLight, setIsLight] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState('ETS2024'); // 'ETS2024' | 'ETS2026'

  const tests = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <>
      <Head>
        <title>Ngân Hàng 20 Đề Thi Chuẩn ETS 2024 &amp; 2026 | Grammar Engine</title>
        <meta name="description" content="Luyện trọn vẹn 20 đề thi TOEIC chuẩn hóa V3.0 (4.000 câu hỏi) kèm chia đôi màn hình Split-Passage Reader." />
      </Head>

      <AppShell2026
        activeView="quiz"
        onSelectView={(v) => {
          if (v === 'dashboard') window.location.href = '/';
          else if (v === 'study') window.location.href = '/';
          else if (v === 'vip') window.location.href = '/';
          else if (v === 'gamification') window.location.href = '/';
        }}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle="20 Đề Thi Chuẩn ETS"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container">
            {/* BACK LINK */}
            <div style={{ marginBottom: '1.25rem' }}>
              <Link
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
              </Link>
            </div>

            {/* HEADER HERO */}
            <div className="toeic-card-hero" style={{ marginBottom: '2rem' }}>
              <div className="toeic-hero-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>Ngân Hàng 20 Đề Thi Chuẩn Hóa V3.0 (4.000 Câu)</span>
              </div>

              <h1 className="toeic-hero-title">
                Luyện Đề Chuẩn ETS 2024 &amp; ETS 2026
              </h1>

              <p className="toeic-hero-desc">
                Trải nghiệm giao diện chia đôi màn hình <strong>Split-Passage Reader</strong>, tự động dò tìm dẫn chứng <strong>Auto-Highlight Evidence</strong> và phân tích quang phổ ngữ pháp <strong>Sentence X-Ray</strong>.
              </p>

              {/* SERIES SWITCHER TABS */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
                <ToeicButton
                  variant={selectedSeries === 'ETS2024' ? 'primary' : 'secondary'}
                  onClick={() => setSelectedSeries('ETS2024')}
                >
                  📘 ETS 2024 (10 Đề • Test 01 - 10)
                </ToeicButton>

                <ToeicButton
                  variant={selectedSeries === 'ETS2026' ? 'primary' : 'secondary'}
                  onClick={() => setSelectedSeries('ETS2026')}
                >
                  🎧 ETS 2026 (10 Đề • Kèm 540 Tracks Dictation)
                </ToeicButton>
              </div>
            </div>

            {/* TESTS GRID (Milestone U5.4) */}
            <div className="toeic-grid-3">
              {tests.map(num => (
                <div key={num} className="toeic-card toeic-card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="toeic-flex-between" style={{ marginBottom: '0.75rem' }}>
                      <ToeicBadge variant="primary">
                        {selectedSeries}
                      </ToeicBadge>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ds-text-muted)', fontWeight: 600 }}>
                        200 câu • 120 phút
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--ds-text)' }}>
                      Test {String(num).padStart(2, '0')}
                    </h3>

                    <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      Listening (Part 1-4: 100 câu) &amp; Reading (Part 5-7: 100 câu) đầy đủ đáp án &amp; giải thích AI chuyên sâu.
                    </p>
                  </div>

                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--ds-border-subtle)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Link
                        href={`/toeic/tests/${selectedSeries}/${num}?mode=part5`}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          borderRadius: '0.5rem',
                          border: '1px solid var(--ds-border)',
                          backgroundColor: 'var(--ds-card)',
                          color: 'var(--ds-text)',
                          textDecoration: 'none'
                        }}
                      >
                        Part 5
                      </Link>

                      <Link
                        href={`/toeic/tests/${selectedSeries}/${num}?mode=part6`}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          borderRadius: '0.5rem',
                          border: '1px solid var(--ds-border)',
                          backgroundColor: 'var(--ds-card)',
                          color: 'var(--ds-text)',
                          textDecoration: 'none'
                        }}
                      >
                        Part 6
                      </Link>

                      <Link
                        href={`/toeic/tests/${selectedSeries}/${num}?mode=part7`}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          borderRadius: '0.5rem',
                          border: '1px solid var(--ds-border)',
                          backgroundColor: 'var(--ds-card)',
                          color: 'var(--ds-text)',
                          textDecoration: 'none'
                        }}
                      >
                        Part 7
                      </Link>
                    </div>

                    <Link
                      href={`/toeic/tests/${selectedSeries}/${num}?mode=full`}
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <ToeicButton
                        variant="primary"
                        style={{ width: '100%' }}
                        icon={
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        }
                      >
                        Luyện Full Đề Thi (120 Phút)
                      </ToeicButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </AppShell2026>
    </>
  );
}
