import React, { useState } from "react";

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
      label: "🔬 1. Quang Phổ Sentence X-Ray™",
      shortLabel: "🔬 1. Sentence X-Ray™",
      tag: "Giải trong 3s",
    },
    {
      id: "dna",
      label: "🧬 2. Hồ Sơ Error Trap DNA™",
      shortLabel: "🧬 2. Error Trap DNA™",
      tag: "Bắt 15 bẫy tư duy",
    },
    {
      id: "loop",
      label: "🔄 3. Vòng Lặp Câu Sinh Đôi™",
      shortLabel: "🔄 3. Twin-Question Loop™",
      tag: "Tăng điểm có kiểm chứng",
    },
  ];

  const pillars = [
    {
      icon: "🔬",
      title: "X-Ray Ngữ Pháp 12 Chuyên Đề",
      desc: "Tách cấu trúc Chủ-Vị, cụm giới từ gây nhiễu & từ loại ngay trên câu hỏi thay vì bắt bạn học vẹt.",
      stat: "2.939 câu + 215 quy tắc",
      color: "var(--ds-accent)",
      bg: "var(--ds-accent-bg)",
      border: "var(--ds-accent-border)",
    },
    {
      icon: "📐",
      title: "Ma Trận 4 Góc Phần Tư",
      desc: "Đo đồng thời Độ chính xác × Tốc độ phản xạ để tách biệt 'hổng kiến thức gốc' với 'sập bẫy vội vàng'.",
      stat: "IRT 2PL Bayesian AI",
      color: "var(--ds-indigo)",
      bg: "var(--ds-indigo-bg)",
      border: "var(--ds-indigo-border)",
    },
    {
      icon: "🧑‍🏫",
      title: "Gia Sư AI Giải Thích 4 Cấp Độ",
      desc: "Tự động điều chỉnh độ sâu giải thích từ Mất gốc (Beginner) đến Cao cấp 850+ chỉ với 1 lần chạm.",
      stat: "4.000 câu TOEIC 2026",
      color: "var(--ds-purple)",
      bg: "var(--ds-purple-bg)",
      border: "var(--ds-purple-border)",
    },
    {
      icon: "🚀",
      title: "Lộ Trình Vá Lỗ Hổng Khép Kín",
      desc: "Tự động trích xuất Câu Sinh Đôi (Twin Questions) cho đúng các bẫy bạn vừa sai và đo điểm tăng ở đề sau.",
      stat: "Kiểm chứng Verified Delta",
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
          background: "linear-gradient(90deg, var(--ds-accent) 0%, #06b6d4 50%, var(--ds-indigo) 100%)",
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
            }}
          >
            ✨ CÔNG NGHỆ ĐỘC QUYỀN TẠI GRAMMARPRO.IO.VN • AI DATA SCIENCE ENGINE
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap", fontSize: "0.74rem", fontWeight: 700, color: "var(--ds-text-muted)" }}>
            <span style={{ padding: "0.2rem 0.55rem", borderRadius: "999px", backgroundColor: "var(--ds-success-bg)", color: "var(--ds-success)", border: "1px solid var(--ds-success-border)" }}>
              ⚡ X3 Tốc Độ Hiểu Bản Chất
            </span>
            <span style={{ padding: "0.2rem 0.55rem", borderRadius: "999px", backgroundColor: "var(--ds-bg-elevated)", border: "1px solid var(--ds-border)" }}>
              📊 6.939+ Dữ Liệu Phân Tích Sâu
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
          Tại Sao Học Ngữ Pháp &amp; Luyện Đề Cùng AI Giúp Bạn Tăng Điểm Nhanh Gấp 3 Lần Cách Học Truyền Thống?
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
          Thay vì học vẹt hàng trăm quy tắc rời rạc hay làm đề xong chỉ thấy con số <em>Đúng / Sai</em> vô hồn,{" "}
          <strong style={{ color: "var(--ds-accent)" }}>GrammarPro.io.vn AI</strong> hoạt động như một{" "}
          <strong>Nhà Khoa Học Dữ Liệu &amp; Bác Sĩ Ngữ Pháp 24/7</strong>: soi chiếu từng lỗi tư duy dưới kính hiển vi, bóc tách công thức câu và thiết kế bài tập đặc trị cho đến khi điểm số của bạn thực sự tăng lên.
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
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--ds-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            ⚡ Bấm Để Xem AI Bóc Tách Thực Tế Trong 0.2 Giây:
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
                  }}
                >
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
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--ds-accent)", textTransform: "uppercase" }}>
                  🔬 Ví Dụ Thực Chiến (Chủ Điểm: Hòa Hợp Chủ Vị &amp; Thì)
                </span>
                <button
                  type="button"
                  onClick={() => setXrayScanActive((prev) => !prev)}
                  className="ds-focusable"
                  style={{
                    padding: "0.28rem 0.7rem",
                    borderRadius: "999px",
                    border: "1px solid var(--ds-accent-border)",
                    backgroundColor: xrayScanActive ? "var(--ds-accent)" : "var(--ds-card)",
                    color: xrayScanActive ? "#ffffff" : "var(--ds-accent)",
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {xrayScanActive ? "✓ Đang bật Tia X-Ray AI (Bấm để tắt)" : "⚡ Bật Tia X-Ray AI Ngay"}
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

            {/* Before vs After Comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>
              <div
                style={{
                  padding: "0.9rem 1rem",
                  borderRadius: "10px",
                  backgroundColor: "var(--ds-danger-bg)",
                  border: "1px solid var(--ds-danger-border)",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--ds-danger)", marginBottom: "0.35rem" }}>
                  ❌ Cách Học Cũ (Mất 45 giây &amp; Dễ Sập Bẫy)
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
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--ds-success)", marginBottom: "0.35rem" }}>
                  ✅ AI Sentence X-Ray™ (3 Giây • Chính Xác 100%)
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
              Hệ thống không chỉ chấm bạn <strong>Đúng hay Sai</strong> — AI đo <strong>từng giây làm bài</strong> và <strong>đáp án nhiễu bạn vừa bấm</strong> để vẽ ra Bản Đồ 4 Góc Phần Tư &amp; chỉ mặt đặt tên đúng <strong>15 bẫy tư duy</strong>:
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.75rem" }}>
              {[
                {
                  badge: "🔴 NGUY CẤP (Sai + >20s)",
                  title: "Lỗ Hổng Kiến Thức Gốc",
                  action: "AI tự mở lại công thức nền tảng & 215 quy tắc ngữ pháp liên kết trực tiếp.",
                  color: "var(--ds-danger)",
                  bg: "var(--ds-danger-bg)",
                  border: "var(--ds-danger-border)",
                },
                {
                  badge: "🟠 BÁO ĐỘNG (Sai + <8s)",
                  title: "Phản Xạ Sập Bẫy Nhanh",
                  action: "Bạn hiểu nhầm bản chất! AI bắt trúng mã bẫy (VD: ERR_SVA_INTERVENING) và chặn lặp lại.",
                  color: "var(--ds-warning)",
                  bg: "var(--ds-warning-bg)",
                  border: "var(--ds-warning-border)",
                },
                {
                  badge: "🟡 CẦN RÈN (Đúng + >18s)",
                  title: "Đúng Nhưng Còn Chậm",
                  action: "Biết làm nhưng tốn thời gian đọc dịch — AI đẩy Speed Drill ép phản xạ xuống dưới 10s.",
                  color: "var(--ds-accent)",
                  bg: "var(--ds-accent-bg)",
                  border: "var(--ds-accent-border)",
                },
                {
                  badge: "🟢 BẢN NĂNG (Đúng + <10s)",
                  title: "Thành Thạo Tuyệt Đối",
                  action: "AI giảm tần suất lặp lại để bạn dồn 100% thời gian vào các chủ điểm kéo điểm cao nhất.",
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
                  <div style={{ fontSize: "0.7rem", fontWeight: 800, color: q.color, marginBottom: "0.25rem" }}>
                    {q.badge}
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
                step: "BƯỚC 01 • CHẨN ĐOÁN",
                title: "Thi Thử & Chấm Điểm IRT 2PL",
                desc: "Làm xong Đề N (hoặc Test Chẩn Đoán 15p), AI tính chính xác năng lực θ và xếp hạng Top 4 chủ điểm đang làm bạn mất nhiều điểm nhất (VD: -65đ).",
                metric: "Phát hiện chính xác lỗ hổng",
                color: "var(--ds-accent)",
                bg: "var(--ds-accent-bg)",
              },
              {
                step: "BƯỚC 02 • ĐẶC TRỊ",
                title: "Khớp Câu Sinh Đôi (Twin Questions)",
                desc: "Sai 1 câu bẫy Part 5/6/7? AI tự động rút ra bộ câu hỏi 'anh em sinh đôi' có cùng cấu trúc bẫy nhưng thay từ vựng để bạn làm lại cho tới khi thông thạo.",
                metric: "Phá vỡ hoàn toàn lỗi lặp",
                color: "var(--ds-warning)",
                bg: "var(--ds-warning-bg)",
              },
              {
                step: "BƯỚC 03 • KIỂM CHỨNG",
                title: "Đo Điểm Tăng Thực Tế Tại Đề N+1",
                desc: "Khi sang Đề N+1, hệ thống tự động đối chiếu chênh lệch điểm Reading (Verified Score Delta) và xác nhận lỗ hổng cũ đã chuyển sang màu xanh 🟢.",
                metric: "Thấy rõ điểm số đi lên",
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
                <span style={{ fontSize: "1.3rem" }} aria-hidden="true">{p.icon}</span>
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
        <div style={{ fontSize: "0.82rem", color: "var(--ds-text-secondary)", fontWeight: 600 }}>
          💡 <strong style={{ color: "var(--ds-text-heading)" }}>Trải nghiệm ngay trong 30 giây:</strong> Tự mình cảm nhận sự khác biệt của công nghệ AI trên bài học đầu tiên.
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleGoStudy}
            className="toeic-btn toeic-btn-primary"
            style={{ fontSize: "0.82rem", padding: "0.55rem 1rem", fontWeight: 800 }}
          >
            🔬 Trải Nghiệm X-Ray Miễn Phí
          </button>
          <button
            type="button"
            onClick={handleGoDiagnostic}
            className="toeic-btn toeic-btn-secondary"
            style={{ fontSize: "0.82rem", padding: "0.55rem 1rem", fontWeight: 700 }}
          >
            🎯 Đo Trình Độ AI (15 Phút)
          </button>
          <button
            type="button"
            onClick={handleGoVip}
            className="toeic-btn toeic-btn-outline"
            style={{ fontSize: "0.82rem", padding: "0.55rem 1rem", fontWeight: 800 }}
          >
            💎 Khám Phá Đặc Quyền VIP
          </button>
        </div>
      </div>
    </section>
  );
}
