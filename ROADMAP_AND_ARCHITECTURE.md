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
| **Content** | **2.5** | **Structured Pedagogical Explanation Engine (JSON Schema)**| **P1 (High)** | ✅ Hoàn thành |
| **Design** | **2.6** | **Enterprise-Grade Design System & WCAG 2.2 AA** | **P2 (Medium)**| ✅ Core Live / Design System Spec Active |
| **Content** | **2.7** | **Grammar Visualization Engine & Audio Engine** | **P1 (High)** | ✅ Hoàn thành |
| **Core EdTech** | **2.8** | **AI-Powered Grammar Diagnostic & Personalized Roadmap** | **P1 (Central Module)**| ✅ Hoàn thành |
| **Intelligence** | **2.9** | **Continuous Adaptive Learning, Mastery Tracking & Reassessment**| **P2 (High)** | ⏳ Kế tiếp |
| **Gamification** | **2.10**| **Achievement, Level & Gamification System** | **P2 (Medium)**| ⏳ Kế tiếp |
| **Quality** | **2.11**| **Performance, Security Hardening & Verification** | **P0 (Pre-Prod)**| ⏳ Kế tiếp |

---

## 🏛️ 3. KIẾN TRÚC DỰ ÁN & PHÂN TÁCH LỚP (LAYERED ARCHITECTURE)

Hệ thống Next.js Pages Router được phân tầng rõ rệt nhằm triệt tiêu hoàn toàn rủi ro lộ khóa bảo mật và đảm bảo code clean, dễ kiểm thử tự động:

```
grammar-platform/
├── components/
│   ├── audio/
│   │   └── AudioPlayer.jsx              # Reusable Audio Player (Compact Inline & Full Card, US/UK, 0.75x/1.0x/1.25x)
│   └── grammar-visualization/
│       ├── GrammarVisualization.jsx     # Master Container trực quan hóa tích hợp Study View
│       ├── VisualizationRenderer.jsx    # Bộ điều phối dynamic render theo registry
│       ├── VisualizationLegend.jsx      # Bảng chú giải màu sắc, thể thì và loại nút
│       ├── VisualizationControls.jsx    # Phím phóng to, thu nhỏ, đặt lại góc nhìn
│       ├── TimelineVisualization.jsx    # Trục thời gian 13 thì, lọc thể, so sánh đối chiếu đa chiều
│       ├── DecisionTreeVisualization.jsx# Cây quyết định câu điều kiện kèm lịch sử rẽ nhánh
│       ├── TransformationDiagram.jsx    # Sơ đồ biến đổi câu chủ động sang bị động S-V-O
│       └── ConversionFlowVisualization.jsx # Luồng 7 giai đoạn câu gián tiếp, ma trận lùi thì & trạng từ
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
│   │   ├── speech.constants.js  # Voice dictionaries (US/UK), rate multipliers, storage keys
│   │   ├── speech.utils.js      # Sanitizer tách Markdown, phiên âm, dịch nghĩa trước TTS
│   │   └── speech.service.js    # Singleton Web Speech API, chống nói đè, lưu preference
│   ├── visualization/
│   │   ├── visualization.registry.js # Registry ánh xạ chuyên đề vào loại sơ đồ
│   │   └── visualization.utils.js    # Tính toán tọa độ và mã màu cho trục thời gian
│   └── tokens/
│       └── design-tokens.js     # Bảng mã màu, khoảng cách, typography tập trung WCAG AA
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
│   ├── grammar-visualizations/
│   │   ├── tenses.data.js               # Dữ liệu 13 thì, vector tọa độ, thể, công thức, bẫy sai
│   │   ├── conditionals.data.js         # Dữ liệu cây quyết định, đảo ngữ, giải thích logic
│   │   ├── passive-voice.data.js        # Dữ liệu quy trình 5 bước, công thức BE, quy tắc lược bỏ
│   │   └── reported-speech.data.js      # Dữ liệu 7 giai đoạn, ma trận lùi thì, trạng từ, ngoại lệ
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

## 🎨 6.5. ENTERPRISE-GRADE DESIGN SYSTEM, SEMANTIC DESIGN TOKENS & WCAG 2.2 AA COMPLIANCE (MILESTONE 2.6)

> **Sứ mệnh cốt lõi:** Xây dựng một Design System tập trung, nhất quán và có khả năng mở rộng cho toàn bộ Grammar Learning Platform. Mục tiêu không chỉ là đồng bộ màu sắc giữa Light Mode và Dark Mode mà còn chuẩn hóa Typography, Spacing, Layout, Component States, Interactions, Animations và Accessibility (WCAG 2.2 Level AA). Toàn bộ giao diện phải sử dụng chung một hệ thống Design Tokens, đảm bảo không xảy ra tình trạng mỗi trang tự định nghĩa màu sắc, font chữ, khoảng cách hoặc trạng thái giao diện riêng.

### 6.5.1. Sơ đồ Cấu trúc Tổng thể Hệ thống Design System

```text
                                DESIGN SYSTEM HOÀN CHỈNH
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     │                                           │
               DESIGN TOKENS                               ACCESSIBILITY
                     │                                     (WCAG 2.2 AA)
          ┌──────────┴──────────┐                                │
          │                     │                                │
    LIGHT MODE              DARK MODE                   Contrast ≥ 4.5:1
  (High Contrast)       (Soft Neutral Eye-Care)         Target Size ≥ 24px
          │                     │                       No Keyboard Trap
          └──────────┬──────────┘                       Focus Not Obscured
                     │
              TYPOGRAPHY SCALE (Inter & JetBrains Mono)
                     │
              SPACING & LAYOUT (4px Grid & Radius Tokens)
                     │
              SHARED COMPONENT LIBRARY (Buttons, Cards, Inputs, Modals)
                     │
              INTERACTION & MOTION (Reduced Motion & Transitions)
                     │
              RESPONSIVE LAYOUT (Mobile-First Breakpoints)
                     │
              VISUAL REGRESSION TESTING (Playwright & Token Audit)
                     │
              ENTIRE GRAMMAR PLATFORM (Dashboard, Study, Quiz, Roadmap)
```

### 6.5.2. Kiến trúc Design Tokens 3 Tầng Tập Trung (`lib/tokens/design-tokens.js`)

Hệ thống token phân tách rõ ràng thành 3 tầng phân cấp:

1. **Layer 1 – Primitive Tokens (Giá trị Nguyên bản):**
   - Bảng mã màu cơ bản (Slate, Blue, Emerald, Amber, Rose, Zinc) được định nghĩa thô từ thang 50 đến 950.
2. **Layer 2 – Semantic Tokens (Màu theo Ý nghĩa & Ngữ cảnh):**
   - **Background:** `bg`, `bgSub`, `bgElevated`, `bgActive`.
   - **Surface & Cards:** `card`, `cardSubtle`, `cardHover`, `cardBorder`.
   - **Borders:** `border`, `borderSubtle`, `borderStrong`.
   - **Typography phân cấp:** `text` (Slate-900 trên sáng / Slate-50 trên tối), `textSecondary`, `textMuted`, `textHeading`.
   - **Semantic Accents:** `accent` (Blue), `success` (Emerald), `warning` (Amber), `danger` (Red), `info` (Sky) kèm `*Bg` và `*Border`.
   - **Focus & Overlays:** `focusRing`, `focusOutline`, `overlay`, `backdrop`.
3. **Layer 3 – Component Tokens (Đặc thù từng Component):**
   - Ví dụ cho Button (`primaryBg: accent`, `radius: radiusMd`, `padding: space2 space4`), Card, Input, Modal, Tooltip.

> [!IMPORTANT]
> **Quy tắc Bất biến:** Tuyệt đối không hardcode mã màu HEX trực tiếp trong các component giao diện. Component chỉ được tiêu thụ Semantic Tokens (`T.accent`, `T.text`, `T.bg`) hoặc Component Tokens.

### 6.5.3. Bảng Chuẩn hóa Màu sắc Light Mode & Dark Mode

| Nhóm Token | Light Mode (Clean & High Readability) | Dark Mode (Deep Neutral & Eye-Care) | Tỷ lệ Tương phản WCAG |
| :--- | :---: | :---: | :---: |
| **Nền chính (`bg`)** | `#ffffff` / `#f8fafc` | `#09090b` / `#0b1120` | Đạt chuẩn nền sâu |
| **Bề mặt thẻ (`card`)** | `#ffffff` (viền `#e2e8f0`) | `#121215` / `#1e293b` (viền `#27272a`) | Độ nổi khối tinh tế |
| **Chữ chính (`text`)** | `#0f172a` (Slate-900) | `#f8fafc` (Slate-50) | **15.5:1** (Rất cao) |
| **Chữ phụ (`textSecondary`)**| `#334155` (Slate-700) | `#cbd5e1` (Slate-300) | **9.6:1** (Vượt chuẩn AA) |
| **Chữ mờ (`textMuted`)** | `#475569` (Slate-600) | `#94a3b8` (Slate-400) | **6.1:1** (Vượt chuẩn 4.5:1) |
| **Thương hiệu (`accent`)** | `#2563eb` (Blue-600) | `#60a5fa` (Blue-400) | **5.2:1** |
| **Thành công (`success`)** | `#15803d` (Green-700) | `#4ade80` (Green-400) | **5.1:1** |
| **Cảnh báo (`warning`)** | `#b45309` (Amber-700) | `#fbbf24` (Amber-400) | **5.3:1** |
| **Nguy hiểm (`danger`)** | `#dc2626` (Red-600) | `#f87171` (Red-400) | **4.8:1** |

### 6.5.4. Hệ thống Typography Chuẩn hóa (`lib/tokens/typography.tokens.js`)

- **Font Family:** Primary: `Inter`, system-ui, sans-serif; Monospace: `JetBrains Mono`, Geist Mono.
- **Thang đo Typography Phân cấp:**
  * `display` (40px / 800) • `h1` (32px / 800) • `h2` (24px / 700) • `h3` (20px / 700) • `h4` (18px / 600)
  * `bodyLg` (16px / 500) • `body` (14px / 500) • `bodySm` (13px / 500) • `caption` (12px / 500) • `overline` (11px / 700 uppercase).
- **Line Height:** 1.4 – 1.7 cho nội dung đọc sư phạm; 1.2 – 1.35 cho tiêu đề.
- **Responsive Typography:** Sử dụng `clamp()` tự động co giãn phông chữ theo độ rộng viewport, chống tràn chữ trên thiết bị di động.

### 6.5.5. Hệ thống Khoảng cách Spacing & Bố cục Layout (`lib/tokens/spacing.tokens.js`)

- **Thang đo Spacing 4px Grid:** `space1` (4px) ➔ `space2` (8px) ➔ `space3` (12px) ➔ `space4` (16px) ➔ `space6` (24px) ➔ `space8` (32px) ➔ `space12` (48px) ➔ `space16` (64px).
- **Hệ thống Bo góc (Border Radius):** `radiusSm` (4px), `radiusMd` (8px), `radiusLg` (12px), `radiusXl` (16px), `radiusFull` (9999px).
- **Đổ bóng (Elevation Shadows):** `shadowXs`, `shadowSm`, `shadowMd`, `shadowLg`, `shadowElevated`.
- **Layout Grid & Breakpoints:** Mobile Small (<375px), Mobile (375-767px), Tablet (768-1023px), Desktop (1024-1439px), Large Desktop (≥1440px). Max container width 1120px / 960px.

### 6.5.6. Bộ Component UI Dùng Chung Chuẩn Hóa (`components/design-system/`)

