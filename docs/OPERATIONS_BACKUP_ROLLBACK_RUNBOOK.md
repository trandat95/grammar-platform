# Operations, Backup, CI/CD & Rollback Runbook (Free-Tier Safe)

Covers **Milestone 2.11.8 (Reliability)**, **2.11.9 (Independent Backup/Restore)**, **2.11.10 (Safe CI/CD & Rollback)**, and **2.11.14 (Operational Docs)** within **Vercel Hobby** + **Supabase Free** constraints.

---

## 1. System Architecture & Production Configuration

- **Frontend / Serverless API:** Next.js `14.2.15` (Pages Router) hosted on Vercel Hobby (`sin1` Singapore region, `vercel.json`).
- **Database & Auth:** Supabase Project `wtvlbbcyvtqqygtojxay` (`ap-northeast-2` Seoul), PostgreSQL 17 + GoTrue Auth + Row-Level Security on all 57 tables.
- **Offline Resilience:** `lib/sync/indexed-db.js` + `lib/sync/sync-manager.js` + `lib/sync/sync-queue.js` queue quiz/lesson events locally with UUIDv4 `idempotency_key` and exponential full-jitter retry against `/api/sync/batch`, preventing quiz result loss on transient disconnections or tab closure.

### Required Environment Variables
| Variable | Location | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel Env (Public) | Supabase REST/Auth endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel Env (Public) | Browser RLS-scoped client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Env (Server Secret — optional/recommended) | Enables privileged admin writes without user JWT fallback |
| `PAYMENT_WEBHOOK_SECRET` | Vercel Env (Server Secret) | Required in production for `/api/monetization/webhook` HMAC-SHA256 |
| `GEMINI_API_KEY` | Vercel Env (Server Secret — optional) | Live LLM enrichment for `/api/ai-advisor/ask` (gracefully falls back to deterministic DAG coach) |
| `SUPABASE_DB_URL` | GitHub Actions Secret (Encrypted) | Postgres connection string used solely by `backup-encrypted.yml` |
| `BACKUP_ENCRYPTION_PASSPHRASE` | GitHub Actions Secret (Encrypted) | AES-256-CBC PBKDF2 passphrase for off-Supabase backups |

---

## 2. CI/CD Pipeline (`.github/workflows/ci-verify.yml` + Vercel)

1. **Code Review & Pre-commit Guard:** Review diff cleanly; verify 12 chapters, 53 lessons, 2,939 questions untouched.
2. **Design Token & Accessibility Static Lint:** `python scripts/validate-design-tokens.py` (`28/28` contrast pairs >= 4.62:1, `0` HEX violations).
3. **Engine Regression Tests:** `validate-mastery-engine.py`, `validate-gamification-engine.py`, `validate-monetization-engine.py`.
4. **Security & Hardening Gate:** `python scripts/validate-milestone-211.py`.
5. **Production Build Verification:** `npm ci && npm run build` (`prisma generate && next build`) in GitHub Actions on `push` / `pull_request` to `main`.
6. **Preview / Production Deployment:** Vercel Git Integration deploys `main` automatically to `https://grammar-platform.vercel.app`.
7. **Post-Deploy Smoke Verification:** Check `/api/health`, `/api/health?deep=1`, security headers, and live deployment status `READY`.

---

## 3. Application & Migration Rollback Runbook

### A. Application Rollback (`<= 5 minutes`)
Prefer **application-only rollback** so zero user learning/payment data is ever touched:
1. **Vercel Instant Promote (Fastest, ~30 seconds):** Open Vercel Dashboard -> Project `grammar-platform` -> **Deployments** -> select the last known-good `READY` deployment -> click **Promote to Production**.
2. **Git Revert (`~2 minutes`):**
   ```bash
   git revert <bad-commit-sha> --no-edit
   git push origin main
   ```

### B. Database Migration Rollback Policy (Expand-and-Contract)
- Migrations are strictly **additive / idempotent** (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`).
- Every migration includes non-destructive rollback SQL (e.g. `database/migrations/014_m211_security_and_performance_hardening.sql` rollback comment drops newly added indexes and restores grants without dropping tables or user rows).

---

## 4. Independent Encrypted Backup & Restore Guide (2.11.9)

Because **Supabase Free does NOT include Automatic Daily Backups or Point-in-Time Recovery (PITR)**, `.github/workflows/backup-encrypted.yml` provides off-Supabase scheduled backups:
- **Schedule:** Daily `02:15 UTC` (`09:15 UTC+7`), auto-tagged `daily` / `weekly` (Sundays) / `monthly` (1st of month), plus manual `workflow_dispatch`.
- **Format:** `pg_dump "$SUPABASE_DB_URL" --schema=public --no-owner --no-privileges --clean --if-exists | gzip` -> encrypted with `openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000` -> SHA-256 checksum recorded -> plaintext deleted immediately -> `.enc` stored in private GitHub Artifacts (30-day retention).
- **What is NOT in DB Backup:** Static files under `public/assets/*` (versioned in Git repository; no Supabase Storage buckets are required for badges/banners/avatars).

### Decrypt & Restore Verification Procedure (Staging / Disposable DB Only)
NEVER overwrite production during routine restore drills. Decrypt and restore into a disposable local PostgreSQL 17 instance or staging Supabase project:
```bash
# 1. Verify SHA-256 integrity of decrypted archive
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
  -in grammar_db_daily_YYYYMMDD_HHMMSS.sql.gz.enc \
  -out restore_check.sql.gz \
  -pass pass:"$BACKUP_ENCRYPTION_PASSPHRASE"

sha256sum -c grammar_db_daily_YYYYMMDD_HHMMSS.sql.gz.sha256

# 2. Restore cleanly into staging/local PostgreSQL 17 database
gunzip -c restore_check.sql.gz | psql "$STAGING_DATABASE_URL"

# 3. Verify row counts & schema integrity
psql "$STAGING_DATABASE_URL" -c "SELECT count(*) FROM public.profiles; SELECT count(*) FROM public.user_learning_trackers;"
```
> **Note:** Until `SUPABASE_DB_URL` and `BACKUP_ENCRYPTION_PASSPHRASE` secrets are configured in GitHub Repository Settings -> Secrets and an end-to-end staging restore drill is executed, **RPO <= 1h / RTO <= 30m are explicitly NOT claimed**.

---

## 5. Incident Response Procedure

1. **Detect & Triage:** Capture `x-correlation-id` returned in HTTP headers or JSON error payloads (`{"success":false,"code":"...","correlationId":"..."}`).
2. **Inspect Logs:** Search Vercel Function Runtime Logs by `correlationId` (`logStructuredError` prints JSON with route, status, errorCode, and redacted metadata).
3. **Contain:**
   - API abuse: Rate-limit (`checkApiRateLimit`) automatically returns HTTP `429`; adjust thresholds in route options if needed.
   - Broken release: Execute Section 3A Instant Vercel Promote Rollback immediately.
   - Payment webhook anomaly: Inspect `public.payment_webhook_events` (`processing_status`, `error_message`) and `public.payment_transactions`; idempotency keys guarantee zero double-crediting.
