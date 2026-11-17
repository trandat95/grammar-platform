import React, { useState } from "react";
import KitIcon, { StatusDot } from "./KitIcon";
import { XRAY_PREVIEW_PATH } from "./assetMap";

/**
 * AiPowerShowcase2026
 * Expert-Marketing Interactive Showcase demonstrating how GrammarPro.io.vn
 * uses AI + Data Science (Sentence X-Ray, Error Trap DNA, IRT 2PL & Twin-Question Loops)
 * to upgrade English grammar and TOEIC scores.
 * 100% var(--ds-*) compliant for Light/Dark Mode + Mobile First.
 */
export default function AiPowerShowcase2026({
  compact = false,
  onNavigateStudy = null,
  onNavigateDiagnostic = null,
  onNavigateVip = null,
}) {
  const [activeTab, setActiveTab] = useState("xray"); // 'xray' | 'dna' | 'loop'
  const [xrayScanActive, setXrayScanActive] = useState(true);

  const handleGoStudy = () => {
    if (onNavigateStudy) {
      onNavigateStudy();
    } else if (typeof window !== "undefined") {
      window.location.href = "/toeic/practice/GRM_POS_NOUN";
    }
  };

  const handleGoDiagnostic = () => {
    if (onNavigateDiagnostic) {
      onNavigateDiagnostic();
    } else if (typeof window !== "undefined") {
      window.location.href = "/toeic/diagnostic";
    }
  };

  const handleGoVip = () => {
    if (onNavigateVip) {
      onNavigateVip();
    } else if (typeof window !== "undefined") {
      window.location.href = "/?view=vip";
    }
  };

  const tabs = [
    {
      id: "xray",
      iconName: "tool-xray",
      label: "1. Soi Cấu Trúc Câu (X-Ray)",
      shortLabel: "1. Soi Câu X-Ray",
      tag: "Giải trong 3s",
    },
    {
      id: "dna",
      iconName: "tool-dna",
      label: "2. Bắt Bệnh Lỗi Hay Sai",
      shortLabel: "2. Lỗi Hay Sai",
      tag: "Tránh mất điểm oan",
    },
    {
      id: "loop",
      iconName: "tool-loop",
      label: "3. Luyện Lại Câu Tương Tự",
      shortLabel: "3. Luyện Câu Tương Tự",
      tag: "Hết sai lần 2",
    },
  ];

  const pillars = [
    {
      iconName: "tool-xray",
      title: "Nhìn Thấu Cấu Trúc Câu",
      desc: "Gạch chân Chủ–Vị, bỏ qua cụm từ gây nhiễu để chọn đúng trong 3 giây thay vì học vẹt.",
      stat: "2.939 câu + 215 mẹo giải",
      color: "var(--ds-accent)",
      bg: "var(--ds-accent-bg)",
      border: "var(--ds-accent-border)",
    },
    {
      iconName: "tool-chart",
      title: "Biết Rõ Mình Yếu Ở Đâu",
      desc: "Đo cả độ đúng lẫn tốc độ làm bài để tách biệt 'chưa hiểu bài' với 'chọn nhầm vì vội'.",
      stat: "Chấm điểm theo độ khó",
      color: "var(--ds-indigo)",
      bg: "var(--ds-indigo-bg)",
      border: "var(--ds-indigo-border)",
    },
    {
      iconName: "tool-spark",
      title: "Giải Thích Dễ Hiểu Theo Trình Độ",
      desc: "Dù đang mất gốc hay ôn mục tiêu 850+, lời giải luôn đi thẳng vào trọng tâm dễ nhớ.",
      stat: "4.000 câu TOEIC 2026",
      color: "var(--ds-purple)",
      bg: "var(--ds-purple-bg)",
      border: "var(--ds-purple-border)",
    },
    {
      iconName: "tool-loop",
      title: "Sai Đâu Luyện Lại Đúng Chỗ Đó",
      desc: "Sai bẫy nào hệ thống đưa ngay câu cùng dạng để bạn làm lại tới khi chắc tay và thấy điểm tăng.",
      stat: "Kiểm chứng qua từng đề",
      color: "var(--ds-success)",
      bg: "var(--ds-success-bg)",
      border: "var(--ds-success-border)",
    },
  ];

  return (
    <section
      aria-label="Công nghệ AI & Data Science tại GrammarPro.io.vn"
      style={{
        position: "relative",
        borderRadius: "16px",
        border: "1px solid var(--ds-card-border)",
        background: "linear-gradient(180deg, var(--ds-card) 0%, var(--ds-bg-elevated) 100%)",
        boxShadow: "var(--ds-shadow-md)",
        padding: compact ? "1.35rem 1.25rem" : "1.85rem 1.75rem",
        marginBottom: "1.5rem",
        overflow: "clip",
      }}
    >
      {/* Subtle Top Glow Strip */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, var(--ds-accent) 0%, var(--ds-cyan) 50%, var(--ds-indigo) 100%)",
        }}
      />

      {/* 1. HERO VALUE HOOK */}
      <div style={{ marginBottom: "1.35rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.65rem", marginBottom: "0.65rem" }}>
          <span
            className="ge-domain-pill"
            style={{
              fontSize: "0.7rem",
              padding: "0.28rem 0.75rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.38rem",
            }}
          >
            <KitIcon name="tool-spark" size={14} />
            <span>CÁCH HỌC THÔNG MINH TẠI GRAMMARPRO.IO.VN</span>
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap", fontSize: "0.74rem", fontWeight: 700, color: "var(--ds-text-muted)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.32rem", padding: "0.2rem 0.55rem", borderRadius: "999px", backgroundColor: "var(--ds-success-bg)", color: "var(--ds-success)", border: "1px solid var(--ds-success-border)" }}>
              <KitIcon name="bolt" size={13} />
              <span>Hiểu bản chất trong 3 giây</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.32rem", padding: "0.2rem 0.55rem", borderRadius: "999px", backgroundColor: "var(--ds-bg-elevated)", border: "1px solid var(--ds-border)" }}>
              <KitIcon name="tool-chart" size={13} />
              <span>6.939+ câu hỏi có giải thích chi tiết</span>
            </span>
          </div>
        </div>

        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: compact ? "1.28rem" : "1.55rem",
            fontWeight: 900,
            lineHeight: 1.3,
            color: "var(--ds-text-heading)",
            margin: "0 0 0.55rem 0",
            letterSpacing: "-0.02em",
          }}
        >
          Vì Sao Luyện Ngữ Pháp Với AI Giúp Bạn Hết Sai Lặp Lại?
        </h2>

        <p
          style={{
            fontSize: "0.88rem",
            lineHeight: 1.6,
            color: "var(--ds-text-secondary)",
            margin: 0,
            maxWidth: "860px",
          }}
        >
          Thay vì làm bài xong chỉ thấy <em>Đúng / Sai</em> rồi quên ngay,{" "}
          <strong style={{ color: "var(--ds-accent)" }}>GrammarPro.io.vn</strong> chỉ thẳng chỗ trống cần điền từ loại gì, bạn hay vướng bẫy nào và đưa ngay bài tương tự để sửa dứt điểm từng lỗi sai.
        </p>
      </div>

      {/* 2. INTERACTIVE 3-TAB LIVE AI DEMO */}
      <div
        style={{
          backgroundColor: "var(--ds-card)",
          border: "1px solid var(--ds-card-border)",
          borderRadius: "14px",
          padding: "1.1rem",
          marginBottom: "1.35rem",
          boxShadow: "var(--ds-shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.85rem" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--ds-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", gap: "0.38rem" }}>
            <KitIcon name="bolt" size={14} />
            <span>Bấm Để Xem AI Bóc Tách Thực Tế Trong 0.2 Giây:</span>
          </span>

          <div className="toeic-h-scroll-strip" role="tablist" aria-label="Demo Công Nghệ AI">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`toeic-target-chip ${isActive ? "active" : ""}`}
                  style={{
                    fontSize: "0.78rem",
                    padding: "0.38rem 0.85rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <KitIcon name={tab.iconName} size={15} />
                  <span className="ge-hide-mobile">{tab.label}</span>
                  <span className="ge-show-mobile-only">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: SENTENCE X-RAY LIVE VISUALIZER */}
        {activeTab === "xray" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {/* Interactive Live Sentence Box */}
            <div
              style={{
                padding: "1rem 1.15rem",
                borderRadius: "12px",
                backgroundColor: "var(--ds-bg-elevated)",
                border: `1.5px solid ${xrayScanActive ? "var(--ds-accent)" : "var(--ds-border)"}`,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.65rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--ds-accent)", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                  <KitIcon name="microscope" size={14} />
                  <span>Ví Dụ Thực Chiến (Chủ Điểm: Hòa Hợp Chủ Vị &amp; Thì)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setXrayScanActive((prev) => !prev)}
                  className="ds-focusable"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.28rem 0.7rem",
                    borderRadius: "999px",
                    border: "1px solid var(--ds-accent-border)",
                    backgroundColor: xrayScanActive ? "var(--ds-accent)" : "var(--ds-card)",
                    color: xrayScanActive ? "var(--ds-text-on-accent)" : "var(--ds-accent)",
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  <KitIcon name={xrayScanActive ? "check-circle" : "bolt"} size={14} style={{ color: xrayScanActive ? "var(--ds-text-on-accent)" : undefined }} />
                  <span>{xrayScanActive ? "Đang bật Tia X-Ray AI (Bấm để tắt)" : "Bật Tia X-Ray AI Ngay"}</span>
                </button>
              </div>

              <div
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.8,
                  fontWeight: 600,
                  color: "var(--ds-text)",
                  wordBreak: "break-word",
                }}
              >
                {xrayScanActive ? (
                  <>
                    <mark
                      style={{
                        backgroundColor: "var(--ds-accent-bg)",
                        color: "var(--ds-accent)",
                        border: "1px solid var(--ds-accent-border)",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "6px",
                        fontWeight: 800,
                      }}
                      title="Chủ ngữ chính (Danh từ tập hợp - Số ít)"
                    >
                      The board [Chủ ngữ chính • Số ít]
                    </mark>{" "}
                    <span
                      style={{
                        textDecoration: "line-through",
                        opacity: 0.55,
                        padding: "0.1rem 0.35rem",
                        borderRadius: "4px",
                        backgroundColor: "var(--ds-danger-bg)",
                        color: "var(--ds-danger)",
                        fontSize: "0.92rem",
                      }}
                      title="Cụm giới từ gây nhiễu — AI tự động loại bỏ"
                    >
                      of directors (Bẫy nhiễu)
                    </span>{" "}
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.12rem 0.6rem",
                        margin: "0 0.25rem",
                        borderRadius: "6px",
                        backgroundColor: "var(--ds-success-bg)",
                        color: "var(--ds-success)",
                        border: "1.5px solid var(--ds-success)",
                        fontWeight: 800,
                      }}
                    >
                      approved ✓
                    </span>{" "}
                    the revised budget proposal{" "}
                    <mark
                      style={{
                        backgroundColor: "var(--ds-warning-bg)",
                        color: "var(--ds-warning)",
                        border: "1px solid var(--ds-warning-border)",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "6px",
                        fontWeight: 800,
                      }}
                      title="Mốc thời gian Quá khứ đơn"
                    >
                      yesterday [Neo Quá khứ]
                    </mark>
                    .
                  </>
                ) : (
                  <>
                    The board of directors{" "}
                    <span
                      style={{
                        display: "inline-block",
                        minWidth: "72px",
                        borderBottom: "2px solid var(--ds-border-strong)",
                        textAlign: "center",
                        color: "var(--ds-text-muted)",
                      }}
                    >
                      [ _____ ]
                    </span>{" "}
                    the revised budget proposal yesterday.{" "}
                    <span style={{ fontSize: "0.82rem", color: "var(--ds-text-muted)", fontWeight: 500 }}>
                      (A. approve | B. approved | C. approves | D. approving)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* M4.4B Vector X-Ray Architecture Preview */}
            <div
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid var(--ds-border)",
                backgroundColor: "var(--ds-bg)",
                padding: "0.5rem",
              }}
            >
              <img
                src={XRAY_PREVIEW_PATH}
                alt="Sơ đồ phân tích cấu trúc câu Sentence X-Ray GrammarPro"
                width={600}
                height={280}
                loading="lazy"
                style={{ width: "100%", height: "auto", maxHeight: "240px", objectFit: "contain", display: "block", margin: "0 auto", aspectRatio: "600 / 280" }}
              />
            </div>

            {/* Before vs After Comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "0.85rem" }}>
              <div
                style={{
                  padding: "0.9rem 1rem",
                  borderRadius: "10px",
                  backgroundColor: "var(--ds-danger-bg)",
                  border: "1px solid var(--ds-danger-border)",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--ds-danger)", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.38rem" }}>
                  <KitIcon name="danger" size={15} />
                  <span>Cách Học Cũ (Mất 45 giây &amp; Dễ Sập Bẫy)</span>
                </div>
                <p style={{ fontSize: "0.81rem", color: "var(--ds-text-secondary)", lineHeight: 1.5, margin: 0 }}>
                  Đọc dịch từng chữ từ đầu tới cuối → nhìn thấy <strong>&ldquo;directors&rdquo;</strong> đứng ngay trước chỗ trống liền chọn nhầm động từ số nhiều <strong>(A) approve</strong>, bỏ quên mốc <em>yesterday</em> và mất 45 giây quý giá.
                </p>
              </div>

              <div
                style={{
                  padding: "0.9rem 1rem",
                  borderRadius: "10px",
                  backgroundColor: "var(--ds-success-bg)",
                  border: "1px solid var(--ds-success-border)",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--ds-success)", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.38rem" }}>
                  <KitIcon name="check-circle" size={15} />
                  <span>AI Sentence X-Ray™ (3 Giây • Chính Xác 100%)</span>
                </div>
                <p style={{ fontSize: "0.81rem", color: "var(--ds-text-secondary)", lineHeight: 1.5, margin: 0 }}>
                  Quét tia X-Ray khóa ngay <strong>Chủ ngữ thật (The board)</strong>, gạch chéo cụm giới từ nhiễu <em>of directors</em> và tô sáng từ neo <strong>yesterday</strong> → Chọn <strong>(B) approved</strong> tức thì không cần dịch!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ERROR TRAP DNA + 4-QUADRANT MATRIX */}
        {activeTab === "dna" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ fontSize: "0.83rem", color: "var(--ds-text-secondary)", lineHeight: 1.55 }}>
              Hệ thống không chỉ chấm <strong>Đúng hay Sai</strong> — AI ghi nhận <strong>thời gian suy nghĩ</strong> và <strong>đáp án bạn chọn nhầm</strong> để chia rõ 4 nhóm nguyên nhân mất điểm:
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.75rem" }}>
              {[
                {
                  dotTone: "danger",
                  badge: "CẦN ÔN GẤP (Sai + >20s)",
                  title: "Chưa Nắm Chắc Kiến Thức",
                  action: "Hệ thống mở lại ngay công thức & mẹo nhận biết ngắn gọn để bạn nắm lại từ gốc.",
                  color: "var(--ds-danger)",
                  bg: "var(--ds-danger-bg)",
                  border: "var(--ds-danger-border)",
                },
                {
                  dotTone: "warning",
                  badge: "HAY MẮC BẪY (Sai + <8s)",
                  title: "Làm Nhanh Nhưng Sập Bẫy",
                  action: "Chỉ rõ bạn vừa vướng bẫy gì (như nhầm danh từ số nhiều đứng xen giữa) để lần sau không dính lại.",
                  color: "var(--ds-warning)",
                  bg: "var(--ds-warning-bg)",
                  border: "var(--ds-warning-border)",
                },
                {
                  dotTone: "accent",
                  badge: "CẦN TĂNG TỐC (Đúng + >18s)",
                  title: "Làm Đúng Nhưng Còn Chậm",
                  action: "Bạn hiểu bài nhưng còn dịch lâu — hệ thống đưa bài luyện tốc độ xuống dưới 10 giây.",
                  color: "var(--ds-accent)",
                  bg: "var(--ds-accent-bg)",
                  border: "var(--ds-accent-border)",
                },
                {
                  dotTone: "success",
                  badge: "ĐÃ CHẮC TAY (Đúng + <10s)",
                  title: "Phản Xạ Tự Nhiên",
                  action: "Giảm bớt câu đã quen để bạn dồn thời gian ôn những phần kéo điểm nhiều nhất.",
                  color: "var(--ds-success)",
                  bg: "var(--ds-success-bg)",
                  border: "var(--ds-success-border)",
                },
              ].map((q) => (
                <div
                  key={q.title}
                  style={{
                    padding: "0.85rem 0.95rem",
                    borderRadius: "10px",
                    backgroundColor: q.bg,
                    border: `1px solid ${q.border}`,
                  }}
                >
                  <div style={{ fontSize: "0.7rem", fontWeight: 800, color: q.color, marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <StatusDot tone={q.dotTone} size={8} />
                    <span>{q.badge}</span>
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--ds-text-heading)", marginBottom: "0.3rem" }}>
                    {q.title}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--ds-text-secondary)", lineHeight: 1.45 }}>
                    {q.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TWIN-QUESTION CLOSED LOOP */}
        {activeTab === "loop" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
            {[
              {
                step: "BƯỚC 01 • KIỂM TRA",
                title: "Làm Đề & Đo Trình Độ Thực Tế",
                desc: "Làm xong bài kiểm tra ngắn, hệ thống tính điểm chuẩn theo độ khó từng câu và chỉ ra 4 dạng bài làm bạn mất điểm nhiều nhất.",
                metric: "Biết rõ mình đang mất điểm ở đâu",
                color: "var(--ds-accent)",
                bg: "var(--ds-accent-bg)",
              },
              {
                step: "BƯỚC 02 • SỬA SAI",
                title: "Làm Ngay Câu Tương Tự",
                desc: "Vừa sai 1 câu bẫy Part 5/6/7? Hệ thống đưa ngay bộ câu hỏi cùng cấu trúc bẫy nhưng đổi từ vựng để bạn làm lại cho quen tay.",
                metric: "Không còn sai lặp lại cùng một lỗi",
                color: "var(--ds-warning)",
                bg: "var(--ds-warning-bg)",
              },
              {
                step: "BƯỚC 03 • KIỂM CHỨNG",
                title: "Thấy Điểm Tăng Ở Đề Tiếp Theo",
                desc: "Khi làm sang đề tiếp theo, hệ thống tự so sánh điểm phần Đọc với đề trước để bạn thấy rõ từng phần yếu đã chuyển sang vùng xanh.",
                metric: "Điểm số tăng thật qua từng đề",
                color: "var(--ds-success)",
                bg: "var(--ds-success-bg)",
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  padding: "1rem",
                  borderRadius: "10px",
                  backgroundColor: "var(--ds-bg-elevated)",
                  border: "1px solid var(--ds-border)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "0.55rem",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "0.18rem 0.55rem",
                      borderRadius: "999px",
                      backgroundColor: item.bg,
                      color: item.color,
                      marginBottom: "0.45rem",
                    }}
                  >
                    {item.step}
                  </span>
                  <h4 style={{ fontSize: "0.94rem", fontWeight: 800, color: "var(--ds-text-heading)", margin: "0 0 0.35rem 0" }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--ds-text-secondary)", lineHeight: 1.5, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
                <div style={{ fontSize: "0.74rem", fontWeight: 800, color: item.color, paddingTop: "0.45rem", borderTop: "1px dashed var(--ds-border)" }}>
                  ✓ {item.metric}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. FOUR AI PILLARS BENTO STRIP */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(205px, 1fr))",
          gap: "0.85rem",
          marginBottom: "1.25rem",
        }}
      >
        {pillars.map((p) => (
          <div
            key={p.title}
            style={{
              padding: "0.95rem 1rem",
              borderRadius: "12px",
              backgroundColor: "var(--ds-card)",
              border: "1px solid var(--ds-card-border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.55rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: p.bg,
                    border: `1px solid ${p.border}`,
                    color: p.color,
                  }}
                >
                  <KitIcon name={p.iconName} size={18} />
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    padding: "0.16rem 0.5rem",
                    borderRadius: "999px",
                    backgroundColor: p.bg,
                    color: p.color,
                    border: `1px solid ${p.border}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.stat}
                </span>
              </div>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--ds-text-heading)", margin: "0 0 0.3rem 0" }}>
                {p.title}
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--ds-text-secondary)", lineHeight: 1.48, margin: 0 }}>
                {p.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. CONVERSION ACTION BAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--ds-border-subtle)",
        }}
      >
        <div style={{ fontSize: "0.82rem", color: "var(--ds-text-secondary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.42rem" }}>
          <KitIcon name="bulb" size={16} />
          <span><strong style={{ color: "var(--ds-text-heading)" }}>Trải nghiệm ngay trong 30 giây:</strong> Tự mình cảm nhận sự khác biệt của công nghệ AI trên bài học đầu tiên.</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleGoStudy}
            className="toeic-btn toeic-btn-primary ds-focusable"
            style={{ fontSize: "0.82rem", padding: "0.55rem 1rem", fontWeight: 800 }}
          >
            <KitIcon name="microscope" size={15} style={{ color: "var(--ds-text-on-accent)" }} />
            <span>Trải Nghiệm X-Ray Miễn Phí</span>
          </button>
          <button
            type="button"
            onClick={handleGoDiagnostic}
            className="toeic-btn toeic-btn-secondary ds-focusable"
            style={{ fontSize: "0.82rem", padding: "0.55rem 1rem", fontWeight: 700 }}
          >
            <KitIcon name="target" size={15} />
            <span>Đo Trình Độ AI (15 Phút)</span>
          </button>
          <button
            type="button"
            onClick={handleGoVip}
            className="toeic-btn toeic-btn-outline ds-focusable"
            style={{ fontSize: "0.82rem", padding: "0.55rem 1rem", fontWeight: 800 }}
          >
            <KitIcon name="hub-vip" size={15} />
            <span>Khám Phá Đặc Quyền VIP</span>
          </button>
        </div>
      </div>
    </section>
  );
}
