import { supabase } from "../lib/supabase/client";

const SMTP_TIMEOUT_MS = 14000;

function formatAuthTimeoutError(err) {
  const msg = String(err?.message || err || "");
  if (
    err?.status === 504 ||
    /context deadline exceeded|request_timeout|gateway timeout|timed out/i.test(msg)
  ) {
    return new Error(
      "Máy chủ gửi email (SMTP) trên Supabase bị timeout sau ~10s (HTTP 504). Hãy tắt 'Confirm email' tại Supabase Auth > Providers > Email để đăng ký vào ngay, hoặc đổi Custom SMTP Port sang 587."
    );
  }
  return err;
}

async function withAuthTimeout(promiseFactory, timeoutMs = SMTP_TIMEOUT_MS) {
  let timerId = null;
  try {
    return await Promise.race([
      promiseFactory(),
      new Promise((_, reject) => {
        timerId = setTimeout(() => {
          reject(
            new Error(
              "Kết nối Supabase Auth quá thời gian (SMTP không phản hồi sau 14s). Hãy tắt 'Confirm email' trong Supabase Auth > Providers > Email hoặc đổi Custom SMTP Port từ 465 sang 587."
            )
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

export const AuthService = {
  async getActiveSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (e) {
      console.warn("Could not get active session:", e.message);
      return null;
    }
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email, password, fullNameOrMeta) {
    const resolvedFullName =
      typeof fullNameOrMeta === "object" && fullNameOrMeta !== null
        ? String(fullNameOrMeta.full_name || fullNameOrMeta.name || "")
        : String(fullNameOrMeta || "");

    // Prefer instant server-side auto-confirmed registration (skips email verification)
    if (typeof window !== "undefined") {
      try {
        const resp = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName: resolvedFullName }),
        });
        const json = await resp.json().catch(() => ({}));

        if (resp.ok && json?.success && json?.autoConfirmed) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: String(email || "").trim().toLowerCase(),
            password,
          });
          if (signInErr) throw signInErr;
          return signInData;
        }

        if (resp.status === 409 || resp.status === 422 || resp.status === 400 || resp.status === 429) {
          throw new Error(json?.error || "Không thể đăng ký tài khoản.");
        }
      } catch (apiErr) {
        if (apiErr?.message && /đã được đăng ký|không hợp lệ|ký tự|quá nhanh|Không thể đăng ký/i.test(apiErr.message)) {
          throw apiErr;
        }
      }
    }

    const { data, error } = await withAuthTimeout(() =>
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: resolvedFullName,
            role: "FREE",
          },
        },
      })
    );
    if (error) throw formatAuthTimeoutError(error);
    return data;
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Sign out warning:", e.message);
      return false;
    }
  },

  async resetPasswordForEmail(email, redirectTo) {
    const options = redirectTo ? { redirectTo } : undefined;
    const { data, error } = await withAuthTimeout(() =>
      supabase.auth.resetPasswordForEmail(email, options)
    );
    if (error) throw formatAuthTimeoutError(error);
    return data;
  },

  async resendConfirmationEmail(email, emailRedirectTo) {
    const options = emailRedirectTo ? { emailRedirectTo } : undefined;
    const { data, error } = await withAuthTimeout(() =>
      supabase.auth.resend({
        type: "signup",
        email,
        options,
      })
    );
    if (error) throw formatAuthTimeoutError(error);
    return data;
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },

  onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return () => data?.subscription?.unsubscribe();
  },
};
