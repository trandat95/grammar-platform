import test from "node:test";
import assert from "node:assert/strict";
import {
  ANALYTICS_SCHEMA_VERSION,
  M47_ANALYTICS_EVENTS,
  buildCanonicalAnalyticsEvent,
  sanitizeAnalyticsProperties,
  validateFtcSafePaywallPayload,
  computeEightCoreKpis,
  toUtcPlus7DateKey,
} from "../lib/learning/behavioral-engine.js";

test("M4.7 Schema & Privacy Sanitizer: strips PII, raw user answers, emails, phones, and Bearer tokens", () => {
  const dirtyProps = {
    question_type: "multiple_choice",
    result: "correct",
    duration_ms: 4200,
    email: "learner@example.com",
    phone: "0912345678",
    token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def",
    user_answer: "She is going to the library",
    raw_input: "is going",
    custom_note: "Contact me at test@domain.vn",
    safe_token_check: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig",
  };

  const clean = sanitizeAnalyticsProperties(dirtyProps);
  assert.equal(clean.question_type, "multiple_choice");
  assert.equal(clean.result, "correct");
  assert.equal(clean.duration_ms, 4200);
  assert.equal("email" in clean, false);
  assert.equal("phone" in clean, false);
  assert.equal("token" in clean, false);
  assert.equal("user_answer" in clean, false);
  assert.equal("raw_input" in clean, false);
  assert.equal("custom_note" in clean, false);
  assert.equal("safe_token_check" in clean, false);

  const canonical = buildCanonicalAnalyticsEvent({
    event_name: M47_ANALYTICS_EVENTS.QUESTION_ANSWERED,
    user_id: "11111111-1111-4111-8111-111111111111",
    platform: "mobile",
    feature: "grammar_study",
    properties: dirtyProps,
  });

  assert.equal(canonical.event_version, ANALYTICS_SCHEMA_VERSION);
  assert.equal(canonical.event_name, "question_answered");
  assert.equal(canonical.event_type, "QUESTION_ANSWERED");
  assert.ok(canonical.event_id && canonical.event_id === canonical.idempotency_key);
  assert.match(canonical.timestamp, /\+07:00$/);
  assert.equal("email" in canonical.properties, false);
});

test("M4.7 FTC Anti-Dark-Pattern Guard: rejects dark-pattern flags and allows transparent A/B variants", () => {
  assert.equal(
    validateFtcSafePaywallPayload({ event_name: "paywall_viewed", properties: { variant: "progress_anchored" } }).safe,
    true
  );

  const badTimer = validateFtcSafePaywallPayload({
    event_name: "paywall_viewed",
    properties: { variant: "control", fake_timer: true },
  });
  assert.equal(badTimer.safe, false);
  assert.ok(badTimer.violations.includes("fake_timer"));

  const badShame = validateFtcSafePaywallPayload({
    event_name: "paywall_viewed",
    properties: { variant: "confirmshaming_v1", shame_copy: true },
  });
  assert.equal(badShame.safe, false);
  assert.ok(badShame.violations.includes("shame_copy"));
  assert.ok(badShame.violations.includes("prohibited_variant_name"));
});

