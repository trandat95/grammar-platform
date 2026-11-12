-- Remove 7-day free trial offers from subscription plans and campaigns
UPDATE public.subscription_plans
SET
  trial_days = 0,
  badge_text = CASE WHEN code = 'VIP_MONTHLY' THEN 'Linh hoạt theo tháng' ELSE badge_text END;

UPDATE public.pricing_campaigns
SET description_vi = 'Áp dụng mã ưu đãi WELCOME15 giảm ngay 15% khi nâng cấp gói VIP Toàn diện, bảo lưu 100% lịch sử học.'
WHERE code = 'FIRST_DIAGNOSTIC_BONUS';

UPDATE public.paywall_configs
SET cta_label = 'Xem Bảng Giá & Quyền Lợi VIP ➔'
WHERE trigger_key = 'vip_feature_click';
