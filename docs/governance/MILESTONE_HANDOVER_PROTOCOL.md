# 📋 MILESTONE COMPLETION & HANDOVER PROTOCOL (P0)

> **Quy tắc cứng:** Không một Milestone nào được phép đánh dấu `COMPLETED` nếu chưa có báo cáo chuẩn 9 mục dưới đây kèm **bằng chứng chạy thực tế** (command logs / test results / screenshots).

```text
MILESTONE: <M4.X>
STATUS: COMPLETED | BLOCKED | NEEDS_APPROVAL

1. AUDIT
- Files inspected: <danh sách path cụ thể>
- Existing issues / conflicts found: <số lượng & tóm tắt>

2. IMPLEMENTATION
- Files created: <danh sách>
- Files modified: <danh sách>
- Files deleted: <danh sách — kèm xác nhận 0 dependency>

3. VALIDATION
- Token validation (`scripts/validate-design-tokens.py` + `scripts/design/*` sau M4.1): PASS / FAIL
- Contrast & Z-Index validation: PASS / FAIL
- Question Engine (`node --test tests/question-engine.test.mjs`): PASS / FAIL / N/A
- Accessibility & Responsive matrix: PASS / FAIL
- Build check (`npm run build`): PASS / FAIL

4. BUSINESS LOGIC & DATA INTEGRITY
- Scoring / Answers / FREE=4 / VIP / SePay / Curriculum changes: NONE (hoặc chi tiết mục đã được duyệt)
- Content SHA-256 parity check: PASS / FAIL

5. REGRESSION
- Existing user journeys: PASS / FAIL
- New milestone scope: PASS / FAIL

6. REMAINING ISSUES
- Critical: 0 (bắt buộc = 0 để PASS)
- Major: 0
- Minor: <số lượng & mô tả>

7. ROLLBACK
- Baseline commit before milestone: <git hash>
- Target commit / PR: <git hash>
- Rollback verified: YES / NO

8. ACCEPTANCE CRITERIA
- Passed: <X>/<X>
- Failed: 0

9. NEXT MILESTONE GATE
- Ready for <M4.Y>: YES / BLOCKED (lý do)
- Product Owner Sign-off needed: YES / NO
```
