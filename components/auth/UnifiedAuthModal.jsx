import React, { useState } from 'react';
import FocusTrapModal2026 from '../ui-2026/FocusTrapModal2026';
import AccountProfileCard from './AccountProfileCard';
import GrammarProLogo from '../ui-2026/GrammarProLogo';
import KitIcon from '../ui-2026/KitIcon';
import { MASCOT_PATHS } from '../ui-2026/assetMap';
import { supabase } from '../../lib/supabase/client';

/**
 * UnifiedAuthModal Component
 * Accessible authentication and user profile dialog for all pages.
 * Displays AccountProfileCard when logged in, or Login/Signup form when guest.
 * Strict Design Token Discipline: 100% var(--ds-*).
 */
export default function UnifiedAuthModal({
  isOpen = false,
  onClose,
  currentUser,
  activeAuthToken,
  userTracker,
  savedMistakesCount = 0,
  savedVocabCount = 0,
  onLogin,
  onSignUp,
  onLogout,
  onRefreshUser
}) {
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSwitchForm, setShowSwitchForm] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (error) {
        setErrorMsg(error.message || 'Không thể kết nối Google Sign-In');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg('Lỗi kết nối Google Sign-In');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isGuest = !currentUser || currentUser.isGuest || currentUser.id === 'guest';
  const showProfile = !isGuest && !showSwitchForm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (authTab === 'login') {
        if (!email.trim() || !password) {
          setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu');
          setIsSubmitting(false);
          return;
        }
        const res = await onLogin(email.trim(), password);
        if (!res.success) {
          setErrorMsg(res.error || 'Đăng nhập không thành công');
        } else {
          setShowSwitchForm(false);
        }
      } else {
        if (!name.trim() || !email.trim() || !password) {
          setErrorMsg('Vui lòng điền đầy đủ họ tên, email và mật khẩu');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự');
          setIsSubmitting(false);
          return;
        }
        const res = await onSignUp(email.trim(), password, name.trim());
        if (!res.success) {
          setErrorMsg(res.error || 'Đăng ký không thành công');
        } else {
          setShowSwitchForm(false);
        }
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ xác thực');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FocusTrapModal2026
      id="unified-auth-modal"
      isOpen={isOpen}
      onClose={() => {
        setErrorMsg('');
        setShowSwitchForm(false);
        if (onClose) onClose();
      }}
      title={
        showProfile
          ? 'Hồ sơ Tài khoản, Gói VIP & Tiến độ'
          : authTab === 'login'
          ? 'Đăng nhập tài khoản'
          : 'Đăng ký thành viên mới'
      }
      maxWidth={showProfile ? '580px' : '440px'}
      padding="24px"
    >
      {showProfile ? (
        <div>
          <AccountProfileCard
            currentUser={currentUser}
            authToken={activeAuthToken}
            completedLessonsCount={(userTracker?.completedLessons || []).length}
            totalLessonsCount={53}
            userTracker={userTracker}
            savedMistakesCount={savedMistakesCount}
            savedVocabCount={savedVocabCount}
            isLight={false}
            onOpenVipHub={() => {
              if (onClose) onClose();
              if (typeof window !== 'undefined') window.location.href = '/?view=vip';
            }}
            onOpenGamificationHub={() => {
              if (onClose) onClose();
              if (typeof window !== 'undefined') window.location.href = '/?view=gamification';
            }}
            onSwitchAccount={() => {
              setErrorMsg('');
              setAuthTab('login');
              setShowSwitchForm(true);
            }}
            onLogout={async () => {
              if (onLogout) await onLogout();
              if (onClose) onClose();
            }}
            onEntitlementSync={onRefreshUser}
          />
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.65rem' }}>
            <img
              src={MASCOT_PATHS.welcome}
              alt="Cú Tri Thức GrammarPro"
              width={68}
              height={68}
              style={{ width: '68px', height: '68px', objectFit: 'contain', marginBottom: '0.35rem' }}
            />
            <GrammarProLogo variant="auth" />
          </div>
          {/* 1-Tap Google OAuth CTA */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '0.65rem 1rem',
              marginBottom: '1rem',
              borderRadius: 'var(--ds-radius-md)',
              border: '1px solid var(--ds-border)',
              backgroundColor: 'var(--ds-card)',
              color: 'var(--ds-text)',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              boxShadow: 'var(--ds-shadow-sm)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"/>
            </svg>
            <span>Tiếp tục với Google (1 chạm)</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--ds-border)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>HOẶC DÙNG EMAIL</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--ds-border)' }} />
          </div>

          {/* TAB SWITCHER */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', padding: '0.25rem', backgroundColor: 'var(--ds-bg-elevated)', borderRadius: 'var(--ds-radius-md)', border: '1px solid var(--ds-border)' }}>
            <button
              type="button"
              onClick={() => { setAuthTab('login'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: 'var(--ds-radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                backgroundColor: authTab === 'login' ? 'var(--ds-card)' : 'transparent',
                color: authTab === 'login' ? 'var(--ds-accent)' : 'var(--ds-text-secondary)',
                cursor: 'pointer',
                boxShadow: authTab === 'login' ? 'var(--ds-shadow-sm)' : 'none'
              }}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('register'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: 'var(--ds-radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                backgroundColor: authTab === 'register' ? 'var(--ds-card)' : 'transparent',
                color: authTab === 'register' ? 'var(--ds-accent)' : 'var(--ds-text-secondary)',
                cursor: 'pointer',
                boxShadow: authTab === 'register' ? 'var(--ds-shadow-sm)' : 'none'
              }}
            >
              Đăng Ký
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--ds-radius-md)',
                backgroundColor: 'var(--ds-danger-bg)',
                border: '1px solid var(--ds-danger-border)',
                color: 'var(--ds-danger)',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                <KitIcon name="warning" size={16} />
                <span>{errorMsg}</span>
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {authTab === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--ds-text-secondary)', marginBottom: '0.35rem' }}>
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--ds-radius-md)',
                    border: '1px solid var(--ds-border)',
                    backgroundColor: 'var(--ds-bg-elevated)',
                    color: 'var(--ds-text)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--ds-text-secondary)', marginBottom: '0.35rem' }}>
                Địa chỉ Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--ds-radius-md)',
                  border: '1px solid var(--ds-border)',
                  backgroundColor: 'var(--ds-bg-elevated)',
                  color: 'var(--ds-text)',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--ds-text-secondary)', marginBottom: '0.35rem' }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.6rem 0.65rem 0.85rem',
                    borderRadius: 'var(--ds-radius-md)',
                    border: '1px solid var(--ds-border)',
                    backgroundColor: 'var(--ds-bg-elevated)',
                    color: 'var(--ds-text)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--ds-text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="toeic-btn toeic-btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                marginTop: '0.5rem',
                justifyContent: 'center'
              }}
            >
              {isSubmitting
                ? 'Đang xử lý...'
                : authTab === 'login'
                ? 'Đăng Nhập Tài Khoản'
                : 'Đăng Ký Tài Khoản'}
            </button>

            {!isGuest && showSwitchForm && (
              <button
                type="button"
                onClick={() => setShowSwitchForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ds-accent)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  marginTop: '0.25rem'
                }}
              >
                &larr; Quay lại hồ sơ tài khoản
              </button>
            )}
          </form>
        </div>
      )}
    </FocusTrapModal2026>
  );
}
