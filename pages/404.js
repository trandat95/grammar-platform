import Head from "next/head";
import Link from "next/link";
import GrammarProLogo from "../components/ui-2026/GrammarProLogo";
import { MASCOT_PATHS } from "../components/ui-2026/assetMap";

export default function Custom404Page() {
  return (
    <>
      <Head>
        <title>404 — Không tìm thấy trang | GrammarPro.io.vn</title>
        <meta
          name="description"
          content="Trang bạn yêu cầu không tồn tại hoặc đã được di chuyển trên hệ thống GrammarPro.io.vn."
        />
      </Head>

      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--ds-bg)",
          color: "var(--ds-text)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.25rem",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <GrammarProLogo variant="header" />
        </div>

        <section
          style={{
            maxWidth: "520px",
            width: "100%",
            backgroundColor: "var(--ds-card)",
            border: "1px solid var(--ds-card-border)",
            borderRadius: "var(--ds-radius-xl, 16px)",
            padding: "2.25rem 1.75rem",
            boxShadow: "var(--ds-shadow-md)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <img
              src={MASCOT_PATHS.state_404}
              alt="Cú Tri Thức đang tìm trang bị thiếu"
              width={200}
              height={200}
              style={{ width: "200px", height: "200px", objectFit: "contain", display: "block" }}
            />
          </div>

          <span
            style={{
              display: "inline-block",
              padding: "0.25rem 0.7rem",
              borderRadius: "9999px",
              backgroundColor: "var(--ds-accent-bg)",
              border: "1px solid var(--ds-accent-border)",
              color: "var(--ds-accent)",
              fontSize: "0.75rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
            }}
          >
            LỖI 404 • KHÔNG TÌM THẤY TRANG
          </span>

          <h1
            style={{
              margin: "0 0 0.65rem",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--ds-text-heading)",
              lineHeight: 1.3,
            }}
          >
            Úi! Trang bạn tìm hiện không có trên bản đồ
          </h1>

          <p
            style={{
              margin: "0 0 1.5rem",
              fontSize: "0.9rem",
              color: "var(--ds-text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Đường dẫn có thể đã thay đổi hoặc nhập sai. Quay về trang chủ để tiếp tục luyện 12 Chuyên đề Ngữ pháp hoặc 20 Đề TOEIC New Format 2026.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/"
              className="ds-focusable"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.65rem 1.25rem",
                minHeight: "44px",
                borderRadius: "var(--ds-radius-lg, 12px)",
                backgroundColor: "var(--ds-btn-primary)",
                color: "var(--ds-text-on-accent)",
                fontWeight: 700,
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              Về Trang chủ
            </Link>
            <Link
              href="/toeic"
              className="ds-focusable"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.65rem 1.25rem",
                minHeight: "44px",
                borderRadius: "var(--ds-radius-lg, 12px)",
                backgroundColor: "var(--ds-bg-elevated)",
                border: "1px solid var(--ds-border)",
                color: "var(--ds-text)",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              Mở TOEIC AI Hub
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
