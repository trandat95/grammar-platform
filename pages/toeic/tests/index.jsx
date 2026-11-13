import React, { useState } from 'react';
import Head from 'next/head';
import AppShell2026 from '../../../components/ui-2026/AppShell2026';

export default function TestsCatalogPage() {
  const [isLight, setIsLight] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState('ETS2024'); // 'ETS2024' | 'ETS2026'

  const tests = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <>
      <Head>
        <title>Ngân Hàng 20 Đề Thi Chuẩn ETS 2024 & 2026 | Grammar Engine</title>
        <meta name="description" content="Luyện trọn vẹn 20 đề thi TOEIC chuẩn hóa V3.0 (4.000 câu hỏi)." />
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
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6" style={{ backgroundColor: 'var(--ds-background)' }}>
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <a
                href="/toeic"
                className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                style={{ color: 'var(--ds-primary)' }}
              >
                <span>← Quay lại TOEIC Hub</span>
              </a>
            </div>

            {/* HEADER */}
            <div className="rounded-2xl p-6 sm:p-8 border shadow-sm space-y-3"
                 style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}>
              <span className="text-xs font-bold px-3 py-1 rounded-full inline-block"
                    style={{ backgroundColor: 'var(--ds-primary-subtle)', color: 'var(--ds-primary)' }}>
                📚 Ngân Hàng Đề Thi Chuẩn Hóa V3.0 (4.000 Câu)
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--ds-text-primary)' }}>
                Luyện Đề ETS 2024 & ETS 2026
              </h1>
              <p className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
                Tích hợp giao diện chia đôi màn hình <strong>Split-Passage Reader</strong>, tự động dò tìm dẫn chứng <strong>Auto-Highlight Evidence</strong> và phân tích quang phổ <strong>Sentence X-Ray</strong>.
              </p>

              {/* SERIES SWITCHER */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSeries('ETS2024')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                    selectedSeries === 'ETS2024' ? 'shadow-sm ring-2 ring-[var(--ds-primary)]' : 'border'
                  }`}
                  style={{
                    backgroundColor: selectedSeries === 'ETS2024' ? 'var(--ds-primary)' : 'var(--ds-surface)',
                    color: selectedSeries === 'ETS2024' ? 'var(--ds-surface)' : 'var(--ds-text-primary)',
                    borderColor: 'var(--ds-border)'
                  }}
                >
                  ETS 2024 (10 Đề • Test 01 - 10)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSeries('ETS2026')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                    selectedSeries === 'ETS2026' ? 'shadow-sm ring-2 ring-[var(--ds-primary)]' : 'border'
                  }`}
                  style={{
                    backgroundColor: selectedSeries === 'ETS2026' ? 'var(--ds-primary)' : 'var(--ds-surface)',
                    color: selectedSeries === 'ETS2026' ? 'var(--ds-surface)' : 'var(--ds-text-primary)',
                    borderColor: 'var(--ds-border)'
                  }}
                >
                  ETS 2026 (10 Đề • Kèm Dictation)
                </button>
              </div>
            </div>

            {/* TESTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map(num => (
                <div
                  key={num}
                  className="rounded-2xl p-5 border shadow-sm space-y-3 transition-all hover:shadow-md hover:border-[var(--ds-primary)]"
                  style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded"
                          style={{ backgroundColor: 'var(--ds-surface-secondary)', color: 'var(--ds-text-primary)' }}>
                      {selectedSeries}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--ds-text-muted)' }}>
                      200 câu • 120 phút
                    </span>
                  </div>

                  <h3 className="font-bold text-lg" style={{ color: 'var(--ds-text-primary)' }}>
                    Test {String(num).padStart(2, '0')}
                  </h3>

                  <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
                    Listening (Part 1-4: 100 câu) & Reading (Part 5-7: 100 câu) đầy đủ đáp án & giải thích AI.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <a
                      href={`/toeic/tests/${selectedSeries}/${num}?mode=part5`}
                      className="flex-1 py-2 rounded-lg text-center font-bold text-xs border hover:bg-[var(--ds-surface-secondary)]"
                      style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-primary)' }}
                    >
                      Part 5
                    </a>
                    <a
                      href={`/toeic/tests/${selectedSeries}/${num}?mode=part6`}
                      className="flex-1 py-2 rounded-lg text-center font-bold text-xs border hover:bg-[var(--ds-surface-secondary)]"
                      style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-primary)' }}
                    >
                      Part 6
                    </a>
                    <a
                      href={`/toeic/tests/${selectedSeries}/${num}?mode=part7`}
                      className="flex-1 py-2 rounded-lg text-center font-bold text-xs border hover:bg-[var(--ds-surface-secondary)]"
                      style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-primary)' }}
                    >
                      Part 7
                    </a>
                  </div>

                  <a
                    href={`/toeic/tests/${selectedSeries}/${num}?mode=full`}
                    className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: 'var(--ds-primary)', color: 'var(--ds-surface)' }}
                  >
                    <span>Luyện Full Đề Thi</span>
                    <span>→</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </main>
      </AppShell2026>
    </>
  );
}
