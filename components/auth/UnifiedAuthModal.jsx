import React, { useState } from 'react';
import FocusTrapModal2026 from '../ui-2026/FocusTrapModal2026';
import AccountProfileCard from './AccountProfileCard';

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
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSwitchForm, setShowSwitchForm] = useState(false);

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
              ⚠️ {errorMsg}
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
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
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
