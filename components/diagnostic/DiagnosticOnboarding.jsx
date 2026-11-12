import React from "react";
import { BANNER_PATHS } from "../ui-2026/assetMap";

export default function DiagnosticOnboarding({
  onStartTest,
  hasExistingRoadmap,
  onViewRoadmap,
  T,
  isLight,
}) {
  return (
    <div
      style={{
        maxWidth: "920px",
        margin: "0 auto",
        padding: "2rem 1.25rem",
      }}
    >
      {/* Hero Card with 2026 Editorial Diagnostic Banner */}
      <div
        className="ge-hero-banner-card"
        style={{
          padding: "2rem",
          border: `1px solid ${T.accentBorder}`,
          boxShadow: T.shadowElevated,
        }}
      >
        <img
          src={BANNER_PATHS.diagnostic}
          alt="Học viên Việt Nam và Cố vấn quốc tế phân tích Knowledge Graph"
          className="ge-hero-banner-bg"
        />
        <div className="ge-hero-banner-scrim" />
        <div className="ge-hero-banner-content">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0.3rem 0.75rem",
                borderRadius: "9999px",
                backgroundColor: T.accentBg,
                color: T.accent,
                border: `1px solid ${T.accentBorder}`,
              }}
            >
              🎯 Milestone 2.8 • Central EdTech Engine
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: T.textMuted,
              }}
            >
              2-Tier Zero-Hallucination Diagnostic
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(1.45rem, 2.8vw, 2rem)",
              fontWeight: 800,
              color: T.textHeading,
              lineHeight: 1.25,
              marginBottom: "1rem",
              maxWidth: "680px",
            }}
          >
            Khám Phá Trình Độ Ngữ Pháp &amp; Thiết Lập Lộ Trình Học Cá Nhân Hóa
          </h1>

          <p
            style={{
              fontSize: "1rem",
              color: T.textSecondary,
              lineHeight: 1.6,
              maxWidth: "680px",
              marginBottom: "2rem",
            }}
          >
            Thay vì tự học mò mẫm trong 53 bài học, hãy để hệ thống đánh giá khách quan trình độ ngữ pháp của bạn,
            chẩn đoán chính xác từng chuyên đề yếu và tự động thiết kế lộ trình học tập đo ni đóng giày riêng cho bạn.
          </p>

          {/* 4 Feature Badges */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
              gap: "0.85rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                padding: "0.95rem",
                borderRadius: "0.75rem",
                backgroundColor: T.card,
                border: `1px solid ${T.borderSubtle}`,
              }}
            >
              <div style={{ fontSize: "1.4rem", marginBottom: "0.25rem" }}>📝</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: T.text }}>30 Câu trắc nghiệm</div>
              <div style={{ fontSize: "0.78rem", color: T.textMuted }}>Cân đối 10 Dễ • 12 TB • 8 Khó</div>
            </div>

            <div
              style={{
                padding: "0.95rem",
                borderRadius: "0.75rem",
                backgroundColor: T.card,
                border: `1px solid ${T.borderSubtle}`,
              }}
            >
              <div style={{ fontSize: "1.4rem", marginBottom: "0.25rem" }}>⏱️</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: T.text }}>15 – 20 Phút</div>
              <div style={{ fontSize: "0.78rem", color: T.textMuted }}>Thoải mái thời gian, không trừ điểm</div>
            </div>

            <div
              style={{
                padding: "0.95rem",
                borderRadius: "0.75rem",
                backgroundColor: T.card,
                border: `1px solid ${T.borderSubtle}`,
              }}
            >
              <div style={{ fontSize: "1.4rem", marginBottom: "0.25rem" }}>🎯</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: T.text }}>10 Nhóm kiến thức</div>
              <div style={{ fontSize: "0.78rem", color: T.textMuted }}>Độ tin cậy &amp; ma trận kỹ năng</div>
            </div>

            <div
              style={{
                padding: "0.95rem",
                borderRadius: "0.75rem",
                backgroundColor: T.card,
                border: `1px solid ${T.borderSubtle}`,
              }}
            >
              <div style={{ fontSize: "1.4rem", marginBottom: "0.25rem" }}>🗺️</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: T.text }}>Lộ trình 4 Tuần</div>
              <div style={{ fontSize: "0.78rem", color: T.textMuted }}>Khắc phục điểm yếu chí mạng</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={onStartTest}
              className="ds-btn ds-focusable"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.85rem 1.8rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--ds-btn-primary)",
                color: "#ffffff",
                fontSize: "1rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                boxShadow: T.shadow,
              }}
            >
              <span>Bắt đầu bài kiểm tra chẩn đoán</span>
              <span style={{ fontSize: "1.2rem" }}>➔</span>
            </button>

            {hasExistingRoadmap && (
              <button
                type="button"
                onClick={onViewRoadmap}
                className="ds-btn ds-focusable"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.85rem 1.4rem",
                  borderRadius: "0.75rem",
                  backgroundColor: T.card,
                  color: T.text,
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  border: `1px solid ${T.border}`,
                  cursor: "pointer",
                }}
              >
                <span>Xem lại Lộ trình cá nhân hóa</span>
                <span>🗺️</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Blueprint Breakdown Table */}
      <div
        style={{
          marginTop: "2rem",
          backgroundColor: T.card,
          borderRadius: "1rem",
          padding: "1.75rem",
          border: `1px solid ${T.cardBorder}`,
          boxShadow: T.shadow,
        }}
      >
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: T.text, marginBottom: "0.5rem" }}>
          Ma Trận Đánh Giá 10 Nhóm Kiến Thức Ngữ Pháp Chuẩn Hóa
        </h2>
        <p style={{ fontSize: "0.875rem", color: T.textMuted, marginBottom: "1.25rem" }}>
          Được trích xuất từ 2.939 câu hỏi giáo trình chuẩn Mai Lan Hương &amp; Hà Thanh Uyên, phân bổ cân đối theo độ khó.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}`, textAlign: "left" }}>
                <th style={{ padding: "0.75rem", color: T.textMuted }}>Chuyên đề</th>
                <th style={{ padding: "0.75rem", color: T.textMuted, textAlign: "center" }}>Số câu</th>
                <th style={{ padding: "0.75rem", color: T.textMuted, textAlign: "center" }}>Tỷ lệ</th>
                <th style={{ padding: "0.75rem", color: T.textMuted }}>Phân bổ độ khó</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Các thì trong tiếng Anh (Tenses)", count: 6, pct: "20%", diff: "2 Dễ • 3 Trung bình • 1 Khó" },
                { name: "Câu bị động (Passive Voice)", count: 3, pct: "10%", diff: "1 Dễ • 1 Trung bình • 1 Khó" },
                { name: "Câu điều kiện (Conditionals)", count: 3, pct: "10%", diff: "1 Dễ • 1 Trung bình • 1 Khó" },
                { name: "Động từ khuyết thiếu (Modal Verbs)", count: 3, pct: "10%", diff: "1 Dễ • 1 Trung bình • 1 Khó" },
                { name: "Mệnh đề quan hệ (Relative Clauses)", count: 3, pct: "10%", diff: "1 Dễ • 1 Trung bình • 1 Khó" },
                { name: "Lượng từ & Mạo từ (Determiners)", count: 3, pct: "10%", diff: "1 Dễ • 1 Trung bình • 1 Khó" },
                { name: "Giới từ & Cụm từ (Prepositions)", count: 3, pct: "10%", diff: "1 Dễ • 2 Trung bình" },
                { name: "Các dạng So sánh (Comparisons)", count: 2, pct: "7%", diff: "1 Dễ • 1 Trung bình" },
                { name: "Lời nói gián tiếp (Reported Speech)", count: 2, pct: "7%", diff: "1 Trung bình • 1 Khó" },
                { name: "Từ loại & Cấu tạo từ (Word Forms)", count: 2, pct: "6%", diff: "1 Dễ • 1 Khó" },
              ].map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: `1px solid ${T.borderSubtle}`,
                    backgroundColor: idx % 2 === 0 ? "transparent" : T.bgElevated,
                  }}
                >
                  <td style={{ padding: "0.75rem", fontWeight: 600, color: T.text }}>{item.name}</td>
                  <td style={{ padding: "0.75rem", textAlign: "center", color: T.textSecondary }}>{item.count}</td>
                  <td style={{ padding: "0.75rem", textAlign: "center", fontWeight: 700, color: T.accent }}>{item.pct}</td>
                  <td style={{ padding: "0.75rem", color: T.textMuted }}>{item.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
