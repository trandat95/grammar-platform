# 🗺️ BẢN ĐỒ PHÁT TRIỂN & KIẾN TRÚC HỆ THỐNG (LIVING ROADMAP & ENTERPRISE ARCHITECTURE GUIDE)
> **Dự án:** Grammar Engine - Nền tảng Tự học & Luyện thi Ngữ pháp Tiếng Anh Toàn diện (Personalized English Grammar Learning Platform)  
> **Nguồn học liệu:** Giáo trình *Ngữ pháp tiếng Anh* - Mai Lan Hương & Hà Thanh Uyên  
> **Kiến trúc:** Enterprise EdTech (Next.js + Supabase PostgreSQL 17 + Offline Sync Engine + AI Diagnostic Roadmap)  
> **Phiên bản hiện tại:** `v2.1-diagnostic-roadmap-enhanced`  
> **Cập nhật gần nhất:** 11/11/2026  
> **Tài liệu điều hướng tối cao:** Mọi phiên làm việc / Prompt tiếp theo **BẮT BUỘC ĐỌC FILE NÀY ĐẦU TIÊN** để nắm bắt chính xác tiến độ, kiến trúc và bước đi tiếp theo.

---

## 📌 1. ĐỊNH VỊ GIAI ĐOẠN HIỆN TẠI (CURRENT PHASE STATUS)

```
[ Phase 1: Frontend MVP & Gamified Core ] ---> [ Phase 2: Enterprise Cloud & Learning Platform (HIỆN TẠI) ] ---> [ Phase 3: AI Tutor & Monetization ]
                  ✅ HOÀN THÀNH                                        🚀 ĐANG TÁI CẤU TRÚC & TRIỂN KHAI                                  ⏳ KẾ TIẾP
```

* **Trọng tâm hiện tại:** **GIAI ĐOẠN 2 - NÂNG CẤP LÊN PERSONALIZED GRAMMAR LEARNING PLATFORM CHUYÊN SÂU**.
* **Mục tiêu cấp thiết nhất:** 
  1. Tách lớp kiến trúc Client/Server/Services/Repositories bảo mật tuyệt đối `SERVICE_ROLE_KEY`.
  2. Nâng cấp schema Supabase PostgreSQL 17 (14 bảng: 8 bảng hệ thống/người dùng + 6 bảng chẩn đoán & lộ trình học cá nhân hóa).
  3. Xây dựng **Offline Sync Engine** đa tầng giải quyết triệt để xung đột LocalStorage / IndexedDB <-> Cloud.
  4. Triển khai **Milestone 2.8 (Module Trung tâm): AI-Powered Grammar Diagnostic & Personalized Learning Roadmap** – Đánh giá trình độ ngữ pháp đầu vào, chẩn đoán chính xác lỗ hổng kiến thức, và tự động thiết kế lộ trình học riêng biệt cho từng học viên.
