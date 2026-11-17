import React from "react";
import { BANNER_PATHS, MASCOT_PATHS } from "../ui-2026/assetMap";
import { HeroBannerVisual } from "../ui-2026/EditorialArtwork";
import { KitIcon } from "../ui-2026/KitIcon";

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
          padding: "1.75rem",
          border: `1px solid ${T.accentBorder}`,
          boxShadow: T.shadowElevated,
        }}
      >
        <div
          className="ge-hero-banner-card"
          style={{
            position: "relative",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "1.5rem",
            padding: "1.35rem 1.4rem",
            border: `1px solid ${T.borderSubtle}`,
          }}
        >
          <HeroBannerVisual kind="diagnostic" webpSrc={BANNER_PATHS.diagnostic} />
          <div className="ge-hero-banner-content ge-hero-banner-content--safe">
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
              <img
                src={MASCOT_PATHS.ai_coach}
                alt="Cú Tri Thức AI Chẩn đoán"
                width={56}
                height={56}
                style={{ width: "56px", height: "56px", objectFit: "contain", flexShrink: 0 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
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
                  <KitIcon name="target" size={13} color={T.accent} />
                  <span>Milestone 2.8 • Central EdTech Engine</span>
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
            </div>

            <h1
              style={{
                fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)",
                fontWeight: 800,
                color: T.textHeading,
                lineHeight: 1.25,
                margin: "0 0 0.75rem 0",
              }}
            >
              Khám Phá Trình Độ Ngữ Pháp &amp; Thiết Lập Lộ Trình Học Cá Nhân Hóa
            </h1>

            <p
              style={{
                fontSize: "0.95rem",
                color: T.textSecondary,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Thay vì tự học mò mẫm trong 53 bài học, hãy để hệ thống đánh giá khách quan trình độ ngữ pháp của bạn,
              chẩn đoán chính xác từng chuyên đề yếu và tự động thiết kế lộ trình học tập đo ni đóng giày riêng cho bạn.
            </p>
          </div>
        </div>

        <div>

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
              <div style={{ marginBottom: "0.4rem", color: T.accent }}>
                <KitIcon name="clipboard" size={20} />
              </div>
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
              <div style={{ marginBottom: "0.4rem", color: T.warning }}>
                <KitIcon name="timer" size={20} />
              </div>
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
              <div style={{ marginBottom: "0.4rem", color: T.success }}>
                <KitIcon name="target" size={20} />
              </div>
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
              <div style={{ marginBottom: "0.4rem", color: T.accent }}>
                <KitIcon name="map" size={20} />
              </div>
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
                color: "var(--ds-text-on-accent)",
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
                <KitIcon name="map" size={16} />
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
          Được trích xuất từ 2.939 câu hỏi ngữ pháp học thuật chuẩn hóa, phân bổ cân đối theo độ khó.
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
