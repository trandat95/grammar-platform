-- Milestone 2.12 / Branding Hygiene: Remove textbook author naming from VIP subscription plan title
UPDATE public.subscription_plans
SET name_vi = 'VIP Trọn Đời Toàn Diện'
WHERE code = 'VIP_LIFETIME'
  AND name_vi ILIKE '%Mai Lan%';
