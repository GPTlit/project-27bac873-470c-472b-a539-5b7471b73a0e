## Goals

1. Fix the two broken AI flows (book metadata upload + Author chat).
2. Add a per-book reader dark mode (inverted-color filter on PDF pages).
3. Build the reading-verification gamification system: 8-digit Reader IDs, quizzes, XP, 20 evolving badges.

---

## 1. Fix AI flows

- Both `ai-book-metadata` and `author-chat` edge functions: switch model to `google/gemini-3-flash-preview` (current `google/gemini-2.5-flash-lite` and `2.5-flash` are returning errors).
- `author-chat`: confirm it can actually see the library — the function already fetches `books` via service role. Verify it returns rows (read query) and, if RLS blocks the anon-key client, switch to `SUPABASE_SERVICE_ROLE_KEY` so the assistant can list and recommend any book.
- Surface 429 / 402 errors clearly in the UI toasts of `AIBulkUpload` and `AuthorChat`.

## 2. Reader dark mode (PDF page filter)

- In `BookReader.tsx`, add a local "light/dark" toggle button in the reader toolbar.
- "Dark" applies `filter: invert(1) hue-rotate(180deg)` to the PDF canvas/page container only (not the surrounding chrome), so white pages flip to black, text flips to white. Light mode = no filter.
- Persist choice per user in `localStorage` (`reader-color-mode`).

## 3. Reader ID, XP, badges, quizzes

### Database (new migration)

- `user_profiles`: add `reader_id INT8 UNIQUE` (8-digit), `xp INT DEFAULT 0`, `badge_rank INT DEFAULT 1` (1–20).
- Backfill: admin user gets `reader_id = 1`; everyone else gets a random unique 8-digit number (10000000–99999999). A trigger on new `user_profiles` insert assigns a random 8-digit ID, retrying on collision; admin override stays at 1.
- `book_quizzes`: `book_id` (FK, unique), `questions JSONB` (array of `{q, choices[4], correct_index, explanation?}`), `generated_at`, `generated_by`. Admin can edit.
- `quiz_attempts`: `user_id`, `book_id`, `score INT`, `answers JSONB`, `passed BOOL`, `verified BOOL` (true only when 10/10), `created_at`. Unique on `(user_id, book_id)` for the *verified* record — store best attempt.
- `book_xp`: helper view or computed column on `books` for size: `xp_value` = 50/100/200 based on page count (short <100, medium <300, long ≥300). Store directly on `books.xp_value` populated by trigger from `page_count` if present, else default 100.
- RLS:
  - `book_quizzes`: anyone authenticated can SELECT; only admin can INSERT/UPDATE/DELETE.
  - `quiz_attempts`: user can SELECT/INSERT their own; admin can SELECT all.
- All tables: standard GRANTs + `updated_at` triggers.
- RPC `award_quiz_result(_book_id, _score)`: SECURITY DEFINER. Inserts attempt; if score = 10, marks verified, adds book's XP to user_profiles.xp, recomputes `badge_rank` (XP thresholds below).

### XP → Badge ranks (20 tiers)

Thresholds (cumulative XP):
1 Paper 0, 2 Ink 100, 3 Bookmark 250, 4 Reader 500, 5 Scholar 1000, 6 Librarian 1750, 7 Archivist 2750, 8 Historian 4000, 9 Sage 5500, 10 Master Reader 7500, 11 Silver Sage 10000, 12 Golden Sage 13000, 13 Crystal Scholar 16500, 14 Mythic Reader 20500, 15 Celestial Archivist 25000, 16 Starborn Scholar 30000, 17 Cosmic Librarian 36000, 18 Eternal Sage 43000, 19 Ascendant Reader 51000, 20 Library Legend 60000.

### Badge visuals

- `src/lib/badges.ts`: array of 20 badges with `name`, `color` (HSL theme color), `glow` (box-shadow), `decoration` (emoji/icon ring), `gradient` for top tiers.
- `src/components/profile/BadgeDisplay.tsx`: renders a badge ring/medallion. Higher ranks add sparkle (CSS pseudo-elements), gradient borders, animated glow.
- Profile theme: when viewing a profile, apply badge color as accent (CSS variable scoped on profile container, not global app).

### Quiz generation edge function

- New function `generate-book-quiz`: input `{ book_id }`. 
  - Reads `books` row (title, author, description, file_url, page_count).
  - Downloads PDF, extracts text sample (first ~8000 chars + middle ~4000 + last ~4000) using existing `pdfExtract` logic ported to Deno (or pass extracted text from client to keep function light — preferred: client extracts and POSTs `text_sample`).
  - Calls Lovable AI (`google/gemini-3-flash-preview`) with tool-call schema returning exactly 10 multiple-choice questions (4 choices each, `correct_index`).
  - Upserts into `book_quizzes`.
- Admin button in admin panel + on each book detail page (admin only): "Generate quiz".
- Admin can edit questions inline in admin panel: new `QuizEditor.tsx`.

### Quiz UI

- New page `/book/:id/quiz` (protected).
- Shows 10 questions one by one with progress bar; on submit, calls `award_quiz_result` RPC, then shows result screen with score, XP gained, badge progression animation.
- "Take quiz" button shown on BookDetail after the user has opened the book at least once (use existing `reading_sessions` table).

### Profile updates

- `Profile.tsx` and `AuthorProfile.tsx`: show big badge + rank name, Reader ID (`#00000001` formatted), XP bar to next rank, list of verified books.
- Verified books = `quiz_attempts.verified = true`.

---

## Files to create/edit

**New**
- `supabase/migrations/<ts>_quiz_badge_system.sql`
- `supabase/functions/generate-book-quiz/index.ts`
- `src/lib/badges.ts`
- `src/components/profile/BadgeDisplay.tsx`
- `src/components/admin/QuizEditor.tsx`
- `src/pages/BookQuiz.tsx`
- `src/hooks/useReaderProfile.ts` (reader_id, xp, badge_rank)
- `src/hooks/useBookQuiz.ts`

**Edit**
- `supabase/functions/ai-book-metadata/index.ts` — model fix
- `supabase/functions/author-chat/index.ts` — model fix + ensure library visibility via service role
- `src/components/admin/AIBulkUpload.tsx` — better error toasts
- `src/pages/BookReader.tsx` — light/dark filter toggle
- `src/pages/BookDetail.tsx` — "Take quiz" CTA
- `src/pages/Profile.tsx`, `src/pages/stories/AuthorProfile.tsx` — badge + reader ID + XP
- `src/pages/AdminPanel.tsx` — Quiz tab + generate/edit
- `src/App.tsx` — `/book/:id/quiz` route

---

## Out of scope (call out)

- I will not auto-extract PDF text inside the edge function for the first version — the client (BookReader) sends the cleaned text sample when admin clicks "Generate quiz". This avoids a 60s function timeout on big PDFs.
- Profile color theming from the badge is scoped to the profile page only; it does not override the global admin theme presets.
