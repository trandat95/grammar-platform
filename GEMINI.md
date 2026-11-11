# AGENT GUIDELINES & DIRECTIVES FOR GRAMMAR PLATFORM

## 🌟 MASTER INSTRUCTION & LIVING ROADMAP
Always refer to and read **`ROADMAP_AND_ARCHITECTURE.md`** at the repository root before planning or executing any task in this workspace.

### Core Operating Directives:
1. **Living Roadmap Single Source of Truth:**
   - `ROADMAP_AND_ARCHITECTURE.md` defines the exact project phase, completed features, system architecture, database schema, and sequential execution milestones.
   - When a user asks a question, gives a new request, or asks to enhance the platform, consult `ROADMAP_AND_ARCHITECTURE.md` first to maintain continuous architectural alignment.
   - Update the checkboxes `[x]` in `ROADMAP_AND_ARCHITECTURE.md` whenever milestones are achieved.

2. **Preserve Educational Integrity:**
   - The platform contains 12 chapters, 53 lessons, 376 pedagogical sections, 215 numbered rules, 82 syntax formulas, and 2,939 practice questions digitized from *Ngữ pháp tiếng Anh - Mai Lan Hương & Hà Thanh Uyên*.
   - Never overwrite or discard this grammar data without explicit instruction.

3. **Current Active Direction: Phase 2 (Supabase Cloud Enhancement):**
   - Active Supabase Project: `wtvlbbcyvtqqygtojxay` (`https://wtvlbbcyvtqqygtojxay.supabase.co`).
   - Priority: Transitioning user profiles, learning trackers (streaks/XP), mistake notebooks, and saved vocabularies from `LocalStorage` to Supabase PostgreSQL 17 with Row-Level Security (RLS) while keeping local-first resilience.

4. **Production Verification:**
   - Every completed feature must be committed to git, pushed to GitHub `main`, and verified on Vercel (`https://grammar-platform.vercel.app`) with deployment status `READY`.
