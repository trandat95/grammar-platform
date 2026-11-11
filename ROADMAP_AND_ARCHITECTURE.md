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
| **Infrastructure** | **2.3** | **Resilient Offline-First Architecture & Multi-Device Sync** | **P0 (Critical)** | ✅ Core Live / Resilient Sync Spec Active |
| **Management** | **2.4** | **Enterprise Admin Dashboard, RBAC & Immutable Audit Logs** | **P1 (High)** | ✅ Core Live / Enterprise Governance Spec Active |
| **Content** | **2.5** | **Structured Pedagogical Intelligence & Remedial Engine** | **P1 (High)** | ✅ Core Live / Knowledge Graph Spec Active |
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

## 🔄 5. OFFLINE-FIRST ARCHITECTURE, RESILIENT SYNC ENGINE & MULTI-DEVICE SYNCHRONIZATION (MILESTONE 2.3)

> **Sứ mệnh cốt lõi:** Xây dựng hệ thống Offline-First cấp công nghiệp (Industrial-grade Offline-First Engine) cho phép học viên tiếp tục toàn bộ hoạt động học tập (học bài, làm quiz, đánh dấu câu sai, lưu từ vựng) trong điều kiện mất Internet hoặc kết nối chập chờn. Toàn bộ tiến trình được bảo toàn 100% trong lưu trữ cục bộ có tính giao dịch, tự động phục hồi và hội tụ nhất quán (Eventually Consistent) ngay khi thiết bị kết nối lại, đảm bảo triệt tiêu rủi ro mất điểm XP, mất chuỗi streak hoặc trùng lặp dữ liệu trên đa thiết bị.

### 5.1. Triết lý & Nguyên tắc Thiết kế Cốt lõi
Hệ thống tuân thủ 4 nguyên tắc kỹ thuật bất biến:
1. **Offline-First Resilience:** Mọi thao tác học tập đều được ghi nhận tức thì vào lưu trữ cục bộ (Local-First Commit) trước khi phát sinh yêu cầu mạng; giao diện phản hồi 0ms không phụ thuộc độ trễ máy chủ.
2. **Event-Driven Synchronization:** Mọi biến động dữ liệu được đóng gói thành các sự kiện đồng bộ tuần tự bất biến (`SyncEvent`), lưu trữ trong hàng đợi có chỉ mục (Transactional IndexedDB Queue).
3. **Eventually Consistent Convergence:** Áp dụng mô hình đồng bộ trạng thái hội tụ giữa các thiết bị thông qua dấu thời gian logical (Vector Clock / Server Sync Cursors) và bộ giải quyết xung đột nghiệp vụ chuyên sâu.
4. **Strict Idempotency:** Mỗi sự kiện đồng bộ mang một mã định danh ngẫu nhiên bất biến (`idempotency_key` UUIDv4). Máy chủ từ chối xử lý lặp lại ngay cả khi client gửi lại nhiều lần do ngắt kết nối giữa chừng.

### 5.2. Sơ đồ Kiến trúc Đồng bộ Hai chiều Đa Thiết bị (End-to-End Architectural Flow)

```text
  [ Học viên thao tác: Làm bài / Luyện Quiz / Lưu câu sai / Bookmark từ vựng ]
                                      │
                                      ▼
                      ┌──────────────────────────────┐
                      │    Optimistic UI Updates     │ ──► Giao diện phản hồi 0ms
                      └──────────────┬───────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │  IndexedDB Transactional Store   │
                    │      (Offline Event Queue)       │
                    └─────────────────┬────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
              [ Tab 1 (Leader Lock) ]    [ Tab 2 (Follower Tab) ]
                         │                         │
                         │    BroadcastChannel     │
                         ├─────────────────────────┤ (Đồng bộ trạng thái giữa các Tab)
                         │                         │
                         ▼                         ▼
              ┌────────────────────────────────────────┐
              │    Resilient Sync Manager (Worker)     │
              │  - Network State & Heartbeat Ping      │
              │  - Batching (Max 50 events / flush)    │
              │  - Exponential Backoff with Jitter     │
              └───────────────────┬────────────────────┘
                                  │
                                  │ (HTTPS POST /api/sync/batch)
                                  ▼
              ┌────────────────────────────────────────┐
              │       Supabase Serverless Edge         │
              │  - Idempotency Deduplication Cache     │
              │  - RBAC & Token Signature Guard        │
              │  - Atomic Multi-Entity DB Transaction  │
              └───────────────────┬────────────────────┘
                                  │
                                  ▼
              ┌────────────────────────────────────────┐
              │       Conflict Resolution Matrix       │
              │  - XP: Transactional Delta Increment   │
              │  - Streak: Server UTC Date Audit       │
              │  - Quiz: Immutable Snapshot Insertion  │
              │  - Mistakes: Last-Write / Delete Flag  │
              │  - Progress: Mathematical Set Union    │
              └───────────────────┬────────────────────┘
                                  │
                                  ▼
              ┌────────────────────────────────────────┐
              │  Supabase PostgreSQL 17 (Cloud State)  │
              └───────────────────┬────────────────────┘
                                  │
                                  │ (Sync Ack & Server Change Delta)
                                  ▼
              ┌────────────────────────────────────────┐
              │  Local Cache Invalidation & Synced (🟢)│
              └────────────────────────────────────────┘
```

### 5.3. Cấu trúc Lưu trữ Ngoại tuyến & Schema Sự kiện Đồng bộ (`lib/sync/sync-queue.js`)

Để đảm bảo hiệu năng và dung lượng lưu trữ lớn (hàng ngàn câu hỏi và phiên làm bài), hệ thống sử dụng **IndexedDB** làm lưu trữ chính (Primary Store) với fallback an toàn sang **LocalStorage** trong môi trường bị hạn chế sandbox:

```typescript
// Schema Sự kiện Đồng bộ Bất biến (Sync Event Schema v1.0)
interface SyncEvent {
  idempotency_key: string;       // UUIDv4 bất biến sinh tại client
  user_id: string;              // UUID học viên (hoặc 'guest_session')
  device_id: string;            // UUID duy nhất cho từng trình duyệt/thiết bị
  event_type:                   // Phân loại biến động dữ liệu
    | 'XP_EARNED' 
    | 'LESSON_COMPLETED' 
    | 'MISTAKE_RECORDED' 
    | 'MISTAKE_RESOLVED' 
    | 'QUIZ_SUBMITTED' 
    | 'VOCABULARY_SAVED' 
    | 'VOCABULARY_DELETED'
    | 'DIAGNOSTIC_COMPLETED';
  payload: Record<string, any>; // Dữ liệu ngữ cảnh chi tiết
  client_timestamp: number;     // Unix timestamp miligiây tại client
  retry_count: number;          // Số lần thử gửi thất bại
  last_error?: string;          // Nguyên nhân thất bại gần nhất
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'RESOLVED';
}
```

### 5.4. Phối hợp Đa Tab & Chống Trùng lặp Giao dịch (`lib/sync/sync-coordinator.js`)
Khi học viên mở nhiều tab cùng lúc trên một trình duyệt, nguy cơ race condition và spam yêu cầu mạng đồng thời lên máy chủ rất cao. Hệ thống triển khai bộ điều phối:
- **Web Locks API (`navigator.locks.request`):** Bầu chọn Tab Trưởng (Leader Tab) độc quyền sở hữu quyền kích hoạt đồng bộ mạng. Các tab còn lại đóng vai trò Follower.
- **BroadcastChannel (`'grammar_sync_channel'`):** Tab Trưởng truyền thông tin trạng thái hàng đợi và kết quả đồng bộ thành công sang các tab khác trong 2ms mà không cần truy vấn lại đĩa cứng.
- Fallback sử dụng `storage` event của `window.localStorage` cho các trình duyệt chưa hỗ trợ Web Locks.

### 5.5. Động cơ Đồng bộ Tự phục hồi & Giao thức Batch Flush (`lib/sync/sync-manager.js`)
- **Exponential Backoff with Full Jitter:** Khi gặp sự cố mạng (HTTP 502/503/504 hoặc Network Timeout), thời gian chờ tái thử nghiệm tuân theo công thức:
  $$T_{backoff} = \min\left(T_{max}, T_{base} \times 2^{retry}\right) \times \text{random}(0.5, 1.5)$$
  *(Với $T_{base} = 1000\text{ms}$, $T_{max} = 30000\text{ms}$)*.
- **Micro-Batching:** Gom tối đa 50 sự kiện đang chờ (`status: 'PENDING'`) vào một mẻ (payload chunk) duy nhất gửi qua API, giảm 98% chi phí kết nối HTTP handshake.
- **Network Liveness Detection:** Kết hợp `window.addEventListener('online')`, `navigator.onLine` và cơ chế Heartbeat Ping định kỳ 60s tới endpoint siêu nhẹ `/api/health` để xác thực đường truyền internet thực tế (tránh captive portal hoặc mạng wifi ảo).

