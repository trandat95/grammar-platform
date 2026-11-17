# 🛡️ MASTER EXECUTION PROTOCOL (P0)

> **Mục đích:** Ngăn chặn AI Agent sửa vượt phạm vi, phá vỡ kiến trúc hiện hành, hoặc tự ý giả định nghiệp vụ khi triển khai `BRAND-UX-V3.1`.

## 10 Nguyên Tắc Điều Khiển Bắt Buộc

| Rule | Quy tắc Bắt buộc | Cơ chế Kiểm chứng |
| :--- | :--- | :--- |
| **Rule 01** | **Audit trước khi sửa:** Đọc đúng các file liên quan và xác nhận hiện trạng thực tế trước khi viết 1 dòng code hay tạo asset. | Ghi rõ danh sách file đã đọc trong Completion Report. |
| **Rule 02** | **Không giả định cấu trúc:** Mọi path, tên biến, token, API route đều phải kiểm chứng trực tiếp trong repo. | Dùng `git grep` / `read_file` xác minh chính xác. |
| **Rule 03** | **Khóa phạm vi Milestone:** Tuyệt đối không sửa ngoài các file thuộc Milestone đang giao. | Kiểm tra `git diff --stat` khớp phạm vi Milestone. |
| **Rule 04** | **Bảo toàn Business Logic:** Không thay đổi scoring, `normalizeText`, `FREE_QUESTIONS_PER_EXERCISE = 4`, quyền VIP/ADMIN, SePay VietQR, hay FTC rules nếu chưa được Product Owner duyệt riêng. | Phân loại rõ *Visual / UX Improvement* vs *Functional Change*. |
| **Rule 05** | **Không xóa component khi chưa chứng minh 0 dependency:** Cấm dọn class CSS hoặc component cũ theo cảm tính. | Bắt buộc grep toàn bộ `pages/`, `components/`, `styles/` cho ra 0 tham chiếu. |
| **Rule 06** | **Không tự ý đổi Database Schema / RLS:** Mọi chỉnh sửa migration hay trigger Postgres đều ngoài phạm vi UI Agent. | `supabase/migrations/` giữ nguyên trừ khi có Milestone DB riêng. |
| **Rule 07** | **Không generate hàng loạt trước Gate A:** Chưa duyệt `MASTER_ART_DIRECTION.md` & `master-mascot` thì cấm chạy hàng loạt Wave 2. | Chỉ được phép tạo M4.3 sau khi Gate A `>= 90/100`. |
| **Rule 08** | **Mỗi Milestone phải có Checkpoint:** Chia nhỏ từng batch thay đổi và kiểm tra ngay thay vì sửa 20 file cùng lúc. | Commit hoặc verify từng nhóm trước khi sang nhóm kế. |
| **Rule 09** | **Chạy Regression Test sau mỗi nhóm thay đổi:** Kiểm tra `npm run build` và các suite kiểm định liên quan. | đính kèm log PASS thực tế. |
| **Rule 10** | **Không tự ý chuyển Milestone:** Tuyệt đối không nhảy sang Milestone tiếp theo khi Acceptance Criteria của Milestone hiện tại chưa PASS hoặc chưa có Sign-off. | Báo cáo qua [`MILESTONE_HANDOVER_PROTOCOL.md`](./MILESTONE_HANDOVER_PROTOCOL.md). |

---

## 🚨 QUY TẮC DỪNG KHẨN CẤP (STOP ON UNDOCUMENTED CONFLICT)

> **AI MUST STOP WHEN DISCOVERING AN UNDOCUMENTED CONFLICT.**

Nếu code thực tế hoặc dữ liệu mâu thuẫn với tài liệu thiết kế (ví dụ: phát hiện câu hỏi có định dạng mới, API có ràng buộc mới, component chia sẻ state khác dự kiến), AI **BẮT BUỘC DỪNG NGAY** và xuất báo cáo 5 bước cho Product Owner:
1. **Ghi nhận sự khác biệt:** File, dòng code và mô tả chính xác điểm lệch.
2. **Bằng chứng thực tế:** Trích output `read_file` / `git grep` / screenshot.
3. **Phân tích ảnh hưởng:** Tác động lên UI, UX, Logic chấm điểm, hay Data.
4. **Đề xuất phương án:** Tối thiểu 2 lựa chọn kèm ưu/nhược điểm (trong đó có phương án an toàn fallback).
5. **Chờ phê duyệt:** Không tự chọn phương án làm thay đổi kiến trúc hoặc nghiệp vụ rồi chạy tiếp.