* **Thông tin Môi trường kết nối:**
  - 🌐 **Production URL:** [https://grammar-platform.vercel.app](https://grammar-platform.vercel.app)
  - 🐙 **GitHub Repository:** [doanphuongtanthoihiep-crypto/grammar-platform](https://github.com/doanphuongtanthoihiep-crypto/grammar-platform)
  - ⚡ **Vercel Project ID:** `prj_yfOLrVVbBV0b8O8G2ihrDhR5HLsa`
  - 🐘 **Supabase Project:**
    - Project ID / Ref: `wtvlbbcyvtqqygtojxay`
    - Tên Project: `doanphuongtanthoihiep-crypto's Project`
    - Region: `ap-northeast-2` (Seoul, độ trễ cực thấp về Việt Nam)
    - URL Endpoint: `https://wtvlbbcyvtqqygtojxay.supabase.co`
    - Trạng thái DB: `ACTIVE_HEALTHY` (PostgreSQL 17)

---

## 🏛️ 2. MA TRẬN PHÂN CHIA MILESTONE & THỨ TỰ ƯU TIÊN (PRIORITY MATRIX)

Nhằm giảm thiểu tối đa rủi ro gián đoạn hệ thống và đảm bảo tính liên tục của nền tảng học tập, lộ trình Phase 2 được tổ chức theo thứ tự ưu tiên kiến trúc nghiêm ngặt:

| Nhóm chức năng | Milestone | Tên Milestone | Mức độ ưu tiên | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| **Infrastructure** | **2.1** | **Database Provisioning, Security Hardening & RLS** | **P0 (Critical)** | ✅ Hoàn thành |
| **Infrastructure** | **2.2** | **Supabase SDK Layering (Client / Server / Services)** | **P0 (Critical)** | ✅ Hoàn thành |
| **Infrastructure** | **2.3** | **Auth & Offline Sync Engine (Conflict Resolution)** | **P0 (Critical)** | ✅ Hoàn thành |
| **Management** | **2.4** | **Enterprise Admin Dashboard & Server Audit Logs** | **P1 (High)** | ✅ Hoàn thành |
| **Content** | **2.5** | **Structured Pedagogical Explanation Engine (JSON Schema)**| **P1 (High)** | 🔄 Nâng cấp |
| **Design** | **2.6** | **Design Token System & White/Dark Mode WCAG AA** | **P2 (Medium)**| ✅ Hoàn thành |
| **Content** | **2.7** | **Grammar Visualization Engine & Audio Engine** | **P1 (High)** | ✅ Hoàn thành |
| **Core EdTech** | **2.8** | **AI-Powered Grammar Diagnostic & Personalized Roadmap** | **P1 (Central Module)**| ⏳ Kế tiếp |
| **Intelligence** | **2.9** | **Continuous Adaptive Learning, Mastery Tracking & Reassessment**| **P2 (High)** | ⏳ Kế tiếp |
| **Gamification** | **2.10**| **Achievement, Level & Gamification System** | **P2 (Medium)**| ⏳ Kế tiếp |
| **Quality** | **2.11**| **Performance, Security Hardening & Verification** | **P0 (Pre-Prod)**| ⏳ Kế tiếp |

---

## 🏛️ 3. KIẾN TRÚC DỰ ÁN & PHÂN TÁCH LỚP (LAYERED ARCHITECTURE)

Hệ thống Next.js Pages Router được phân tầng rõ rệt nhằm triệt tiêu hoàn toàn rủi ro lộ khóa bảo mật và đảm bảo code clean, dễ kiểm thử tự động:

```
grammar-platform/
├── lib/
│   ├── supabase/
│   │   ├── client.js            # Browser Supabase Client (Chỉ dùng NEXT_PUBLIC_SUPABASE_ANON_KEY)
│   │   ├── server.js            # Server-side Client (Sử dụng SUPABASE_SERVICE_ROLE_KEY, chỉ chạy trên Node.js/API)
│   │   └── middleware.js        # Session check & token refresh helper
│   ├── sync/
│   │   ├── indexed-db.js        # Local Database adapter cho lưu trữ lớn
│   │   ├── sync-queue.js        # Hàng đợi Offline Write Queue
│   │   └── sync-manager.js      # Bộ điều phối đồng bộ & giải quyết xung đột (Conflict Resolution)
│   ├── diagnostic/
│   │   ├── question-selector.js # Thuật toán rút trích 30 câu chuẩn blueprint từ ngân hàng 2.939 câu
│   │   ├── scoring-engine.js    # Layer 1: Deterministic Assessment & Confidence Scoring
│   │   └── roadmap-generator.js # Layer 2: Liên kết điểm yếu với 53 bài học & 51 bài tập
│   ├── audio/
│   │   ├── audio.service.js     # Trình phát âm thanh & Cache
│   │   └── speech.service.js    # Web Speech API & TTS Fallback (US / UK accents, Playback speed)
│   └── tokens/
│       └── design-tokens.js     # Bảng mã màu, khoảng cách, typography tập trung
├── services/
│   ├── auth.service.js          # Nghiệp vụ đăng ký, đăng nhập, phân quyền
│   ├── profile.service.js       # Nghiệp vụ thông tin tài khoản & vai trò
│   ├── tracker.service.js       # Nghiệp vụ XP, Streak, Bài học hoàn thành
│   ├── mistakes.service.js      # Nghiệp vụ Sổ tay câu sai & thuật toán ôn tập
│   ├── vocabulary.service.js    # Nghiệp vụ Sổ tay từ vựng
│   ├── quiz.service.js          # Nghiệp vụ bộ đề trắc nghiệm & lưu kết quả
│   ├── policy.service.js        # Nghiệp vụ cấu hình hạn mức người dùng
│   ├── diagnostic.service.js    # Nghiệp vụ điều phối bài kiểm tra chẩn đoán 30 câu
│   └── roadmap.service.js       # Nghiệp vụ theo dõi tiến độ lộ trình cá nhân hóa
├── repositories/
│   ├── user.repository.js       # Truy cập DB bảng profiles, user_learning_trackers
│   ├── quiz.repository.js       # Truy cập DB bảng quiz_attempts
│   ├── mistakes.repository.js   # Truy cập DB bảng user_mistakes
│   ├── vocabulary.repository.js # Truy cập DB bảng user_vocabularies
│   ├── activity.repository.js   # Truy cập DB bảng user_daily_activities
│   ├── audit.repository.js      # Truy cập DB bảng audit_logs (Server-side Only)
│   └── diagnostic.repository.js # Truy cập DB các bảng diagnostic_* & user_learning_roadmaps
├── pages/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── users.js         # API quản trị tài khoản có xác thực Admin Server-side
│   │   │   ├── policy.js        # API cập nhật hạn mức hệ thống
│   │   │   └── audit-logs.js    # API lấy lịch sử hoạt động Admin
│   │   ├── diagnostic/
│   │   │   ├── start.js         # API cấp phát đề kiểm tra chẩn đoán 30 câu
│   │   │   ├── submit.js        # API chấm điểm server-side & tính ma trận điểm yếu
│   │   │   └── roadmap.js       # API lưu và nạp lộ trình học cá nhân hóa
│   │   ├── sync/
│   │   │   └── batch.js         # Endpoint nhận đồng bộ mẻ từ Sync Queue
│   │   └── dictionary.js        # Serverless API tra từ điển
│   ├── _app.js                  # Global wrappers, Theme Provider & Offline Sync Provider
│   └── index.js                 # Single-Page Application (Navigation, Dashboard, Study, Quiz, Mistakes, Admin, Diagnostic)
├── data/
│   ├── normalized/
│   │   └── full_import_data.json # 7.2MB quan hệ gốc 53 lessons, 982 rules
│   └── ui/
│       ├── preview_data.json    # 12 chương, 53 bài, cheat-sheets, song ngữ
│       └── quiz_bank.json       # 2.939 câu trắc nghiệm đã làm sạch
└── ROADMAP_AND_ARCHITECTURE.md  # SINGLE SOURCE OF TRUTH
```

---

## 🐘 4. THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN POSTGRESQL 17 (14 TABLES & RLS ARCHITECTURE)

### 4.1. Sơ đồ Thực thể Dữ liệu Toàn diện (Extended Master ERD)

```mermaid
erDiagram
    PROFILES ||--o{ USER_TRACKERS : owns
    PROFILES ||--o{ USER_MISTAKES : tracks
    PROFILES ||--o{ USER_VOCAB : saves
    PROFILES ||--o{ QUIZ_ATTEMPTS : records
    PROFILES ||--o{ USER_ACHIEVEMENTS : earns
    PROFILES ||--o{ USER_DAILY_ACTIVITIES : logs
    PROFILES ||--o{ AUDIT_LOGS : triggers

    PROFILES ||--o{ DIAGNOSTIC_ATTEMPTS : takes
    DIAGNOSTIC_TESTS ||--o{ DIAGNOSTIC_ATTEMPTS : defines
    DIAGNOSTIC_ATTEMPTS ||--o{ DIAGNOSTIC_ANSWERS : contains
    DIAGNOSTIC_ATTEMPTS ||--o{ DIAGNOSTIC_SKILL_RESULTS : analyzes
    DIAGNOSTIC_ATTEMPTS ||--o| USER_LEARNING_ROADMAPS : generates
    USER_LEARNING_ROADMAPS ||--o{ ROADMAP_ITEMS : structures

    PROFILES {
        uuid id PK "references auth.users(id)"
        text email UK
        text full_name
        text role "FREE | VIP | ADMIN"
        text status "ACTIVE | LOCKED"
        timestamptz created_at
        timestamptz updated_at
    }
    USER_TRACKERS {
        uuid id PK
        uuid user_id FK
        int streak
        int xp
        date last_active_date
        jsonb active_days
        jsonb daily_goal
        jsonb completed_lessons
        int quizzes_today
        date quiz_date
        int version
        timestamptz updated_at
    }
    DIAGNOSTIC_TESTS {
        uuid id PK
        text title
        text description
        int total_questions "Default 30"
        int time_limit_seconds "Default 1200 (20 mins)"
        jsonb blueprint_config
        text status "ACTIVE | DRAFT"
        timestamptz created_at
    }
    DIAGNOSTIC_ATTEMPTS {
        uuid id PK
        uuid user_id FK
        uuid test_id FK
        int total_questions
        int correct_answers
        numeric total_score
        text estimated_level "A1 | A2 | B1 | B2 | C1 (Estimated)"
        text status "IN_PROGRESS | COMPLETED | ABANDONED"
        timestamptz started_at
        timestamptz completed_at
    }
    DIAGNOSTIC_ANSWERS {
        uuid id PK
        uuid attempt_id FK
        text question_id
        jsonb question_snapshot
        text selected_answer
        boolean is_correct
        int time_spent_seconds
        timestamptz answered_at
    }
    DIAGNOSTIC_SKILL_RESULTS {
        uuid id PK
        uuid attempt_id FK
        uuid user_id FK
        text topic_id
        text topic_name
        int total_questions
        int correct_answers
        numeric accuracy
        text confidence "low | medium | high"
        text classification "mastered | good | developing | needs_improvement | critical_weakness"
    }
    USER_LEARNING_ROADMAPS {
        uuid id PK
        uuid user_id FK
        uuid diagnostic_attempt_id FK
        text title
        text target_level
        text status "ACTIVE | COMPLETED | ARCHIVED"
        timestamptz created_at
        timestamptz updated_at
    }
    ROADMAP_ITEMS {
        uuid id PK
        uuid roadmap_id FK
        uuid user_id FK
        text lesson_id
        text practice_id
        text topic_id
        text title
        text item_type "THEORY | GUIDED_PRACTICE | QUIZ | REASSESSMENT"
        text priority "HIGH | MEDIUM | MAINTAIN"
        int sequence_order
        text status "PENDING | IN_PROGRESS | COMPLETED | SKIPPED"
        text reason
        timestamptz completed_at
    }
    AUDIT_LOGS {
        uuid id PK
        uuid admin_id FK
        text action_type
        text target_type
        text target_id
        jsonb before_state
        jsonb after_state
        text ip_address
        timestamptz created_at
    }
```

### 4.2. RLS Security Model (Chống Đệ quy & Phân quyền Độc lập)

1. **Hàm bảo mật xác thực Admin (Security Definer Helper Function):**
   Tránh lỗi `infinite recursion` khi RLS policy trên `profiles` truy vấn ngược chính bảng `profiles`:
   ```sql
   CREATE OR REPLACE FUNCTION public.is_admin()
   RETURNS boolean AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role = 'ADMIN' AND status = 'ACTIVE'
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
   ```

2. **Chính sách phân quyền 2 tầng rõ rệt:**
   - **Bảng người dùng & Chẩn đoán (`profiles`, `user_learning_trackers`, `diagnostic_attempts`, `diagnostic_answers`, `diagnostic_skill_results`, `user_learning_roadmaps`, `roadmap_items`):**
     * `SELECT`: `auth.uid() = user_id` HOẶC `is_admin() = true`.
     * `INSERT`: `auth.uid() = user_id`. Khóa cứng không cho client tự sửa `is_correct` hay `total_score`.
     * `UPDATE`: `auth.uid() = user_id` (Cấm user cập nhật cột `role` trong bảng `profiles`).
     * `DELETE`: `auth.uid() = user_id` HOẶC `is_admin() = true`.
   - **Bảng cấu hình hệ thống & bài test (`system_policies`, `diagnostic_tests`):**
     * `SELECT`: Công khai hoặc `auth.role() = 'authenticated'`.
     * `INSERT / UPDATE / DELETE`: Chỉ dành riêng cho Admin (`is_admin() = true`).
   - **Bảng ghi log (`audit_logs`):**
     * `SELECT`: Chỉ dành riêng cho Admin (`is_admin() = true`).
     * `INSERT`: Bất biến (Append-only), chỉ thực hiện từ Server-Side API qua `SERVICE_ROLE_KEY`.

3. **Cơ chế Trigger Khởi tạo An toàn & Idempotent:**
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS trigger AS $$
   BEGIN
     INSERT INTO public.profiles (id, email, full_name, role, status)
     VALUES (
       new.id,
       new.email,
       COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
       'FREE',
       'ACTIVE'
     )
     ON CONFLICT (id) DO UPDATE
     SET email = EXCLUDED.email,
         full_name = EXCLUDED.full_name;

     INSERT INTO public.user_learning_trackers (user_id, streak, xp, last_active_date)
     VALUES (new.id, 1, 50, CURRENT_DATE)
     ON CONFLICT (user_id) DO NOTHING;

     RETURN new;
   EXCEPTION WHEN OTHERS THEN
     RAISE WARNING 'handle_new_user error: %', SQLERRM;
     RETURN new;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
   ```

4. **Composite Performance Indexes:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_diag_attempts_user ON public.diagnostic_attempts(user_id, started_at DESC);
   CREATE INDEX IF NOT EXISTS idx_diag_answers_attempt ON public.diagnostic_answers(attempt_id);
   CREATE INDEX IF NOT EXISTS idx_diag_skills_attempt ON public.diagnostic_skill_results(attempt_id, topic_id);
   CREATE INDEX IF NOT EXISTS idx_roadmaps_user_status ON public.user_learning_roadmaps(user_id, status);
   CREATE INDEX IF NOT EXISTS idx_roadmap_items_seq ON public.roadmap_items(roadmap_id, sequence_order ASC);
   CREATE INDEX IF NOT EXISTS idx_mistakes_user_ch ON public.user_mistakes(user_id, chapter_title);
   CREATE INDEX IF NOT EXISTS idx_vocab_user_date ON public.user_vocabularies(user_id, added_at DESC);
   CREATE INDEX IF NOT EXISTS idx_quiz_user_date ON public.quiz_attempts(user_id, created_at DESC);
   ```

---

## 🔄 5. KIẾN TRÚC OFFLINE SYNC ENGINE & CHIẾN LƯỢC XUNG ĐỘT (HYBRID SYNC)

### 5.1. Mô hình Đồng bộ Dữ liệu

```text
[ Browser Event: Complete Question / Learn Lesson ]
                       │
                       ▼
       [ Local Storage / IndexedDB Storage ]
                       │
                       ▼
            [ Offline Write Queue ]
                       │
           ┌───────────┴───────────┐
      (Online)                  (Offline)
           │                         │
           ▼                         ▼
   [ Sync Manager ]           [ Pending Changes State (🟠) ]
           │                         │
    (Conflict Rules)                 ▼
           │                  [ Auto-retry when online ]
           ▼
[ Supabase PostgreSQL 17 via API ]
           │
           ▼
[ Synced State (🟢) with Last Sync Timestamp ]
```

### 5.2. Ma trận Chiến lược Giải quyết Xung đột (Conflict Resolution Matrix)

| Loại dữ liệu | Chiến lược xử lý | Cơ chế thực thi |
| :--- | :--- | :--- |
| **Điểm kinh nghiệm (XP)** | Transactional Increment | Tính toán phần gia tăng (delta) ở client; server thực hiện phép toán cộng dồn nguyên tử `xp = xp + delta` thay vì ghi đè giá trị tuyệt đối. |
| **Chuỗi ngày học (Streak)**| Server-side Calculation | Server đối chiếu `last_active_date` với `CURRENT_DATE`: nếu là ngày kế tiếp thì tăng 1; nếu trùng thì giữ nguyên; nếu đứt quãng thì reset về 1. |
| **Bài làm Chẩn đoán & Quiz**| Immutable Records | Mỗi bài kiểm tra là một bản ghi bất biến với UUID riêng; lưu snapshot câu hỏi tại thời điểm làm bài để bảo toàn lịch sử khi ngân hàng câu hỏi thay đổi. |
| **Sổ tay câu sai (Mistakes)** | Upsert theo Unique Key | Cặp `(user_id, question_id)` làm khóa duy nhất: nếu làm sai lại thì cập nhật `failed_at` và `review_count += 1`; nếu làm đúng trong chế độ ôn thì set `is_mastered = true`. |
| **Lộ trình học tập (Roadmap)**| Active State Locking | Không tự ý ghi đè lộ trình đang thực hiện khi chưa có quyết định rõ ràng từ người dùng hoặc qua quy trình Reassessment chính thức. |

---

## 📐 6. STRUCTURED PEDAGOGICAL EXPLANATION ENGINE (JSON SCHEMA)

Toàn bộ giải thích câu hỏi bài tập và đề thi được chuẩn hóa thành cấu trúc dữ liệu JSON sư phạm thay vì các chuỗi văn bản tự do:

```json
{
  "signal": {
    "title": "Dấu hiệu nhận biết",
    "content": "Xuất hiện trạng từ chỉ thời gian 'for 5 years' kết hợp ngữ cảnh hành động bắt đầu từ quá khứ và vẫn tiếp diễn ở hiện tại.",
    "keywords": ["for 5 years", "since", "so far"]
  },
  "rule": {
    "title": "Quy tắc ngữ pháp",
    "formula": "S + have/has + V3/V-ed",
    "explanation": "Thì Hiện tại hoàn thành (Present Perfect Tense) diễn tả hành động xảy ra trong quá khứ và kéo dài đến hiện tại."
  },
  "translation": {
    "vi": "Họ đã sống ở thành phố này được 5 năm.",
    "en": "They have lived in this city for 5 years."
  },
  "common_mistakes": [
    "Dùng nhầm thì Quá khứ đơn (lived) vì thấy hành động đã bắt đầu từ trước.",
    "Quên chia 'has' với ngôi thứ ba số ít."
  ],
  "exam_tips": [
    "Phân biệt 'since' (mốc thời gian cụ thể: since 2018) và 'for' (khoảng thời gian: for 5 years)."
  ],
  "difficulty": "Intermediate",
  "category": "TENSES"
}
```

---

## 🎨 7. GRAMMAR VISUALIZATION ENGINE & AUDIO ARCHITECTURE

### 7.1. Trực quan Hóa Tương tác Theo Từng Chủ điểm

| Chủ điểm Ngữ pháp | Hình thức Trực quan Hóa | Trải nghiệm Tương tác |
| :--- | :--- | :--- |
| **13 Thì tiếng Anh (Tenses)** | **Dòng thời gian (Timeline Axis)** | Trục thời gian Quá khứ - Hiện tại - Tương lai kèm điểm mốc và khoảng hành động. |
| **Câu điều kiện (Conditionals)** | **Cây quyết định (Decision Tree)** | Phân nhánh theo tính khả thi: Có thật ở hiện tại -> Loại 1; Giả định hiện tại -> Loại 2; Giả định quá khứ -> Loại 3. |
| **Câu bị động (Passive Voice)** | **Sơ đồ Biến đổi (Transformation Diagram)** | Mũi tên chuyển vị trí S -> By O, O -> S, và động từ V -> Be + V3 sinh động. |
| **Câu gián tiếp (Reported Speech)** | **Bảng Lùi thì & Chuyển đổi (Conversion Flow)** | Luồng lùi thì mũi tên (Present -> Past -> Past Perfect) và quy tắc đổi đại từ/thời gian. |
| **Mệnh đề quan hệ (Relative Clauses)** | **Sơ đồ Cấu trúc Câu (Sentence Tree)** | Highlight danh từ đi trước và liên kết với đại từ quan hệ (Who, Whom, Which, Whose, That). |
| **So sánh (Comparisons)** | **Thẻ So sánh Đa cấp (Comparison Scale)** | Biểu diễn trực quan tỷ lệ Bằng nhau (=), Hơn (>), Nhất (MAX). |
| **Động từ khuyết thiếu (Modal Verbs)**| **Ma trận Cấp độ Nghĩa (Meaning Matrix)** | Thang đo độ chắc chắn từ 0% đến 100% (Might -> May -> Could -> Should -> Must). |
| **Từ loại & Cấu tạo từ (Word Forms)** | **Cây Họ từ (Word Family Tree)** | Cây phân nhánh Gốc từ -> Danh từ -> Động từ -> Tính từ -> Trạng từ kèm hậu tố. |

### 7.2. Chuẩn hóa Audio Engine
- **Tập trung hóa:** `lib/audio/speech.service.js` và `lib/audio/pronunciation.service.js`.
- **Đa dạng ngữ điệu:** Hỗ trợ tùy chọn giọng đọc Anh - Anh (UK) và Anh - Mỹ (US).
- **Điều chỉnh tốc độ:** `0.75x`, `1.0x`, `1.25x`.
- **Bộ nhớ đệm âm thanh (Audio Caching):** Lưu cache URL phát âm, chống tải trùng lặp.

---

## 🎯 8. MILESTONE 2.8: AI-POWERED GRAMMAR DIAGNOSTIC & PERSONALIZED LEARNING ROADMAP (MODULE TRUNG TÂM)

> **Sứ mệnh cốt lõi:** Thay vì để học viên tự chọn mò mẫm trong 53 bài học mà không biết xuất phát điểm của mình ở đâu, hệ thống chủ động đánh giá chính xác năng lực, chẩn đoán vùng kiến thức yếu và kiến tạo lộ trình học tập đo ni đóng giày cho riêng từng người.

### 8.1. Quy trình Trải nghiệm Học viên (4-Step UX Flow)

```
[ Step 1: Initial Assessment Onboarding ]
  "Discover Your Grammar Level" -> 30 câu hỏi / 15-20 phút / Không áp lực trừ điểm
                       │
                       ▼
[ Step 2: Adaptive Placement Test Session ]
  Giao diện 1 câu/màn hình -> Timer -> Progress Bar -> Flag Review -> Submit
                       │
                       ▼
[ Step 3: Deterministic Diagnostic Analysis ]
  Bóc tách ma trận 12 chuyên đề -> Tính Accuracy & Confidence Level -> Phân loại điểm mạnh/yếu
                       │
                       ▼
[ Step 4: Dynamic Personalized Learning Roadmap ]
  Lộ trình hành động tuần tự: Ôn lý thuyết -> Luyện tập bài tập thực tế -> Mini-quiz -> Reassessment
```

### 8.2. Ma trận Blueprint 30 Câu hỏi & Phân loại Độ khó

Tái sử dụng ngân hàng 2.939 câu hỏi hiện có thông qua thuật toán trích xuất có đối trọng:

| Nhóm Kiến thức Ngữ pháp | Số lượng Câu | Tỷ lệ Blueprint | Phân bổ Độ khó |
| :--- | :---: | :---: | :---: |
| **Các Thì trong tiếng Anh (Tenses)** | 6 câu | 20% | 2 Dễ - 3 Trung bình - 1 Khó |
| **Câu bị động (Passive Voice)** | 3 câu | 10% | 1 Dễ - 1 Trung bình - 1 Khó |
| **Câu điều kiện (Conditionals)** | 3 câu | 10% | 1 Dễ - 1 Trung bình - 1 Khó |
| **Động từ khuyết thiếu (Modal Verbs)** | 3 câu | 10% | 1 Dễ - 1 Trung bình - 1 Khó |
| **Mệnh đề quan hệ (Relative Clauses)** | 3 câu | 10% | 1 Dễ - 1 Trung bình - 1 Khó |
| **Mạo từ & Từ chỉ số lượng (Determiners)**| 3 câu | 10% | 1 Dễ - 1 Trung bình - 1 Khó |
| **Giới từ & Cụm từ (Prepositions)** | 3 câu | 10% | 1 Dễ - 2 Trung bình - 0 Khó |
| **Các dạng So sánh (Comparisons)** | 2 câu | 7% | 1 Dễ - 1 Trung bình - 0 Khó |
| **Lời nói gián tiếp (Reported Speech)** | 2 câu | 7% | 0 Dễ - 1 Trung bình - 1 Khó |
| **Từ loại & Cấu trúc câu (Word Forms)** | 2 câu | 6% | 1 Dễ - 0 Trung bình - 1 Khó |
| **TỔNG CỘNG** | **30 câu** | **100%** | **10 Dễ (33%) - 12 TB (40%) - 8 Khó (27%)** |

**Schema Metadata gắn kèm mỗi câu hỏi:**
```json
{
  "question_id": "Q_TENSE_042",
  "topic": "Tenses",
  "sub_topic": "Present Perfect vs Past Simple",
  "lesson_id": "lesson_03",
  "difficulty": "medium",
  "skill": "grammar_application",
  "correct_answer": "C",
  "competency_id": "COMP_TENSE_PERFECT"
}
```

### 8.3. Kiến trúc Đánh giá 2 Tầng (Two-Tier Diagnostic Engine)

1. **Layer 1 – Deterministic Assessment Engine (Toán học Thuần túy - Zero Hallucination):**
   - Chấm điểm tuyệt đối phía server (Server-side Verification).
   - Công thức: `Accuracy = (Correct Answers / Total Questions) * 100`.
   - Phân loại 5 cấp độ chuẩn xác:
     * `90% – 100%`: **Mastered** (Đã làm chủ kiến thức)
     * `75% – 89%`: **Good** (Nắm vững tốt)
     * `60% – 74%`: **Developing** (Đang phát triển, cần củng cố)
     * `40% – 59%`: **Needs Improvement** (Hổng kiến thức nền)
     * `0% – 39%`: **Critical Weakness** (Điểm yếu chí mạng - Ưu tiên hàng đầu 🔴)
   - **Độ tin cậy (Confidence Level):** Gắn nhãn `low` (1-2 câu), `medium` (3-5 câu), `high` (> 5 câu) để không kết luận vội vã về năng lực của học viên khi mẫu dữ liệu còn nhỏ.
   - **Xếp hạng trình độ tổng thể (Estimated Grammar Level):** Ước tính nội bộ mức A1, A2, B1, B2 (rõ ràng minh bạch: đây là thang đo ngữ pháp nội bộ, không thay thế chứng chỉ 4 kỹ năng quốc tế).

2. **Layer 2 – AI Learning Recommendation Engine (Cá nhân hóa Lời khuyên):**
   - Tiếp nhận kết quả đã được xác minh từ Layer 1 (không để AI tự chấm điểm).
   - Diễn giải dễ hiểu điểm mạnh, điểm yếu.
   - Sắp xếp thứ tự ưu tiên học tập: 🔴 High Priority -> 🟡 Medium Priority -> 🟢 Maintain.
   - Tạo lời khuyên truyền cảm hứng và giải thích lý do vì sao cần học bài học đó.

### 8.4. Lộ trình Học tập Cá nhân hóa Hành động (Actionable Learning Roadmap)

Roadmap liên kết chặt chẽ 100% với **53 bài học lý thuyết** và **51 bộ bài tập thực hành** có thật trong hệ thống:

```
[ LỘ TRÌNH MẪU ĐƯỢC TẠO SAU CHẨN ĐOÁN ]
Ước tính trình độ: B1 Grammar (Estimated) - Điểm tổng thể: 72/100

Tuần 1: Khắc phục Điểm Yếu Chí Mạng (🔴 Critical Weakness)
  Step 1: Ôn lý thuyết Thì Hiện tại hoàn thành (Bài học số 3 - Chuyên đề 1)
  Step 2: Học bảng công thức 3 thể & Dấu hiệu nhận biết Since/For
  Step 3: Làm 20 câu bài tập phân biệt Present Perfect vs Past Simple
  Step 4: Hoàn thành Mini-Quiz kiểm tra lại chuyên đề (Target: >= 80%)

Tuần 2: Nâng cấp Dạng câu Biến đổi (🔴 High Priority)
  Step 1: Ôn lý thuyết Câu bị động đặc biệt (Bài học số 42 - Chuyên đề 10)
  Step 2: Thực hành 20 câu Sentence Transformation Chủ động -> Bị động
  Step 3: Rà soát các câu làm sai trong Sổ tay câu sai

Tuần 3: Đánh giá lại Tiến độ (Reassessment)
  Step 1: Thực hiện bài Retake Test 30 câu
  Step 2: Xem biểu đồ đối soát tăng trưởng: Present Perfect (Trước: 20% -> Hiện tại: 85% [+65%])
```

---

## 🛡️ 9. ENGINEERING QUALITY GATES (TIÊU CHUẨN NGHIỆM THU BẮT BUỘC)

| Quality Gate | Tiêu chuẩn Đánh giá | Bằng chứng Bắt buộc (Verification Evidence) |
| :--- | :--- | :--- |
| **1. Architecture Compliance** | Tuân thủ tuyệt đối cấu trúc Client / Server / Services / Repositories. | Không import server code vào browser, không dùng `SERVICE_ROLE_KEY` ở client. |
| **2. Security & RLS** | RLS không đệ quy, không bypass authorization, người dùng không thể tự phong quyền Admin. | Script chạy test RLS đóng vai trò Anonymous, Free User, VIP User và Admin. |
| **3. Database Migration** | Migration chạy thành công, hỗ trợ rollback, idempotent. | Log kết quả chạy SQL từ Supabase MCP tool `execute_sql`. |
| **4. Zero Compilation Error** | Bản build Next.js thành công 100%, không lỗi cú pháp hoặc JSON escape. | Vercel Deployment đạt trạng thái `READY` trên production. |
| **5. Functional Integrity** | Tính năng hoạt động chuẩn xác theo nghiệp vụ mô tả. | Test luồng end-to-end từ UI -> API -> Supabase DB. |
| **6. Regression Proof** | Không làm hỏng hoặc mất mát 12 chuyên đề, 53 bài học và 2.939 câu hỏi hiện có. | Kiểm tra đối soát số lượng record dữ liệu sau khi cập nhật. |
| **7. Design & Responsive** | Hiển thị hoàn hảo trên cả White Mode và Dark Mode, đáp ứng tốt Mobile / Tablet / Desktop. | Đảm bảo tương phản WCAG AA, không bị thanh đen, nút chìm hay text tàng hình. |
| **8. Living Roadmap Sync** | File `ROADMAP_AND_ARCHITECTURE.md` được cập nhật đồng bộ ngay sau mỗi bước. | Commit Git có diff thể hiện việc cập nhật checklist tương ứng. |

---

## 📋 10. CHI TIẾT CÁC MILESTONE TIẾP THEO

### 🔹 Milestone 2.1: Database Provisioning, Security Hardening & RLS (P0)
- [x] Chạy migration mở rộng bảng trên Supabase Postgres: `profiles`, `user_learning_trackers`, `user_mistakes`, `user_vocabularies`, `system_policies`, `quiz_attempts`, `user_achievements`, `user_daily_activities`, `audit_logs`, `diagnostic_tests`, `diagnostic_attempts`, `diagnostic_answers`, `diagnostic_skill_results`, `user_learning_roadmaps`, `roadmap_items`.
- [x] Thiết lập hàm bảo mật `is_admin()` (Security Definer) ngăn ngừa triệt để lỗi Infinite Recursion trong RLS.
- [x] Thiết lập RLS policies độc lập: User tables (Owner read/write), System tables (Authenticated read, Admin write), Audit logs (Append-only).
- [x] Tạo trigger `on_auth_user_created` idempotent với `SET search_path = public` và bảo vệ lỗi ngoại lệ.
- [x] Tạo composite indexes cho các câu truy vấn thực tế (`user_id`, `chapter_title`, `created_at DESC`, `started_at DESC`).
- [x] Chạy bộ kiểm thử tự động RLS Security Validation.

### 🔹 Milestone 2.2: Phân tách Kiến trúc Supabase SDK (Client / Server / Services / Repositories) (P0)
- [x] Tách `lib/supabase/client.js` chỉ chứa browser client sử dụng `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [x] Tạo `lib/supabase/server.js` chỉ chạy phía server sử dụng `SUPABASE_SERVICE_ROLE_KEY`.
- [x] Xây dựng thư mục `repositories/` chuyên trách các thao tác database.
- [x] Xây dựng thư mục `services/` chuyên trách các quy tắc nghiệp vụ.
- [x] Tạo các Next.js API Routes được bảo vệ quyền Admin phía server (`/api/admin/users`, `/api/admin/policy`, `/api/admin/audit-logs`).

### 🔹 Milestone 2.3: Offline Sync Engine & Hybrid Synchronization (P0)
- [x] Xây dựng `lib/sync/sync-queue.js` quản lý hàng đợi ghi chép cục bộ khi mất mạng.
- [x] Xây dựng `lib/sync/sync-manager.js` điều phối gửi mẻ dữ liệu đồng bộ khi có kết nối trở lại.
- [x] Triển khai các quy tắc giải quyết xung đột (Conflict Resolution Rules): Transactional increment cho XP, Server calculation cho Streak, Immutable records cho Quiz & Diagnostic, Upsert cho Mistakes, Set Union cho Progress.
- [x] Thiết kế huy hiệu trạng thái đồng bộ trên UI: 🟢 Synced, 🟡 Syncing, 🟠 Pending Changes, 🔴 Sync Failed, ⚪ Offline Mode kèm thời gian đồng bộ thành công gần nhất.

### 🔹 Milestone 2.4: Nâng cấp Admin Dashboard Chuyên sâu & Audit Logs (P1)
- [x] Bổ sung thanh tìm kiếm người dùng theo email và bộ lọc trạng thái (FREE / VIP / ADMIN).
- [x] Hiển thị thống kê tổng thể: Tổng người dùng, Người dùng tích cực hàng ngày, Tỷ lệ trả lời chính xác trung bình, Top bài học khó nhất, Top câu hỏi sai nhiều nhất.
- [x] Ghi nhận toàn bộ thao tác thay đổi quyền và cập nhật cấu hình vào bảng `audit_logs`.
- [x] Xử lý khóa tài khoản (Ban/Unban) thực thi ở server-side API.

### 🔹 Milestone 2.5: Chuẩn hóa Structured Pedagogical Explanation Engine (JSON) (P1)
- [ ] Chuyển đổi định dạng giải thích sang chuẩn JSON sư phạm gồm 5 trường: `signal`, `rule`, `translation`, `common_mistakes`, `exam_tips`.
- [ ] Bổ sung nhãn phân cấp độ khó: Beginner, Elementary, Intermediate, Advanced.
- [ ] Bổ sung tính năng học viên gửi phản hồi chất lượng lời giải (Hữu ích / Báo lỗi).
- [ ] Tự động đề xuất bài học bù đắp khi học viên làm sai câu hỏi.

### 🔹 Milestone 2.6: Chuẩn hóa Design Token System & WCAG AA (P2)
- [x] Định nghĩa Design Tokens tập trung trong `lib/tokens/design-tokens.js` và CSS Variables.
- [x] Đảm bảo 100% tỷ lệ tương phản đạt chuẩn WCAG AA cho cả Light Theme và Dark Theme.
- [x] Ngăn ngừa hiện tượng nhấp nháy giao diện khi tải trang (FOIT / FOUT).
- [x] Bổ sung Skeleton Loading và các trạng thái Empty / Error đồng bộ.

### 🔹 Milestone 2.7: Xây dựng Grammar Visualization Engine & Audio Service (P1)
- [x] Thiết kế sơ đồ trực quan hóa đặc thù cho từng nhóm ngữ pháp: Timeline (13 thì), Decision Tree (Câu điều kiện), Transformation Diagram (Câu bị động), Conversion Flow (Câu gián tiếp).
- [x] Cho phép học viên tương tác click chọn từng thành phần trên sơ đồ trực quan, so sánh đối chiếu đa chiều.
- [x] Chuẩn hóa `lib/audio/speech.service.js` với tùy chọn giọng đọc UK/US và thanh chỉnh tốc độ đọc (`0.75x`, `1.0x`, `1.25x`), lưu trữ tùy chọn localStorage và chống phát âm chồng lấn.

### 🔹 Milestone 2.8: AI-Powered Grammar Diagnostic & Personalized Learning Roadmap (P1 - Central Module)
- [ ] **2.8.1 Diagnostic Assessment Engine:**
  * Xây dựng bài kiểm tra đầu vào 30 câu trắc nghiệm (A/B/C/D), thời gian 15-20 phút.
  * Phân bổ cân đối theo ma trận blueprint 12 chuyên đề (10 Dễ - 12 Trung bình - 8 Khó).
  * Tái sử dụng ngân hàng 2.939 câu hỏi thông qua hệ thống metadata và mapping bài học (`lesson_id`, `topic_id`, `difficulty`).
  * Cơ chế làm bài 1 câu/màn hình, Progress bar, Timer, Đánh dấu xem lại (Flag Question), Auto-save tiến độ.
  * Chống gian lận: Không hiển thị đáp án trong lúc làm bài; chỉ submit 1 lần duy nhất mỗi lượt attempt.
- [ ] **2.8.2 Assessment Scoring & Weakness Detection Engine:**
  * Thuật toán chấm điểm server-side an toàn, xác định Accuracy và Confidence level.
  * Phân loại trình độ theo từng kỹ năng: Mastered / Good / Developing / Needs Improvement / Critical Weakness.
  * Ước tính trình độ ngữ pháp tổng thể (A1 / A2 / B1 / B2 / C1 Estimated Level).
  * Lưu trữ snapshot câu hỏi và kết quả phân tích vào PostgreSQL 17.
- [ ] **2.8.3 Personalized Learning Roadmap Engine:**
  * Tự động sinh lộ trình học tập cá nhân hóa dựa trên kết quả chẩn đoán.
  * Ưu tiên khắc phục các chuyên đề có mức độ Critical Weakness và Needs Improvement.
  * Liên kết trực tiếp 100% với 53 bài học và 51 bài tập thực hành hiện có.
  * Tích hợp AI Recommendation Layer giải thích nguyên nhân và đưa ra lời khuyên cá nhân hóa.
- [ ] **2.8.4 Learning Analytics, Progress Comparison & Reassessment:**
  * Theo dõi tiến độ hoàn thành từng nhiệm vụ trên Roadmap.
  * Hỗ trợ Retake Test sau quá trình học tập để đo lường mức độ cải thiện (+% Improvement).
  * Tự động tái tạo Roadmap khi học viên đã làm chủ các chủ điểm ngữ pháp cũ.
- [ ] **2.8.5 UI/UX & Responsive Experience:**
  * Thiết kế Landing Page giới thiệu bài kiểm tra chẩn đoán.
  * Giao diện làm bài hiện đại, tập trung cao độ, hỗ trợ cả White Mode & Dark Mode.
  * Dashboard hiển thị kết quả chẩn đoán trực quan (Biểu đồ Radar / Bar Chart kỹ năng).
  * Giao diện Lộ trình học tập cá nhân hóa dạng Timeline các chặng tuần học.
- [ ] **2.8.6 Security, Anti-Tampering & Quality Assurance:**
  * RLS bảo vệ toàn bộ bảng `diagnostic_*` và `user_learning_roadmaps`.
  * Server-side Answer Validation ngăn chặn can thiệp kết quả từ client.
  * Bộ kiểm thử tự động toàn diện từ khâu làm bài, chấm điểm, sinh lộ trình đến thi lại.

### 🔹 Milestone 2.9: Continuous Adaptive Learning & Mastery Tracking (P2)
- [ ] Theo dõi độ bền vững của kiến thức (Spaced Repetition Review) cho các câu hỏi hay làm sai.
- [ ] Cập nhật bảng xếp hạng thành thạo 12 chuyên đề realtime theo thời gian thực.

### 🔹 Milestone 2.10: Achievement, Level & Gamification System (P2)
- [ ] Hệ thống huy hiệu thành tích mở khóa tự động (Ví dụ: "Bậc thầy 13 Thì", "Chiến binh Chẩn đoán", "Chuỗi lửa 7 ngày").
- [ ] Bảng xếp hạng học tập (Leaderboard) tuần và tháng tạo động lực thi đua.
- [ ] Thử thách hàng ngày (Daily Challenges) nhận thêm điểm kinh nghiệm XP.

### 🔹 Milestone 2.11: Performance, Security Hardening & Pre-Production Verification (P0)
- [ ] Kiểm thử bảo mật RLS và API Authorization (Penetration testing mô phỏng tấn công chiếm quyền).
- [ ] Tối ưu hóa truy vấn cơ sở dữ liệu, kiểm tra EXPLAIN ANALYZE các query phức tạp.
- [ ] Đạt điểm số Google Lighthouse tối thiểu 90+ trên cả Mobile và Desktop.
- [ ] Thiết lập quy trình sao lưu định kỳ (Automated Backup) và kịch bản Rollback khi có sự cố.

---

## 📋 11. NGUYÊN TẮC VẬN HÀNH DÀNH CHO AGENT / DEVELOPER (OPERATIONAL PROTOCOL)

1. **Đọc tài liệu này đầu tiên:** Trong mọi lượt tương tác phát triển mới, agent phải đọc `ROADMAP_AND_ARCHITECTURE.md` để nắm đúng bối cảnh, kiến trúc và mục tiêu kế tiếp.
2. **Tuân thủ Quality Gates:** Tuyệt đối không tự ý báo cáo hoàn thành một milestone nếu chưa cung cấp đầy đủ bằng chứng thực thi theo bảng Tiêu chuẩn Nghiệm thu tại Mục 9.
3. **Bảo tồn tính toàn vẹn của học liệu:** Không làm mất mát hoặc xáo trộn 12 chuyên đề, 53 bài học lý thuyết và 2.939 câu hỏi thực hành đã được số hóa.
4. **Cập nhật trạng thái liên tục:** Sau khi hoàn thành bất kỳ mục nào trong Milestone 2.x, agent phải đánh dấu `[x]` vào checklist của tài liệu này và commit lên git.
5. **Kiểm thử trên Production:** Mọi code mới sau khi commit phải được push lên GitHub và xác nhận Vercel Deployment đạt trạng thái `READY` trước khi bàn giao cho người dùng.