### 5.6. Ma trận Chiến lược Giải quyết Xung đột Dữ liệu (Conflict Resolution Matrix)

| Thực thể dữ liệu | Chiến lược xử lý | Quy tắc giải quyết xung đột (Conflict Resolution Protocol) |
| :--- | :--- | :--- |
| **Điểm kinh nghiệm (XP)** | **Transactional Delta Accumulation** | Client chỉ gửi độ tăng $\Delta_{xp}$. Server thực hiện phép toán nguyên tử: `UPDATE profiles SET xp = xp + $delta, level = calculate_level(xp + $delta)`. Không bao giờ ghi đè con số tổng tuyệt đối. |
| **Chuỗi học tập (Streak)** | **Server-side Temporal Audit** | Server thẩm định đối chiếu `last_activity_date` máy chủ với UTC ngày hiện tại. Nếu khoảng cách là 1 ngày: `streak += 1`. Nếu trùng ngày: giữ nguyên. Nếu gián đoạn > 48h: reset về 1. |
| **Phiên thi & Quiz** | **Immutable Snapshot Append** | Mỗi bài thi mang UUID riêng và là thực thể bất biến. Server chỉ thực hiện `INSERT`, không bao giờ `UPDATE` phiên thi cũ. Lưu snapshot danh sách câu hỏi tại thời điểm làm bài. |
| **Sổ tay câu sai (Mistakes)** | **Composite Key Upsert & Soft-Delete** | Khóa duy nhất `(user_id, question_id)`. Nếu làm sai lại khi offline: `review_count += 1`, `last_failed_at = MAX(server, client)`. Nếu ôn đúng: `is_mastered = true`. Trạng thái sửa/xóa có độ ưu tiên thời gian (`updated_at`). |
| **Tiến trình bài học** | **Mathematical Set Union ($S_{srv} \cup S_{cli}$)** | Hợp tập hợp tất cả bài học đã hoàn thành giữa local và cloud. Học viên không bao giờ bị mất bài học đã hoàn thành dù học xen kẽ trên điện thoại và laptop. |
| **Từ vựng đã lưu (Bookmarks)** | **Tombstone Precedence** | Áp dụng cờ xóa ảo (`deleted_at`). Bản ghi có `deleted_at > updated_at` luôn được xem là đã xóa, triệt tiêu hiện tượng từ vựng bị "hồi sinh" sau khi đồng bộ. |

### 5.7. Giao thức API Serverless Phục vụ Đồng bộ (`pages/api/sync/*`)
1. `POST /api/sync/batch`: Nhận danh sách mẻ sự kiện, xác thực token phiên, thực thi transaction PostgreSQL trên Supabase, trả về danh sách các sự kiện được chấp nhận và danh sách ID bị từ chối/xung đột.
2. `GET /api/sync/pull`: Tiếp nhận con trỏ thời gian `since_timestamp` của thiết bị, trả về toàn bộ thay đổi dữ liệu phát sinh từ các thiết bị khác sau mốc đó.
3. `GET /api/sync/status`: Cung cấp đồng hồ chuẩn máy chủ (Server Clock UTC) để client tính toán độ lệch đồng hồ (Clock Skew Offset).

### 5.8. Giao diện Chỉ báo Trạng thái Đồng bộ UI (`components/sync/SyncStatusIndicator.jsx`)
Được nhúng trực tiếp trên Navbar và chân trang, phản hồi 5 trạng thái trực quan:
- 🟢 **Cloud Synced:** Thiết bị khớp hoàn toàn với máy chủ. Tooltip: *"Dữ liệu học tập đã được sao lưu an toàn trên Cloud."*
- 🟡 **Syncing...:** Hiển thị icon xoay mượt mà khi đang truyền dữ liệu mẻ.
- 🟠 **Pending Changes ($N$ items):** Hiển thị số lượng sự kiện đang xếp hàng chờ đồng bộ.
- 🔴 **Sync Error:** Cảnh báo khi thử lại quá số lần quy định; cung cấp nút bấm *"Thử lại ngay"* thủ công.
- ⚪ **Offline Mode:** Huy hiệu biểu tượng đám mây gạch chéo thông báo ứng dụng đang vận hành hoàn toàn độc lập ngoại tuyến.

### 5.9. Chiến lược Service Worker & Caching Ngoại tuyến
- Cấu hình Workbox precaching toàn bộ tài sản tĩnh (HTML shell, CSS, Fonts, Icons).
- Cache-First cho toàn bộ dữ liệu 12 chuyên đề ngữ pháp, 53 bài học lý thuyết (`/data/grammar-lessons/*`).
- Network-First với Fallback sang Cache cho ngân hàng 2,939 câu hỏi luyện tập.

### 5.10. Giám sát, Đo lường & Telemetry
- Client ghi nhận các chỉ số hiệu năng vào bảng cục bộ: Tỷ lệ đồng bộ thành công (% success), Thời gian hoàn tất mẻ đồng bộ P95 (< 600ms), Tỷ lệ giải quyết xung đột dữ liệu.

---

## 🛡️ 5.5. ENTERPRISE ADMIN DASHBOARD, RBAC GOVERNANCE & IMMUTABLE AUDIT TRAIL (MILESTONE 2.4)

> **Sứ mệnh cốt lõi:** Thiết lập hệ thống Quản trị & Giám sát Tập trung (Centralized Administrative & Governance System) đáp ứng tiêu chuẩn Enterprise dành cho Giảng viên, Chuyên gia Sư phạm và Quản trị viên Nền tảng. Hệ thống cung cấp khả năng kiểm soát vai trò chặt chẽ (RBAC), điều phối chính sách hạn mức hệ thống động (Dynamic Quota Policies), bảo vệ dữ liệu học viên và lưu vết toàn bộ thay đổi thông qua Nhật ký Kiểm toán Bất biến (Immutable Append-Only Audit Trail) chống giả mạo.

### 5.5.1. Sứ mệnh Quản trị & Kiến trúc Kiểm soát Tập trung
Bảng điều khiển quản trị viên được phân ly kiến trúc hoàn toàn với giao diện học viên:
- **Zero-Trust Access:** Mọi thao tác truy vấn và biến đổi dữ liệu trên giao diện Admin đều phải đi qua Server-side Authorization Middleware (`lib/admin/admin-guard.js`), kiểm tra chữ ký JWT phiên làm việc và đối chiếu quyền trong bảng `public.profiles`.
- **Defense in Depth:** Kết hợp bảo vệ 3 lớp: UI Route Guards -> Next.js API Middleware -> Supabase Row-Level Security (RLS) Policies.

### 5.5.2. Bảng Điều khiển Vận hành Hệ thống (`components/admin/AdminOverview.jsx`)
Cung cấp góc nhìn thời gian thực về sức khỏe và chỉ số vận hành nền tảng:
- **Chỉ số Người dùng:** Tổng số tài khoản, Học viên tích cực hôm nay (DAU), Học viên tích cực tuần này (WAU), Tỷ lệ chuyển đổi VIP ⭐.
- **Chỉ số Học tập:** Số bài học lý thuyết đã hoàn thành trong 24h, Số lượt thi Quiz 50 câu, Tỷ lệ trả lời chính xác trung bình toàn hệ thống.
- **Chỉ số Đồng bộ & Kỹ thuật:** Số lượng sự kiện đồng bộ ngoại tuyến được xử lý/phút, Tỷ lệ lỗi API (4xx/5xx), Độ trễ phản hồi trung bình (P95 Response Time).
- **Trạng thái Dịch vụ:** Supabase Database Connection Pool, Audio CDN Health, Vercel Edge Cache Hit Ratio.

### 5.5.3. Ma trận Phân quyền RBAC & Quản trị Học viên (`components/admin/UserManagementTable.jsx`)

#### A. Ma trận Quyền hạn Chi tiết (RBAC Permissions Matrix)

| Danh mục Quyền | FREE (Học viên Miễn phí) | VIP (Học viên Cao cấp) | ADMIN (Quản trị viên) |
| :--- | :---: | :---: | :---: |
| Học lý thuyết 12 Chuyên đề & 53 Bài học | ✅ Đầy đủ | ✅ Đầy đủ | ✅ Đầy đủ |
| Luyện tập bài tập trắc nghiệm | ⚠️ 10 câu đầu/chương | ✅ Toàn bộ 2,939 câu | ✅ Toàn bộ 2,939 câu |
| Thi thử Quiz 50 câu chuẩn THPT | ⚠️ Tối đa 2 đề/ngày | ✅ Không giới hạn | ✅ Không giới hạn |
| Lời giải Sư phạm Chuẩn hóa (JSON Schema) | ⚠️ Bản cơ bản (Beginner) | ✅ Đầy đủ 4 Cấp độ | ✅ Đầy đủ 4 Cấp độ |
| Phát âm Audio Engine bản xứ (US/UK) | ❌ Không hỗ trợ | ✅ Không giới hạn | ✅ Không giới hạn |
| Chẩn đoán Năng lực & Lộ trình Cá nhân hóa | ⚠️ 1 lần/tháng | ✅ Định kỳ linh hoạt | ✅ Không giới hạn |
| Đồng bộ Đa thiết bị (Offline Sync Engine) | ✅ Tiêu chuẩn | ✅ Ưu tiên cao | ✅ Không giới hạn |
| Quản lý Người dùng & Đổi vai trò | ❌ Bị chặn | ❌ Bị chặn | ✅ Quyền tối cao |
| Cấu hình Chính sách Hạn mức Hệ thống | ❌ Bị chặn | ❌ Bị chặn | ✅ Toàn quyền |
| Truy cập Nhật ký Kiểm toán (Audit Logs) | ❌ Bị chặn | ❌ Bị chặn | ✅ Read-only Toàn quyền |