test("M4.7 8 Core KPIs: calculates UTC+7 metrics accurately across completion, latency, mobile, D7/D14, VIP & paywall", () => {
  const u1 = "11111111-1111-4111-8111-111111111111";
  const u2 = "22222222-2222-4222-8222-222222222222";
  const u3 = "33333333-3333-4333-8333-333333333333";

  // Registration cohort D0 = 2026-11-01T10:00:00+07:00 (UTC 03:00)
  const d0Iso = "2026-11-01T03:00:00.000Z";
  assert.equal(toUtcPlus7DateKey(d0Iso), "2026-11-01");
  const d7Iso = "2026-11-08T04:00:00.000Z"; // +7 days in UTC+7
  const d14Iso = "2026-11-15T05:00:00.000Z"; // +14 days in UTC+7

  const learningLogs = [
    // Exercise started (2) & completed (1) => 50%
    { user_id: u1, event_type: "EXERCISE_STARTED", created_at: "2026-11-01T03:05:00.000Z", payload: {} },
    { user_id: u1, event_type: "EXERCISE_COMPLETED", created_at: "2026-11-01T03:10:00.000Z", payload: {} }, // +5 min valid
    { user_id: u2, event_type: "EXERCISE_STARTED", created_at: "2026-11-01T03:00:00.000Z", payload: {} },
    // Huge idle gap (30 min > 15 min) must NOT count into session duration, starts new session
    { user_id: u1, event_type: "QUESTION_ANSWERED", is_correct: true, response_time_ms: 4000, device_id: "mobile", created_at: "2026-11-01T03:40:00.000Z", payload: { platform: "mobile", properties: { question_type: "multiple_choice", touch_success: true } } },
    { user_id: u1, event_type: "QUESTION_ANSWERED", is_correct: false, response_time_ms: 9000, device_id: "mobile", created_at: "2026-11-01T03:42:00.000Z", payload: { platform: "mobile", properties: { question_type: "text_input", touch_success: true } } }, // +2 min valid
    { user_id: u1, event_type: "QUESTION_ANSWERED", is_correct: true, response_time_ms: 2000, device_id: "desktop", created_at: d7Iso, payload: { platform: "desktop", properties: { question_type: "multiple_choice" } } },
    { user_id: u1, event_type: "QUESTION_ANSWERED", is_correct: true, response_time_ms: 6000, device_id: "desktop", created_at: d14Iso, payload: { platform: "desktop", properties: { question_type: "text_input" } } },
    // Diagnostic started (2), completed (1) => 50%
    { user_id: u1, event_type: "DIAGNOSTIC_STARTED", created_at: d0Iso, payload: {} },
    { user_id: u2, event_type: "DIAGNOSTIC_STARTED", created_at: d0Iso, payload: {} },
    { user_id: u1, event_type: "DIAGNOSTIC_COMPLETED", created_at: "2026-11-01T03:12:00.000Z", payload: {} },
    // Paywall views (4) & checkout initiated (1) => 75% abandonment
    { user_id: u2, event_type: "PAYWALL_VIEWED", created_at: d0Iso, payload: { properties: { variant: "control" } } },
    { user_id: u2, event_type: "PAYWALL_VIEWED", created_at: d0Iso, payload: { properties: { variant: "control" } } },
    { user_id: u3, event_type: "PAYWALL_VIEWED", created_at: d0Iso, payload: { properties: { variant: "progress_anchored" } } },
    { user_id: u3, event_type: "PAYWALL_VIEWED", created_at: d0Iso, payload: { properties: { variant: "progress_anchored" } } },
    { user_id: u3, event_type: "CHECKOUT_INITIATED", created_at: d0Iso, payload: { properties: { variant: "progress_anchored" } } },
  ];

  const profiles = [
    { id: u1, role: "VIP", created_at: d0Iso },
    { id: u2, role: "VIP", created_at: d0Iso },
    { id: u3, role: "FREE", created_at: d0Iso },
  ];

  const subscriptions = [
    { user_id: u1, provider: "sepay", status: "active" },
    { user_id: u2, provider: "manual", status: "active" },
  ];

  const kpis = computeEightCoreKpis({ learningLogs, profiles, subscriptions });

  assert.equal(kpis.timezone, "UTC+7");
  assert.equal(kpis.exercise_completion_rate.rate_percent, 50);
  assert.equal(kpis.question_answer_time.median_multiple_choice_ms, 3000); // median(2000, 4000)
  assert.equal(kpis.question_answer_time.median_text_input_ms, 7500); // median(6000, 9000)
  assert.equal(kpis.mobile_interaction_success.attempted_touch, 2);
  assert.equal(kpis.mobile_interaction_success.successful_touch, 2);
  assert.equal(kpis.mobile_interaction_success.rate_percent, 100);
  assert.equal(kpis.diagnostic_completion_rate.rate_percent, 50);
  // Session time for u1: 03:00->03:05 (5m) + 03:05->03:10 (5m) + 03:10->03:12 (2m) + 03:40->03:42 (2m) = 14m (28m idle gap clamped)
  assert.equal(kpis.learning_session_duration.total_valid_minutes, 14);
  assert.equal(kpis.retention_d7_d14.cohort_users, 3);
  assert.equal(kpis.retention_d7_d14.d7_retained, 1);
  assert.equal(kpis.retention_d7_d14.d14_retained, 1);
  assert.equal(kpis.free_to_vip_conversion.sepay_paid_count, 1);
  assert.equal(kpis.free_to_vip_conversion.admin_grant_count, 1);
  assert.equal(kpis.paywall_abandonment.paywall_views, 4);
  assert.equal(kpis.paywall_abandonment.checkout_initiated, 1);
  assert.equal(kpis.paywall_abandonment.abandonment_percent, 75);
  assert.equal(kpis.paywall_abandonment.by_variant.control.abandonment_percent, 100);
  assert.equal(kpis.paywall_abandonment.by_variant.progress_anchored.abandonment_percent, 50);
});
