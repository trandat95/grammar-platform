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

  async signUp(email, password, fullName) {
    const { data, error } = await withAuthTimeout(() =>
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
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
