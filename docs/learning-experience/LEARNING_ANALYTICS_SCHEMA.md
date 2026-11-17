# 📊 LEARNING & CONVERSION ANALYTICS EVENT SCHEMA (`M4.7`)

> Đo lường hiệu quả UX mới một cách minh bạch, bảo vệ quyền riêng tư người học và tuyệt đối tuân thủ **FTC Anti-Dark-Pattern**.

---

## 1. Canonical Analytics Event Schema (JSON)

```json
{
  "event_name": "question_answered",
  "event_version": "1.0",
  "event_id": "<uuid-dedup-key>",
  "user_id": null,
  "session_id": "<anonymous-or-auth-session-uuid>",
  "timestamp": "2026-11-17T09:30:00+07:00",
  "platform": "mobile",
  "feature": "grammar_study",
  "properties": {
    "question_type": "multiple_choice",
    "result": "correct",
    "duration_ms": 8500
  }
}
```

---

## 2. Công Thức Chính Xác Cho 8 KPI Cốt Lõi

| KPI | Công thức Định nghĩa & Cách đo | Timezone / Cohort |
| :--- | :--- | :--- |
| **Exercise Completion Rate** | `Completed Exercises / Started Exercises` | `UTC+7` theo ngày/tuần |
| **Question Answer Time** | Median `duration_ms` từ lúc render câu hỏi tới lúc bấm `Kiểm tra` / `Submit` | So sánh Text Input vs Radio Cards |
| **Mobile Interaction Success** | `Successful Touch Submissions / Total Attempted Submissions` trên viewport `< 768px` | Lọc theo `platform = mobile` |
| **Diagnostic Completion Rate** | `Submitted 30Q Diagnostics / Started Diagnostics` | `UTC+7` |
| **Learning Session Duration** | Tổng thời gian phiên hợp lệ (idle timeout `<= 15 phút`) | `UTC+7` |
| **D7 / D14 Retention** | `% Cohort người dùng active ngày D0 quay lại hoàn thành >= 1 hoạt động học vào ngày D7 / D14` | Cohort theo ngày đăng ký đầu tiên (`UTC+7`) |
| **Free-to-VIP Conversion** | `Users nâng cấp VIP thành công / Active FREE Users đủ điều kiện trong kỳ` | Tách biệt SePay Paid vs Admin Grant |
| **Paywall Abandonment** | `(SmartPaywall Views - Checkout Initiated) / SmartPaywall Views` | Theo biến thể A/B trung thực |

---

## 3. Transport Endpoint, Bảo Mật, Quyền Riêng Tư & Deduplication (`Bắt buộc`)

1. **Transport & Existing Architecture Compliance (Rule 06):** Mọi sự kiện gửi qua endpoint hiện có **`POST /api/learning/events`** và xử lý qua **`lib/learning/behavioral-engine.js`** (ghi nhận idempotent vào `learning_event_logs` / bảng behavioral hiện hành — **không tự ý đổi DB Schema nếu chưa được PO duyệt**).
2. **Data Minimization:** **Cấm** lưu nội dung câu trả lời tự luận cá nhân, email, SĐT hoặc token xác thực vào `properties`.
3. **Idempotency & Deduplication:** Mọi sự kiện mang `event_id` chống đếm trùng khi mạng lag/retry.
4. **Consent & RLS:** Tôn trọng tùy chọn tracking của user; bảng analytics khóa chặt RLS (chỉ user ghi sự kiện của chính mình, chỉ `ADMIN` xem tổng hợp).
