import React, { useState } from 'react';
import Head from 'next/head';
import AppShell2026 from '../../components/ui-2026/AppShell2026';
import ToeicDiagnosticSession from '../../components/toeic/ToeicDiagnosticSession';

export default function ToeicDiagnosticPage() {
  const [isLight, setIsLight] = useState(true);

  return (
    <>
      <Head>
        <title>Kiểm Tra Năng Lực TOEIC 3 Chặng Thích Ứng (AI IRT 3PL) | Grammar Engine</title>
        <meta name="description" content="Đánh giá năng lực ngữ pháp TOEIC chính xác theo mô hình IRT 3PL & Radar 6 trục năng lực." />
      </Head>

      <AppShell2026
        activeView="diagnostic"
        onSelectView={(v) => {
          if (v === 'dashboard') window.location.href = '/';
          else if (v === 'study') window.location.href = '/';
          else if (v === 'vip') window.location.href = '/';
          else if (v === 'gamification') window.location.href = '/';
        }}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle="TOEIC AI Diagnostic Test"
      >
        <main className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--ds-background)' }}>
          <div className="max-w-5xl mx-auto">
            {/* BACK LINK */}
            <div className="mb-4">
              <a
                href="/toeic"
                className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                style={{ color: 'var(--ds-primary)' }}
              >
                <span>← Quay lại TOEIC Hub</span>
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
        </main>
      </AppShell2026>
    </>
  );
}