#### B. Thao tác Quản trị Học viên Tập trung
- **Nâng cấp / Hạ cấp Vai trò 1-Chạm:** Chuyển đổi trạng thái `FREE` $\leftrightarrow$ `VIP` $\leftrightarrow$ `ADMIN` với xác thực phân quyền máy chủ.
- **Quản lý Trạng thái Tài khoản:** Khóa tài khoản vi phạm quy định (`BANNED`) hoặc kích hoạt lại (`ACTIVE`). Khi bị khóa, toàn bộ API của học viên lập tức bị chặn qua middleware.
- **Bộ lọc & Tìm kiếm Tức thì:** Tìm kiếm theo Email, Họ tên, UUID; lọc theo Vai trò, Trạng thái hoạt động, Mốc ngày tạo và Chuỗi Streak.
- **Xuất Dữ liệu (Bulk Export):** Trích xuất danh sách học viên định dạng CSV/JSON phục vụ báo cáo sư phạm.

### 5.5.4. Quản lý Hạn mức Động & Chính sách Hệ thống (`components/admin/PolicyManagementModal.jsx`)
Thay vì hardcode hạn mức trong mã nguồn, hệ thống cho phép Admin cấu hình động các thông số trong bảng `public.system_policies`:
- `free_questions_per_chapter`: Số câu bài tập tối đa người dùng Free được làm mỗi chương (Mặc định: 10).
- `free_daily_quiz_limit`: Số lượt làm Quiz 50 câu mỗi ngày cho người dùng Free (Mặc định: 2).
- `diagnostic_cooldown_days`: Khoảng thời gian giãn cách giữa 2 lần làm bài chẩn đoán năng lực (Mặc định: 7 ngày).
- `offline_sync_max_batch`: Kích thước mẻ đồng bộ tối đa (Mặc định: 50 sự kiện/mẻ).
- Cơ chế Semantic Versioning: Mọi thay đổi chính sách được lưu phiên bản mới kèm ghi chú lý do và người phê duyệt; client nhận tín hiệu invalidate cache sau 60 giây.

### 5.5.5. Nhật ký Kiểm toán Bất biến (Immutable Audit Trail - `public.audit_logs`)
Mọi hành vi có tính biến đổi cấu hình, can thiệp tài khoản hoặc thay đổi vai trò đều bắt buộc ghi vào bảng `public.audit_logs`:
- **Cấu trúc Bản ghi Kiểm toán:**
  - `id`: UUID khóa chính.
  - `actor_id`: UUID của Quản trị viên thực hiện hành động.
  - `actor_email`: Email định danh người thao tác.
  - `action_type`: `ROLE_CHANGE` | `USER_BAN` | `USER_UNBAN` | `POLICY_UPDATE` | `CONTENT_APPROVAL` | `EXPLANATION_EDIT`.
  - `target_resource`: Bảng hoặc thực thể bị tác động (`profiles`, `system_policies`, `explanations`).
  - `target_id`: Định danh bản ghi đích.
  - `old_value`: JSON snapshot trạng thái trước khi thay đổi.
  - `new_value`: JSON snapshot trạng thái sau khi thay đổi.
  - `ip_address`: Địa chỉ IP của client thực hiện.
  - `user_agent`: Thông tin trình duyệt/thiết bị thao tác.
  - `created_at`: Dấu thời gian chuẩn UTC.
- **Bảo vệ Bất biến Cấp Cơ sở Dữ liệu:** Thiết lập PostgreSQL Trigger chặn hoàn toàn lệnh `UPDATE` hoặc `DELETE` trên bảng `public.audit_logs`. Ngay cả tài khoản Quản trị viên cao cấp nhất cũng không thể sửa đổi hoặc xóa dấu vết nhật ký.

### 5.5.6. Bảo vệ Thao tác Nhạy cảm, Rate Limiting & Xác thực Hai bước
- **Step-up Confirmation Dialog:** Đối với các thao tác rủi ro cao (Khóa vĩnh viễn tài khoản, Chỉ định quyền ADMIN mới, Điều chỉnh hạn mức cốt lõi), hệ thống yêu cầu Quản trị viên nhập chuỗi xác nhận cụ thể (ví dụ: gõ chữ `"CONFIRM_ACTION"`) trước khi kích hoạt.
- **Rate Limiting nghiêm ngặt:** Áp dụng giới hạn tối đa 30 yêu cầu thao tác nhạy cảm/phút/IP để ngăn chặn tấn công vét cạn hoặc tự động hóa trái phép.

### 5.5.7. Bộ API Quản trị Serverless (`pages/api/admin/*`)
1. `GET /api/admin/overview`: Trả về dữ liệu KPI tổng quan hệ thống, trạng thái dịch vụ và cảnh báo bất thường.
2. `GET /api/admin/users`: Truy vấn danh sách học viên có phân trang, tìm kiếm và lọc đa tiêu chí.
3. `PATCH /api/admin/users/[userId]`: Cập nhật vai trò (`role`) hoặc trạng thái (`status`), tự động ghi nhận bản ghi audit log trong cùng một transaction.
4. `GET & PUT /api/admin/policy`: Truy xuất cấu hình hạn mức hiện hành và cập nhật chính sách mới.
5. `GET /api/admin/audit-logs`: Truy vấn danh mục nhật ký kiểm toán có phân trang, lọc theo người thực hiện và loại hành động.

### 5.5.8. Tối ưu Hiệu năng Truy vấn & Chỉ mục Quản trị
- Tạo Composite Indexes trên `profiles(role, created_at DESC)` và `audit_logs(created_at DESC, action_type)`.
- Áp dụng Server-side Caching (S-MaxAge: 30s, Stale-While-Revalidate: 60s) cho endpoint thống kê `/api/admin/overview`.

---

## 🧠 6. STRUCTURED PEDAGOGICAL INTELLIGENCE, KNOWLEDGE GRAPH & PERSONALIZED REMEDIAL LEARNING (MILESTONE 2.5)

> **Sứ mệnh cốt lõi:** Chuyển hóa toàn bộ hệ thống giải thích ngữ pháp từ dạng văn bản tự do (unstructured text) sang **Động cơ Trí tuệ Sư phạm Cấu trúc (Structured Pedagogical Intelligence Engine)** chuẩn hóa JSON. Hệ thống tích hợp Đồ thị Tri thức Ngữ pháp (Grammar Knowledge Graph), Phân cấp độ sâu sư phạm thích ứng 4 cấp độ học lực, Hệ thống phản hồi đánh giá chất lượng từ học viên, Phân loại 11 nhóm lỗi sai chuẩn xác và Động cơ Đề xuất Bài học Bù đắp Tự động (Deterministic Remedial Recommendation Engine) kết hợp Lặp lại Ngắt quãng (Spaced Repetition).

### 6.1. Sứ mệnh Sư phạm & Kiến trúc Trí tuệ Giáo dục
Trong học tập ngôn ngữ, lời giải không chỉ để thông báo đáp án đúng/sai, mà là công cụ giảng dạy trực tiếp tại khoảnh khắc học viên vấp ngã (teachable moment). Hệ thống giải thích cấu trúc giải quyết 3 bài toán:
1. Chuẩn hóa tính chính xác và nhất quán sư phạm cho toàn bộ 2,939 câu hỏi dựa trên nguyên tác *Ngữ pháp tiếng Anh - Mai Lan Hương & Hà Thanh Uyên*.
2. Cá nhân hóa chiều sâu lý giải phù hợp với trình độ người học (từ mới bắt đầu đến nâng cao).
3. Tự động chẩn đoán lỗ hổng kiến thức căn nguyên và dẫn hướng học viên bù đắp kiến thức ngay lập tức.

### 6.2. Chuẩn Hóa Schema Lời Giải Sư Phạm 5 Trường (JSON Schema v1.0)
Mọi câu hỏi trong nền tảng đều được chuẩn hóa thành cấu trúc JSON nghiêm ngặt gồm 5 trường sư phạm cốt lõi:

