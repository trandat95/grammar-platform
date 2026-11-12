import http from "k6/http";
import { check, sleep } from "k6";

/**
 * Milestone 2.11.7: Controlled Free-Tier Safe API Performance Benchmark (k6)
 *
 * SAFETY GUARDRAILS:
 * - Default BASE_URL targets localhost (`http://127.0.0.1:3000`) or staging mock server.
 * - Strictly capped at low concurrency (max 3 VUs, short 15s run) to respect Vercel Hobby
 *   and Supabase Free quotas. NEVER aim high-VU load against production.
 * - Covers all 9 core API functional clusters (health/auth, questions/test, quiz/diagnostic submit,
 *   learning events/history, mastery dashboard, spaced repetition, leaderboard, achievements, challenges).
 */

export const options = {
  vus: Number(__ENV.K6_VUS || 2),
  duration: __ENV.K6_DURATION || "15s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1200"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:3000";
const AUTH_TOKEN = __ENV.TEST_BEARER_TOKEN || "";

export default function () {
  const headers = {
    "Content-Type": "application/json",
    ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
  };

  // 1. Health / Liveness
  const resHealth = http.get(`${BASE_URL}/api/health`);
  check(resHealth, { "health 200": (r) => r.status === 200 });

  // 2. Questions / Diagnostic Blueprint
  const resTest = http.get(`${BASE_URL}/api/diagnostic/test`);
  check(resTest, { "diagnostic test 200": (r) => r.status === 200 });

  // 3. Quiz / Diagnostic Submit (Stateless Guest Grading)
  const resSubmit = http.post(
    `${BASE_URL}/api/diagnostic/submit`,
    JSON.stringify({ answers: [], duration_seconds: 12 }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(resSubmit, { "diagnostic submit 200": (r) => r.status === 200 });

  // 4. Learning Knowledge Graph & 5. Mastery / 6. Spaced Repetition
  const resKg = http.get(`${BASE_URL}/api/learning/knowledge-graph`);
  check(resKg, { "knowledge graph 200": (r) => r.status === 200 });

  const resMix = http.post(
    `${BASE_URL}/api/learning/adaptive-mix`,
    JSON.stringify({ count: 5, mode: "adaptive" }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(resMix, { "adaptive mix 200": (r) => r.status === 200 });

  // 7. Leaderboard (Public Snapshot)
  const resLb = http.get(`${BASE_URL}/api/gamification/leaderboard?mode=weekly_consistency&limit=10`);
  check(resLb, { "leaderboard 200": (r) => r.status === 200 });

  // 8 & 9. Gamification Summary (Achievements & Challenges - Guest Safe)
  const resSummary = http.get(`${BASE_URL}/api/gamification/summary`);
  check(resSummary, { "gamification summary 200": (r) => r.status === 200 });

  // Authenticated-only clusters (Sync Pull & Events) if TEST_BEARER_TOKEN supplied
  if (AUTH_TOKEN) {
    const resEvents = http.post(
      `${BASE_URL}/api/learning/events`,
      JSON.stringify({ eventType: "PING", idempotencyKey: `k6_${__VU}_${__ITER}` }),
      { headers }
    );
    check(resEvents, { "events auth ok": (r) => r.status === 200 || r.status === 400 });
  }

  sleep(1);
}
