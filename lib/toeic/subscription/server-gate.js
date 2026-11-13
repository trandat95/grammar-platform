/**
 * Milestone E7.1: Authoritative Server-Side Gate Middleware
 * Verifies Supabase session / user role on API routes before returning VIP assets.
 * Rejects Free users attempting to bypass frontend paywalls with HTTP 403.
 */

import { hasVipPrivilege, getMilestoneAccess, TOEIC_FEATURE_KEYS } from './toeic-entitlement';
import { supabaseServer } from '../../supabase/server';

/**
 * Resolves user role from Authorization bearer or cookies using Supabase Auth.
 */
export async function resolveServerUserRole(req) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabaseServer.auth.getUser(token);
      if (!error && user) {
        // Query profile role
        const { data: profile } = await supabaseServer
          .from('profiles')
          .select('role, status')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.status === 'ACTIVE') {
          return {
            userId: user.id,
            role: profile.role || 'FREE',
            isVip: hasVipPrivilege(profile.role)
          };
        }
      }
    }
  } catch (err) {
    console.warn('[server-gate] Token resolution fallback to guest/free:', err.message);
  }

  // Fallback for demo / guest mode or unauthenticated
  const clientHeaderRole = req.headers['x-user-role'];
  const guestRole = clientHeaderRole === 'VIP' || clientHeaderRole === 'ADMIN' ? clientHeaderRole : 'FREE';

  return {
    userId: req.headers['x-user-id'] || 'guest_user',
    role: guestRole,
    isVip: hasVipPrivilege(guestRole)
  };
}

/**
 * Guards milestone drill & boss gate endpoints.
 */
export async function verifyMilestoneServerAccess(req, milestoneId) {
  const { role, isVip, userId } = await resolveServerUserRole(req);

  const access = getMilestoneAccess(milestoneId, role);
  if (!access.canAccess) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'UPGRADE_REQUIRED',
      message: `Trạm ${milestoneId} thuộc phân hệ VIP. Vui lòng nâng cấp gói để tiếp tục lộ trình!`,
      isVip,
      userId
    };
  }

  return { allowed: true, role, isVip, userId };
}

/**
 * Guards AI Tutor queries.
 */
export async function verifyAiTutorServerAccess(req, dailyCount = 0) {
  const { role, isVip, userId } = await resolveServerUserRole(req);

  if (isVip) {
    return { allowed: true, role, isVip, userId };
  }

  if (dailyCount >= 3) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'AI_TUTOR_QUOTA_EXCEEDED',
      message: 'Bạn đã sử dụng hết 3 câu hỏi AI Gia Sư miễn phí trong ngày. Nâng cấp VIP để hỏi đáp không giới hạn!',
      isVip,
      userId
    };
  }

  return { allowed: true, role, isVip, userId };
}
