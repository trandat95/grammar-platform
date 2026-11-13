import { useState, useEffect, useCallback } from 'react';
import {
  hasVipPrivilege,
  getMilestoneAccess,
  checkToeicEntitlement,
  TOEIC_FEATURE_KEYS,
  FREE_TIER_LIMITS
} from '../lib/toeic/subscription/toeic-entitlement';
import { supabase } from '../lib/supabase/client';

export function useToeicEntitlement() {
  const [role, setRole] = useState('FREE');
  const [userId, setUserId] = useState('guest_user');
  const [isLoading, setIsLoading] = useState(true);
  const [paywallState, setPaywallState] = useState({
    isOpen: false,
    triggerId: null,
    context: null
  });

  // Resolve user role from Supabase session or localStorage mirror
  useEffect(() => {
    let isMounted = true;

    async function loadRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setUserId(session.user.id);

          // Fetch profile role from Supabase table
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, status')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile && isMounted) {
            setRole(profile.role || 'FREE');
            return;
          }
        }

        // Check local storage mock role for offline/demo if unauthenticated
        if (typeof window !== 'undefined') {
          const storedRole = localStorage.getItem('ge_user_role') || 'FREE';
          if (isMounted) setRole(storedRole);
        }
      } catch (err) {
        console.warn('[useToeicEntitlement] Error loading role:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRole();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && isMounted) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile && isMounted) {
          setRole(profile.role || 'FREE');
        }
      } else if (isMounted) {
        setRole('FREE');
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const isVip = hasVipPrivilege(role);

  const canAccessMilestone = useCallback((milestoneId) => {
    return getMilestoneAccess(milestoneId, role);
  }, [role]);

  const checkFeature = useCallback((featureKey, usageCount = 0) => {
    return checkToeicEntitlement(featureKey, { role, usageCount });
  }, [role]);

  const openPaywall = useCallback((triggerId = 'MANUAL_UPGRADE', context = {}) => {
    setPaywallState({
      isOpen: true,
      triggerId,
      context
    });
  }, []);

  const closePaywall = useCallback(() => {
    setPaywallState({
      isOpen: false,
      triggerId: null,
      context: null
    });
  }, []);

  return {
    role,
    userId,
    isVip,
    isLoading,
    canAccessMilestone,
    checkFeature,
    openPaywall,
    closePaywall,
    paywallState,
    FREE_TIER_LIMITS,
    TOEIC_FEATURE_KEYS
  };
}

export default useToeicEntitlement;
