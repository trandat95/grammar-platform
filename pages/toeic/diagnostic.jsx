import React, { useState } from 'react';
import Head from 'next/head';
import AppShell2026 from '../../components/ui-2026/AppShell2026';
import ToeicDiagnosticSession from '../../components/toeic/ToeicDiagnosticSession';

export default function ToeicDiagnosticPage() {
  const [isLight, setIsLight] = useState(true);

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

  return (
    <>
      <Head>
        <title>Kiểm Tra Năng Lực TOEIC 3 Chặng Thích Ứng (AI IRT 3PL) | Grammar Engine</title>
        <meta name="description" content="Đánh giá năng lực ngữ pháp TOEIC chính xác theo mô hình IRT 3PL & Radar 6 trục năng lực." />
      </Head>

      <AppShell2026
        activeView="toeic"
        toeicSubView="diagnostic"
        onSelectView={handleSelectView}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle="TOEIC AI Diagnostic Test"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container">
            {/* BACK LINK */}
            <div style={{ marginBottom: '1rem' }}>
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
            </div>

            <ToeicDiagnosticSession
              userId="student_user"
              targetScore={650}
              onFinish={(res) => {
                console.log('Diagnostic finished:', res);
              }}
            />
          </div>
        </div>
      </AppShell2026>
    </>
  );
}