```json
{
  "$schema": "https://grammar-platform.com/schemas/explanation.v1.json",
  "version": "1.0",
  "question_id": "ch1_ex1_q05",
  "topic": "TENSES",
  "signal": {
    "title": "Dấu hiệu nhận biết",
    "keywords": ["for 5 years", "since 2018", "so far"],
    "grammar_clues": [
      "Xuất hiện cụm giới từ chỉ khoảng thời gian 'for + khoảng thời gian'.",
      "Ngữ cảnh hành động bắt đầu trong quá khứ và vẫn tiếp diễn ở hiện tại."
    ],
    "identified_pattern": "S + [verb] + for + duration"
  },
  "rule": {
    "title": "Quy tắc ngữ pháp",
    "topic_name": "Thì Hiện tại hoàn thành (Present Perfect Tense)",
    "formula": "S + have/has + V3/V-ed",
    "explanation": "Diễn tả hành động xảy ra trong quá khứ và vẫn đang kéo dài đến hiện tại hoặc để lại kết quả ở hiện tại.",
    "conditions": ["Chủ ngữ số nhiều / I / You / We / They đi với 'have'", "Chủ ngữ số ít đi với 'has'"],
    "exceptions": ["Không dùng thì tiếp diễn với các Stative Verbs như know, believe, like..."]
  },
  "translation": {
    "title": "Dịch nghĩa sư phạm",
    "vietnamese": "Họ đã sống ở thành phố này được 5 năm.",
    "english": "They have lived in this city for 5 years.",
    "highlight_segment": "đã sống... được 5 năm",
    "literal_meaning": "Hành động sinh sống bắt đầu từ 5 năm trước và hiện vẫn đang sống ở đây."
  },
  "common_mistakes": [
    {
      "trap_option": "lived",
      "error_type": "TENSE_CONFUSION",
      "why_incorrect": "Dùng thì Quá khứ đơn (Past Simple) là sai vì hành động chưa chấm dứt hoàn toàn trong quá khứ mà vẫn tiếp diễn ở hiện tại.",
      "confusion_point": "Nhầm lẫn giữa hành động trong quá khứ có mốc thời gian chấm dứt và hành động kéo dài đến hiện tại."
    },
    {
      "trap_option": "are living",
      "error_type": "TENSE_CONFUSION",
      "why_incorrect": "Thì Hiện tại tiếp diễn chỉ hành động đang diễn ra ngay lúc nói, không dùng kèm 'for + khoảng thời gian' để chỉ độ dài tích lũy.",
      "confusion_point": "Thấy hành động đang diễn ra nên vội vàng chọn Hiện tại tiếp diễn."
    }
  ],
  "exam_tips": [
    {
      "type": "QUICK_RULE",
      "tip": "Gặp 'since + mốc thời gian' hoặc 'for + khoảng thời gian' -> 90% ưu tiên chọn thì Hiện tại hoàn thành (have/has + V3/ed)."
    },
    {
      "type": "ELIMINATION_STRATEGY",
      "tip": "Loại ngay các phương án chia thì Quá khứ đơn (V2/ed) nếu trong câu không có mốc thời gian chấm dứt như 'yesterday', 'ago', 'in 2010'."
    }
  ],
  "metadata": {
    "difficulty_tier": "INTERMEDIATE",
    "prerequisite_concepts": ["concept_present_simple", "concept_past_simple"],
    "target_chapter": 1,
    "target_lesson": 3
  }
}
```

### 6.3. Động cơ Phân cấp 4 Cấp độ Học lực Thích ứng (Level-Aware Adaptation Engine)
Hàm thích ứng sư phạm phi hủy diệt (`lib/explanation/adaptive-explanation.js`) tự động điều chỉnh độ sâu phân tích theo trình độ học viên:
- **Cấp độ 1 - BEGINNER (Mới bắt đầu):**
  - Tối giản thuật ngữ ngôn ngữ học.
  - Nêu bật ngay từ khóa nhận diện (`keywords`) và công thức cứu cánh ngắn gọn.
  - Cung cấp dịch nghĩa thô từng từ để người học không bị rào cản từ vựng cản trở việc hiểu ngữ pháp.
- **Cấp độ 2 - ELEMENTARY (Sơ cấp):**
  - Trình bày công thức hoàn chỉnh kèm các bước áp dụng từng bước ($Step-by-Step$).
  - Phân tích bẫy thường gặp nhất trong danh mục `common_mistakes`.
- **Cấp độ 3 - INTERMEDIATE (Trung cấp):**
  - Phân tích toàn diện cấu trúc câu, chỉ báo ngữ cảnh thì và lý giải cặn kẽ tại sao tất cả các phương án gây nhiễu đều sai.
  - Bổ sung mẹo thi THPT Quốc gia / TOEIC từ `exam_tips`.
- **Cấp độ 4 - ADVANCED (Nâng cao):**
  - Mở rộng các trường hợp ngoại lệ (Edge Cases), sắc thái văn phong (Formal vs Informal), cấu trúc đảo ngữ hoặc biến thể văn chương tương đương.
  - Chiến lược loại trừ thần tốc giúp tiết kiệm thời gian tối đa trong phòng thi.

### 6.4. Vòng lặp Phản hồi Chất lượng Sư phạm & Báo cáo Lỗi 6 Danh mục
Tích hợp trực tiếp dưới chân mỗi thẻ giải thích (`StructuredExplanation.jsx`):
- **Đánh giá Hữu ích (Helpful Rating):** Nút "👍 Lời giải dễ hiểu" cho phép học viên bình chọn; cập nhật realtime tỷ lệ hài lòng của bài tập.
- **Modal Báo cáo Lỗi Chuẩn hóa (Pedagogical Error Reporting):** Cung cấp 6 danh mục phản ánh chuyên sâu:
  1. `incorrect_grammar_rule`: Sai quy tắc hoặc công thức ngữ pháp.
  2. `incorrect_translation`: Bản dịch tiếng Việt chưa chuẩn hoặc thiếu tự nhiên.
  3. `confusing_explanation`: Lời giải tối nghĩa, khó hiểu đối với học viên.
  4. `missing_information`: Thiếu giải thích nguyên nhân các phương án khác bị sai.
  5. `incorrect_exam_tip`: Mẹo làm bài chưa chính xác hoặc không áp dụng được.
  6. `other`: Góp ý nội dung khác kèm khung nhập văn bản chi tiết.
- **Bảo vệ Chống Spam:** Ràng buộc dữ liệu duy nhất `UNIQUE(user_id, question_id, explanation_version)` ngăn chặn gửi lặp lại nhiều lần.

### 6.5. Phân loại Lỗi Ngữ pháp Chuẩn hóa 11 Nhóm & Tính Điểm Tin cậy
Mô-đun `lib/explanation/error-taxonomy.js` phân loại chính xác bản chất sai sót của học viên vào 11 danh mục chuẩn quốc tế:

```typescript
export const GRAMMAR_ERROR_TAXONOMY = {
  TENSE_CONFUSION: 'Nhầm lẫn giữa các thì trong tiếng Anh',
  SUBJECT_VERB_AGREEMENT: 'Không hòa hợp giữa Chủ ngữ và Động từ',
  WORD_FORM: 'Nhầm lẫn dạng từ (Danh từ, Động từ, Tính từ, Trạng từ)',
  PREPOSITION_ERROR: 'Dùng sai giới từ chỉ thời gian, nơi chốn hoặc đi kèm',
  ARTICLE_ERROR: 'Sử dụng sai mạo từ (a, an, the hoặc không dùng mạo từ)',
  CONDITIONAL_ERROR: 'Sai cấu trúc câu điều kiện hoặc mệnh đề ước muốn',
  PASSIVE_VOICE_ERROR: 'Sai dạng bị động của động từ hoặc tân ngữ',
  REPORTED_SPEECH_ERROR: 'Sai quy tắc lùi thì, đổi đại từ hoặc trạng từ khi tường thuật',
  VOCABULARY_ERROR: 'Chọn sai từ vựng hoặc cặp từ dễ gây nhầm lẫn',
  CONTEXT_MISUNDERSTANDING: 'Hiểu sai ngữ cảnh hoặc đại từ quan hệ',
  UNKNOWN_ERROR: 'Sai sót chưa phân loại'
} as const;
```

Bộ phân loại kết hợp Heuristic đối chiếu phương án học viên chọn với bảng phân tích bẫy `trap_options`, tính toán **Độ tin cậy Chẩn đoán (Confidence Score)** từ `0.85` đến `0.99`.

