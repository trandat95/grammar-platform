# Security Assessment, STRIDE Threat Model & RLS Audit (Milestone 2.11)

**Platform:** Grammar Learning Platform (`https://grammar-platform.vercel.app`)  
**Database:** Supabase PostgreSQL 17 (`wtvlbbcyvtqqygtojxay`, Seoul `ap-northeast-2`)  
**Hosting:** Vercel Hobby (`sin1`) • Next.js `14.2.15`

---

## 1. Attack Surface Inventory

1. **Client & Static Surface:** Next.js pages (`pages/index.js`, `pages/_app.js`), Service Worker (`public/sw.js`), LocalStorage/IndexedDB v2 (`lib/sync/indexed-db.js`). Zero secrets bundled; `SUPABASE_SERVICE_ROLE_KEY` strictly excluded from client directories (`components/`, `services/`, `repositories/`, `pages/*.js`).
2. **Serverless API Surface (34 Routes under `pages/api/`):**
   - Admin RBAC APIs (`8 routes` under `pages/api/admin/*`) protected by `verifyAdminWithGuard` (rate limit `30/min/IP` + verified Supabase JWT + `profiles.role = 'ADMIN'`).
   - Monetization & Webhooks (`6 routes` under `pages/api/monetization/*`) protected by Bearer session (`checkout`, `sepay-status`, `export-report`), HMAC-SHA256 (`webhook`), or SePay API key (`sepay-webhook`).
   - Learning, Diagnostic, AI Coach, Sync & Gamification (`20 routes`) with standardized `lib/api/security-guard.js`.
3. **Database & PostgREST RPC Surface:** `57` tables in `public` schema (all with RLS enabled) + `SECURITY DEFINER` RPCs exposed selectively via PostgREST.

---

## 2. STRIDE Threat Model & OWASP Top 10 Evaluation

| STRIDE Threat | Vector / OWASP Category | Mitigation Implemented | Status |
| :--- | :--- | :--- | :--- |
| **Spoofing (S)** | Cross-user `user_id` spoofing in `/api/diagnostic/submit`, `/api/diagnostic/roadmap`, `/api/learning/remedial-recommendations`, `/api/explanation-feedback`, `/api/sync/batch`, `/api/sync/pull`, `/api/monetization/export-report`, `/api/monetization/checkout` | Strict `verifyServerSession(req)` Bearer JWT verification (`401`/`403` on missing or mismatched `user_id`); DB writes bind strictly to `authUser.id` (`verifiedUserId`). | **Verified** |
| **Tampering (T)** | Hardcoded dev HMAC fallback secret (`grammar_dev_webhook_secret_v1`) active if env vars missing in production; client-side role escalation | `lib/monetization/payment-provider-adapter.js` fails closed (`return false`) when `NODE_ENV === "production"` and `PAYMENT_WEBHOOK_SECRET`/`SUPABASE_SERVICE_ROLE_KEY` are absent. PostgreSQL `protect_profile_role()` trigger blocks non-admin role upgrades except `sepay_rpc_v1` billing tx. | **Verified** |
| **Repudiation (R)** | Untraceable errors/actions across admin and user mutations | `x-correlation-id` UUID propagated across all 34 API routes (`attachCorrelationId`), secret-redacting JSON error logs (`redactSensitiveData`), immutable `public.audit_logs` trigger (`trg_audit_logs_immutable`). | **Verified** |
| **Information Disclosure (I)** | Raw Postgres/exception messages on HTTP `500`, missing security headers, exposed `SECURITY DEFINER` trigger RPCs | All 34 API routes sanitized (`sendSafeServerError`, 0 raw `err.message` `500` responses); `next.config.js` enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security`, `poweredByHeader: false`; Migration `014` revokes `EXECUTE` from `anon`/`PUBLIC` on trigger and auth-only RPCs. | **Verified** |
| **Denial of Service (D)** | Unbounded API spam on AI Coach, Checkout, Dictionary, Sync, Feedback endpoints | Bounded in-memory LRU sliding-window rate limiter (`checkApiRateLimit`, max 2,000 IP buckets, zero Supabase DB quota cost) returning HTTP `429` + `Retry-After`. | **Verified** |
| **Elevation of Privilege (E)** | Horizontal IDOR on `roadmap_items` (`PATCH`), `remedial_recommendations` (`PATCH`), `export-report` (`GET`); anonymous RPC calls | `PATCH` filters scoped strictly by `.eq("user_id", authUser.id)`; `export-report` enforces authenticated VIP/ADMIN server entitlement check (`403` otherwise); `is_admin()` & billing RPCs revoked from `anon`. | **Verified** |

---

## 3. Risk Register

| ID | Severity | Finding | Resolution & Verification |
| :--- | :---: | :--- | :--- |
| **RISK-01** | **High** | Cross-user `user_id` fallback in `sync/batch`, `sync/pull`, `export-report`, `checkout`, `diagnostic/roadmap`, `diagnostic/submit`, `remedial-recommendations`, `explanation-feedback` | **Resolved:** Enforced `verifyServerSession` + `authUser.id` ownership checks across all 8 routes & attached Bearer headers in `GrammarDiagnosticEngine.jsx` and `StructuredExplanation.jsx`. |
| **RISK-02** | **High** | Hardcoded HMAC webhook dev secret fallback active if production secret unset | **Resolved:** `payment-provider-adapter.js` now restricts `"grammar_dev_webhook_secret_v1"` strictly to `NODE_ENV !== "production"` and fails closed in production. |
| **RISK-03** | **Medium** | `anon` & `authenticated` had `EXECUTE` on `handle_new_user()`, `protect_profile_role()`, and `anon` had `EXECUTE` on auth-only `SECURITY DEFINER` RPCs | **Resolved:** Migration `014_m211_security_and_performance_hardening.sql` applied on Supabase; Security Advisor `anon_security_definer_function_executable` reduced from 9 to 2 intentional public endpoints. |
| **RISK-04** | **Medium** | Raw `err.message` returned in HTTP `500` responses & missing OWASP HTTP headers | **Resolved:** Centralized `sendSafeServerError` + `attachCorrelationId` across 34 API routes + `next.config.js` security headers (`validate-milestone-211.py` PASS). |
| **RISK-05** | **Low** | Supabase Auth `auth_leaked_password_protection` warning (HaveIBeenPwned check) | **Documented (Plan-dependent):** Supabase HaveIBeenPwned leaked-password check requires Supabase Pro or manual dashboard enablement; app enforces min-length & confirmation matching on signup. |

---

## 4. Database Security & RLS Verification Summary (`57/57` Tables)

- **RLS Coverage:** PostgreSQL catalog check confirms `57 / 57` tables in `public` have `rowsecurity = true` and `policy_count >= 1`.
- **Anonymous Isolation Probe (`validate-milestone-211.py`):** Direct REST queries as `anon` against `payment_gateway_secrets`, `payment_transactions`, `user_subscriptions`, `audit_logs`, `user_learning_trackers`, `diagnostic_attempts`, and `user_xp` all return `0` rows (`[]`). Calling revoked `award_user_gamification_xp` RPC as `anon` is rejected (`401`/`403`/`404`).
- **Session Hardening:** Multi-tab `SIGNED_OUT`, `TOKEN_REFRESHED`, and `StorageEvent` synchronization active in `pages/index.js`; `PASSWORD_RECOVERY` + `?type=recovery` opens dedicated password-reset view cleanly.
