# Performance Optimization, Testing & Free-Tier Limitations (Milestone 2.11)

Honest engineering summary of **verified**, **partially verified**, and **deferred / not-supported** items on **Vercel Hobby + Supabase Free**.

---

## 1. Database Query & Index Audit (`2.11.5`)

- **Duplicate Index Removed:** Dropped redundant `uq_user_achievement` constraint/index on `public.user_achievements` via Migration `014` (retained `uq_user_achievements_user_code`), reducing write overhead.
- **Unindexed Foreign Keys Fixed (`11 + 1` hot index):** Migration `014` added covering B-tree indexes for all 11 unindexed foreign keys flagged by Supabase Performance Advisor (`ai_advisor_logs.attempt_id`, `diagnostic_attempts.test_id`, `diagnostic_skill_results.user_id`, `explanation_feedback.explanation_id`, `leaderboard_snapshots.user_id`, `roadmap_items.user_id`, `roadmap_versions.roadmap_id`, `spaced_repetition_queue.concept_id`, `user_activity_logs(user_id, created_at DESC)`, `user_challenges.challenge_id`, `user_learning_roadmaps.diagnostic_attempt_id`) plus `idx_xp_transactions_created_user_amt (created_at DESC, user_id, xp_amount)` for 7-day/30-day leaderboard aggregations.
- **Verified Query Plans (`EXPLAIN`):** Post-index verification confirmed index scans on `learning_event_logs` (`idx_learning_events_user_time`) and covering indexes ready across hot user tables.
- **Remaining Informational Advisor:** Existing `auth_rls_initplan` rewrite (`(select auth.uid())`) on legacy 001–004 policies was conservatively left unmodified per Milestone `2.11.2` non-bulk-RLS guardrail to guarantee zero regression on live access controls.

---

## 2. Frontend Performance & Bundle Optimization (`2.11.6`)

- **Code Splitting (`pages/index.js`):** Converted 11 heavy modal/admin/secondary-tab subtrees (`AdminOverviewPanel`, `AdminMonetizationPanel`, `PedagogicalQualityDashboard`, `StepUpConfirmModal`, `GrammarDiagnosticEngine`, `MasteryIntelligenceDashboard`, `SpacedRepetitionPanel`, `GrammarVisualization`, `AccountProfileCard`, `SmartPaywallModal`, `GamificationCelebrationModal`) to `next/dynamic(..., { ssr: false })` so initial Homepage load does not eagerly parse admin or diagnostic bundles.
- **HTTP Compression & Static Asset Caching (`next.config.js`):** Enabled `compress: true`, `poweredByHeader: false`, and `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` on `/assets/:path*`, cutting repeat bandwidth and speeding subsequent visits.
- **Accessibility & Contrast (`2.11.12`):** `validate-design-tokens.py` mathematically verifies `28/28` light & dark token contrast pairs `>= 4.62:1` (WCAG 2.2 AA threshold >= 4.5:1) with `0` hardcoded HEX violations across UI components, `.ge-*` reduced-motion media queries in `design-system-2026.css`, and keyboard modal focus trapping (`FocusTrapModal2026`).

---

## 3. Free-Tier Infrastructure Limitations

| Constraint | Vercel Hobby | Supabase Free | Impact / Mitigation |
| :--- | :--- | :--- | :--- |
| **Compute & Timeouts** | Serverless function execution limits & cold starts | Shared Postgres CPU/RAM; pauses after 7 days of zero activity | Lightweight `/api/health` skips DB by default; rate limiter uses zero-DB in-memory Map; avoid heavy LLM loops. |
| **Backups & PITR** | No stateful DB | No automated daily backups or Point-in-Time Recovery | Mitigated via `.github/workflows/backup-encrypted.yml` (`pg_dump` + OpenSSL AES-256). |
| **Concurrency / Load** | No high-VU stress tests allowed cleanly | Connection/Egress quotas | `tests/k6/api-smoke-benchmark.js` capped safely at 2 VUs against localhost/staging. |
| **Monitoring** | Ephemeral function logs | Dashboard advisors only | Structured JSON error logging + `x-correlation-id` + `audit_logs` table. |

---

## 4. Honest Verification Status Ledger (No False Claims)

| Area | Status | Evidence |
| :--- | :---: | :--- |
| **2.11.1–2.11.3 Security Audit, IDOR Fixes, Webhook Fail-Closed, Error Sanitization, Security Headers** | **Verified** | `next.config.js`, `lib/api/security-guard.js`, 34 API routes audited, `scripts/validate-milestone-211.py` PASS |
| **2.11.2 / 2.11.5 DB RLS, Trigger RPC Hardening & Covering Indexes** | **Verified** | Migration `014` applied on Supabase `wtvlbbcyvtqqygtojxay`; `57/57` RLS tables; `0` unindexed FKs & `0` duplicate indexes post-`014` |
| **2.11.4 Auth & Multi-Tab Session Sync** | **Verified (Code & Flow)** | `onSupabaseAuthStateChange` (`SIGNED_IN`, `TOKEN_REFRESHED`, `SIGNED_OUT`, `PASSWORD_RECOVERY`) + cross-tab `StorageEvent` listener in `pages/index.js` |
| **2.11.6 / 2.11.12 Frontend Code Splitting, Headers & WCAG Contrast** | **Partially Verified** | Dynamic imports + caching headers + `28/28` WCAG contrast & `0` HEX violations verified; **Lighthouse CLI scores not run locally** (no local Chrome/Node runner on Windows environment) |
| **2.11.7 Controlled API Performance (k6)** | **Partially Verified** | `tests/k6/api-smoke-benchmark.js` script covering 9 API clusters created; **k6 execution not run locally** (k6 CLI absent on Windows host; high-VU prod stress test intentionally excluded per Free-Tier rule) |
| **2.11.9 Independent Backup & Restore** | **Partially Verified** | `.github/workflows/backup-encrypted.yml` (`pg_dump` + OpenSSL AES-256-CBC) + Restore runbook implemented; **live restore drill requires GitHub Secrets (`SUPABASE_DB_URL`, `BACKUP_ENCRYPTION_PASSPHRASE`) & staging DB** |
| **2.11.10 CI/CD & Production Smoke Test** | **Verified** | `.github/workflows/ci-verify.yml` + Vercel `READY` deploy + live HTTP endpoint & header checks |
| **2.11.11 / 2.11.13 Cross-Browser Playwright & 18 E2E Regression** | **Partially Verified** | Curriculum (`12` chapters, `53` lessons, `2,939` questions), Mastery, Gamification, Monetization & Security suites PASS 100%; automated multi-browser Playwright matrix requires CI/Node environment |