### 6.6. Bản đồ Đồ thị Tri thức Ngữ pháp (Grammar Knowledge Graph & Prerequisite DAG)
Xây dựng đồ thị có hướng không chu trình (Directed Acyclic Graph - DAG) kết nối toàn bộ hệ thống tri thức sách Mai Lan Hương:
- **Cấu trúc Nút (Nodes):** 12 Chuyên đề $\rightarrow$ 53 Bài học $\rightarrow$ 376 Mục sư phạm $\rightarrow$ 215 Quy tắc $\rightarrow$ 82 Công thức $\rightarrow$ 2,939 Câu hỏi.
- **Cạnh Phụ thuộc (Prerequisite Edges):**
  - Ví dụ: `Thì Hiện tại hoàn thành (Ch1_L3)` có quan hệ phụ thuộc tiên quyết vào `Thì Hiện tại đơn (Ch1_L1)` và `Thì Quá khứ đơn (Ch1_L2)`.
  - `Câu Bị động (Ch8)` có phụ thuộc tiên quyết vào toàn bộ `12 Thì tiếng Anh (Ch1)`.
  - `Câu Tường thuật (Ch9)` phụ thuộc vào `Quy tắc Lùi thì (Ch1)` và `Đại từ nhân xưng (Ch4)`.

### 6.7. Động cơ Đề xuất Bài học Bù đắp Tự động (Deterministic Remedial Recommendation Engine)
Khi học viên trả lời sai một câu hỏi trong bài luyện tập hoặc đề thi Quiz 50 câu:
1. Động cơ phân tích câu sai, xác định mã lỗi và khái niệm bị khuyết (`knowledge_gap`).
2. Tra cứu Đồ thị Tri thức để tìm bài học gốc có độ ưu tiên cao nhất cần bồi dưỡng trong 53 bài học.
3. Xuất thẻ kiến nghị sư phạm trực quan (`components/explanation/RemedialRecommendationCard.jsx`):
   - Nêu rõ nguyên nhân chọn sai và phân tích cặn kẽ lỗ hổng kiến thức.
   - Hiển thị nút hành động 1-chạm: `"📖 Bổ sung kiến thức: [Tên Bài Học]"`, nhấp vào sẽ điều hướng thẳng tới đúng vị trí bài học lý thuyết tương ứng.

### 6.8. Theo dõi Mức độ Thành thạo & Thuật toán Lặp lại Ngắt quãng (Spaced Repetition)
- **Công thức Đo lường Mức độ Thành thạo (Mastery Score Formula):**
  $$\text{Mastery}(C) = \min\left(100, \max\left(0, (\text{Correct} \times 10) - (\text{Wrong} \times 15) + \text{StreakBonus}\right)\right)$$
- **Lịch Ôn tập Ngắt quãng (Spaced Repetition Schedule):** Áp dụng thuật toán Leitner biến thể kết hợp đường cong quên lãng Ebbinghaus:
  - Lần 1: Ôn sau **1 ngày** kể từ khi làm sai.
  - Lần 2: Ôn sau **3 ngày** nếu làm đúng lần 1.
  - Lần 3: Ôn sau **7 ngày**.
  - Lần 4: Ôn sau **14 ngày**.
  - Lần 5: Ôn sau **30 ngày** (Đạt trạng thái *Làm chủ Hoàn toàn - Fully Mastered*).
- **Suy hao Tri thức (Knowledge Decay):** Nếu quá hạn ôn tập 14 ngày mà học viên không thực hiện bài ôn tập, điểm thành thạo của khái niệm tự động giảm 5%/tuần.

### 6.9. Thiết kế Cơ sở Dữ liệu Supabase PostgreSQL 17 (9 Bảng Chuyên dụng)
1. `public.explanations`: Lưu trữ nội dung JSON 5 trường, phiên bản hóa và trạng thái phê duyệt.
2. `public.explanation_feedback`: Lưu trữ đánh giá hữu ích và báo cáo sai sót từ người dùng.
3. `public.concepts`: Bảng danh mục các khái niệm ngữ pháp nguyên tử trong 12 chuyên đề.
4. `public.concept_dependencies`: Lưu trữ các cạnh phụ thuộc tiên quyết trong Knowledge Graph (DAG).
5. `public.question_concepts`: Bản đồ liên kết từng câu hỏi với các khái niệm liên quan và trọng số.
6. `public.user_concept_progress`: Theo dõi điểm thành thạo (`mastery_score`), số lần đúng/sai theo từng học viên.
7. `public.remedial_recommendations`: Nhật ký các khuyến nghị học tập bù đắp được tạo tự động.
8. `public.spaced_repetition_queue`: Hàng đợi các câu hỏi cần ôn tập ngắt quãng theo từng ngày.
9. `public.error_taxonomy_registry`: Bảng tra cứu danh mục phân loại lỗi ngữ pháp chuẩn hóa.

### 6.10. Bộ API Phục vụ Học tập & Sư phạm (`/api/questions/*`, `/api/learning/*`)
1. `GET /api/questions/[questionId]/explanation?level=...`: Trả về lời giải cấu trúc 5 trường thích ứng theo trình độ học viên (`BEGINNER` $\rightarrow$ `ADVANCED`).
2. `POST /api/explanation-feedback`: Tiếp nhận phản hồi đánh giá và báo cáo sai sót từ học viên.
3. `POST & GET /api/learning/remedial-recommendations`: Tạo mới và truy vấn danh sách bài học cần bồi dưỡng.
4. `GET /api/learning/mastery`: Truy xuất bản đồ năng lực thành thạo các chuyên đề của học viên.
5. `GET /api/admin/explanations/feedback-summary`: Endpoint tổng hợp báo cáo phản ánh chất lượng sư phạm cho Giảng viên/Quản trị viên.

---

## 🔗 6.2. CROSS-MILESTONE INTEGRATION, ARCHITECTURAL FLOW & SHARED INFRASTRUCTURE (MILESTONES 2.3 - 2.5)

> **Mô tả tích hợp:** Ba cột mốc 2.3, 2.4 và 2.5 không vận hành độc lập mà tạo thành một tam giác kiến trúc khép kín: **Hạ tầng Ngoại tuyến (2.3) $\rightarrow$ Động cơ Sư phạm Thông minh (2.5) $\rightarrow$ Quản trị & Kiểm soát Tập trung (2.4)**.

### 1. Luồng Dữ liệu Xuyên suốt Toàn diện (Unified Cross-Milestone Data Flow)

```text
[ Học viên làm bài khi Offline ]
               │
               ▼
  [ 2.3 IndexedDB Event Queue ] 
               │
               ▼ (Thiết bị có kết nối lại)
  [ 2.3 Resilient Sync Manager ] ──(HTTPS Batch Sync)──► [ Supabase Serverless Engine ]
                                                                     │
                                    ┌────────────────────────────────┴────────────────────────────────┐
                                    ▼                                                                 ▼
               [ 2.5 Pedagogical Intelligence Engine ]                                  [ 2.4 Admin Audit Logging ]
                                    │                                                                 │
                 - Tính toán phân loại lỗi 11 nhóm                                       - Ghi nhận biến động mẻ đồng bộ
                 - Cập nhật Điểm Thành thạo (Mastery)                                    - Cảnh báo bất thường nếu có
                 - Kích hoạt Đề xuất Học bù đắp (Remedial)                               - Lưu vết trạng thái tài khoản
                                    │                                                                 │
                                    ▼                                                                 ▼
                     [ 2.5 Remedial & Spaced Repetition ]                             [ 2.4 Admin Overview Monitoring ]
```

### 2. Cấu trúc Thư viện Dùng chung (Shared Library Modules)
- `lib/sync/`: Bộ điều phối ngoại tuyến (`sync-queue.js`, `sync-manager.js`, `sync-coordinator.js`).
- `lib/explanation/`: Chuẩn hóa sư phạm (`explanation.schema.js`, `adaptive-explanation.js`, `error-taxonomy.js`, `remedial-engine.js`).
- `lib/knowledge/`: Bản đồ tri thức ngữ pháp (`knowledge-graph.js`, `spaced-repetition.js`).
- `lib/admin/`: Tiện ích quản trị và kiểm soát bảo mật (`admin-guard.js`, `audit-logger.js`, `policy-service.js`).

### 3. Yêu cầu Phi Chức năng (Non-Functional Requirements & Performance SLAs)
- **Độ trễ API (Latency):** Thời gian phản hồi P95 < 500ms cho toàn bộ các endpoint đồng bộ, quản trị và sư phạm dưới tải 500 người dùng đồng thời.
- **Bảo toàn Dữ liệu (Data Integrity):** Tỷ lệ mất mát dữ liệu do ngắt kết nối đột ngột hoặc xung đột đa thiết bị bằng 0.00%.
- **Khả năng Tiếp cận (Accessibility):** 100% các thành phần UI mới (Chỉ báo đồng bộ, Thẻ khuyến nghị học bù đắp, Bảng điều khiển quản trị) tuân thủ tiêu chuẩn WCAG 2.2 AA.
- **Bảo vệ Bảo mật (Security):** 100% các bảng Supabase mới đều được áp dụng Row-Level Security (RLS) nghiêm ngặt; mọi endpoint nhạy cảm đều có middleware xác thực chữ ký phiên.

