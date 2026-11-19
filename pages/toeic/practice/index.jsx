import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AppShell2026 from '../../../components/ui-2026/AppShell2026';
import { KitIcon } from '../../../components/ui-2026/KitIcon';
import useToeicEntitlement from '../../../hooks/useToeicEntitlement';
import { ToeicBadge } from '../../../components/toeic/ui';

export default function ToeicPracticeDirectoryPage() {
  const entitlement = useToeicEntitlement();
  const isVip = entitlement.isVip;
  const [isLight, setIsLight] = useState(true);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bandFilter, setBandFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    fetch('/api/toeic/practice/drill?listTopics=1')
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data?.success && Array.isArray(data.topics)) {
          setTopics(data.topics);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return topics.filter((t) => {
      const band = Number(t.target_score_band || 450);
      if (bandFilter === 'FOUNDATION' && band >= 550) return false;
      if (bandFilter === 'INTERMEDIATE' && (band < 550 || band >= 700)) return false;
      if (bandFilter === 'ADVANCED' && band < 700) return false;
      if (q) {
        const hay = `${t.name_vi || ''} ${t.name_en || ''} ${t.id || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [topics, bandFilter, searchQuery]);

  return (
    <>
      <Head>
        <title>Chọn Dạng Bài Luyện Tập TOEIC (24 Chủ Điểm X-Ray) | GrammarPro</title>
        <meta
          name="description"
          content="Chọn 1 trong 24 dạng bài ngữ pháp TOEIC Part 5-6 để luyện tập chuyên sâu với Sentence X-Ray."
        />
      </Head>

      <AppShell2026
        activeView="toeic"
        toeicSubView="hub"
        onSelectView={(v) => {
          if (v === 'toeic') {
            if (typeof window !== 'undefined') window.location.href = '/toeic';
            return;
          }
          if (typeof window !== 'undefined') {
            window.location.href = v === 'dashboard' ? '/' : `/?view=${v}`;
          }
        }}
        isLight={isLight}
        onToggleTheme={() => setIsLight((prev) => !prev)}
        currentChapterTitle="24 Dạng Bài TOEIC X-Ray"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container" style={{ maxWidth: '1040px' }}>
            {/* Top Back Link & Title */}
            <div style={{ marginBottom: '1rem' }}>
              <Link
                href="/toeic"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: 'var(--ds-accent)',
                  textDecoration: 'none',
                  marginBottom: '0.6rem',
                }}
              >
                <span>&larr; Quay lại TOEIC Hub</span>
              </Link>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ds-text-heading)', margin: '0 0 0.25rem 0' }}>
                    Chọn Dạng Bài Luyện Tập (24 Chủ Điểm X-Ray)
                  </h1>
                  <p style={{ fontSize: '0.86rem', color: 'var(--ds-text-secondary)', margin: 0 }}>
                    Chọn chuyên đề ngữ pháp bạn muốn rèn kỹ năng soi từ khóa nhanh Part 5–6.
                  </p>
                </div>
                <ToeicBadge variant="primary">
                  {filteredTopics.length} / {topics.length || 24} dạng bài
                </ToeicBadge>
              </div>
            </div>

            {/* Filter Bar: Band Chips + Search */}
            <div
              className="toeic-card"
              style={{
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: 'Tất cả (24)' },
                  { id: 'FOUNDATION', label: 'Nền tảng (< 550)' },
                  { id: 'INTERMEDIATE', label: 'Trung cấp (550–650)' },
                  { id: 'ADVANCED', label: 'Nâng cao (700+)' },
                ].map((chip) => {
                  const active = bandFilter === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setBandFilter(chip.id)}
                      style={{
                        minHeight: '36px',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '999px',
                        border: `1px solid ${active ? 'var(--ds-accent)' : 'var(--ds-border)'}`,
                        backgroundColor: active ? 'var(--ds-accent-bg)' : 'var(--ds-card)',
                        color: active ? 'var(--ds-accent)' : 'var(--ds-text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: active ? 800 : 600,
                        cursor: 'pointer',
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '280px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm dạng bài (VD: danh từ, thì, bị động)..."
                  aria-label="Tìm dạng bài TOEIC"
                  style={{
                    width: '100%',
                    minHeight: '38px',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '0.55rem',
                    border: '1px solid var(--ds-border)',
                    backgroundColor: 'var(--ds-bg-elevated)',
                    color: 'var(--ds-text)',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Topics Grid */}
            {isLoading ? (
              <div style={{ minHeight: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ds-text-muted)', fontSize: '0.9rem' }}>
                Đang tải danh sách 24 dạng bài TOEIC...
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="toeic-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ds-text-muted)' }}>
                Không tìm thấy dạng bài phù hợp.
              </div>
            ) : (
              <div className="toeic-grid-3" style={{ gap: '0.85rem' }}>
                {filteredTopics.map((top, idx) => {
                  const band = Number(top.target_score_band || 450);
                  const isFree = band < 550;
                  const fullAccess = isVip || isFree;
                  return (
                    <Link
                      key={top.id || idx}
                      href={`/toeic/practice/${top.id}`}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block', minWidth: 0, maxWidth: '100%' }}
                    >
                      <div
                        className="toeic-topic-card"
                        style={{
                          padding: '1rem 1.05rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.65rem',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                          minWidth: 0,
                          maxWidth: '100%',
                        }}
                      >
                        <div>
                          <div className="toeic-flex-between" style={{ marginBottom: '0.5rem', gap: '0.4rem' }}>
                            <ToeicBadge variant="muted">Band {band}+</ToeicBadge>
                            {fullAccess ? (
                              <ToeicBadge variant="success">{isFree ? 'Miễn phí' : 'VIP'}</ToeicBadge>
                            ) : (
                              <ToeicBadge variant="warning">4 câu thử</ToeicBadge>
                            )}
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ds-text-heading)', lineHeight: 1.4, marginBottom: '0.35rem' }}>
                            {top.name_vi}
                          </div>
                          {top.theory_summary_vi && (
                            <p
                              style={{
                                fontSize: '0.78rem',
                                color: 'var(--ds-text-secondary)',
                                margin: 0,
                                lineHeight: 1.45,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {top.theory_summary_vi}
                            </p>
                          )}
                        </div>

                        <div
                          className="toeic-flex-between"
                          style={{
                            paddingTop: '0.55rem',
                            borderTop: '1px solid var(--ds-border)',
                            fontSize: '0.78rem',
                          }}
                        >
                          <span style={{ color: 'var(--ds-text-muted)', fontWeight: 600 }}>
                            {top.questionCount ? `${top.questionCount} câu X-Ray • ` : ''}Trọng số {top.weight_in_toeic || 0}%
                          </span>
                          <span style={{ color: 'var(--ds-accent)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <KitIcon name="target" size={13} />
                            <span>Luyện ngay &rarr;</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AppShell2026>
    </>
  );
}
