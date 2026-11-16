import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppShell2026 from '../../../components/ui-2026/AppShell2026';
import SentenceXRayCard from '../../../components/toeic/SentenceXRayCard';
import { ToeicBadge, ToeicButton } from '../../../components/toeic/ui';
import useGlobalAuth from '../../../hooks/useGlobalAuth';
import useToeicEntitlement from '../../../hooks/useToeicEntitlement';
import ToeicSmartPaywallModal from '../../../components/toeic/premium/ToeicSmartPaywallModal';

export default function RemediationPlanPage() {
  const router = useRouter();
  const { planId } = router.query;
  const globalAuth = useGlobalAuth();
  const entitlement = useToeicEntitlement(globalAuth.currentUser?.id, globalAuth.currentUser?.role);

  const [isLight, setIsLight] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [planData, setPlanData] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!planId || !globalAuth.activeAuthToken) {
      if (!globalAuth.isLoading && !globalAuth.activeAuthToken) {
        setLoading(false);
        setErrorMsg('Vui lòng đăng nhập để truy cập lộ trình vá lỗ hổng cá nhân hóa.');
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMsg('');

    fetch(`/api/toeic/remediation/${planId}`, {
      headers: { Authorization: `Bearer ${globalAuth.activeAuthToken}` },
    })
      .then(r => r.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success) {
          setPlanData(data);
        } else {
          setErrorMsg(data.error || 'Không thể tải lộ trình vá lỗ hổng.');
        }
      })
      .catch(() => {
        if (isMounted) setErrorMsg('Lỗi kết nối khi tải lộ trình.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [planId, globalAuth.activeAuthToken, globalAuth.isLoading]);

  const handleMarkCompleted = async (questionId) => {
    if (!planId || !globalAuth.activeAuthToken) return;
    try {
      const res = await fetch(`/api/toeic/remediation/${planId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${globalAuth.activeAuthToken}`,
        },
        body: JSON.stringify({ questionId }),
      });
      const json = await res.json();
      if (json.success && planData?.plan) {
        setPlanData(prev => ({
          ...prev,
          plan: {
            ...prev.plan,
            completed_question_ids: json.completedQuestionIds,
            progress_percent: json.progressPercent,
            status: json.status,
          },
        }));
      }
    } catch (e) {
      console.warn('Mark remediation completed warning:', e?.message);
    }
  };

  const plan = planData?.plan;
  const dna = planData?.dnaSnapshot;
  const questions = planData?.questions || [];
  const currentQuestion = questions[activeIdx] || null;
  const quadrants = dna?.skill_quadrant_matrix || {};

  return (
    <>
      <Head>
        <title>Lộ Trình Vá Lỗ Hổng Cá Nhân Hóa | GrammarPro.io.vn</title>
      </Head>

      <AppShell2026
        activeView="toeic"
        toeicSubView="tests"
        onSelectView={(v) => {
          if (v === 'toeic') {
            window.location.href = '/toeic';
            return;
          }
          window.location.href = v === 'dashboard' ? '/' : `/?view=${v}`;
        }}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle="Lộ Trình Vá Lỗ Hổng AI"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container">
            <div className="toeic-flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <a
                href="/toeic/tests"
                style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ds-accent)', textDecoration: 'none' }}
              >
                &larr; Quay lại Ngân hàng Đề thi
              </a>
              {plan && (
                <ToeicBadge variant={planData?.isVip ? 'success' : 'warning'}>
                  {planData?.isVip ? '✓ VIP Full Remediation Unlocked' : `Free Preview (${questions.length}/${planData?.totalPrescribedCount} câu)`}
                </ToeicBadge>
              )}
            </div>

            {loading ? (
              <div className="toeic-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--ds-text-muted)' }}>
                Đang khởi tạo Lộ trình Vá Lỗ Hổng Data Science...
              </div>
            ) : errorMsg ? (
              <div className="toeic-card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--ds-danger-border)' }}>
                <p style={{ color: 'var(--ds-danger)', fontWeight: 700 }}>{errorMsg}</p>
                <a href="/toeic/tests" className="toeic-btn toeic-btn-primary">Quay lại</a>
              </div>
            ) : plan && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* HEADER PROGRESS & SCORE TARGET */}
                <div className="toeic-card" style={{ padding: '1.5rem', border: '1.5px solid var(--ds-accent)' }}>
                  <div className="toeic-flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <ToeicBadge variant="primary">🗺️ Cross-Test Remediation Loop • {plan.series} Test {String(plan.source_test_number).padStart(2, '0')} &rarr; Test {String(plan.target_next_test_number).padStart(2, '0')}</ToeicBadge>
                      <h1 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0.5rem 0 0.25rem 0', color: 'var(--ds-text)' }}>
                        Quy Trình Vá Lỗ Hổng &amp; Nâng Điểm Cá Nhân Hóa
                      </h1>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ds-text-secondary)' }}>
                        Mục tiêu: tăng từ <strong>{plan.baseline_reading_score}đ</strong> lên <strong>{plan.target_reading_score}đ</strong> Reading trước khi thi lại Test {String(plan.target_next_test_number).padStart(2, '0')}.
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-text-muted)' }}>Tiến độ hoàn thành</div>
                      <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--ds-accent)' }}>{plan.progress_percent}%</div>
                    </div>
                  </div>

                  {/* 4-QUADRANT MATRIX SUMMARY */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { key: 'CRITICAL_GAP', title: '🔴 Nguy cấp (Sai + Chậm)', color: 'var(--ds-danger)', desc: 'Học lại công thức & drill nền' },
                      { key: 'TRAP_PRONE', title: '🟠 Hay sập bẫy (Sai + Nhanh)', color: 'var(--ds-warning)', desc: 'Phá bẫy bằng Câu Sinh Đôi' },
                      { key: 'SLOW_FLUENCY', title: '🟡 Chưa phản xạ (Đúng + Chậm)', color: 'var(--ds-accent)', desc: 'Tăng tốc phản xạ < 12s' },
                      { key: 'MASTERED', title: '🟢 Thành thạo (Đúng + Nhanh)', color: 'var(--ds-success)', desc: 'Duy trì qua SRS Flashcards' },
                    ].map(qBox => {
                      const list = quadrants[qBox.key] || [];
                      return (
                        <div key={qBox.key} style={{ padding: '0.75rem', borderRadius: 'var(--ds-radius-md)', border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-bg-elevated)' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: qBox.color }}>{qBox.title} ({list.length})</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--ds-text-muted)', marginTop: '0.2rem' }}>{qBox.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* INTERACTIVE REMEDIATION DRILL WORKSPACE */}
                {currentQuestion && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div className="toeic-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--ds-text-muted)', marginRight: '0.25rem' }}>
                        Bài tập đặc trị ({questions.length}/{planData?.totalPrescribedCount}):
                      </span>
                      {questions.map((q, idx) => {
                        const done = (plan.completed_question_ids || []).includes(q.id);
                        const isCur = idx === activeIdx;
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setActiveIdx(idx)}
                            className={`toeic-target-chip ${isCur ? 'active' : ''}`}
                            style={{
                              fontSize: '0.74rem',
                              padding: '0.25rem 0.6rem',
                              borderColor: done && !isCur ? 'var(--ds-success)' : undefined,
                            }}
                          >
                            {done ? '✓ ' : ''}#{idx + 1} ({q.remediationType === 'TWIN_QUESTION' ? 'Twin' : 'Drill'})
                          </button>
                        );
                      })}
                      {planData?.lockedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => entitlement.openPaywall('TRG_04_FULL_MOCK_TEST', { testNumber: plan.source_test_number, series: plan.series })}
                          style={{
                            fontSize: '0.74rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: 'var(--ds-radius-sm)',
                            border: '1px dashed var(--ds-warning)',
                            backgroundColor: 'var(--ds-warning-bg)',
                            color: 'var(--ds-warning)',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          🔒 +{planData.lockedCount} câu VIP
                        </button>
                      )}
                    </div>

                    <SentenceXRayCard
                      key={currentQuestion.id}
                      question={currentQuestion}
                      examMode="practice"
                      onAnswerSubmit={() => handleMarkCompleted(currentQuestion.id)}
                      onNextQuestion={() => {
                        if (activeIdx < questions.length - 1) {
                          setActiveIdx(activeIdx + 1);
                        } else if (planData?.lockedCount > 0) {
                          entitlement.openPaywall('TRG_04_FULL_MOCK_TEST', { testNumber: plan.source_test_number, series: plan.series });
                        }
                      }}
                    />
                  </div>
                )}

                {/* STEP 3: VERIFY AT TEST N+1 */}
                <div className="toeic-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--ds-bg-elevated)' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--ds-text)' }}>
                      🏁 Bước Cuối: Kiểm chứng điểm số tại {plan.series} Test {String(plan.target_next_test_number).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ds-text-secondary)', marginTop: '0.2rem' }}>
                      Hệ thống sẽ tự động đo chênh lệch điểm (Verified Score Delta) ngay khi bạn nộp Test {String(plan.target_next_test_number).padStart(2, '0')}.
                    </div>
                  </div>
                  <a
                    href={`/toeic/tests/${plan.series}/${plan.target_next_test_number}`}
                    className="toeic-btn toeic-btn-primary toeic-cta-wrap"
                    style={{ textDecoration: 'none', fontWeight: 800 }}
                  >
                    Thi Thử Test {String(plan.target_next_test_number).padStart(2, '0')} Ngay &rarr;
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <ToeicSmartPaywallModal
          isOpen={entitlement.paywallState.isOpen}
          onClose={entitlement.closePaywall}
          triggerId={entitlement.paywallState.triggerId}
          context={entitlement.paywallState.context}
        />
      </AppShell2026>
    </>
  );
}