### 4. Trình tự Triển khai 5 Giai đoạn & Tiêu chuẩn Nghiệm thu Toàn diện (Phased Quality Gates)
1. **Giai đoạn 1 (Database & Schemas):** Triển khai schema 9 bảng PostgreSQL 17 trên Supabase, thiết lập RLS và triggers bảo vệ.
2. **Giai đoạn 2 (Core Engines & Resolvers):** Hoàn thiện Sync Queue, Conflict Resolvers, Error Taxonomy Classifier và Knowledge Graph DAG.
3. **Giai đoạn 3 (Serverless API Suite):** Xây dựng các route `/api/sync/*`, `/api/admin/*` và `/api/learning/*` kèm middleware kiểm soát.
4. **Giai đoạn 4 (UI Integration & Interactive Components):** Tích hợp `SyncStatusIndicator`, `RemedialRecommendationCard` và `AdminOverview` vào layout ứng dụng.
5. **Giai đoạn 5 (End-to-End Verification & Verification Gate):** Kiểm thử mô phỏng mất mạng, kiểm thử xung đột đa tab, rà soát hiệu năng và đẩy code lên production Vercel.

---

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

### 🔹 Milestone 2.3: Resilient Offline-First Architecture & Multi-Device Sync (P0)

> **Mục tiêu:** Xây dựng hệ thống Offline-First cấp công nghiệp, bảo toàn 100% dữ liệu học tập khi mất mạng, tự động phục hồi và hội tụ nhất quán trên đa thiết bị với cơ chế chống trùng lặp giao dịch và giải quyết xung đột nghiệp vụ chuyên sâu.

#### 1. Các thành phần Cốt lõi Đã Triển khai & Hoạt động trên Production:
- [x] **2.3.1 Local Storage & Offline Write Queue Cơ Bản (`lib/sync/sync-queue.js`):**
  * Hàng đợi lưu trữ sự kiện ngoại tuyến sử dụng LocalStorage với fallback an toàn.
  * Định danh duy nhất cho từng hành động với UUID tạm thời và cờ trạng thái `is_pending: true`.
- [x] **2.3.2 Bộ Điều Phối Lắng Nghe Mạng (`lib/sync/sync-manager.js`):**
  * Lắng nghe sự kiện `window.addEventListener('online')` và `window.addEventListener('offline')`.
  * Cơ chế tự động giải phóng hàng đợi theo mẻ (batch flush) khi thiết bị phục hồi kết nối.
  * Exponential Backoff tự động thử lại khi gặp sự cố mạng hoặc máy chủ phản hồi chậm.
- [x] **2.3.3 Quy Tắc Xử Lý Xung Đột Dữ Liệu Ban Đầu:**
  * XP & Điểm số: Tính toán độ tăng `delta` để cộng dồn nguyên tử phía server.
  * Chuỗi học tập: Máy chủ thẩm định dựa trên mốc ngày UTC.
  * Sổ tay câu sai & Từ vựng: Cơ chế Last-Write-Wins.
  * Tiến độ bài học: Phép hợp tập hợp (Set Union).
- [x] **2.3.4 Huy Hiệu Trạng Thái Đồng Bộ Trực Quan Trên Navbar (`SyncStatusIndicator.jsx`):**
  * 🟢 Cloud Synced (Đã đồng bộ) | 🟡 Syncing (Đang đồng bộ) | 🟠 Pending (Chờ gửi $N$ items) | 🔴 Sync Failed (Lỗi kèm nút thử lại) | ⚪ Offline Mode (Ngoại tuyến).

#### 2. Kế hoạch Mở rộng Nâng cao (Resilient Offline-First & Multi-Device Sync Spec):
- [ ] **2.3.5 Nâng cấp Lưu trữ Giao dịch Cấp Đĩa Cứng (IndexedDB Transactional Store):**
  * **Mô tả:** Thay thế hoàn toàn giới hạn 5MB của LocalStorage bằng IndexedDB thông qua thư viện IDB/Dexie wrapper nhẹ (< 4KB). Cho phép lưu trữ không giới hạn hàng chục ngàn câu hỏi, lịch sử làm bài và âm thanh đệm.
  * **Tiêu chuẩn Nghiệm thu (AC-2.3.1):** Hàng đợi `pending_sync_queue` có transactional write, tự động rollback nếu xảy ra lỗi ghi đĩa, hỗ trợ lưu trữ blob/jsonb lên tới 100MB.
- [ ] **2.3.6 Schema Sự kiện Đồng bộ Bất biến v1.0 & Khóa Idempotency:**
  * **Mô tả:** Chuẩn hóa payload sự kiện đồng bộ `SyncEvent` gồm 8 loại (`XP_EARNED`, `LESSON_COMPLETED`, `MISTAKE_RECORDED`, `MISTAKE_RESOLVED`, `QUIZ_SUBMITTED`, `VOCABULARY_SAVED`, `VOCABULARY_DELETED`, `DIAGNOSTIC_COMPLETED`).
  * **Tiêu chuẩn Nghiệm thu (AC-2.3.2):** Mọi sự kiện đều mang `idempotency_key` (UUIDv4) và `device_id`. Server từ chối xử lý lặp lại với mã HTTP 200 (Deduped), triệt tiêu rủi ro duplicate XP khi mạng rớt giữa chừng.
- [ ] **2.3.7 Phối hợp Đa Tab Trình duyệt (Multi-Tab Coordination via Web Locks & BroadcastChannel):**
  * **Mô tả:** Triển khai `lib/sync/sync-coordinator.js` bầu chọn 1 Tab Trưởng (Leader Tab) bằng Web Locks API (`navigator.locks.request`). Tab Trưởng chịu trách nhiệm giao tiếp mạng với server; các tab còn lại nhận tín hiệu cập nhật qua `BroadcastChannel('grammar_sync_channel')`.
  * **Tiêu chuẩn Nghiệm thu (AC-2.3.3):** Mở 5 tab đồng thời và hoàn thành bài tập chỉ phát sinh 1 HTTP request duy nhất; trạng thái pill trên 5 tab đồng loạt chuyển sang 🟢 Synced cùng lúc trong vòng 10ms.
- [ ] **2.3.8 Động cơ Tự Phục hồi & Exponential Backoff with Full Jitter:**
  * **Mô tả:** Áp dụng công thức jitter ngẫu nhiên $T_{backoff} = \min(30000, 1000 \times 2^{retry}) \times \text{random}(0.5, 1.5)$ để ngăn chặn hiện tượng thundering herd khi hàng ngàn thiết bị cùng online trở lại.
  * **Tiêu chuẩn Nghiệm thu (AC-2.3.4):** Mô phỏng máy chủ 503 tạm thời, client thử lại với thời gian giãn cách ngẫu nhiên và tự động phục hồi thành công khi máy chủ 200 trở lại mà không gây nghẽn mạng.
- [ ] **2.3.9 Bộ API Serverless Đồng bộ Hai Chiều (`/api/sync/batch`, `/api/sync/pull`, `/api/sync/status`):**
  * **Mô tả:** Xây dựng endpoint tiếp nhận mẻ (micro-batching tối đa 50 sự kiện/lần) trong một transaction duy nhất trên PostgreSQL 17; endpoint pull theo dõi con trỏ thời gian `since_timestamp` để đồng bộ thay đổi giữa các thiết bị khác nhau của cùng 1 học viên.
  * **Tiêu chuẩn Nghiệm thu (AC-2.3.5):** Một học viên làm bài trên điện thoại (Device A), sau đó mở laptop (Device B), dữ liệu trên Device B được tự động cập nhật đầy đủ chỉ trong vòng 1 lần kéo (pull delta).
- [ ] **2.3.10 Service Worker Caching & Offline Grammar PWA Assets:**
  * **Mô tả:** Đăng ký Service Worker precache toàn bộ 12 chuyên đề lý thuyết, 53 bài học ngữ pháp và shell giao diện. Áp dụng chiến lược Stale-While-Revalidate cho dữ liệu câu hỏi.
  * **Tiêu chuẩn Nghiệm thu (AC-2.3.6):** Ngắt kết nối mạng hoàn toàn (DevTools Offline), học viên vẫn có thể mở ứng dụng, đọc toàn bộ lý thuyết 12 chương và làm bài tập trắc nghiệm mà không gặp màn hình trắng hay lỗi mạng.
- [ ] **2.3.11 Giám sát Hiệu năng Đồng bộ & Telemetry Client:**
  * **Mô tả:** Thu thập chỉ số P95 sync latency, queue backlog depth, tỷ lệ giải quyết xung đột để phục vụ giám sát và cảnh báo.
  * **Tiêu chuẩn Nghiệm thu (AC-2.3.7):** Thời gian hoàn thành mẻ đồng bộ 50 sự kiện P95 < 600ms, tỷ lệ lỗi đồng bộ < 0.01%.

---

