# 🔒 CONTENT INTEGRITY VERIFICATION SPEC (`M4.1` → `M4.5`)

> Bảo vệ toàn vẹn 100% kho học liệu *Mai Lan Hương & Hà Thanh Uyên* và đáp án gốc trong suốt quá trình nâng cấp UI/UX.

---

## 1. Quy Tắc Đếm Nguồn Dữ Liệu Chuẩn (Chống Đếm Trùng)

Kiểm chứng trực tiếp từ codebase hiện tại trên nhánh `main`:
- **`data/ui/preview_data.json`:** `12` chương, `53` bài học, **`507` câu bài tập chương** (`376` phân mục, `215` quy tắc), trong đó có `49` câu `MULTIPLE_CHOICE` (`48` inline).
- **`data/ui/quiz_bank.json`:** Ngân hàng luyện tập gồm **`2,939` câu hỏi** (gồm `151` câu `MULTIPLE_CHOICE` / `148` inline). **Toàn bộ `507` ID của `preview_data.json` nằm bên trong `quiz_bank.json` (`overlap = 507`) — tuyệt đối không cộng dồn `507 + 2,939`.**
- **`data/toeic/*.json`:** Kho đề thi & luyện tập TOEIC 2026 giữ nguyên cấu trúc & đáp án.

---

## 2. Quy Trình Baseline Manifest (`docs/qa/content-baseline.sha256.json`)

1. **Tại `M4.1` (Trước khi thay đổi UI/Component):** Chạy script Node xuất file baseline chính thức tại **`docs/qa/content-baseline.sha256.json`** từ commit `main` sạch, ghi nhận:
   - SHA-256 hash của từng file `data/ui/preview_data.json`, `data/ui/quiz_bank.json`, và `data/toeic/*.json`.
   - Tổng số chương (`12`), bài học (`53`), bài tập (`51`), câu hỏi `preview_data` (`507`), `quiz_bank` (`2,939`), và checksum tập `answers[]`.
2. **Tại Cổng QA `M4.5`:** Chạy so sánh đối chiếu với `docs/qa/content-baseline.sha256.json`:
   - `100%` SHA-256 hash của mọi file dữ liệu giáo trình phải khớp tuyệt đối.
   - Kết quả chấm điểm của `148` câu `MULTIPLE_CHOICE` inline qua Radio Cards phải khớp `100%` đáp án gốc.