1. **Buttons & Actions:** `Button` (Primary, Secondary, Ghost, Danger), `IconButton`, `ButtonGroup`.
2. **Form Controls:** `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Switch` tích hợp focus ring và error state.
3. **Feedback & Status:** `Badge`, `Alert`, `Toast`, `Progress`, `Tooltip`.
4. **Layout & Containers:** `Card`, `Container`, `Grid`, `Divider`.
5. **Overlays:** `Modal`, `Drawer`, `Dropdown`, `Popover` có bẫy focus (focus trap) và phục hồi focus sau khi đóng.
6. **Loading & States:** `Skeleton` đồng bộ kích thước ngăn ngừa Layout Shift (CLS), `EmptyState` có hình minh họa và CTA rõ ràng.

### 6.5.7. Tuân Thủ Toàn Diện Chuẩn Tiếp Cận WCAG 2.2 Level AA

- **Tương phản Màu sắc (Color Contrast):** Văn bản thông thường ≥ 4.5:1; Văn bản lớn / Icon ý nghĩa ≥ 3.0:1. Không dùng màu sắc làm phương tiện duy nhất để truyền tải thông tin (luôn kèm icon và văn bản bổ trợ).
- **Khả năng Tiếp cận qua Bàn phím (Keyboard Accessibility):** Điều hướng 100% bằng Tab, Shift+Tab, Enter, Space, Escape, Mũi tên; hiển thị rõ ràng Visible Focus Ring (`2px solid T.accent`).
- **Tiêu chuẩn WCAG 2.2 Bổ sung:**
  * **2.4.11 Focus Not Obscured:** Không để thanh Header dính (sticky) hoặc Modal che khuất phần tử đang focus.
  * **2.5.8 Target Size (Minimum):** Vùng tương tác cảm ứng tối thiểu 24 × 24 CSS pixels; ưu tiên 44 × 44 pixels trên Mobile.
  * **Hỗ trợ Zoom:** Cho phép phóng to văn bản lên 200% – 400% mà không bị vỡ bố cục hoặc mất thông tin.

### 6.5.8. Cơ chế Chống Nhấp Nháy Theme (Anti-Flicker & Theme Initialization)

Script khởi tạo inline chặn ngay trong `<Head>` của `pages/_document.js` hoặc `pages/_app.js`:
- Đọc `localStorage.getItem('grammar_theme')`.
- Nếu chưa có, tự động bắt sự kiện `window.matchMedia('(prefers-color-scheme: dark)')`.
- Gán thuộc tính `data-theme` trước khi DOM được paint, triệt tiêu 100% hiện tượng chớp sáng / nhấp nháy FOUC (Flash of Unstyled Content).

### 6.5.9. Tương tác Chuyển động & Reduced Motion (Motion Guidelines)

- **Thời lượng Animation Chuẩn:** `durationFast` (120ms), `durationNormal` (200ms), `durationSlow` (300ms).
- **Hỗ trợ Bắt buộc `@media (prefers-reduced-motion: reduce)`:** Tự động vô hiệu hóa transition và animation cho học viên có cơ địa nhạy cảm chuyển động hoặc rối loạn tiền đình.

### 6.5.10. Kiểm Thử Tự Động Token & Visual Regression Testing

- **Tự động Kiểm tra Mã Màu:** Script `scripts/validate-design-tokens.js` rà quét toàn bộ JSX để phát hiện mã HEX bị hardcode hoặc vi phạm tương phản.
- **Visual Regression Testing:** Tích hợp Playwright chụp snapshot giao diện (Dashboard, Study, Quiz, Mistakes, Roadmap) trên 3 thiết bị (Mobile, Tablet, Desktop) ở cả 2 chế độ Light/Dark để phát hiện lệch giao diện ngoài ý muốn.

---

## 🎨 7. GRAMMAR VISUALIZATION ENGINE & AUDIO ARCHITECTURE (MILESTONE 2.7)

### 7.1. Bảng Trực quan Hóa Tương tác Theo Từng Chủ điểm