### 🔹 Milestone 2.4: Enterprise Admin Dashboard, RBAC Governance & Immutable Audit Trail (P1)

> **Mục tiêu:** Thiết lập hệ thống Quản trị & Giám sát Tập trung (Enterprise Admin & Governance System) với cơ chế bảo vệ Zero-Trust, phân quyền RBAC đa cấp (FREE/VIP/ADMIN), điều phối chính sách hạn mức động và lưu vết toàn bộ biến động hệ thống qua Nhật ký Kiểm toán Bất biến (Immutable Append-Only Audit Trail).

#### 1. Các thành phần Cốt lõi Đã Triển khai & Hoạt động trên Production:
- [x] **2.4.1 Bảng Điều Khiển Quản Trị Viên Tập Trung (Admin Panel View):**
  * Tích hợp trực tiếp vào thanh điều hướng khi đăng nhập bằng tài khoản có quyền `role === 'ADMIN'`.
  * Hiển thị thẻ thông tin hệ thống trực tiếp từ Supabase PostgreSQL 17.
- [x] **2.4.2 Quản Lý Học Viên & Phân Quyền Cơ Bản:**
  * Bảng danh sách học viên trực quan: Họ tên, Email, Vai trò (`ADMIN`, `VIP`, `FREE`), Tiến độ học tập (Streak, XP, số bài học), Trạng thái (`ACTIVE`, `BANNED`) và Ngày tạo.
  * Thao tác nhanh 1 chạm: Nâng cấp VIP ⭐, Hạ xuống FREE, Khóa tài khoản (Khóa/Mở khóa học viên).
  * Modal thêm người dùng mới với form xác thực chuẩn.
  * Thanh tìm kiếm người dùng theo Họ tên, Email và bộ lọc vai trò tức thì.
- [x] **2.4.3 Cấu Hình Hạn Mức Hệ Thống Ban Đầu (`system_policies`):**
  * Cấu hình hạn mức số câu bài tập tối đa mỗi chương (10 câu) và số đề thi Quiz mỗi ngày (2 đề 50 câu).
  * Lưu trữ cấu hình trực tiếp vào bảng `system_policies` trên Supabase PostgreSQL 17.
- [x] **2.4.4 Hệ Thống Ghi Nhận Lịch Sử Quản Trị Cơ Bản (`audit_logs`):**
  * Tự động ghi nhận mọi hành động quản trị vào bảng `audit_logs`: Thay đổi quyền tài khoản, Khóa/Mở khóa học viên, Cập nhật hạn mức hệ thống.
  * Lưu trữ metadata chi tiết: `admin_id`, `admin_email`, `action_type`, `target_user_id`, `old_value`, `new_value`, `ip_address`, `created_at`.

#### 2. Kế hoạch Mở rộng Nâng cao (Enterprise Governance & Immutable Audit Spec):
- [ ] **2.4.5 Bảng Điều Khiển Vận Hành Thời Gian Thực (Operational Health Dashboard):**
  * **Mô tả:** Tích hợp các biểu đồ trực quan hóa số lượng active users (DAU/WAU), tỷ lệ chuyển đổi VIP, số phiên thi Quiz hoàn thành trong ngày, tỷ lệ lỗi API và backlog hàng đợi đồng bộ ngoại tuyến.
  * **Tiêu chuẩn Nghiệm thu (AC-2.4.1):** Dashboard tải hoàn tất dưới 500ms, tự động làm mới số liệu mỗi 60 giây qua cached serverless endpoint `/api/admin/overview`.
- [ ] **2.4.6 Ma Trận Phân Quyền RBAC Phía Server & Middleware Bảo Vệ (`admin-guard.js`):**
  * **Mô tả:** Xác thực phân quyền 3 tầng nghiêm ngặt (UI Guard -> API Middleware -> Database RLS). Ngăn chặn hoàn toàn việc can thiệp bằng cách giả mạo JWT hoặc sửa đổi localStorage.
  * **Tiêu chuẩn Nghiệm thu (AC-2.4.2):** Mọi request tới `/api/admin/*` thiếu chữ ký admin hợp lệ lập tức nhận HTTP 403 Forbidden kèm ghi nhận cảnh báo an ninh.
- [ ] **2.4.7 Quản Lý Chính Sách Hạn Mức Động Với Quản Lý Phiên Bản (Policy Versioning):**
  * **Mô tả:** Cho phép Quản trị viên cập nhật động các tham số hạn mức: số câu miễn phí mỗi chương, số lượt làm quiz, thời gian cooldown bài thi chẩn đoán, kích thước mẻ sync. Mỗi lần thay đổi được gán mã phiên bản `policy_version` và tự động kích hoạt client invalidation.
  * **Tiêu chuẩn Nghiệm thu (AC-2.4.3):** Khi Admin thay đổi hạn mức từ 10 lên 15 câu, học viên Free lập tức nhận hạn mức mới mà không cần restart máy chủ hoặc build lại code.
- [ ] **2.4.8 Khóa Bất Biến Cấp Cơ Sở Dữ Liệu Cho Nhật Ký Kiểm Toán (`public.audit_logs`):**
  * **Mô tả:** Cài đặt PostgreSQL Trigger chặn hoàn toàn lệnh `UPDATE` hoặc `DELETE` trên bảng `public.audit_logs`. Đảm bảo tính pháp lý và toàn vẹn dữ liệu tuyệt đối (Zero Erasure).
  * **Tiêu chuẩn Nghiệm thu (AC-2.4.4):** Chạy lệnh SQL `DELETE FROM audit_logs` nhận thông báo lỗi từ chối `EXCEPTION: Audit logs are immutable and cannot be deleted or modified`.
- [ ] **2.4.9 Hộp Thoại Xác Nhận Thao Tác Nguy Hiểm & Rate Limiting Admin:**
  * **Mô tả:** Thao tác khóa tài khoản hàng loạt hoặc chỉ định quyền ADMIN mới yêu cầu Quản trị viên nhập chuỗi văn bản xác nhận bảo mật (`CONFIRM_SECURITY_ACTION`). Giới hạn tối đa 30 thao tác nhạy cảm/phút/IP.
  * **Tiêu chuẩn Nghiệm thu (AC-2.4.5):** Không thể kích hoạt hành động nếu nhập sai chuỗi xác nhận; vượt quá 30 req/phút nhận mã lỗi HTTP 429 Too Many Requests.
- [ ] **2.4.10 Bộ Lọc Nâng Cao & Xuất Báo Cáo Sư Phạm (Bulk User Operations & CSV Export):**
  * **Mô tả:** Tìm kiếm đa tiêu chí kết hợp (vai trò + chuỗi streak > 7 ngày + trạng thái), hỗ trợ xuất báo cáo tiến độ học tập toàn hệ thống dưới dạng file CSV/Excel UTF-8 có dấu.
  * **Tiêu chuẩn Nghiệm thu (AC-2.4.6):** Xuất thành công danh sách 10,000 học viên dưới 2 giây với đầy đủ dữ liệu tiếng Việt chuẩn Unicode.
- [ ] **2.4.11 Tối Ưu Hóa Truy Vấn & Composite Indexing Cho Quản Trị:**
  * **Mô tả:** Đánh chỉ mục tổng hợp trên các cột tìm kiếm và sắp xếp của `profiles` và `audit_logs`.
  * **Tiêu chuẩn Nghiệm thu (AC-2.4.7):** Thời gian truy vấn danh sách người dùng phân trang 50 mục < 50ms trên tập dữ liệu 50,000 người dùng.

---

### 🔹 Milestone 2.5: Structured Pedagogical Intelligence, Knowledge Graph & Personalized Remedial Learning (P1)

> **Mục tiêu:** Chuyển đổi toàn bộ giải thích ngữ pháp sang Động cơ Trí tuệ Sư phạm Cấu trúc (JSON Schema v1.0), tích hợp Đồ thị Tri thức Ngữ pháp (Grammar Knowledge Graph), Phân cấp 4 cấp độ học lực thích ứng, Hệ thống phản hồi chất lượng từ học viên, Phân loại 11 nhóm lỗi sai chuẩn xác và Động cơ Đề xuất Bài học Bù đắp Tự động kết hợp Lặp lại Ngắt quãng (Spaced Repetition).

#### 1. Các thành phần Cốt lõi Đã Triển khai & Hoạt động trên Production:
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
  * Hàm `adaptExplanationForLevel(explanation, targetLevel)` tự động điều chỉnh độ sâu phân tích không làm thay đổi bản chất câu hỏi hay đáp án chính xác.
