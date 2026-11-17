# ⚙️ QUESTION EXPERIENCE ENGINE (`components/question-engine/`)

> Nâng cấp từ component hiển thị đơn thuần thành **Question Experience Engine** dùng chung cho **Study Exercises** và **Grammar Quiz**, bảo toàn 100% logic chấm điểm và đáp án gốc.

---

## 1. Kiến Trúc Thư Mục Dùng Chung

```text
components/question-engine/
├── resolver/
│   ├── QuestionTypeResolver.js   # Phân giải loại hiển thị (ưu tiên Audited ID Registry)
│   ├── ChoiceParser.js           # Tách phương án an toàn khi hợp lệ
│   └── AnswerCompatibility.js    # Kiểm tra khớp q.answers[] trước khi cho phép Radio
├── renderers/
│   ├── MultipleChoiceRenderer.jsx
│   ├── TextInputRenderer.jsx
│   └── MultiBlankRenderer.jsx
├── components/
│   ├── QuestionStem.jsx
│   ├── RadioChoiceCard.jsx       # Min-height 48px, A/B/C/D, arrow keys + touch
│   ├── QuestionAudio.jsx
│   └── QuestionFeedback.jsx      # Nhúng StructuredExplanation 5 bước
├── states/
│   ├── BeforeAnswer.jsx          # Sạch sẽ, 0 hình ảnh phân tâm
│   ├── AfterCorrect.jsx          # Highlight Emerald + kiến thức + Tiếp tục
│   └── AfterWrong.jsx            # Không đỏ gắt, giải thích lỗi + fallback an toàn
└── hooks/
    └── useQuestionState.js       # Persist input & attempt state không mất khi đổi UI
```

---

## 2. Phạm Vi Dữ Liệu Thực Tế & An Toàn Parser (`Audited Registry`)

Kiểm toán trực tiếp trên `data/ui/`:
- `quiz_bank.json`: `2,939` câu tổng, trong đó `151` câu `type === "MULTIPLE_CHOICE"` (**`148` câu inline `(opt1/opt2)`**, **`3` câu ngoại lệ**).
- `preview_data.json`: `507` câu bài tập chương nằm hoàn toàn bên trong `quiz_bank.json`, gồm **`49` `MULTIPLE_CHOICE` (`48` inline)**.
- **3 câu `MULTIPLE_CHOICE` ngoại lệ & câu nhiều ô trống bắt buộc fallback về `TextInputRenderer`:**
  - `People have said that the sun (rise) in the East.` (1 động từ chia thì)
  - `John, you (yourself, yourselves) have to do it.` (dấu phẩy, không có `/`)
  - `“What’s in that box?” “Nothing/ Anything). It’s empty.` (thiếu ngoặc mở `(`)
  - Mọi câu nhiều lỗ trống kiểu `"How (many/ much)1 lists ... (plenty/ plenty of)2 ..."`

**Thứ tự ưu tiên của `QuestionTypeResolver.js`:**
1. **Structured `q.choices`:** Có mảng `choices >= 2` → `MultipleChoiceRenderer`.
2. **Audited MC Registry (Question ID Map):** Danh sách ID đã kiểm duyệt + 5 điều kiện khóa (`type === MULTIPLE_CHOICE`, đúng 1 nhóm `(...)` có `/`, 2–4 lựa chọn, không `starter_prompt`, và `AnswerCompatibility` khớp `q.answers[]`) → `MultipleChoiceRenderer`.
3. **Safe Fallback (`TextInputRenderer`):** Mọi trường hợp ngoại lệ, dấu `/` trong văn bản thường (`and/or`, `km/h`), hoặc lỗi cú pháp → **giữ nguyên `<input type="text">`**.

---

## 3. State Flow, Persistence & Fallback Giải Thích

- **Persistence (`useQuestionState`):** Đáp án đang nhập/chọn không bị mất khi chuyển câu, mở Drawer, đóng Modal, reload hoặc mất mạng.
- **Attempt Tracking:** Ghi *số lần thử, thời gian, đã kiểm tra, đã xem đáp án, cho phép retry*; **không thay đổi scoring hay XP rules**.
- **After Wrong Pedagogical Flow:** Hiển thị *Your Answer / Correct Answer / Why Wrong / Why Right / Grammar Rule / Common Mistake / Related Lesson / Retry*. **Chống bịa nội dung:** Nếu thiếu `Common Mistake` hoặc `Related Knowledge` trong JSON → dùng fallback từ quy tắc chính của bài học, **cấm AI tự bịa lời giải**.
- *(Tương thích đầy đủ các sub-state `submitting`, `revealed`, `retry`).*

---

## 4. Bộ 10 Test Fixtures & Test Runner Tự Động (`M4.4A`)

- Chạy trực tiếp bằng **`node --test tests/question-engine.test.mjs`** (`node:test` + `node:assert`, **không cần cài thêm Jest/Vitest vào `package.json`**) phủ đủ **10 fixtures**:
  `1.` 148 MC inline hợp lệ • `2.` Structured `choices` • `3.` Multi-blank paragraph • `4.` `SENTENCE_TRANSFORMATION` • `5.` `ERROR_CORRECTION` • `6.` Câu có `starter_prompt` • `7.` Long Stem (`749` chars) • `8.` Long Explanation (`1,190` chars) • `9.` Invalid Answer Key / Mismatch • `10.` Ambiguous/Malformed Slash (`and/or`, `Nothing/ Anything)`).
