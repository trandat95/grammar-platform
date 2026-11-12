import React, { useState, useEffect } from "react";
import KitIcon from "./KitIcon";
import SyncStatusIndicator from "../sync/SyncStatusIndicator";

/**
 * 5 Cognitive Navigation Hubs consolidating the previous 7-8 header tabs:
 * 1. dashboard (Tổng quan)
 * 2. study | diagnostic (Học & Chẩn đoán)
 * 3. quiz | mistakes (Luyện tập & Ôn sai)
 * 4. gamification (Thành tích)
 * 5. vip (Nâng cấp VIP / ⭐ VIP)
 * + Conditional admin (Quản trị Admin)
 */
export const HUB_ITEMS = [
  { id: "dashboard", label: "Tổng quan", mobileLabel: "Tổng quan", icon: "hub-overview" },
  {
    id: "study",
    label: "Học tập",
    mobileLabel: "Học tập",
    icon: "hub-study",
    subViews: ["study", "diagnostic"],
  },
  {
    id: "quiz",
    label: "Luyện tập",
    mobileLabel: "Luyện tập",
    icon: "hub-practice",
    subViews: ["quiz", "mistakes"],
  },
  { id: "gamification", label: "Thành tích", mobileLabel: "Thành tích", icon: "hub-achievements" },
  { id: "vip", label: "Gói VIP", mobileLabel: "VIP", icon: "hub-vip", isVip: true },
];