- [x] **2.5.3 Hệ Thống Thu Thập Phản Hồi Học Viên (Explanation Quality Feedback System):**
  * Component `StructuredExplanation.jsx` tích hợp thanh phản hồi trực quan:
    * Nút "👍 Hữu ích": Ghi nhận đánh giá tích cực của học viên, tính toán tỷ lệ hữu ích theo thời gian thực.
    * Nút "⚠️ Báo lỗi": Mở modal phản hồi chi tiết với 6 danh mục lỗi chuẩn hóa kèm ô góp ý bổ sung.
  * Bảng Supabase `public.explanation_feedback` có ràng buộc duy nhất `UNIQUE(user_id, question_id, explanation_version)` chống spam lặp lại.
  * API bảo mật `pages/api/explanation-feedback.js` và API tổng hợp quản trị `pages/api/admin/explanations/feedback-summary.js`.
- [x] **2.5.4 Chuẩn Hóa Phân Loại Lỗi & Phát Hiện Lỗ Hổng Kiến Thức (Error Classification Taxonomy):**
  * Danh mục 11 nhóm lỗi ngữ pháp chuẩn hóa trong `lib/explanation/error-taxonomy.js`:
    * `TENSE_CONFUSION`, `SUBJECT_VERB_AGREEMENT`, `WORD_FORM`, `PREPOSITION_ERROR`, `ARTICLE_ERROR`, `CONDITIONAL_ERROR`, `PASSIVE_VOICE_ERROR`, `REPORTED_SPEECH_ERROR`, `VOCABULARY_ERROR`, `CONTEXT_MISUNDERSTANDING`, `UNKNOWN_ERROR`.
  * Bộ phân loại thông minh `classifyError(question, userAnswer, correctAnswer)` kết hợp phân tích từ khóa, cấu trúc thì và từ vựng đối chiếu.
- [x] **2.5.5 Động Cơ Đề Xuất Bài Học Bù Đắp Tự Động (Deterministic Remedial Recommendation Engine):**
  * Module `lib/explanation/remedial-engine.js` phân tích câu sai của học viên, tính điểm tin cậy (Confidence Score 0.88 - 0.98), tra cứu danh mục 12 chương & 53 bài học chuẩn sách Mai Lan Hương.
  * Component `RemedialRecommendationCard.jsx` hiển thị cảnh báo sư phạm ngay khi học viên trả lời sai kèm nút hành động 1-click "📖 Học ngay bài bù đắp" điều hướng thẳng đến đúng bài học cần củng cố trong 12 Chuyên đề.
- [x] **2.5.6 Lưu Trữ Supabase PostgreSQL 17 & Serverless API Routes:**
  * 5 bảng cơ sở dữ liệu chuyên dụng với RLS và chỉ mục tổng hợp: `explanations`, `explanation_feedback`, `question_concepts`, `remedial_recommendations`, `user_concept_progress`.
  * Serverless API Routes bảo vệ: `/api/questions/[questionId]/explanation`, `/api/explanation-feedback`, `/api/learning/remedial-recommendations`, `/api/admin/explanations/feedback-summary`.

#### 2. Kế hoạch Mở rộng Nâng cao (Pedagogical Intelligence & Knowledge Graph Spec):
- [ ] **2.5.7 Bản Đồ Đồ Thị Tri Thức Ngữ Pháp Hoàn Chỉnh (Grammar Knowledge Graph DAG):**
  * **Mô tả:** Xây dựng mô-đun `lib/knowledge/knowledge-graph.js` mô hình hóa toàn bộ 12 Chuyên đề, 53 Bài học, 376 Mục sư phạm thành đồ thị có hướng không chu trình (DAG). Lưu trữ mối quan hệ phụ thuộc tiên quyết (prerequisite edges) giữa các khái niệm ngữ pháp.
  * **Tiêu chuẩn Nghiệm thu (AC-2.5.1):** Kiểm tra đồ thị không có chu trình (Acyclic Validation = pass); thuật toán tìm đường đi tiên quyết (`findPrerequisites(conceptId)`) trả về danh sách bài học gốc cần học trước trong thời gian < 5ms.
- [ ] **2.5.8 Tự Động Hóa Chuyển Đổi Dữ Liệu Lời Giải Sư Phạm Cho Toàn Bộ 2,939 Câu Hỏi:**
  * **Mô tả:** Triển khai kịch bản xử lý hàng loạt (Batch Pedagogical Ingestion Script) chuyển đổi 100% lời giải hiện có trong cơ sở dữ liệu và mã nguồn thành định dạng JSON 5 trường đạt chuẩn schema v1.0.
  * **Tiêu chuẩn Nghiệm thu (AC-2.5.2):** 100% trong số 2,939 câu hỏi vượt qua hàm kiểm định `validateExplanation() === true`; không có câu hỏi nào bị lỗi format hay thiếu các trường bắt buộc `signal`, `rule`, `translation`.
- [ ] **2.5.9 Theo Dõi Mức Độ Thành Thạo Khái Niệm Thời Gian Thực (Concept Mastery Tracker):**
  * **Mô tả:** Triển khai mô-đun `lib/learning/mastery-tracker.js` tính toán điểm thành thạo $\text{Mastery}(C) \in [0, 100]$ cho từng khái niệm theo thời gian thực dựa trên tỷ lệ trả lời đúng, số lần sai lặp lại và chuỗi ngày ôn tập.
  * **Tiêu chuẩn Nghiệm thu (AC-2.5.3):** Điểm thành thạo được cập nhật tức thì sau mỗi bài làm và hiển thị thanh tiến độ phần trăm rõ ràng trong thẻ bài học và trang cá nhân.
- [ ] **2.5.10 Hệ Thống Ôn Tập Lặp Lại Ngắt Quãng (Spaced Repetition Engine - SM-2 Variant):**
  * **Mô tả:** Xây dựng lịch trình ôn tập tự động theo các mốc giãn cách thời gian: 1 ngày -> 3 ngày -> 7 ngày -> 14 ngày -> 30 ngày. Thiết lập bảng `public.spaced_repetition_queue` tự động gợi ý danh sách câu hỏi cần ôn tập mỗi ngày.
  * **Tiêu chuẩn Nghiệm thu (AC-2.5.4):** Học viên đăng nhập mỗi ngày nhận được thông báo: *"Bạn có $N$ câu hỏi cần ôn tập hôm nay để duy trì trí nhớ dài hạn"*; làm đúng liên tục 5 mốc sẽ được đánh dấu *Làm chủ Hoàn toàn (Fully Mastered)*.
- [ ] **2.5.11 Cơ Chế Suy Hao Tri Thức Tự Động (Knowledge Decay Algorithm):**
  * **Mô tả:** Thiết lập quy tắc suy hao tri thức: nếu học viên không thực hiện ôn tập một khái niệm sau 14 ngày kể từ ngày đáo hạn, điểm thành thạo của khái niệm đó tự động giảm 5%/tuần cho tới ngưỡng sàn 50%.
  * **Tiêu chuẩn Nghiệm thu (AC-2.5.5):** Mô phỏng thời gian học tập 30 ngày không ôn tập, điểm thành thạo tự động phản ánh sự suy giảm hợp lý theo đường cong quên lãng Ebbinghaus.
- [ ] **2.5.12 Bảng Điều Khiển Chất Lượng Sư Phạm Dành Cho Giảng Viên (Pedagogical Quality Dashboard):**
  * **Mô tả:** Xây dựng giao diện quản trị sư phạm tổng hợp các câu hỏi có tỷ lệ phản ánh lỗi cao (`report_count > 3`), tỷ lệ bình chọn không hữu ích cao để đội ngũ biên soạn sư phạm xem xét, chỉnh sửa trực tiếp nội dung JSON và phê duyệt phiên bản mới.
  * **Tiêu chuẩn Nghiệm thu (AC-2.5.6):** Quản trị viên sư phạm có thể lọc các câu hỏi có vấn đề, chỉnh sửa trực tiếp các trường `signal`, `rule`, `translation` trên giao diện web và xuất bản phiên bản mới ngay lập tức.
- [ ] **2.5.13 Kiểm Thử Hiệu Năng & Độ Sâu Thích Ứng (Pedagogical Adaptation Performance Test):**
  * **Mô tả:** Kiểm thử tự động khả năng thích ứng của hàm `adaptExplanationForLevel` với 1,000 câu hỏi mẫu ở cả 4 cấp độ.
  * **Tiêu chuẩn Nghiệm thu (AC-2.5.7):** Thời gian chuyển đổi cấp độ sư phạm trung bình < 1ms/câu; không phát sinh bất kỳ lỗi runtime nào.
- [ ] **2.5.14 Hoàn Thiện Bộ Schema 9 Bảng Supabase PostgreSQL 17 Cho Phân Hệ Sư Phạm:**
  * **Mô tả:** Bổ sung đầy đủ 4 bảng còn lại trong kiến trúc 9 bảng: `concepts`, `concept_dependencies`, `spaced_repetition_queue`, `error_taxonomy_registry` với RLS và indexes đầy đủ.
  * **Tiêu chuẩn Nghiệm thu (AC-2.5.8):** 9 bảng được kết nối toàn vẹn qua Foreign Keys, có RLS pass-through an toàn và chỉ mục tối ưu hóa tốc độ truy vấn.

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
