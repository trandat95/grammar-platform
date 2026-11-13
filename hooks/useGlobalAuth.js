import { useState, useEffect, useCallback } from 'react';
import {
  supabase,
  signInWithSupabase,
  signUpWithSupabase,
  signOutSupabase,
  getProfile,
  getTracker
} from '../lib/supabase/client';

const GUEST_USER = {
  id: 'guest',
  name: 'Khách (Chưa đăng nhập)',
  email: 'guest@grammarpro.com',
  role: 'FREE',
  status: 'ACTIVE',
  createdAt: '2026-11-11',
  isGuest: true,
};

const DEFAULT_TRACKER = {
  streak: 0,
  xp: 0,
  completedLessons: [],
  quizzesCompletedToday: 0
};

/**
 * useGlobalAuth Hook
 * Provides shared real-time user authentication, Supabase profile sync,
 * learning tracker (Streak, XP), and modal controls across all pages.
 */
export default function useGlobalAuth() {
  const [currentUser, setCurrentUser] = useState(GUEST_USER);
  const [activeAuthToken, setActiveAuthToken] = useState(null);
  const [userTracker, setUserTracker] = useState(DEFAULT_TRACKER);
  const [savedMistakesCount, setSavedMistakesCount] = useState(0);
  const [savedVocabCount, setSavedVocabCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session from Supabase
  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setActiveAuthToken(session.access_token || null);

        // Fetch user profile from Supabase
        const profile = await getProfile(session.user.id).catch(() => null);

        const loadedUser = {
          id: session.user.id,
          name: profile?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Học viên',
          email: session.user.email || profile?.email || '',
          role: profile?.role || 'FREE',
          status: profile?.status || 'ACTIVE',
          createdAt: profile?.created_at || session.user.created_at || '2026-11-11',
          isGuest: false
        };

        setCurrentUser(loadedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('grammar_active_user_id', session.user.id);
          localStorage.setItem('ge_user_role', loadedUser.role);
        }

        // Fetch tracker
        const tracker = await getTracker(session.user.id).catch(() => null);
        if (tracker) {
          setUserTracker(tracker);
        } else if (typeof window !== 'undefined') {
          try {
            const localTrk = JSON.parse(localStorage.getItem(`grammar_tracker_${session.user.id}`) || 'null');
            if (localTrk) setUserTracker(localTrk);
          } catch (e) {}
        }
      } else {
        // Fallback to local guest profile
        setCurrentUser(GUEST_USER);
        setActiveAuthToken(null);
        if (typeof window !== 'undefined') {
          const storedUserId = localStorage.getItem('grammar_active_user_id');
          if (storedUserId && storedUserId !== 'guest') {
            try {
              const localTrk = JSON.parse(localStorage.getItem(`grammar_tracker_${storedUserId}`) || 'null');
              if (localTrk) setUserTracker(localTrk);
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.warn('[useGlobalAuth] Error resolving session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Listen to Supabase Auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        refreshUser();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(GUEST_USER);
        setActiveAuthToken(null);
        setUserTracker(DEFAULT_TRACKER);
        if (typeof window !== 'undefined') {
          localStorage.setItem('grammar_active_user_id', 'guest');
          localStorage.setItem('ge_user_role', 'FREE');
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [refreshUser]);

  // Load counts from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const uid = currentUser?.id || 'guest';
      const mistakes = JSON.parse(localStorage.getItem(`grammar_mistakes_${uid}`) || '[]');
      const vocab = JSON.parse(localStorage.getItem(`grammar_vocab_${uid}`) || '[]');
      setSavedMistakesCount(Array.isArray(mistakes) ? mistakes.length : 0);
      setSavedVocabCount(Array.isArray(vocab) ? vocab.length : 0);
    } catch (e) {}
  }, [currentUser?.id]);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const handleLogin = async (email, password) => {
    const res = await signInWithSupabase(email, password);
    if (res.success) {
      await refreshUser();
      closeAuthModal();
      return { success: true };
    }
    return { success: false, error: res.error || 'Đăng nhập không thành công' };
  };

  const handleSignUp = async (email, password, name) => {
    const res = await signUpWithSupabase(email, password, { full_name: name });
    if (res.success) {
      await refreshUser();
      closeAuthModal();
      return { success: true };
    }
    return { success: false, error: res.error || 'Đăng ký không thành công' };
  };

  const handleLogout = async () => {
    await signOutSupabase().catch(() => {});
    setCurrentUser(GUEST_USER);
    setActiveAuthToken(null);
    setUserTracker(DEFAULT_TRACKER);
    closeAuthModal();
  };

  return {
    currentUser,
    activeAuthToken,
    userTracker,
    savedMistakesCount,
    savedVocabCount,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    handleLogin,
    handleSignUp,
    handleLogout,
    refreshUser,
    isLoading,
    syncState: { status: 'synced', pendingCount: 0 }
  };
}