export default function AppShell2026({
  activeView,
  onSelectView,
  currentUser,
  userTracker,
  savedMistakesCount = 0,
  savedVocabCount = 0,
  syncState,
  onTriggerSync,
  onPullRemote,
  dictSearchInput = "",
  onDictSearchChange,
  onDictSearchSubmit,
  dictEnabled = true,
  onToggleDict,
  isLight = false,
  onToggleTheme,
  onOpenVocabModal,
  onOpenAuthModal,
  onPrefetchView,
  onStartQuizIfEmpty,
  currentChapterTitle = "Chương 01: Các thì",
  sidebarCollapsed = false,
  onToggleSidebarCollapse,
  sidebarContent,
  children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Automatically close slide-over mobile drawer when switching away from study view
  useEffect(() => {
    if (activeView !== "study") setDrawerOpen(false);
  }, [activeView]);

  const handleSelectHub = (hubId) => {
    if (hubId === "quiz" && onStartQuizIfEmpty) {
      onStartQuizIfEmpty();
    }
    onSelectView(hubId);
  };

  const isAdmin = !currentUser?.isGuest && currentUser?.role === "ADMIN";
  const inStudyOrDiagnostic = activeView === "study" || activeView === "diagnostic";
  const inQuizOrMistakes = activeView === "quiz" || activeView === "mistakes";

  return (
    <div
      className={`ge-app-root ${isLight ? "theme-light" : "theme-dark"}`}
      data-theme={isLight ? "light" : "dark"}
    >
      {/* 1. Sticky Header (56px) */}
      <header className="ge-header-2026" role="banner">
        {/* Left: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              backgroundColor: "var(--ds-btn-primary)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: "0.85rem",
              boxShadow: "var(--ds-shadow-sm)",
            }}
          >
            G
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.92rem",
              letterSpacing: "-0.02em",
              color: "var(--ds-text-heading)",
            }}
          >
            Grammar Engine
          </span>
          <span
            className="ge-hide-laptop-compact"
            style={{
              fontSize: "0.66rem",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: "9999px",
              backgroundColor: "var(--ds-bg-elevated)",
              color: "var(--ds-text-muted)",
              border: "1px solid var(--ds-card-border)",
            }}
          >
            v1.4
          </span>
        </div>

        {/* Center: Desktop 5-Hub Segmented Navigation */}
        <nav className="ge-hub-nav" aria-label="Điều hướng chính">
          {HUB_ITEMS.map((hub) => {
            const isActive =
              activeView === hub.id || (hub.subViews && hub.subViews.includes(activeView));
            const labelText =
              hub.isVip && currentUser?.role === "VIP" ? "⭐ VIP" : hub.label;
            return (
              <button
                key={hub.id}
                type="button"
                className={`ge-hub-tab ds-focusable ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => handleSelectHub(hub.id)}
                onMouseEnter={() => onPrefetchView && onPrefetchView(hub.id)}
                onFocus={() => onPrefetchView && onPrefetchView(hub.id)}
              >
                <KitIcon name={hub.icon} size={15} />
                <span>{labelText}</span>
                {hub.id === "quiz" && savedMistakesCount > 0 && (
                  <span
                    style={{
                      backgroundColor: "var(--ds-btn-danger)",
                      color: "#ffffff",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "1px 5px",
                      borderRadius: "999px",
                      lineHeight: 1.2,
                    }}
                  >
                    {savedMistakesCount}
                  </span>
                )}
              </button>
            );
          })}

          {isAdmin && (
            <button
              type="button"
              className={`ge-hub-tab ds-focusable ${activeView === "admin" ? "is-active" : ""}`}
              aria-current={activeView === "admin" ? "page" : undefined}
              style={{ color: "var(--ds-danger)" }}
              onClick={() => onSelectView("admin")}
            >
              <KitIcon name="hub-admin" size={15} />
              <span>Quản trị</span>
            </button>
          )}
        </nav>

        {/* Right: Quick Tools + Streak/XP + Account */}
        <div className="ge-header-actions">
          <div className="ge-hide-mobile">
            <SyncStatusIndicator
              syncState={syncState}
              isLight={isLight}
              onTriggerSync={onTriggerSync}
              onPullRemote={onPullRemote}
            />
          </div>

          {/* Quick Search Box (Desktop >= 1120px) */}
          <div className="ge-search-wrap" style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: "9px", pointerEvents: "none", display: "inline-flex", color: "var(--ds-text-muted)" }}>
              <KitIcon name="tool-search" size={14} />
            </span>
            <input
              type="text"
              value={dictSearchInput}
              onChange={(e) => onDictSearchChange && onDictSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && dictSearchInput.trim() && onDictSearchSubmit) {
                  onDictSearchSubmit(dictSearchInput.trim());
                }
              }}
              placeholder="Tra từ nhanh..."
              aria-label="Tra từ nhanh"
              className="ds-focusable"
              style={{
                height: "30px",
                padding: "0 10px 0 28px",
                backgroundColor: "var(--ds-card)",
                border: "1px solid var(--ds-border)",
                borderRadius: "999px",
                fontSize: "0.78rem",
                color: "var(--ds-text)",
                width: "112px",
              }}
            />
          </div>

          {/* Click-to-Lookup Dictionary Pill */}
          <button
            type="button"
            onClick={onToggleDict}
            aria-pressed={dictEnabled}
            title={dictEnabled ? "Chế độ click tra từ nhanh đang BẬT" : "Click để bật tra từ nhanh"}
            className="ds-btn ds-focusable ge-hide-tablet"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 9px",
              borderRadius: "999px",
              fontSize: "0.74rem",
              fontWeight: 700,
              border: `1px solid ${dictEnabled ? "var(--ds-success-border)" : "var(--ds-border)"}`,
              backgroundColor: dictEnabled ? "var(--ds-success-bg)" : "var(--ds-bg-elevated)",
              color: dictEnabled ? "var(--ds-success)" : "var(--ds-text-secondary)",
              cursor: "pointer",
            }}
          >
            <KitIcon name="tool-dict" size={14} />
            <span className="ge-hide-laptop-compact">Tra từ: {dictEnabled ? "BẬT" : "TẮT"}</span>
          </button>

          {/* Saved Vocabulary Notebook */}
          <button
            type="button"
            onClick={onOpenVocabModal}
            title="Sổ tay từ vựng đã lưu"
            className="ds-btn ds-focusable ge-hide-mobile"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 9px",
              borderRadius: "999px",
              fontSize: "0.74rem",
              fontWeight: 700,
              border: `1px solid ${savedVocabCount > 0 ? "var(--ds-warning-border)" : "var(--ds-border)"}`,
              backgroundColor: savedVocabCount > 0 ? "var(--ds-warning-bg)" : "var(--ds-bg-elevated)",
              color: savedVocabCount > 0 ? "var(--ds-warning)" : "var(--ds-text-secondary)",
              cursor: "pointer",
            }}
          >
            <KitIcon name="tool-vocab" size={14} />
            <span>{savedVocabCount}</span>
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isLight ? "Chuyển sang giao diện Tối" : "Chuyển sang giao diện Sáng"}
            title={isLight ? "Chuyển sang Dark Mode" : "Chuyển sang Light Mode"}
            className="ds-btn ds-focusable"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "999px",
              border: "1px solid var(--ds-border)",
              backgroundColor: "var(--ds-card)",
              color: "var(--ds-text)",
              fontSize: "0.74rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <KitIcon name={isLight ? "tool-theme-light" : "tool-theme-dark"} size={14} />
            <span className="ge-hide-laptop-compact">{isLight ? "Sáng" : "Tối"}</span>
          </button>

          {/* Streak & XP Pills */}
          <button
            type="button"
            onClick={() => onSelectView("dashboard")}
            title="Chuỗi ngày học liên tiếp"
            className="ds-focusable"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              padding: "4px 8px",
              borderRadius: "999px",
              border: "1px solid var(--ds-warning-border)",
              backgroundColor: "var(--ds-warning-bg)",
              color: "var(--ds-warning)",
              fontSize: "0.74rem",
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span aria-hidden="true">🔥</span>
            <span>{userTracker?.streak || 0}d</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView("dashboard")}
            title="Tổng điểm XP"
            className="ds-focusable ge-hide-tablet"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              padding: "4px 8px",
              borderRadius: "999px",
              border: "1px solid var(--ds-accent-border)",
              backgroundColor: "var(--ds-accent-bg)",
              color: "var(--ds-accent)",
              fontSize: "0.74rem",
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span>{Number(userTracker?.xp || 0).toLocaleString()} XP</span>
          </button>

          {/* Admin Quick Shortcut on Mobile */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onSelectView("admin")}
              aria-label="Mở Bảng điều khiển Admin"
              className="ge-show-mobile-only ds-focusable"
              style={{
                padding: "4px 7px",
                borderRadius: "999px",
                border: "1px solid var(--ds-danger-border)",
                backgroundColor: "var(--ds-danger-bg)",
                color: "var(--ds-danger)",
                cursor: "pointer",
                alignItems: "center",
              }}
            >
              <KitIcon name="hub-admin" size={14} />
            </button>
          )}

          {/* Account / Login Pill */}
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="ds-btn ds-focusable"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 11px",
              borderRadius: "999px",
              backgroundColor: currentUser?.isGuest ? "var(--ds-btn-primary)" : "var(--ds-bg-elevated)",
              color: currentUser?.isGuest ? "#ffffff" : "var(--ds-text)",
              border: currentUser?.isGuest ? "1px solid var(--ds-btn-primary)" : "1px solid var(--ds-border)",
              fontSize: "0.76rem",
              fontWeight: 700,
              cursor: "pointer",
              maxWidth: "130px",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentUser?.isGuest ? "Đăng nhập" : currentUser?.name || "Tài khoản"}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Contextual Segmented Sub-Bar inside Hubs */}
      {inStudyOrDiagnostic && (
        <div className="ge-subnav-bar" data-no-dict="true">
          <div className="ge-subnav-pills" role="tablist" aria-label="Phân khu Học tập">
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "study"}
              onClick={() => onSelectView("study")}
              className={`ge-subnav-btn ds-focusable ${activeView === "study" ? "is-active" : ""}`}
            >
              📖 Bài học ngữ pháp (12 chương)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "diagnostic"}
              onClick={() => onSelectView("diagnostic")}
              className={`ge-subnav-btn ds-focusable ${activeView === "diagnostic" ? "is-active" : ""}`}
            >
              🎯 Kiểm tra trình độ &amp; Lộ trình
            </button>
          </div>

          {activeView === "study" && onToggleSidebarCollapse && (
            <button
              type="button"
              onClick={onToggleSidebarCollapse}
              className="ge-hide-desktop-toggle ds-focusable"
              style={{
                padding: "5px 12px",
                borderRadius: "7px",
                border: "1px solid var(--ds-border)",
                backgroundColor: "var(--ds-card)",
                color: "var(--ds-text-secondary)",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {sidebarCollapsed ? "☰ Hiện mục lục chương" : "◧ Thu gọn mục lục"}
            </button>
          )}
        </div>
      )}

      {inQuizOrMistakes && (
        <div className="ge-subnav-bar" data-no-dict="true">
          <div className="ge-subnav-pills" role="tablist" aria-label="Phân khu Luyện tập">
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "quiz"}
              onClick={() => handleSelectHub("quiz")}
              className={`ge-subnav-btn ds-focusable ${activeView === "quiz" ? "is-active" : ""}`}
            >
              ⚡ Làm đề trắc nghiệm
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "mistakes"}
              onClick={() => onSelectView("mistakes")}
              className={`ge-subnav-btn ds-focusable ${activeView === "mistakes" ? "is-active" : ""}`}
            >
              📓 Sổ tay câu sai ({savedMistakesCount})
            </button>
          </div>
          <div style={{ display: "flex", gap: "6px" }} className="ge-show-mobile-only">
            <button
              type="button"
              onClick={onOpenVocabModal}
              className="ds-focusable"
              style={{
                padding: "4px 10px",
                borderRadius: "7px",
                border: "1px solid var(--ds-warning-border)",
                backgroundColor: "var(--ds-warning-bg)",
                color: "var(--ds-warning)",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ⭐ Sổ từ ({savedVocabCount})
            </button>
          </div>
        </div>
      )}

      {/* 3. Mobile/Tablet Sticky Chapter Bar (only in Study Mode < 1024px) */}
      {activeView === "study" && (
        <div className="ge-mobile-chapter-bar" data-no-dict="true">
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--ds-accent)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentChapterTitle}
          </span>
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="ds-focusable"
            style={{
              padding: "6px 11px",
              borderRadius: "7px",
              fontSize: "0.76rem",
              fontWeight: 700,
              backgroundColor: "var(--ds-card)",
              color: "var(--ds-text)",
              border: "1px solid var(--ds-border)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {drawerOpen ? "Đóng mục lục ✕" : "Chọn chuyên đề ☰"}
          </button>
        </div>
      )}

      {/* 4. Main Content Area */}
      {activeView === "study" ? (
        <div className={`ge-study-shell ${sidebarCollapsed ? "is-collapsed" : ""}`}>
          {drawerOpen && (
            <div
              className="ge-drawer-backdrop"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
          )}
          <aside
            id="chapter-sidebar"
            data-no-dict="true"
            className={`ge-chapter-sidebar ${drawerOpen ? "is-open" : ""}`}
            aria-label="Mục lục 12 Chuyên đề"
            onClick={(e) => {
              // Auto-close slide drawer when choosing a lesson on mobile/tablet
              if (drawerOpen && e.target.closest("[data-lesson-item='true']")) {
                setDrawerOpen(false);
              }
            }}
          >
            {sidebarContent}
          </aside>
          <main id="learning-content-area" data-dict-area="true" className="ge-study-main">
            {children}
          </main>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
      )}

      {/* 5. Mobile Bottom Navigation Bar (5 Cognitive Hubs, Touch Target >= 44x44px) */}
      <nav className="ge-mobile-bottom-nav" aria-label="Điều hướng di động" data-no-dict="true">
        {HUB_ITEMS.map((hub) => {
          const isActive =
            activeView === hub.id || (hub.subViews && hub.subViews.includes(activeView));
          return (
            <button
              key={hub.id}
              type="button"
              className={`ge-mobile-nav-item ds-focusable ${isActive ? "is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleSelectHub(hub.id)}
              style={{ position: "relative" }}
            >
              <KitIcon name={hub.icon} size={19} />
              <span>{hub.mobileLabel}</span>
              {hub.id === "quiz" && savedMistakesCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "18%",
                    backgroundColor: "var(--ds-btn-danger)",
                    color: "#ffffff",
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    padding: "1px 4px",
                    borderRadius: "999px",
                  }}
                >
                  {savedMistakesCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
