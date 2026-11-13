import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AppShell2026 from '../../components/ui-2026/AppShell2026';

export default function ToeicHubPage() {
  const [isLight, setIsLight] = useState(true);
  const [taxonomy, setTaxonomy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Quick load taxonomy
    fetch('/api/toeic/practice/drill?topicId=GRM_POS_NOUN&limit=1')
      .then(res => res.json())
      .then(d => {
        // Taxonomy is available
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const featureCards = [
    {
      id: 'diagnostic',
      title: 'Bài Kiểm Tra Thích Ứng (3 Chặng)',
      desc: '30 câu chẩn đoán chính xác điểm TOEIC (IRT 3PL), vẽ Radar 6 trục và phát hiện 15 mẫu lỗi tư duy.',
      badge: '12-15 phút • AI Adaptive',
      cta: 'Bắt Đầu Kiểm Tra',
      href: '/toeic/diagnostic',
      color: 'var(--ds-primary)'
    },
    {
      id: 'practice',
      title: 'Luyện 24 Chủ Điểm (Sentence X-Ray)',
      desc: 'Tô sáng neo ngữ pháp trước/sau ô trống, phân tích họ từ loại, bẫy thường gặp và Twin-Questions tức thì.',
      badge: '920 câu Part 5 & 6',
      cta: 'Vào Luyện Tập',
      href: '/toeic/practice/GRM_POS_NOUN',
      color: 'var(--ds-success)'
    },
    {
      id: 'tests',
      title: 'Luyện Đề Chuẩn ETS 2024 & 2026',
      desc: '20 đề thi chuẩn (4.000 câu) có chia đôi màn hình Split-Passage Reader và Auto-Highlight dẫn chứng.',
      badge: '20 Full Tests • 4.000 câu',
      cta: 'Chọn Đề Luyện Thi',
      href: '/toeic/tests',
      color: 'var(--ds-warning)'
    },
    {
      id: 'dictation',
      title: 'Phòng Nghe Chép Chính Tả (Dictation)',
      desc: '540 tracks luyện nghe chép từ ETS 2026 với cloze inputs và kiểm tra tức thời phím Space/Enter.',
      badge: '540 Tracks • ETS 2026',
      cta: 'Vào Phòng Nghe',
      href: '/toeic/dictation',
      color: 'var(--ds-primary)'
    },
    {
      id: 'srs',
      title: 'Sổ Tay Câu Sai & Từ Vựng (SRS)',
      desc: 'Ôn tập câu làm sai và từ vựng trọng tâm theo chu kỳ ngắt quãng SM-2 (1 - 3 - 7 - 14 ngày).',
      badge: 'Spaced Repetition',
      cta: 'Mở Sổ Tay Ôn Tập',
      href: '/toeic/mistakes-srs',
      color: 'var(--ds-danger)'
    }
  ];

  return (
    <>
      <Head>
        <title>Hệ Thống Luyện Thi Ngữ Pháp TOEIC AI (ETS 2024 & 2026) | Grammar Engine</title>
        <meta name="description" content="Nền tảng luyện thi TOEIC thích ứng với 4.000 câu hỏi chuẩn hóa, Sentence X-Ray và Dictation Studio." />
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
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-8" style={{ backgroundColor: 'var(--ds-background)' }}>
          <div className="max-w-5xl mx-auto space-y-8">
            {/* HERO BANNER */}
            <div
              className="rounded-3xl p-6 sm:p-10 border shadow-sm relative overflow-hidden transition-all"
              style={{
                backgroundColor: 'var(--ds-surface)',
                borderColor: 'var(--ds-border)'
              }}
            >
              <div className="max-w-2xl space-y-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'var(--ds-primary-subtle)', color: 'var(--ds-primary)' }}
                >
                  🚀 Nâng Cấp V3.0 • ETS Corpus 2024 & 2026
                </span>

                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
                  Luyện Thi Ngữ Pháp TOEIC Thích Ứng Bằng AI
                </h1>

                <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
                  4.000 câu hỏi thực tế được giải mã cấu trúc quang phổ <strong>Sentence X-Ray</strong>,
                  thuật toán <strong>IRT 3PL</strong> dự đoán chính xác điểm số, và lộ trình <strong>7 Milestones</strong> tự động
                  khắc phục 15 mẫu lỗi tư duy nhận thức.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href="/toeic/diagnostic"
                    className="px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                    style={{ backgroundColor: 'var(--ds-primary)', color: 'var(--ds-surface)' }}
                  >
                    <span>🎯 Làm Bài Test Chẩn Đoán (15 Phút)</span>
                    <span>→</span>
                  </a>

                  <a
                    href="/toeic/practice/GRM_POS_NOUN"
                    className="px-5 py-3 rounded-xl font-bold text-sm border hover:bg-[var(--ds-surface-secondary)] active:scale-95 transition-all"
                    style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-primary)' }}
                  >
                    🔬 Trải Nghiệm Sentence X-Ray
                  </a>
                </div>
              </div>
            </div>

            {/* 5 FEATURE MODULES GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--ds-text-primary)' }}>
                    Các Phân Hệ Học & Luyện Thi
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                    Được thiết kế đồng bộ theo chuẩn sư phạm ETS V3.0
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featureCards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-2xl p-6 border shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-[var(--ds-primary)]"
                    style={{
                      backgroundColor: 'var(--ds-surface)',
                      borderColor: 'var(--ds-border)'
                    }}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[11px] px-2.5 py-0.5 rounded-full font-bold"
                          style={{
                            backgroundColor: 'var(--ds-surface-secondary)',
                            color: 'var(--ds-text-secondary)'
                          }}
                        >
                          {card.badge}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg" style={{ color: 'var(--ds-text-primary)' }}>
                        {card.title}
                      </h3>

                      <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
                        {card.desc}
                      </p>
                    </div>

                    <div className="pt-6">
                      <a
                        href={card.href}
                        className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm hover:opacity-90 active:scale-95"
                        style={{
                          backgroundColor: 'var(--ds-primary)',
                          color: 'var(--ds-surface)'
                        }}
                      >
                        <span>{card.cta}</span>
                        <span>→</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </AppShell2026>
    </>
  );
}
