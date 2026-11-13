import React, { useState } from 'react';

/**
 * AppShell2026.jsx
 * Giải quyết triệt để lỗi P0 Sticky Header 16 phần tử & Sidebar 320px cố định trên Mobile 375px.
 * Gộp 7-8 tab cũ thành 5 Hub nhận thức chính + Mobile Bottom Navigation + Slide-over Chapter Drawer.
 */
export const HUB_ITEMS = [
  { id: 'dashboard', label: 'Tổng quan', icon: '/assets/icons/navigation/hub-01-overview.svg' },
  { id: 'study', label: 'Học & Chẩn đoán', icon: '/assets/icons/navigation/hub-02-study-diagnostic.svg', subViews: ['study', 'diagnostic'] },
  { id: 'quiz', label: 'Luyện tập & Ôn sai', icon: '/assets/icons/navigation/hub-03-practice-quiz.svg', subViews: ['quiz', 'mistakes'] },
  { id: 'gamification', label: 'Thành tích', icon: '/assets/icons/navigation/hub-04-achievements.svg' },
  { id: 'vip', label: 'Nâng cấp VIP', icon: '/assets/icons/navigation/hub-05-vip-diamond.svg', isVip: true },
];

export default function AppShell2026({
  activeView,
  onSelectView,
  userRole = 'FREE',
  streakDays = 14,
  totalXp = 2450,
  syncState = 'SYNCED',
  dictEnabled = true,
  onToggleDict,
  theme = 'dark',
  onToggleTheme,
  vocabCount = 18,
  onOpenVocabModal,
  onOpenAuthModal,
  currentChapterTitle = 'Chương 01: Các thì (13 bài)',
  sidebarContent,
  children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="ge-app-root" data-theme={theme}>
      {/* 1. Sticky Header 56px */}
      <header className="ge-header-2026" role="banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'var(--ds-accent)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
            }}
          >
            G
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
            Grammar Engine
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 9999,
              background: 'var(--ds-accent-bg)',
              color: 'var(--ds-accent)',
              border: '1px solid var(--ds-accent-border)',
            }}
          >
            v1.4 PRO
          </span>
        </div>

        {/* 2. Desktop 5-Hub Segmented Navigation */}
        <nav className="ge-hub-nav" aria-label="Điều hướng chính">
          {HUB_ITEMS.map((hub) => {
            const isActive =
              activeView === hub.id || (hub.subViews && hub.subViews.includes(activeView));
            return (
              <button
                key={hub.id}
                type="button"
                className={`ge-hub-tab ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectView(hub.id)}
              >
                <img src={hub.icon} alt="" width={16} height={16} aria-hidden="true" />
                <span>{hub.label}</span>
              </button>
            );
          })}
          {userRole === 'ADMIN' && (
            <button
              type="button"
              className={`ge-hub-tab ${activeView === 'admin' ? 'is-active' : ''}`}
              style={{ color: 'var(--ds-danger)' }}
              onClick={() => onSelectView('admin')}
            >
              <img
                src="/assets/icons/navigation/hub-06-admin-shield.svg"
                alt=""
                width={16}
                height={16}
                aria-hidden="true"
              />
              <span>Quản trị</span>
            </button>
          )}
        </nav>

        {/* 3. Compact Right Cluster: Sync + Quick Tools + Streak/XP + Account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            title={`Trạng thái đồng bộ IndexedDB: ${syncState}`}
            style={{
              padding: '4px 9px',
              borderRadius: 9999,
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'var(--ds-success-bg)',
              color: 'var(--ds-success)',
              border: '1px solid var(--ds-success-border)',
            }}
          >
            ● {syncState}
          </span>

          <button
            type="button"
            className="ds-btn"
            onClick={onToggleDict}
            aria-pressed={dictEnabled}
            title="Bật/Tắt Click tra từ điển Anh-Việt"
            style={{
              padding: '4px 9px',
              borderRadius: 8,
              fontSize: '0.75rem',
              border: '1px solid var(--ds-card-border)',
              background: dictEnabled ? 'var(--ds-accent-bg)' : 'var(--ds-bg-elevated)',
              color: dictEnabled ? 'var(--ds-accent)' : 'var(--ds-text-muted)',
            }}
          >
            Tra từ: {dictEnabled ? 'BẬT' : 'TẮT'}
          </button>

          <button
            type="button"
            className="ds-btn"
            onClick={onOpenVocabModal}
            style={{
              padding: '4px 9px',
              borderRadius: 8,
              fontSize: '0.75rem',
              border: '1px solid var(--ds-card-border)',
              background: 'var(--ds-bg-elevated)',
              color: 'var(--ds-text)',
            }}
          >
            Sổ từ ({vocabCount})
          </button>

          <button
            type="button"
            className="ds-btn"
            onClick={onToggleTheme}
            aria-label="Đổi giao diện Sáng / Tối"
            style={{
              padding: '4px 8px',
              borderRadius: 8,
              border: '1px solid var(--ds-card-border)',
              background: 'var(--ds-bg-elevated)',
            }}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          <span
            style={{
              padding: '4px 9px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'var(--ds-warning-bg)',
              color: 'var(--ds-warning)',
            }}
          >
            {streakDays} ngày
          </span>

          <span
            style={{
              padding: '4px 9px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'var(--ds-accent-bg)',
              color: 'var(--ds-accent)',
            }}
          >
            {totalXp.toLocaleString()} XP
          </span>

          <button
            type="button"
            onClick={onOpenAuthModal}
            style={{
              padding: '5px 12px',
              borderRadius: 9999,
              fontSize: '0.78rem',
              fontWeight: 700,
              background: 'var(--ds-accent)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Tài khoản
          </button>
        </div>
      </header>

      {/* 4. Mobile/Tablet Sticky Chapter Bar (chỉ hiện khi ở Study mode trên màn < 1024px) */}
      {activeView === 'study' && (
        <div className="ge-mobile-chapter-bar">
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ds-accent)' }}>
            {currentChapterTitle}
          </span>
          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            style={{
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'var(--ds-card)',
              color: 'var(--ds-text)',
              border: '1px solid var(--ds-border)',
            }}
          >
            {drawerOpen ? 'Đóng mục lục ✕' : 'Chọn chuyên đề ☰'}
          </button>
        </div>
      )}

      {/* 5. Main Content Area (2-column in Study View, Centered Container in other views) */}
      {activeView === 'study' ? (
        <div className="ge-study-shell">
          <aside
            id="chapter-sidebar"
            data-no-dict="true"
            className={`ge-chapter-sidebar ${drawerOpen ? 'is-open' : ''}`}
            aria-label="Mục lục 12 Chuyên đề"
          >
            {sidebarContent}
          </aside>
          <main id="learning-content-area" className="ge-study-main">
            {children}
          </main>
        </div>
      ) : (
        <main>{children}</main>
      )}

      {/* 6. Mobile Bottom Navigation Bar (5 Hubs, Touch Target >= 44x44px) */}
      <nav className="ge-mobile-bottom-nav" aria-label="Điều hướng di động">
        {HUB_ITEMS.map((hub) => {
          const isActive =
            activeView === hub.id || (hub.subViews && hub.subViews.includes(activeView));
          return (
            <button
              key={hub.id}
              type="button"
              className={`ge-mobile-nav-item ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectView(hub.id)}
            >
              <img src={hub.icon} alt="" width={20} height={20} aria-hidden="true" />
              <span>{hub.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