| Chủ điểm Ngữ pháp | Hình thức Trực quan Hóa | Trạng thái | Trải nghiệm Tương tác & Chi tiết Sư phạm |
| :--- | :--- | :--- | :--- |
| **13 Thì tiếng Anh (Tenses)** | **Dòng thời gian (Timeline Axis)** | ✅ **Đã hoàn thành** | Trục thời gian 3 miền (Past - Present - Future) kết hợp 4 thể (Simple, Continuous, Perfect, Perfect Continuous); chế độ Side-by-side Compare Mode; vector tọa độ trực quan; phát âm bản ngữ. |
| **Câu điều kiện (Conditionals)** | **Cây quyết định (Decision Tree)** | ✅ **Đã hoàn thành** | Cây phân nhánh logic Zero, Loại 1, 2, 3 và Mixed; breadcrumbs lưu vết lựa chọn; hỗ trợ Back/Reset; bảng công thức đảo ngữ; phân tích *"Vì sao chọn kết quả này?"*. |
| **Câu bị động (Passive Voice)** | **Sơ đồ Biến đổi (Transformation Diagram)** | ✅ **Đã hoàn thành** | Pipeline 5 bước; highlight màu sắc chuẩn S (Blue), V (Amber), O (Green); mũi tên dịch chuyển vị trí S ➔ By O và O ➔ S mới; tab chuyển đổi thì; cẩm nang quy tắc lược bỏ *By + O*. |
| **Câu gián tiếp (Reported Speech)** | **Luồng Chuyển đổi (Conversion Flow)** | ✅ **Đã hoàn thành** | Quy trình 7 giai đoạn liên hoàn; Ma trận Lùi thì (Backshift Matrix); Bảng chuyển đổi trạng từ thời gian & nơi chốn; Cảnh báo các trường hợp ngoại lệ không lùi thì. |
| **Mệnh đề quan hệ (Relative Clauses)** | **Sơ đồ Cấu trúc Câu (Sentence Tree)** | ✅ **Đã hoàn thành** | Phân tích cú pháp tương tác, liên kết đại từ (Who, Whom, Which, Whose, That), so sánh mệnh đề xác định vs không xác định (dấu phẩy, that), và quy tắc rút gọn V-ing / V3 / to-V. |
| **So sánh (Comparisons)** | **Thẻ So sánh Đa cấp (Comparison Scale)** | ✅ **Đã hoàn thành** | Thước đo tỷ lệ trực quan 4 cấp độ (=, >, MAX, ↗↗), quy tắc tính từ ngắn vs dài, nhấn mạnh (much/far) và bảng tra cứu bất quy tắc (better, worse, further...). |
| **Động từ khuyết thiếu (Modal Verbs)**| **Ma trận Cấp độ Nghĩa (Meaning Matrix)** | ✅ **Đã hoàn thành** | Thang đo mức độ chắc chắn 0% đến 100% (Can't -> Might -> May -> Should -> Must), phân loại 4 nhóm chức năng (Ability, Permission, Obligation, Advice) và suy đoán quá khứ Perfect Modals. |
| **Từ loại & Cấu tạo từ (Word Forms)** | **Cây Họ từ (Word Family Tree)** | ✅ **Đã hoàn thành** | Cây phân nhánh gốc từ 4 hướng (Danh - Động - Tính - Trạng), phiên âm IPA, bộ quy tắc nhận diện hậu tố vàng (-tion, -ment, -ize, -ful, -ly) và vị trí đứng trong câu. |

### 7.2. Kiến trúc Registry & Phân Tách Dữ liệu Sư phạm

Nhằm tránh hiện tượng "hardcoded diagrams" trong từng trang bài học, hệ thống áp dụng mô hình **Data-Driven Registry**:
1. **Dữ liệu cấu trúc hóa độc lập (`data/grammar-visualizations/`):**
   * Toàn bộ nội dung lý thuyết, công thức, vector tọa độ, câu ví dụ và bẫy sai được định nghĩa dưới dạng JS/JSON schema chuẩn hóa độc lập:
     * `tenses.data.js`: Trục thời gian 13 thì tiếng Anh.
     * `conditionals.data.js`: Cây quyết định câu điều kiện & đảo ngữ.
     * `passive-voice.data.js`: Sơ đồ biến đổi câu bị động & lược bỏ *By + Agent*.
     * `reported-speech.data.js`: Luồng 7 giai đoạn câu gián tiếp & ma trận lùi thì.
     * `relative-clauses.data.js`: Sơ đồ cấu trúc câu & liên kết đại từ quan hệ.
     * `comparisons.data.js`: Thẻ so sánh đa cấp & thang đo tỷ lệ.
     * `modal-verbs.data.js`: Ma trận cấp độ nghĩa & thang đo xác suất.
     * `word-forms.data.js`: Cây họ từ & động cơ hậu tố nhận diện từ loại.
2. **Dynamic Registry Dispatcher (`lib/visualization/visualization.registry.js`):**
   * Hàm `getVisualizationForLesson(lesson, chapter)` tự động phân giải mã bài học (`code`) hoặc số chương (`number`) để nạp mô hình trực quan tương ứng:
     * Chương 1 hoặc `TENSE_*` ➔ `timeline`
     * Chương 3 (`CLAUSE_CONDITION`) ➔ `decision-tree`
     * Chương 3 (`CLAUSE_RELATIVE`) ➔ `sentence-tree`
     * Chương 10 hoặc `PASSIVE_*` ➔ `transformation`
     * Chương 9 hoặc `REP_*` ➔ `conversion-flow`
     * Chương 7 (`POS_COMPARISON`) ➔ `comparison-scale`
     * Chương 7 (`POS_VERBS` / `MODAL_*`) ➔ `modal-matrix`
     * Chương 8 (`WORD_FORMS`, `WORD_FORMATIONS`) ➔ `word-family-tree`
     * Fallback linh hoạt cho các chuyên đề khác đảm bảo 100% bài học có mô hình trực quan.
3. **Thành phần Dựng hình Đa tầng (`components/grammar-visualization/`):**
   * `GrammarVisualization.jsx`: Container chính tích hợp trực tiếp vào Study View (`pages/index.js`) với hiệu ứng accordion đóng/mở mượt mà, lưu trạng thái thu gọn và tích hợp **Visualizer Catalog Switcher** cho phép chuyển đổi tức thì giữa 8 mô hình trực quan.
   * `VisualizationRenderer.jsx`: Trình điều phối render động các visualizer theo type từ Registry.
   * `VisualizationControls.jsx`: Bộ công cụ thu nhỏ/phóng to giao diện và nút đặt lại góc nhìn ban đầu.
   * `VisualizationLegend.jsx`: Bảng giải thích màu sắc, hình khối và ký hiệu sư phạm đồng bộ cho toàn bộ 8 mô hình.

### 7.3. Chi tiết Kỹ thuật 8 Mô Hình Trực Quan Hóa Lõi

#### 1. Dòng thời gian 13 Thì (TimelineVisualization.jsx)
* **Phân định miền thời gian (Time Spheres):** Quá khứ (`past`), Hiện tại (`present`), Tương lai (`future`).
* **Bốn thể ngữ pháp (Aspects):** Đơn (`simple` - chấm mốc), Tiếp diễn (`continuous` - dải sóng kéo dài), Hoàn thành (`perfect` - cầu nối sự kiện), Hoàn thành tiếp diễn (`perfect_continuous` - dải kéo dài liên tục đến mốc mốc).
* **So sánh đối chiếu 2 thì (Compare Mode):** Cho phép đặt 2 thì bất kỳ cạnh nhau (ví dụ: *Past Simple vs Present Perfect*) để so sánh trực diện công thức, cách dùng và ngữ cảnh thi cử.
* **Tích hợp phát âm câu mẫu:** Nút loa bản ngữ trực tiếp cho câu ví dụ của từng thì.

#### 2. Cây quyết định câu điều kiện (DecisionTreeVisualization.jsx)
* **Cấu trúc rẽ nhánh:** Bắt đầu từ câu hỏi gốc (Sự thật hiển nhiên ➔ Zero; Có thể xảy ra ở hiện tại/tương lai ➔ Type 1; Giả định trái ngược hiện tại ➔ Type 2; Giả định trái ngược quá khứ ➔ Type 3; Giả định hỗn hợp ➔ Mixed Conditionals).
* **Điều hướng thông minh:** Breadcrumb theo dõi hành trình lựa chọn, nút Back (lùi 1 bước), Reset (quay về câu hỏi đầu).
* **Cẩm nang đảo ngữ:** Tích hợp trực tiếp công thức đảo ngữ câu điều kiện (`Should + S + V`, `Were + S`, `Had + S + V3`).

#### 3. Sơ đồ biến đổi câu bị động (TransformationDiagram.jsx)
* **Quy trình 5 bước sư phạm:**
  1. Xác định thành phần S - V - O.
  2. Dịch chuyển Tân ngữ (O) lên đầu làm Chủ ngữ mới.
  3. Xác định dạng thích hợp của động từ TO BE theo thì và ngôi của Chủ ngữ mới.
  4. Đưa động từ chính về Quá khứ phân từ (V3/V-ed).
  5. Đặt tác nhân thực hiện sau `by + O` (hoặc áp dụng quy tắc lược bỏ).
* **Mã màu phân tích câu:** Chủ ngữ (Xanh dương), Động từ (Vàng hổ phách), Tân ngữ (Xanh lá), TO BE (Cam), V3 (Lam).
* **Tab thì ngữ pháp:** Chuyển đổi nhanh giữa các thì thường gặp và Modals.
* **Cẩm nang lược bỏ "By + Agent":** Bảng quy tắc khi nào bắt buộc bỏ (*by people, by someone, by them...*) và khi nào bắt buộc giữ (*tên riêng, đại từ xác định*).

#### 4. Luồng chuyển đổi câu gián tiếp (ConversionFlowVisualization.jsx)
* **7 Giai đoạn liên hoàn:** Nhận diện động từ tường thuật ➔ Xác định câu ➔ Lùi thì ➔ Đổi đại từ ➔ Đổi trạng từ thời gian/nơi chốn ➔ Xử lý modals ➔ Bỏ dấu ngoặc kép.
* **Ma trận lùi thì (Backshift Matrix):** Bảng đối chiếu song song từ câu trực tiếp sang gián tiếp cho tất cả các thì.
* **Bảng trạng từ:** Tra cứu nhanh *today ➔ that day*, *now ➔ then*, *here ➔ there*, *ago ➔ before*, v.v.
* **Ngoại lệ không lùi thì:** Cảnh báo rõ ràng các trường hợp chân lý hiển nhiên, động từ tường thuật ở hiện tại (*says, tells*), và câu điều kiện loại 2, 3.

#### 5. Sơ đồ cấu trúc câu Mệnh đề quan hệ (SentenceTreeVisualization.jsx)
* **Bóc tách cú pháp trực quan (Syntax Tree Breakdown):** Phân rã câu phức thành các khối màu trực quan: Danh từ đi trước (*Antecedent* - Xanh dương), Đại từ quan hệ (*Pronoun* - Tím), Mệnh đề quan hệ (*Relative Clause* - Vàng hổ phách), và Vị ngữ mệnh đề chính (*Main Clause* - Xanh lục).
* **Ma trận 5 đại từ & 3 trạng từ quan hệ:** Bảng phân loại chi tiết *who, whom, which, whose, that, where, when, why* kèm điều kiện ngữ cảnh và bẫy đề thi.
* **So sánh Mệnh đề Xác định vs Không xác định:** Thẻ đối chiếu quy tắc bắt buộc dấu phẩy, điều kiện sử dụng đại từ *that* và quy tắc lược bỏ đại từ khi làm tân ngữ.
* **Cẩm nang Rút gọn Mệnh đề quan hệ thần tốc:** Phân loại 3 quy tắc rút gọn phổ biến: Cụm *V-ing* (Chủ động), Cụm *V3/V-ed* (Bị động), và Cụm *To-V* (khi đi sau the first, the second, the only, so sánh nhất).

#### 6. Thẻ so sánh đa cấp & Thước đo tỷ lệ (ComparisonScaleVisualization.jsx)
* **Thang đo tỷ lệ 4 cấp độ (Ratio Gauges):** Thanh đo phần trăm trực quan biểu diễn tương quan giữa đối tượng A và đối tượng B:
  * So sánh bằng: A = B (100% : 100%) với công thức `as + adj/adv + as`.
  * So sánh hơn: A > B (140% : 100%) với quy tắc đuôi `-er than` và `more ... than`.
  * So sánh nhất: A đứng đầu nhóm (100% of Group) với mạo từ `the -est` / `the most` kèm giới từ `in` / `of`.
  * So sánh kép: Biến thiên lũy tiến `adj-er and adj-er` / `The more..., the more...`.
* **Phân biệt Tính từ ngắn vs Tính từ dài:** Hệ thống hóa quy tắc nhận diện tính từ 1 âm tiết, tính từ 2 âm tiết đặc biệt tận cùng `-y, -le, -er, -ow, -et` và tính từ dài.
* **Bảng tra cứu Bất quy tắc cốt lõi:** Bảng đối chiếu nhanh các cặp từ bất quy tắc hay gặp trong đề thi (*good/better/best, bad/worse/worst, far/further/furthest...*) kèm âm thanh phát âm mẫu.

#### 7. Ma trận động từ khuyết thiếu & Thang đo xác suất (ModalMatrixVisualization.jsx)
* **Thang đo mức độ chắc chắn (Probability Gauge 0% ➔ 100%):**
  * `0% - Impossible`: *can't, couldn't* (Khẳng định phủ định tuyệt đối dựa trên bằng chứng).
  * `30% - Slight Possibility`: *might, could* (Khả năng mong manh, phỏng đoán).
  * `50% - Medium Possibility`: *may* (Xác suất 50/50).
  * `75% - High Expectation`: *should, ought to* (Kỳ vọng theo lẽ thường hoặc lịch trình).
  * `95-100% - Logical Certainty`: *must* (Suy đoán logic chắc chắn có căn cứ thực tế).
* **Ma trận 4 nhóm chức năng cốt lõi:** Phân loại chi tiết Khả năng (*Ability*), Xin phép & Cho phép (*Permission*), Bắt buộc & Cấm đoán (*Obligation & Prohibition* - phân biệt *must* vs *have to* vs *mustn't*), và Lời khuyên (*Advice*).
* **Sơ đồ Suy đoán & Nuối tiếc trong quá khứ (Perfect Modals):** Làm rõ bản chất ngữ pháp của `must have + V3`, `can't have + V3`, `should have + V3`, và `needn't have + V3`.

#### 8. Cây họ từ & Động cơ nhận diện hậu tố (WordFamilyTreeVisualization.jsx)
* **Mô hình Cây phân nhánh 4 hướng (Word Family Tree):** Từ một gốc từ cốt lõi (Root Node), sơ đồ tỏa nhánh sang 4 từ loại tương ứng: Danh từ (*Noun* - Xanh lục), Động từ (*Verb* - Đỏ), Tính từ (*Adjective* - Xanh dương), Trạng từ (*Adverb* - Tím) kèm phiên âm quốc tế IPA và câu ví dụ ngữ cảnh.
* **8 Bộ Họ từ kinh điển trong đề thi:** Tích hợp bộ dữ liệu chuẩn cho các gốc từ: *SUCCESS, DANGER, DECIDE, BEAUTY, CREATE, DIFFER, CARE, ACT*.
* **Động cơ Hậu tố nhận diện vàng (Suffix Gold Rules):** Bảng tổng hợp các đuôi từ loại đặc trưng (*-tion, -ment, -ness, -ity, -ize, -en, -ify, -ful, -less, -able, -ive, -ly*) và quy tắc xác định vị trí đứng của từ loại trong câu.

### 7.4. Kiến trúc Centralized Audio Service & Pronunciation Pipeline

* **Tập trung hóa (`lib/audio/speech.service.js`):** Singleton Service quản lý toàn bộ âm thanh nền tảng, chống hiện tượng gọi Web Speech API đồng thời gây phát âm méo tiếng hoặc nói đè (`speechSynthesis.cancel()`).
* **Lọc văn bản trước TTS (`lib/audio/speech.utils.js`):**
  * Hàm `sanitizeSpeechText(text)` tự động loại bỏ các thẻ định dạng Markdown (`**`, `*`, `~~`), ký hiệu phiên âm IPA `/.../`, và phần dịch nghĩa tiếng Việt trong ngoặc `(...)` để TTS chỉ đọc tiếng Anh tự nhiên.
  * Hàm `matchBestVoice(lang)` ưu tiên nạp các giọng đọc chất lượng cao tự nhiên của hệ thống (Google US English, Samantha, Microsoft Zira/David, Daniel).
* **Đa dạng tùy chọn học viên:**
  * Giọng đọc bản ngữ: Anh - Mỹ (US, `en-US`) và Anh - Anh (UK, `en-GB`).
  * Tốc độ phát âm: `0.75x` (Luyện nghe chậm, rõ từng âm tiết), `1.0x` (Tốc độ tự nhiên chuẩn), `1.25x` (Tăng cường phản xạ nghe nhanh).
  * Bộ nhớ đệm tùy chọn: Tự động lưu lựa chọn giọng và tốc độ vào `localStorage` (`grammar_audio_voice`, `grammar_audio_rate`).
* **Reusable UI Component (`components/audio/AudioPlayer.jsx`):**
  * Chế độ **Compact Inline:** Nút loa nhỏ tích hợp trong bảng ví dụ, các câu mẫu trong sơ đồ.
  * Chế độ **Full Card:** Giao diện thẻ đầy đủ kèm waveform visualizer, nút chuyển đổi giọng US/UK, và 3 nút chuyển tốc độ nhanh chóng.

### 7.5. Tiêu chuẩn Tiếp cận & Tương thích Giao diện Sáng/Tối (WCAG AA)

* **Chuẩn hóa Design Tokens:** Toàn bộ thành phần âm thanh và trực quan hóa sử dụng biến màu tập trung từ `lib/tokens/design-tokens.js`.
* **Độ tương phản cao trên White Mode:** Đảm bảo toàn bộ chữ tiêu đề, phụ đề, nhãn công thức và văn bản giải thích đạt độ tương phản tối thiểu từ 4.5:1 đến 15.5:1 trên nền trắng (`#ffffff` / `#f8fafc`).
* **Hoàn toàn Responsive:** Tự động co giãn mượt mà trên mọi kích thước màn hình từ Desktop (1440px), Laptop (1024px) đến Tablet và Mobile.

---

## 🎯 8. MILESTONE 2.8: AI-POWERED GRAMMAR DIAGNOSTIC & PERSONALIZED ADAPTIVE LEARNING ROADMAP (P1 – MODULE TRUNG TÂM)

> **Sứ mệnh cốt lõi:** Xây dựng một hệ thống Grammar Diagnostic & Personalized Learning có khả năng đánh giá trình độ ngữ pháp đầu vào, phát hiện chính xác lỗ hổng kiến thức, phân tích năng lực theo từng chuyên đề và tự động xây dựng lộ trình học tập cá nhân hóa. Hệ thống không chỉ dừng lại ở việc đưa ra điểm số sau bài kiểm tra mà phải liên tục theo dõi, đánh giá và điều chỉnh phương pháp học dựa trên hành vi, kết quả và mức độ tiến bộ thực tế của từng người dùng.

### 8.1. Sơ đồ Vòng lặp Học tập Thích ứng Khép kín (Closed-Loop Adaptive Learning Cycle)

```text
            HỌC VIÊN (USER)
                  │
                  ▼
      Diagnostic Assessment (30 câu)
                  │
                  ▼
       Scoring Engine (Deterministic)
                  │
                  ▼
     Weakness Detection (5 Mastery Tiers)
                  │
                  ▼
     Knowledge Gap & Root Cause Analysis
                  │
                  ▼
    Personalized Roadmap (4 Tuần Hành Động)
                  │
                  ▼
       Learning Activities (53 Bài học)
                  │
                  ▼
      Exercise Performance (51 Bài tập)
                  │
                  ▼
     Adaptive Learning Engine (Điều chỉnh Động)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   Mastery Tracking    Spaced Repetition
  (Độ thành thạo)     (Lịch ôn 1-3-7-14-30d)
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
       Reassessment (Retake Test)
                  │
                  ▼
      Progress Comparison (+% Growth)
                  │
                  ▼
       Updated Dynamic Roadmap
                  │
                  └──────────► Continuous Adaptive Learning
```

### 8.2. Ma trận Blueprint 30 Câu hỏi & Tích hợp Ngân hàng Câu hỏi

**A. Diagnostic Test Blueprint**
- Định nghĩa tập trung tại `lib/diagnostic/diagnostic.blueprint.js`.
- Bài kiểm tra đầu vào chuẩn hóa gồm 30 câu trắc nghiệm A/B/C/D, thời gian 15–20 phút.
- Phân bổ độ khó: 10 câu Easy (33%), 12 câu Medium (40%), 8 câu Hard (27%).
- Phân bổ câu hỏi theo ma trận 10 nhóm kiến thức chuẩn hóa khớp giáo trình Mai Lan Hương & Hà Thanh Uyên:
  1. **Các Thì trong tiếng Anh (Tenses)** - 6 câu (20%) - 2 Dễ, 3 TB, 1 Khó.
  2. **Câu bị động (Passive Voice)** - 3 câu (10%) - 1 Dễ, 1 TB, 1 Khó.
  3. **Câu điều kiện (Conditionals)** - 3 câu (10%) - 1 Dễ, 1 TB, 1 Khó.
  4. **Động từ khuyết thiếu (Modal Verbs)** - 3 câu (10%) - 1 Dễ, 1 TB, 1 Khó.
  5. **Mệnh đề quan hệ (Relative Clauses)** - 3 câu (10%) - 1 Dễ, 1 TB, 1 Khó.
  6. **Lượng từ & Mạo từ (Determiners)** - 3 câu (10%) - 1 Dễ, 1 TB, 1 Khó.
  7. **Giới từ & Cụm từ (Prepositions)** - 3 câu (10%) - 1 Dễ, 2 TB, 0 Khó.
  8. **Các dạng So sánh (Comparisons)** - 2 câu (7%) - 1 Dễ, 1 TB, 0 Khó.
  9. **Lời nói gián tiếp (Reported Speech)** - 2 câu (7%) - 0 Dễ, 1 TB, 1 Khó.
  10. **Từ loại & Cấu tạo từ (Word Forms)** - 2 câu (6%) - 1 Dễ, 0 TB, 1 Khó.

**B. Question Bank Schema & Metadata Integration**
Mỗi câu hỏi quản lý đầy đủ metadata chuẩn hóa:
```json
{
  "question_id": "DIAG_TENSE_03",
  "lesson_id": "97a9ba73-7f60-5a48-8781-cf7d07ea8af1",
  "lesson_code": "TENSE_PRES_PERF",
  "chapter_number": 1,
  "competency_id": "COMP_PRES_PERF_SINCE",
  "difficulty_level": "medium",
  "grammar_topic": "tenses",
  "learning_objective": "Phân biệt Thì Hiện tại hoàn thành với Quá khứ đơn qua giới từ since/for",
  "question_type": "MULTIPLE_CHOICE",
  "estimated_time": 45,
  "prerequisite_competencies": ["COMP_PAST_SIMPLE", "COMP_PAST_PARTICIPLE_V3"]
}
```

**C. Trải nghiệm Làm bài Thi Chẩn đoán (`DiagnosticTestSession.jsx`)**
- One Question Per Screen, Focus Mode.
- Progress Bar (`Câu X / 30`) kèm thanh % hoàn thành động.
- Countdown Timer (20:00), cảnh báo trực quan khi còn 5 phút và 1 phút.
- Flag Question (`🚩 Đánh dấu xem lại`).
- Điều hướng Previous / Next, hỗ trợ Keyboard Shortcuts (A, B, C, D; Mũi tên trái/phải).
- Question Drawer Palette chuyển nhanh giữa 30 câu (Màu xanh: đã trả lời, Vàng: đã đánh dấu, Trắng: chưa trả lời).
- Tự động lưu tiến độ vào state / LocalStorage, xử lý an toàn khi reload trang.

**D. Cơ chế Chống Gian lận (Anti-Cheating & Data Protection)**
- Endpoint `/api/diagnostic/test` tuyệt đối không trả về `correct_answer`, `explanation` hay scoring metadata về browser.
- Server-side generation UUID cho mỗi attempt, kiểm soát thời gian bắt đầu và kết thúc.
- Xác nhận Confirmation Dialog trước khi nộp; ngăn chặn replay request và duplicate submission qua idempotency.
- Không tin tưởng bất kỳ kết quả hay competency mapping nào do client tự tính toán gửi lên.

---

### 8.3. Bộ máy Chấm điểm Xác định & Nhận diện Lỗ hổng Kiến thức (`lib/diagnostic/diagnostic.scoring.js`)

**A. Thuật toán Chấm điểm Cốt lõi (Deterministic Scoring - Zero Hallucination)**
- Không phụ thuộc vào AI để tính điểm; toàn bộ công thức là toán học xác định tuyệt đối:
  $$\text{Accuracy} = \left(\frac{\text{Correct Answers}}{\text{Total Valid Questions}}\right) \times 100$$
- Đánh giá phân tách theo từng competency, từng mức độ khó và từng khoảng thời gian làm bài.

**B. Thang Đo Độ Tin Cậy (Competency Confidence Level)**

| Số câu đánh giá trong bài | Confidence Level | Hành vi Ứng xử Hệ thống |
| :---: | :---: | :--- |
| **> 5 câu** | **High** | Đủ dữ liệu thống kê để kết luận độ thuần thục của chuyên đề |
| **3 – 5 câu** | **Medium** | Đủ dữ liệu đưa ra khuyến nghị ban đầu, cần kiểm chứng thêm |
| **< 3 câu** | **Low** | Gắn nhãn *Insufficient Evidence*, không vội vàng kết luận mất gốc, ưu tiên thu thập qua quá trình học |

**C. Phân loại 5 Cấp độ Thành thạo (Grammar Mastery Classification)**

| Mastery Level | Accuracy Range | Diễn giải Sư phạm | Màu sắc & Ưu tiên |
| :--- | :---: | :--- | :---: |
| **Mastered** | **90% – 100%** | Đã làm chủ hoàn toàn kiến thức chuyên đề | 🌟 Xanh lục • Low |
| **Good** | **75% – 89%** | Nắm vững tốt các quy tắc cốt lõi | ✅ Xanh dương • Low |
| **Developing** | **60% – 74%** | Đang phát triển, còn lúng túng ở câu phức | ⚠️ Hổ phách • Medium |
| **Needs Improvement**| **40% – 59%** | Hổng kiến thức nền tảng, nhầm lẫn công thức | 🟡 Cam • High |
| **Critical Weakness** | **0% – 39%** | Lỗ hổng nghiêm trọng - Ưu tiên hàng đầu | 🔴 Đỏ • Critical Priority |

**D. Ước tính Trình độ Ngữ pháp Nội bộ (Estimated Grammar Proficiency Level)**
Ước tính trình độ theo thang CEFR nội bộ: **A1 (Beginner), A2 (Elementary), B1 (Intermediate), B2 (Upper Intermediate), C1 (Advanced)**.
Công bố rõ ràng: Đây là thang đo ước tính năng lực ngữ pháp nội bộ cho chương trình số hóa, không thay thế chứng chỉ 4 kỹ năng quốc tế.

---

### 8.4. Grammar Knowledge Graph & Competency Mapping Engine (P1 - Kiến trúc Nâng cấp)

Thay vì xem 10 chuyên đề là các ốc đảo độc lập, hệ thống xây dựng **Bản đồ Tri thức Ngữ pháp (Knowledge Graph)** phản ánh quan hệ tiền đề (Prerequisites) và mối phụ thuộc sâu xa giữa các khái niệm:

```text
Basic Grammar (Ngữ pháp Nền tảng)
    │
    ├── Parts of Speech (Từ loại)
    │      ├── Nouns (Danh từ) ──► Determiners & Quantifiers (Lượng từ)
    │      ├── Verbs (Động từ) ──► Regular & Irregular V2/V3 (Bảng V3)
    │      └── Adjectives & Adverbs (Tính từ / Trạng từ) ──► Comparisons (So sánh)
    │
    ├── Tenses (Hệ thống Thì)
    │      ├── Present Simple ──► Past Simple ──► Present Perfect (Hiện tại hoàn thành)
    │      └── Auxiliary Verbs (To Be, Have, Do) ──► Passive Voice (Câu bị động)
    │
    ├── Sentence Structure (Cấu trúc Câu)
    │      ├── Subject & Verb Agreement (Sự hòa hợp Chủ ngữ - Vị ngữ)
    │      └── Sentence Transformation (Biến đổi câu)
    │
    └── Advanced Syntactic Structures (Ngữ pháp Nâng cao)
           ├── Conditional Sentences Type 1, 2, 3 (Câu điều kiện)
           ├── Relative Clauses: Defining & Non-defining (Mệnh đề quan hệ)
           ├── Reported Speech: Tense Backshift (Lời nói gián tiếp)
           └── Impersonal & Modal Passive (Bị động đặc biệt & khuyết thiếu)
```

**Root Cause Analysis (Phân tích Nguyên nhân Gốc rễ):**
- **Conceptual Error:** Không hiểu bản chất thời điểm / đối tượng tác động.
- **Rule Confusion:** Nhầm lẫn giữa quá khứ đơn và hiện tại hoàn thành.
- **Structural Error:** Sai trật tự từ hoặc thiếu trợ động từ trong câu hỏi gián tiếp.
- **Application Error:** Biết công thức nhưng không nhận diện được signal context.

---

### 8.5. Bộ máy Tạo Lộ trình Học Cá nhân hóa 4 Tuần (`lib/diagnostic/roadmap.generator.js`)

**Chiến lược Học tập 4 Tuần Hành động:**

| Tuần Học | Tên Giai đoạn Chiến lược | Mục tiêu Trọng tâm Hành động |
| :---: | :--- | :--- |
| **Tuần 1** | **Foundation Recovery**<br>(🔴 Critical Priority) | Khắc phục triệt để lỗ hổng kiến thức nghiêm trọng nhất (<40%), xây lại kiến thức nền |
| **Tuần 2** | **Core Grammar Development**<br>(🟡 High Priority) | Củng cố và nâng cấp các chuyên đề trọng tâm thứ hai, dạng câu bị động & chuyển đổi |
| **Tuần 3** | **Application & Transformation**<br>(🟢 Medium Priority) | Luyện tập vận dụng mệnh đề quan hệ, so sánh kép và các bài tập tổng hợp 12 chuyên đề |
| **Tuần 4** | **Advanced Practice & Assessment**<br>(🎯 Growth Milestone) | Làm bài Retake Placement Test (30 câu) đối soát mức độ tăng trưởng điểm số (+% Growth) |

**Liên kết Trực tiếp Học liệu:**
Mỗi nhiệm vụ trong lộ trình ánh xạ trực tiếp 100% vào **53 bài học** và **51 bài tập** với nút bấm 1-click **`Vào học ngay ➔`**, tự động chuyển ngữ cảnh học viên tới chính xác bài học và chương tương ứng.

---

### 8.6. Adaptive Learning Engine & Dynamic Roadmap Adjustment (Học tập Thích ứng Động)

Hệ thống không giữ nguyên một lộ trình cố định mà tự động thích ứng dựa trên kết quả thực tế qua bộ quy tắc `lib/diagnostic/adaptive.learning.engine.js`:
- **Trường hợp 1 (Vượt tiến độ - Accuracy > 90%):** Giảm tải bài tập cơ bản, mở khóa ngay các bài tập nâng cao hoặc chặng tiếp theo.
- **Trường hợp 2 (Tiếp tục mắc lỗi - Accuracy < 60%):** Giữ chuyên đề trong Priority Queue, tự động chèn thêm bước ôn lý thuyết nền tảng từ Knowledge Graph.
- **Trường hợp 3 (Lệch pha Lý thuyết - Bài tập - Application Gap):** Đọc lý thuyết 100% nhưng làm bài đạt < 50%, hệ thống chuyển sang bài tập có hướng dẫn (Scaffolded Practice) và trực quan hóa thay vì bắt đọc lại văn bản.
- **Roadmap Versioning:** Lưu trữ lịch sử các phiên bản lộ trình (`roadmap_versions`) để học viên xem lại hành trình tiến bộ.

---

### 8.7. Spaced Repetition Review & Knowledge Retention Tracking (Độ Bền vững Kiến thức)

Không kết luận học viên đã làm chủ vĩnh viễn một quy tắc chỉ qua 1 lần làm đúng. Hệ thống áp dụng chu kỳ lặp lại ngắt quãng:

$$\text{Review Interval} \in \{1\text{ ngày}, 3\text{ ngày}, 7\text{ ngày}, 14\text{ ngày}, 30\text{ ngày}\}$$

- Tự động quét và đẩy các câu hỏi hay làm sai từ Sổ tay câu sai (`user_mistakes`) vào lịch ôn tập ngắt quãng.
- Tính toán chỉ số **Knowledge Retention Score** phản ánh độ bền ghi nhớ trước và sau khi ôn tập.

---

### 8.8. AI Learning Advisor & Intelligent Study Coach (AI Cố vấn Học tập)

- **AI Guardrails Tuyệt đối:** AI không được tự ý tính điểm hay phát minh ra lesson ID giả mạo. Toàn bộ thông số đầu vào được trích xuất từ Scorer toán học và cơ sở dữ liệu có thật.
- **Vai trò của AI Advisor:**
  - Diễn giải dễ hiểu điểm mạnh, điểm yếu theo ngôn ngữ truyền cảm hứng.
  - Phân tích nguyên nhân sâu xa vì sao học viên gặp khó khăn ở từng dạng bài.
  - Tư vấn chiến lược học tập hàng ngày: *"Hôm nay nên dành 20 phút học bài nào, làm bài tập nào và vì sao?"*.
  - Sẵn sàng giải đáp các câu hỏi học tập có ngữ cảnh: *"Tại sao tôi hay nhầm thì hoàn thành?", "Khi nào tôi sẵn sàng cho trình độ B2?"*.

---

### 8.9. Kiến trúc Cơ sở Dữ liệu PostgreSQL 17 & API Design

**A. Các bảng Cơ sở Dữ liệu Quản lý trên Supabase:**
1. `diagnostic_tests`: Danh mục bài thi chẩn đoán (blueprint, thời gian, câu hỏi).
2. `diagnostic_attempts`: Lịch sử các lần làm bài (user, điểm, level, thời gian, trạng thái).
3. `diagnostic_answers`: Snapshot từng câu trả lời, thời gian làm và tính đúng/sai.
4. `diagnostic_skill_results`: Kết quả phân tích chi tiết từng chuyên đề (accuracy, confidence, classification).
5. `grammar_competencies` & `competency_dependencies`: Bản đồ năng lực và quan hệ tiên quyết của Knowledge Graph.
6. `user_learning_roadmaps`: Lộ trình học cá nhân hóa đang hoạt động.
7. `roadmap_items`: Danh sách các đầu việc học tập chi tiết của từng tuần.
8. `roadmap_versions`: Lịch sử các lần tự động điều chỉnh lộ trình thích ứng.
9. `user_competency_mastery`: Bảng theo dõi độ thành thạo tích lũy theo thời gian.
10. `spaced_repetition_reviews`: Lịch trình ôn tập ngắt quãng cá nhân.

**B. Kiến trúc API Endpoints:**
```text
/api/diagnostic
    GET  /test          -> Lấy bài thi chẩn đoán (đã ẩn đáp án)
    POST /submit        -> Chấm điểm server-side & khởi tạo lộ trình
    GET  /roadmap       -> Lấy lộ trình cá nhân hóa hiện tại
    PATCH /roadmap/item -> Cập nhật trạng thái nhiệm vụ (completed/pending)
    POST /adaptive/adjust -> Tự động điều chỉnh lộ trình theo kết quả mới
    GET  /analytics     -> Thống kê đối soát năng lực trước/sau
```

---

### 8.10. Kiến trúc Thư mục Module Mở rộng

```text
lib/
├── diagnostic/
│   ├── diagnostic.blueprint.js     # Ma trận 30 câu hỏi chuẩn hóa
│   ├── diagnostic.scoring.js       # Scorer xác định Layer 1 (Zero Hallucination)
│   ├── roadmap.generator.js        # Generator lộ trình học tập 4 tuần
│   ├── knowledge.graph.js          # Bản đồ quan hệ tiên quyết & Root Cause
│   └── adaptive.learning.engine.js # Engine điều chỉnh lộ trình thích ứng động
│
├── spaced-repetition/
│   ├── repetition.scheduler.js     # Thuật toán lập lịch 1-3-7-14-30 ngày
│   └── retention.tracker.js        # Đo lường độ bền kiến thức
│
components/
└── diagnostic/
    ├── DiagnosticOnboarding.jsx         # Landing page giới thiệu bài kiểm tra
    ├── DiagnosticTestSession.jsx        # Giao diện làm bài 1 câu/màn hình, timer, shortcuts
    ├── DiagnosticAnalysisDashboard.jsx  # Báo cáo kết quả & ma trận 10 kỹ năng
    ├── PersonalizedRoadmapView.jsx      # Lộ trình học 4 tuần với nút 1-click vào bài
    ├── DiagnosticQuestionReview.jsx     # Xem lại 30 câu với giải thích 5 trường
    └── GrammarDiagnosticEngine.jsx      # Trình điều phối trung tâm
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
- [x] **2.1.1 PostgreSQL 17 Database Provisioning & Schema Migration:**
  * Khởi tạo và liên kết môi trường Supabase Cloud PostgreSQL 17 (Project ID: `wtvlbbcyvtqqygtojxay`).
  * Mở rộng và chuẩn hóa toàn bộ 15 bảng nghiệp vụ có khóa ngoại chặt chẽ: `profiles`, `user_learning_trackers`, `user_mistakes`, `user_vocabularies`, `system_policies`, `quiz_attempts`, `user_achievements`, `user_daily_activities`, `audit_logs`, `diagnostic_tests`, `diagnostic_attempts`, `diagnostic_answers`, `diagnostic_skill_results`, `user_learning_roadmaps`, `roadmap_items`.
  * Hàng rào khóa ngoại bảo đảm toàn vẹn tham chiếu `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`.
- [x] **2.1.2 Row-Level Security (RLS) & Anti-Recursion Architecture:**
  * Kích hoạt RLS trên 100% các bảng thuộc schema `public`.
  * Xây dựng hàm bảo mật `public.is_admin()` (`SECURITY DEFINER`, `SET search_path = public`) kiểm tra vai trò `role = 'ADMIN'`, triệt tiêu vĩnh viễn lỗi Infinite Recursion khi query bảng `profiles`.
  * Phân tách chính sách bảo mật độc lập:
    * **User Tables** (`profiles`, `user_learning_trackers`, `user_mistakes`, `user_vocabularies`, `user_achievements`, `user_daily_activities`): Chủ sở hữu (`auth.uid() = user_id`) có toàn quyền SELECT, INSERT, UPDATE, DELETE; Admin có quyền kiểm tra và hỗ trợ thông qua `public.is_admin()`.
    * **System Policies Table** (`system_policies`): Mở quyền SELECT cho người dùng đã đăng nhập hoặc hệ thống; giới hạn quyền INSERT/UPDATE/DELETE nghiêm ngặt cho `public.is_admin() OR auth.role() = 'service_role'`.
    * **Audit Logs Table** (`audit_logs`): Kiến trúc Append-Only, chỉ cho phép INSERT từ backend máy chủ, cấm hoàn toàn thao tác sửa (UPDATE) hoặc xóa (DELETE) để đảm bảo tính toàn vẹn pháp lý.
- [x] **2.1.3 Idempotent Triggers & Search Path Hardening:**
  * Tạo trigger cơ sở dữ liệu `on_auth_user_created` tự động khởi tạo hồ sơ `profiles` và bộ theo dõi `user_learning_trackers` (streak 1, 0 XP) ngay khi người dùng đăng ký mới.
  * Cấu hình an toàn `SET search_path = public` cho toàn bộ function và trigger chống lại kỹ thuật tấn công Search Path Hijacking.
- [x] **2.1.4 Composite Indexes & Performance Optimization:**
  * Đánh chỉ mục hiệu năng cao cho các câu truy vấn thời gian thực: `idx_user_mistakes_user_id`, `idx_user_vocab_user_id`, `idx_quiz_attempts_user_id`.
  * Composite Indexes tối ưu hóa truy vấn có sắp xếp: `idx_quiz_attempts_user_created` (`user_id, created_at DESC`), `idx_audit_logs_created` (`created_at DESC`), `idx_daily_activities_user_date` (`user_id, activity_date DESC`).
  * Thực thi bộ kiểm thử tự động RLS Security Validation qua Supabase API.

### 🔹 Milestone 2.2: Phân tách Kiến trúc Supabase SDK (Client / Server / Services / Repositories) (P0)
- [x] **2.2.1 Cô Lập Hoàn Toàn Client & Server Supabase SDK:**
  * `lib/supabase/client.js`: Browser Supabase Client chỉ sử dụng `NEXT_PUBLIC_SUPABASE_ANON_KEY`, an toàn tuyệt đối trước rò rỉ mã bảo mật trên client. Hỗ trợ tự động đính kèm bearer token người dùng cho các truy vấn RLS pass-through.
  * `lib/supabase/server.js`: Server-side Supabase Client chỉ chạy trên môi trường Node.js / Serverless API, sử dụng `SUPABASE_SERVICE_ROLE_KEY` để thực thi các tác vụ quản trị, vượt qua RLS an toàn.
  * Cơ chế Dynamic Server Client Fallback: Tự động dự phòng an toàn khi biến môi trường máy chủ đang trong quá trình đồng bộ.
- [x] **2.2.2 Phân Tách Tầng Dữ Liệu & Nghiệp Vụ (Service & Repository Patterns):**
  * Tầng **Repositories** (`repositories/`): Chuyên trách truy vấn dữ liệu thô từ database (`user.repository.js`, `quiz.repository.js`, `mistakes.repository.js`, `vocabulary.repository.js`, `activity.repository.js`, `audit.repository.js`).
  * Tầng **Services** (`services/`): Đóng gói toàn bộ quy tắc nghiệp vụ ứng dụng (`auth.service.js`, `profile.service.js`, `tracker.service.js`, `mistakes.service.js`, `vocabulary.service.js`, `quiz.service.js`, `policy.service.js`).
- [x] **2.2.3 Xây Dựng Serverless API Routes Được Bảo Vệ Phía Server:**
  * `/api/admin/users`: API quản trị danh sách người dùng, tìm kiếm theo email/tên, phân loại quyền (FREE/VIP/ADMIN), cập nhật vai trò và khóa tài khoản phía server.
  * `/api/admin/policy`: API truy xuất và cập nhật cấu hình hạn mức bài tập và số lượt thi Quiz mỗi ngày của hệ thống.
  * `/api/admin/audit-logs`: API truy xuất nhật ký thao tác kiểm toán của quản trị viên.
  * Middleware xác thực thẩm quyền Admin nghiêm ngặt phía server thông qua token phiên đăng nhập.

### 🔹 Milestone 2.3: Offline Sync Engine & Hybrid Synchronization (P0)
- [x] **2.3.1 Local Storage & Offline Write Queue:**
  * Xây dựng `lib/sync/sync-queue.js` quản lý hàng đợi ghi chép cục bộ sử dụng LocalStorage / IndexedDB, lưu trữ các thao tác (lưu XP, hoàn thành bài, thêm/xóa câu sai, thêm/xóa từ vựng) khi mạng ngắt kết nối.
  * Định danh duy nhất cho từng hành động với UUID tạm thời và cờ trạng thái `is_pending: true`.
- [x] **2.3.2 Bộ Điều Phối Đồng Bộ Đa Luồng (Sync Manager):**
  * Xây dựng `lib/sync/sync-manager.js` tự động lắng nghe sự kiện mạng `window.addEventListener('online')` và `window.addEventListener('offline')`.
  * Cơ chế tự động giải phóng hàng đợi theo mẻ (batch flush) khi thiết bị phục hồi kết nối Internet.
  * Cơ chế Exponential Backoff tự động thử lại khi gặp sự cố mạng hoặc máy chủ phản hồi chậm.
- [x] **2.3.3 Quy Tắc Xử Lý Xung Đột Dữ Liệu Toàn Diện (Conflict Resolution Strategy):**
  * **XP & Điểm số:** Cộng dồn lũy tiến giao dịch (Transactional increment `server_xp + local_pending_xp`), triệt tiêu rủi ro ghi đè làm mất điểm kinh nghiệm của học viên.
  * **Chuỗi học tập (Streak):** Máy chủ thẩm định dựa trên mốc ngày UTC (`activity_date`), duy trì chuỗi học liên tục nếu có hoạt động trong vòng 24-48 giờ.
  * **Quiz & Lịch sử làm bài:** Bản ghi bất biến (Immutable records), các lượt làm bài khi offline được gắn timestamp máy client và nạp bổ sung vào lịch sử mà không ghi đè lượt cũ.
  * **Sổ tay câu sai & Từ vựng:** Cơ chế Last-Write-Wins có kiểm tra trạng thái xóa (Delete flag precedence).
  * **Tiến độ học tập:** Hợp tập hợp (Set Union `server_completed_lessons ∪ local_completed_lessons`), bảo toàn 100% tiến độ bài học.
- [x] **2.3.4 Huy Hiệu Trạng Thái Đồng Bộ Trực Quan Trên UI (Sync Status Pill):**
  * Hiển thị trạng thái đồng bộ thời gian thực trên Navbar:
    * 🟢 **Đã đồng bộ (Cloud Synced)**: Dữ liệu đám mây khớp hoàn toàn với thiết bị.
    * 🟡 **Đang đồng bộ (Syncing...)**: Đang gửi dữ liệu mẻ lên máy chủ.
    * 🟠 **Chờ gửi (Pending Changes - X items)**: Đang lưu tạm khi mất kết nối.
    * 🔴 **Lỗi đồng bộ (Sync Failed)**: Cảnh báo kèm nút thử lại thủ công.
    * ⚪ **Chế độ ngoại tuyến (Offline Mode)**: Tiếp tục học tập bình thường không bị gián đoạn.

### 🔹 Milestone 2.4: Nâng cấp Admin Dashboard Chuyên sâu & Audit Logs (P1)
- [x] **2.4.1 Bảng Điều Khiển Quản Trị Viên Tập Trung (Admin Panel View):**
  * Tích hợp trực tiếp vào thanh điều hướng khi đăng nhập bằng tài khoản có quyền `role === 'ADMIN'`.
  * Hiển thị thẻ thông tin hệ thống trực tiếp từ Supabase PostgreSQL 17.
- [x] **2.4.2 Quản Lý Học Viên & Phân Quyền Nâng Cao:**
  * Bảng danh sách học viên trực quan: Họ tên, Email, Vai trò (`ADMIN`, `VIP`, `FREE`), Tiến độ học tập (Streak, XP, số bài học), Trạng thái (`ACTIVE`, `BANNED`) và Ngày tạo.
  * Thao tác nhanh 1 chạm: Nâng cấp VIP ⭐, Hạ xuống FREE, Khóa tài khoản (Khóa/Mở khóa học viên).
  * Modal thêm người dùng mới với form xác thực chuẩn.
  * Thanh tìm kiếm người dùng theo Họ tên, Email và bộ lọc vai trò tức thì.
- [x] **2.4.3 Cấu Hình Hạn Mức Hệ Thống (System Quota Policy Management):**
  * Biểu mẫu cấu hình hạn mức cho học viên mặc định (FREE):
    * Số câu bài tập tối đa mỗi chương (Mặc định: 10 câu; câu thứ 11 trở đi khóa VIP).
    * Số đề thi Quiz tối đa mỗi ngày (Mặc định: 2 đề 50 câu/ngày).
  * Lưu trữ cấu hình trực tiếp vào bảng `system_policies` trên Supabase PostgreSQL 17 và đồng bộ ngay cho người dùng.
- [x] **2.4.4 Hệ Thống Ghi Nhận Lịch Sử Quản Trị (Enterprise Audit Logs):**
  * Tự động ghi nhận mọi hành động quản trị vào bảng `audit_logs`: Thay đổi quyền tài khoản, Khóa/Mở khóa học viên, Cập nhật hạn mức hệ thống.
  * Lưu trữ metadata chi tiết: `admin_id`, `admin_email`, `action_type`, `target_user_id`, `old_value`, `new_value`, `ip_address`, `created_at`.
  * Cơ chế Append-Only bảo vệ tính toàn vẹn dữ liệu, không thể can thiệp xóa dấu vết.

### 🔹 Milestone 2.5: Structured Pedagogical Explanation Engine (JSON) & Remedial Engine (P1)
- [x] **2.5.1 Chuẩn Hóa Schema Lời Giải Sư Phạm 5 Trường (`lib/explanation/explanation.schema.js`):**
  * Định dạng JSON v1.0 chuẩn hóa bắt buộc gồm đúng 5 thành phần sư phạm:
    1. `signal`: Dấu hiệu ngữ pháp, từ khóa nhận diện, bối cảnh câu (`keywords`, `grammar_clues`, `identified_pattern`).
    2. `rule`: Quy tắc áp dụng, công thức cú pháp, điều kiện ứng dụng và ngoại lệ (`topic`, `formula`, `explanation`, `conditions`, `exceptions`).
    3. `translation`: Dịch câu hoàn chỉnh sang tiếng Việt, làm nổi bật ngữ nghĩa thành phần ngữ pháp trọng tâm (`vietnamese`, `highlight_segment`, `literal_meaning`).
    4. `common_mistakes`: Sai lầm phổ biến, phân tích bẫy đề thi và lý do học viên hay chọn nhầm (`trap_distractors`, `why_incorrect`, `confusion_point`).
    5. `exam_tips`: Mẹo nhận diện thần tốc cho kỳ thi THPT/IELTS/TOEIC, quy tắc loại trừ nhanh (`quick_rule`, `time_saver`, `elimination_strategy`).
  * Runtime schema validator `validateExplanation()` đảm bảo mọi câu hỏi đều thỏa mãn 100% định dạng, có fallback an toàn.
- [x] **2.5.2 Phân Cấp 4 Cấp Độ Học Lực Thích Ứng (Level-Aware Difficulty Adaptation):**
  * Phân loại chuẩn 4 cấp độ: `BEGINNER` (Score 1, 30s), `ELEMENTARY` (Score 2, 45s), `INTERMEDIATE` (Score 3, 60s), `ADVANCED` (Score 4, 90s).
  * Hàm `adaptExplanationForLevel(explanation, targetLevel)` tự động điều chỉnh độ sâu phân tích:
    * *Beginner*: Tối giản, tập trung vào từ khóa nhận diện, công thức ngắn gọn, tránh thuật ngữ phức tạp.
    * *Elementary*: Bổ sung bước áp dụng chi tiết và phân tích bẫy thường gặp.
    * *Intermediate*: Phân tích đầy đủ cấu trúc câu, ngữ cảnh thì và các phương án gây nhiễu.
    * *Advanced*: Mở rộng ngoại lệ ngữ pháp, sắc thái nâng cao và mẹo tăng tốc tối đa khi làm bài thi.
  * Bộ chuyển đổi thích ứng phi hủy diệt (`non-destructive adaptation`): không bao giờ thay đổi bản chất câu hỏi hay đáp án chính xác.
- [x] **2.5.3 Hệ Thống Thu Thập Phản Hồi Học Viên (Explanation Quality Feedback System):**
  * Component `StructuredExplanation.jsx` tích hợp thanh phản hồi trực quan:
    * Nút "👍 Hữu ích": Ghi nhận đánh giá tích cực của học viên, tính toán tỷ lệ hữu ích theo thời gian thực.
    * Nút "⚠️ Báo lỗi": Mở modal phản hồi chi tiết với 6 danh mục lỗi chuẩn hóa: `incorrect_grammar_rule`, `incorrect_translation`, `confusing_explanation`, `missing_information`, `incorrect_exam_tip`, `other` kèm ô góp ý bổ sung.
  * Bảng Supabase `public.explanation_feedback` có ràng buộc duy nhất `UNIQUE(user_id, question_id, explanation_version)` chống spam lặp lại.
  * API bảo mật `pages/api/explanation-feedback.js` và API tổng hợp quản trị `pages/api/admin/explanations/feedback-summary.js`.
- [x] **2.5.4 Chuẩn Hóa Phân Loại Lỗi & Phát Hiện Lỗ Hổng Kiến Thức (Error Classification Taxonomy):**
  * Danh mục 11 nhóm lỗi ngữ pháp chuẩn hóa trong `lib/explanation/error-taxonomy.js`:
    * `TENSE_CONFUSION`, `SUBJECT_VERB_AGREEMENT`, `WORD_FORM`, `PREPOSITION_ERROR`, `ARTICLE_ERROR`, `CONDITIONAL_ERROR`, `PASSIVE_VOICE_ERROR`, `REPORTED_SPEECH_ERROR`, `VOCABULARY_ERROR`, `CONTEXT_MISUNDERSTANDING`, `UNKNOWN_ERROR`.
  * Bộ phân loại thông minh `classifyError(question, userAnswer, correctAnswer)` kết hợp phân tích từ khóa, cấu trúc thì và từ vựng đối chiếu.
- [x] **2.5.5 Động Cơ Đề Xuất Bài Học Bù Đắp Tự Động (Deterministic Remedial Recommendation Engine):**
  * Module `lib/explanation/remedial-engine.js` phân tích câu sai của học viên, tính điểm tin cậy (Confidence Score 0.88 - 0.98), tra cứu danh mục 12 chương & 53 bài học chuẩn sách Mai Lan Hương.
  * Component `RemedialRecommendationCard.jsx` hiển thị cảnh báo sư phạm ngay khi học viên trả lời sai (ở chế độ kiểm tra từng câu hoặc xem lại toàn bộ đề thi Quiz 50 câu):
    * Hiển thị chính xác lỗ hổng kiến thức phát hiện (`knowledge_gap`).
    * Giải thích nguyên nhân vì sao phương án chọn bị sai và chỉ ra quy tắc đúng.
    * Cung cấp nút hành động 1-click "📖 Học ngay bài bù đắp" điều hướng thẳng đến đúng bài học cần củng cố trong 12 Chuyên đề.
- [x] **2.5.6 Lưu Trữ Supabase PostgreSQL 17 & Serverless API Routes:**
  * 5 bảng cơ sở dữ liệu chuyên dụng với RLS và chỉ mục tổng hợp:
    * `public.explanations`: Lưu trữ định dạng JSON 5 trường, quản lý phiên bản `version` và trạng thái phê duyệt.
    * `public.explanation_feedback`: Lưu trữ đánh giá của học viên.
    * `public.question_concepts`: Bản đồ liên kết câu hỏi với khái niệm kiến thức và độ khó.
    * `public.remedial_recommendations`: Nhật ký các khuyến nghị học tập bù đắp cá nhân hóa.
    * `public.user_concept_progress`: Theo dõi mức độ thành thạo (`mastery_score`) từng khái niệm theo người dùng.
  * Serverless API Routes bảo vệ:
    * `GET /api/questions/[questionId]/explanation`: Trả về lời giải 5 trường thích ứng theo trình độ học viên.
    * `POST /api/explanation-feedback`: Gửi phản hồi đánh giá và báo cáo sai sót.
    * `POST & GET & PATCH /api/learning/remedial-recommendations`: Tạo và quản lý trạng thái khuyến nghị học bù đắp.
    * `GET /api/admin/explanations/feedback-summary`: Tổng hợp báo cáo chất lượng sư phạm cho Quản trị viên.

### 🔹 Milestone 2.6: Enterprise-Grade Design System, Semantic Design Tokens & WCAG 2.2 AA Compliance (P2)

> **Mục tiêu:** Xây dựng một Design System tập trung, nhất quán và có khả năng mở rộng cho toàn bộ Grammar Learning Platform. Chuẩn hóa 3 tầng Design Tokens, Typography Scale, Spacing & Layout, Component Library dùng chung, Interaction & Motion System và nâng cấp khả năng tiếp cận lên chuẩn quốc tế WCAG 2.2 Level AA.

#### 1. Các thành phần Cốt lõi Đã Triển khai & Hoạt động trên Production:
- [x] **2.6.1 Hệ Thống Design Tokens Tập Trung (`lib/tokens/design-tokens.js`):**
  * Chuẩn hóa bảng mã màu độc lập cho cả Light Mode (Sáng) và Dark Mode (Tối):
    * Nền & Bề mặt: `bg`, `bgSub`, `bgElevated`, `bgActive`.
    * Thẻ nội dung: `card`, `cardSubtle`, `cardBorder`.
    * Đường viền: `border`, `borderSubtle`, `borderStrong`.
    * Typography phân cấp: `text` (`#0f172a`), `textSecondary` (`#334155`), `textMuted` (`#475569`), `textHeading` (`#0f172a`).
    * Accent Tokens: `accent`, `success`, `warning`, `danger` kèm màu nền nhẹ và đường viền tương ứng.
- [x] **2.6.2 Đảm Bảo Tuyệt Đối Chuẩn Tiếp Cận WCAG AA & Tương Phản Màu:**
  * Mọi thành phần chữ trên nền sáng đều đạt tỷ lệ tương phản tối thiểu ≥ 4.5:1 (Normal Text) và ≥ 3.0:1 (Large Text / Icons).
  * Tiêu đề chính đạt tỷ lệ tương phản 15.5:1 trên nền trắng (`#0f172a` trên `#ffffff`).
  * Loại bỏ hoàn toàn các mã màu xám mờ (`#a1a1aa`, `#71717a`) trên nền sáng ở Dashboard, Bản đồ tiến độ 12 chương, Breadcrumbs, Quiz Engine và Sổ tay câu sai.
- [x] **2.6.3 Chống Nhấp Nháy Giao Diện (Anti-Flicker Script):**
  * Script Inline chặn ngay trong `<Head>` của `pages/_app.js` đọc `localStorage.getItem('grammar_theme')` trước khi DOM render để loại bỏ triệt để hiện tượng Flash of Unstyled Content (FOUC).
- [x] **2.6.4 Chuẩn Hóa Các Trạng Thái Giao Diện Cơ bản:**
  * Empty States (Trạng thái rỗng cho Sổ tay câu sai, Bộ đề Quiz, Danh sách từ vựng).
  * Skeleton Loading đồng bộ cho thẻ học viên và bài học.
  * Form Controls (Input, Select, Textarea) tự động thích ứng viền và nền theo theme đang chọn.

#### 2. Kế hoạch Mở rộng 8 Hướng Nâng cấp Enterprise Design System (Spec 2.6 Enhanced):
- [ ] **2.6.5 Semantic & Component Design Tokens (3-Layer Architecture):**
  * Tách biệt 3 tầng: Primitive Tokens ➔ Semantic Tokens ➔ Component Tokens.
  * Cấm tuyệt đối hardcode mã HEX trong components; mọi thành phần chỉ tiêu thụ Semantic/Component Tokens.
- [ ] **2.6.6 Typography System & Responsive Fluid Fonts (`lib/tokens/typography.tokens.js`):**
  * Chuẩn hóa font gia đình Inter & JetBrains Mono; phân cấp 10 bậc từ `display` (40px) đến `overline` (11px).
  * Ứng dụng hàm `clamp()` co giãn phông chữ mượt mà theo viewport, chống tràn chữ trên màn hình nhỏ.
- [ ] **2.6.7 Spacing 4px Grid, Border Radius & Elevation Shadow (`lib/tokens/spacing.tokens.js`):**
  * Thống nhất thang khoảng cách 4px Grid (`space1` 4px đến `space16` 64px) và hệ thống bo góc (`radiusSm` đến `radiusFull`).
  * Chuẩn hóa chiều rộng container (max 1120px / 960px) trên toàn bộ Dashboard, Quiz, Study Mode và Roadmap.
- [ ] **2.6.8 Shared Component Design System Library (`components/design-system/`):**
  * Xây dựng thư viện component nguyên khối dùng chung: `buttons/` (Button, IconButton, ButtonGroup), `forms/` (Input, Select, Checkbox, Radio, Switch), `feedback/` (Badge, Alert, Toast, Progress, Tooltip), `layout/` (Card, Container, Grid, Divider), `overlays/` (Modal, Drawer, Dropdown, Popover).
  * Mỗi component hỗ trợ đầy đủ 8 trạng thái: Default, Hover, Focus, Active, Disabled, Loading, Error, Success.
- [ ] **2.6.9 WCAG 2.2 Level AA Compliance Nâng cao:**
  * **2.4.11 Focus Not Obscured:** Không để thanh header dính hoặc modal che khuất focus indicator.
  * **2.5.8 Target Size:** Vùng tương tác cảm ứng tối thiểu 24 × 24 CSS pixels (ưu tiên 44 × 44 pixels trên Mobile).
  * **Keyboard Accessibility:** Điều hướng 100% bằng phím (Tab, Enter, Space, Escape, Arrow), hiển thị rõ ràng Focus Ring (`2px solid T.accent`).
  * Hỗ trợ zoom phóng to 200% - 400% không vỡ giao diện.
- [ ] **2.6.10 Interaction & Motion Design System:**
  * Chuẩn hóa thời lượng transition (120ms, 200ms, 300ms) và easing curves.
  * Hỗ trợ bắt buộc `@media (prefers-reduced-motion: reduce)` vô hiệu hóa animation cho người dùng nhạy cảm.
- [ ] **2.6.11 Automated Token Validation & Visual Regression Testing:**
  * Script `scripts/validate-design-tokens.js` tự động quét phát hiện mã HEX bị hardcode hoặc vi phạm tương phản.
  * Bộ kiểm thử Playwright Visual Regression chụp so sánh screenshot giao diện trên Mobile, Tablet, Desktop ở cả Light/Dark Mode.
- [ ] **2.6.12 Design System Documentation & Governance (`docs/design-system/`):**
  * Bộ tài liệu hướng dẫn sử dụng Design System, Token guidelines, quy tắc đóng góp và cơ chế phát hiện vi phạm.
- [ ] **2.6.13 Bộ Tiêu chuẩn Nghiệm thu 20 Tiêu chí (AC-01 -> AC-20):**
  * `AC-01 -> AC-06`: Primitive/Semantic tokens, Light/Dark sync, System Theme OS detection, Anti-Flicker no FOUC.
  * `AC-07 -> AC-09`: Typography scale, Spacing scale 4px grid, Shared Component Library đầy đủ.
  * `AC-10 -> AC-13`: WCAG contrast ≥4.5:1, Keyboard navigation, Focus management, Motion System có Reduced Motion.
  * `AC-14 -> AC-16`: Empty states có illustration, Skeleton loading không CLS layout shift, Mobile-first responsive.
  * `AC-17 -> AC-20`: Visual regression testing, Accessibility audit report, Token validation script, Tài liệu Design System.

### 🔹 Milestone 2.7: Xây dựng Grammar Visualization Engine & Audio Service (P1)
- [x] **2.7.1 Centralized Audio Service & Pronunciation Engine:**
  * Xây dựng singleton `lib/audio/speech.service.js` bao bọc Web Speech API chuẩn W3C, cơ chế chống phát âm chồng lấn (overlap cancellation) và lắng nghe sự kiện `voiceschanged`.
  * Hỗ trợ chuyển đổi linh hoạt giọng đọc bản ngữ Anh - Mỹ (US, `en-US`) và Anh - Anh (UK, `en-GB`).
  * Tùy chỉnh tốc độ đọc 3 cấp độ (`0.75x`, `1.0x`, `1.25x`) và tự động ghi nhớ tùy chọn học viên vào `localStorage`.
  * Xây dựng bộ lọc làm sạch văn bản `lib/audio/speech.utils.js` (`sanitizeSpeechText`) tự động bóc tách Markdown, phiên âm quốc tế IPA `/.../` và giải nghĩa tiếng Việt trong ngoặc đơn `(...)` để TTS phát âm tự nhiên.
  * Thiết kế UI component tái sử dụng `components/audio/AudioPlayer.jsx` với 2 chế độ: Compact Inline (nút phát âm nhỏ gọn cho câu ví dụ) và Full Card (bộ điều khiển đầy đủ kèm chuyển giọng, tốc độ đọc và thanh trạng thái).
- [x] **2.7.2 Structured Pedagogical Visualization Data Layer (Toàn Diện 8 Bộ Dữ Liệu):**
  * Tách biệt 100% dữ liệu sư phạm khỏi logic render vào thư mục chuẩn `data/grammar-visualizations/`.
  * `tenses.data.js`: Trục thời gian 13 thì tiếng Anh (Past, Present, Future), 4 thể ngữ pháp, công thức và so sánh cặp thì.
  * `conditionals.data.js`: Cây quyết định câu điều kiện (Zero, 1, 2, 3, Mixed) và công thức đảo ngữ nâng cao.
  * `passive-voice.data.js`: Quy trình chuyển đổi 5 bước chủ động sang bị động, ma trận TO BE và quy tắc lược bỏ *By + Agent*.
  * `reported-speech.data.js`: Quy trình 7 giai đoạn câu gián tiếp, ma trận lùi thì và bảng biến đổi trạng từ nơi chốn/thời gian.
  * `relative-clauses.data.js`: Cấu trúc câu mệnh đề quan hệ, phân loại đại từ/trạng từ (who, whom, which, whose, that, where, when, why), so sánh mệnh đề xác định vs không xác định và quy tắc rút gọn (V-ing, V3, to-V).
  * `comparisons.data.js`: Thẻ so sánh đa cấp 4 cấp độ (=, >, MAX, ↗↗), tính từ ngắn vs dài và bảng bất quy tắc.
  * `modal-verbs.data.js`: Thang đo mức độ chắc chắn 0% - 100%, 4 nhóm chức năng cốt lõi và suy đoán quá khứ Perfect Modals.
  * `word-forms.data.js`: Cây họ từ 4 hướng (Danh - Động - Tính - Trạng), 8 bộ họ từ kinh điển và bộ quy tắc hậu tố nhận diện vàng.
- [x] **2.7.3 Registry-Driven Visualization Engine:**
  * Xây dựng `lib/visualization/visualization.registry.js` tự động phân giải bài học và chuyên đề sang toàn bộ 8 mô hình trực quan hóa tương ứng.
  * Bộ tiện ích `lib/visualization/visualization.utils.js` chuẩn hóa mã màu thể thì và tính toán tọa độ vector SVG/Flexbox.
  * Thành phần điều phối `components/grammar-visualization/VisualizationRenderer.jsx` kết nối linh hoạt giữa Registry và 8 View trực quan.
  * Bảng chú giải ký hiệu trực quan `components/grammar-visualization/VisualizationLegend.jsx` giải thích màu sắc, hình khối và ký hiệu đồng bộ cho toàn bộ 8 mô hình.
  * Bộ điều khiển trực quan `components/grammar-visualization/VisualizationControls.jsx` (Thu nhỏ/Phóng to giao diện, Đặt lại trạng thái ban đầu).
- [x] **2.7.4 Tám Mô Hình Trực Quan Hóa Chuyên Sâu Tích Hợp Study Mode:**
  * `TimelineVisualization.jsx`: Trục thời gian 13 thì tương tác, bộ lọc thể thì, chế độ đối chiếu 2 thì song song (Side-by-side Compare Mode).
  * `DecisionTreeVisualization.jsx`: Cây quyết định câu điều kiện từng bước, Breadcrumbs, nút Back/Reset và phát âm câu ví dụ.
  * `TransformationDiagram.jsx`: Sơ đồ chuyển đổi S-V-O sang câu bị động với mã màu trực quan, mũi tên dịch chuyển vị trí và bảng quy tắc lược bỏ tác nhân.
  * `ConversionFlowVisualization.jsx`: Luồng 7 giai đoạn câu gián tiếp, tab tra cứu ma trận lùi thì, tab tra cứu trạng từ và nghe phát âm câu mẫu.
  * `SentenceTreeVisualization.jsx`: Sơ đồ cấu trúc câu phân rã màu sắc Antecedent ➔ Pronoun ➔ Relative Clause ➔ Main Clause, so sánh mệnh đề xác định/không xác định và 3 quy tắc rút gọn thần tốc.
  * `ComparisonScaleVisualization.jsx`: Thước đo tỷ lệ thực nghiệm 4 cấp độ (=, >, MAX, ↗↗), bộ phân loại tính từ ngắn vs dài và bảng tra cứu bất quy tắc.
  * `ModalMatrixVisualization.jsx`: Thang đo xác suất phần trăm 0% đến 100%, ma trận 4 nhóm chức năng và suy đoán quá khứ Perfect Modals.
  * `WordFamilyTreeVisualization.jsx`: Cây họ từ phân nhánh từ Root Node sang Danh - Động - Tính - Trạng từ, phiên âm IPA, câu ví dụ và động cơ hậu tố vàng.
- [x] **2.7.5 Tối Ưu Tương Phản White (Light) Mode & WCAG AA:**
  * Rà soát và loại bỏ toàn bộ mã màu xám mờ (`#a1a1aa`, `#71717a`) trên nền sáng.
  * Áp dụng hệ thống Design Tokens (`T.text`, `T.textSecondary`, `T.textMuted`), bảo đảm tỷ lệ tương phản đạt chuẩn WCAG AA (≥ 4.5:1 đến 15.5:1) trên toàn bộ Dashboard, Bản đồ tiến độ, Breadcrumbs, Quiz Engine và Sổ tay câu sai.
- [x] **2.7.6 Visualizer Catalog Switcher Toàn Diện:**
  * Tích hợp thanh chuyển đổi 8 mô hình trực quan trực tiếp trên đầu `GrammarVisualization.jsx`, cho phép học viên khám phá linh hoạt bất kỳ mô hình nào tại bất kỳ bài học nào.

### 🔹 Milestone 2.8: AI-Powered Grammar Diagnostic & Personalized Adaptive Learning Roadmap (P1 - Central Module)

> **Mục tiêu:** Xây dựng hệ thống Grammar Diagnostic & Personalized Learning có khả năng đánh giá trình độ ngữ pháp đầu vào, phát hiện chính xác lỗ hổng kiến thức, phân tích năng lực theo từng chuyên đề và tự động xây dựng lộ trình học tập cá nhân hóa 4 tuần liên kết 100% với 53 bài học và 51 bài tập.

#### 1. Các thành phần Cốt lõi Đã Triển khai & Hoạt động trên Production:
- [x] **2.8.1 Diagnostic Assessment Engine (Placement Test Blueprint):**
  * Xây dựng bài kiểm tra đầu vào chuẩn hóa 30 câu trắc nghiệm (A/B/C/D), thời gian 15-20 phút tại `lib/diagnostic/diagnostic.blueprint.js`.
  * Phân bổ cân đối theo ma trận blueprint 10 nhóm kiến thức chuẩn hóa (10 Dễ - 12 Trung bình - 8 Khó) khớp 100% tài liệu Mai Lan Hương & Hà Thanh Uyên.
  * Tái sử dụng ngân hàng câu hỏi thông qua hệ thống metadata và mapping bài học (`lesson_id`, `lesson_code`, `chapter_number`, `competency_id`).
  * Trải nghiệm làm bài 1 câu/màn hình (`DiagnosticTestSession.jsx`), Progress bar, Countdown Timer (20:00), Đánh dấu xem lại (Flag Question), phím tắt nhanh (A/B/C/D), Question drawer chuyển nhanh 30 câu.
  * Cơ chế chống gian lận: Che giấu đáp án đúng và giải thích ở client API (`/api/diagnostic/test`); chỉ submit 1 lần duy nhất mỗi lượt attempt với hộp thoại xác nhận.
- [x] **2.8.2 Assessment Scoring & Weakness Detection Engine:**
  * Thuật toán chấm điểm server-side toán học thuần túy (Zero Hallucination) tại `lib/diagnostic/diagnostic.scoring.js`.
  * Xác định Accuracy % và gán nhãn Confidence level (`high` >5 câu, `medium` 3-5 câu, `low` <3 câu) tránh kết luận vội vã.
  * Phân loại 5 cấp độ thành thạo: Mastered (90-100%) / Good (75-89%) / Developing (60-74%) / Needs Improvement (40-59%) / Critical Weakness (0-39% 🔴).
  * Ước tính trình độ ngữ pháp nội bộ chuẩn xác (A1 / A2 / B1 / B2 / C1 Estimated Level).
  * Lưu trữ snapshot câu hỏi, đáp án học viên và kết quả kỹ năng vào PostgreSQL 17 (`diagnostic_attempts`, `diagnostic_answers`, `diagnostic_skill_results`).
- [x] **2.8.3 Personalized Learning Roadmap Engine:**
  * Bộ máy sinh lộ trình học tập cá nhân hóa 4 tuần tại `lib/diagnostic/roadmap.generator.js` dựa trên kết quả chẩn đoán.
  * Ưu tiên tuần 1 khắc phục điểm yếu chí mạng (🔴 Critical Priority) và tuần 2 nâng cấp dạng câu biến đổi.
  * Liên kết trực tiếp 100% với 53 bài học và 51 bài tập trong hệ thống với nút bấm 1-click **"Vào học ngay ➔"**.
  * Tích hợp AI Recommendation Layer (AI Advisor) tổng hợp điểm mạnh, lỗ hổng cần ưu tiên và lời khuyên học tập truyền cảm hứng.
  * Lưu trữ lộ trình và các đầu việc học tập vào Supabase PostgreSQL 17 (`user_learning_roadmaps`, `roadmap_items`).
- [x] **2.8.4 Learning Analytics, Progress Comparison & Reassessment:**
  * Theo dõi tiến độ hoàn thành từng nhiệm vụ trên Roadmap qua checkbox tương tác và thanh tiến độ thời gian thực.
  * Hỗ trợ Retake Placement Test sau quá trình học tập để đo lường mức độ cải thiện (+% Improvement).
  * Tích hợp công cụ xem lại chi tiết 30 câu hỏi kèm giải thích sư phạm chuẩn 5 trường (Signal, Rule, Translation, Common Mistakes, Exam Tips) từ Milestone 2.5 (`DiagnosticQuestionReview.jsx`).
- [x] **2.8.5 UI/UX & Responsive Experience:**
  * Landing Page giới thiệu bài kiểm tra chẩn đoán trực quan (`DiagnosticOnboarding.jsx`) với bảng ma trận 10 chuyên đề.
  * Giao diện làm bài hiện đại, tập trung cao độ, hỗ trợ đầy đủ phím tắt và cảnh báo thời gian.
  * Dashboard hiển thị kết quả chẩn đoán trực quan (`DiagnosticAnalysisDashboard.jsx`) với thẻ trình độ nổi bật và ma trận 10 kỹ năng.
  * Giao diện Lộ trình học tập cá nhân hóa dạng Timeline tuần học (`PersonalizedRoadmapView.jsx`) với bộ lọc chặng tuần.
  * Tuân thủ chuẩn thiết kế Design Token System WCAG AA trên cả White Mode và Dark Mode.
- [x] **2.8.6 Security, Anti-Tampering & Quality Assurance:**
  * Server-side Answer Validation ngăn chặn can thiệp kết quả từ client qua `/api/diagnostic/submit`.
  * Cơ chế Fallback linh hoạt: hoạt động mượt mà cả khi offline hoặc ở chế độ Khách (Guest User) với LocalStorage.
  * RLS bảo vệ bảng `diagnostic_*` và `user_learning_roadmaps`, chống đệ quy và phân quyền chặt chẽ.

#### 2. Kế hoạch Mở rộng 6 Hướng Nâng cấp Adaptive EdTech (Phases 4 - 10 / Spec 2.8 Enhanced):
- [ ] **2.8.7 Grammar Knowledge Graph & Competency Mapping:** Xây dựng bản đồ quan hệ tri thức giữa 53 bài học, xác định các khái niệm tiền đề (Prerequisites) và cơ chế Root Cause Analysis cho các lỗi sai lặp lại.
- [ ] **2.8.8 Adaptive Learning & Dynamic Roadmap Adjustment Engine:** Bộ quy tắc `adaptive.learning.engine.js` tự động điều chỉnh lộ trình dựa trên kết quả làm bài tập thực tế (Accuracy >90% tăng tốc; Accuracy <60% bổ sung bài tập củng cố; Application Gap tự động bù đắp bài tập có giàn giáo).
- [ ] **2.8.9 Learning Mastery, Spaced Repetition & Retention Tracking:** Tự động lên lịch ôn tập ngắt quãng 1-3-7-14-30 ngày cho các câu hỏi hay làm sai trong Sổ tay câu sai và đo lường chỉ số Knowledge Retention Score.
- [ ] **2.8.10 Conversational AI Learning Advisor:** Phát triển endpoint `/api/ai-advisor/ask` giải đáp ngữ cảnh người học (*"Tại sao tôi yếu chuyên đề Thì?", "Tôi đã sẵn sàng lên B2 chưa?"*) với hệ thống AI Guardrails chặt chẽ.
- [ ] **2.8.11 Bộ Tiêu chuẩn Nghiệm thu Toàn diện (20 Acceptance Criteria AC-01 -> AC-20):**
  * `AC-01 -> AC-05`: Đạt chuẩn Blueprint 30 câu, 10 nhóm kiến thức, 15-20 phút, Anti-Cheating server-side.
  * `AC-06 -> AC-09`: Thuật toán chấm điểm xác định, nhận diện điểm yếu, phân loại Confidence, Knowledge Graph mapping.
  * `AC-10 -> AC-13`: Roadmap 4 tuần, liên kết 53 Lessons, 51 Exercises, AI Recommendation theo schema cố định.
  * `AC-14 -> AC-17`: Tự động điều chỉnh thích ứng, theo dõi 10 competency mastery, lịch ôn tập ngắt quãng, so sánh tăng trưởng trước/sau.
  * `AC-18 -> AC-20`: Lưu trữ toàn vẹn trên Supabase PostgreSQL 17, bảo mật RLS, UI/UX chuẩn WCAG 2.2 AA.

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
