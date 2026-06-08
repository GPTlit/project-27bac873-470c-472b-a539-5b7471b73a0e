
# Plan — Icon UI overhaul + Wattpad-style Stories platform

This is a large change. I'll ship it in one go, but in a clear order so each layer builds on the last. If anything breaks mid-way it'll be obvious which slice caused it.

---

## Part 1 — Emoji → real icon buttons (app-wide)

Sweep the codebase for emoji-as-UI and replace with `lucide-react` icons inside the existing `Button` component, keeping all current functionality.

Known emoji usages to replace:
- `AmbientPlayer.tsx` — 🌧️ 🌊 🍃 🔥 ☕ 🏜️ 🌌 🎹 🧘 → `CloudRain`, `Waves`, `Wind`, `Flame`, `Coffee`, `Mountain`, `Sparkles`, `Piano`, `Brain`
- Category icons (currently emoji strings in `mockData` / DB `categories.icon`) → map emoji → lucide icon via a lookup table, render via a `<CategoryIcon name=…>` component
- Any other emoji-as-button found via a `rg` sweep (file upload zones, success states, etc.)

Button style baseline (used everywhere):
- `rounded-xl`, consistent padding, `shadow-sm hover:shadow-md`
- Icon + label stacked or inline depending on context
- Min hit area 40×40 px, `aria-label` on icon-only buttons
- Uses existing semantic tokens (`primary`, `accent`, `muted-foreground`) — no hard-coded colors

No functionality changes — only swap the visual.

---

## Part 2 — Bottom navigation bar

A new persistent bottom nav on mobile (and a slimmer version on desktop) with 5 entries, matching your spec:

```text
[ Home ]  [ Feed ]  [ Explore ]  [ Write ]  [ Bell ]
```

- **Home** → existing `/` (library landing)
- **Feed** → `/feed` — stories from authors you follow + trending
- **Explore** → `/explore` — browse all published stories by tag/category
- **Write** → `/write` — your stories dashboard + "New story" button
- **Bell** → `/notifications` — existing notifications page, just moved into the bar

Built as `<BottomNav />` rendered inside `Layout.tsx`, lucide icons, active-state highlight via design tokens.

---

## Part 3 — Database (one migration)

New tables — all in `public` with GRANTs + RLS + `has_role`-safe policies.

| Table | Purpose | Key columns |
|---|---|---|
| `stories` | A user-authored story | `id`, `author_id`, `title`, `description`, `cover_url`, `language`, `mature` (bool), `copyright`, `status` ('draft'\|'published'), `tags` (text[]), `category`, `views`, `created_at`, `updated_at`, `published_at` |
| `story_parts` | Chapters within a story | `id`, `story_id`, `order_index`, `title`, `content` (text, unlimited), `media` (jsonb: array of `{type:'image'\|'youtube', url}`), `published`, timestamps |
| `story_follows` | Who follows whom | `id`, `follower_id`, `author_id`, `created_at`, unique(follower, author) |
| `story_comments` | Comments on parts | `id`, `part_id`, `user_id`, `parent_id` (nullable, threaded), `content`, timestamps |
| `story_likes` | Likes on stories | `id`, `story_id`, `user_id`, unique |
| `user_reading_prefs` | Mature opt-in etc. | `user_id` PK, `show_mature` bool default false |

Existing `user_profiles` table is extended with `is_writer` (bool) and we'll show counts (followers, stories) via aggregates — no schema change needed beyond that.

RLS summary (plain English):
- Anyone (even logged-out) can read published stories, their published parts, comments, likes, and authors' public profiles.
- Only the author can read/edit drafts and unpublished parts.
- Only authenticated users can like, comment, follow, or create stories.
- Mature stories are filtered out client-side unless `user_reading_prefs.show_mature = true`.

Storage buckets: reuse `covers` for story covers, reuse `chat-media` style for inline images, new public bucket `story-media`.

Notifications: a Postgres trigger on `stories` `INSERT … status='published'` (and `UPDATE` to published) inserts a row into the existing `notifications` table for every follower of `author_id`, type `'new_story'`, metadata `{story_id, story_title, author_id, author_name}`.

---

## Part 4 — Frontend pages & components

New routes:
- `/feed` — paginated list of stories from followed authors, newest first; if no follows yet, show trending stories CTA
- `/explore` — search + tag/category filters across all published stories
- `/write` — your stories: list of drafts + published, "Create new story" button
- `/write/:storyId` — story metadata editor (title, cover, description, language, mature, copyright, tags, categories)
- `/write/:storyId/parts/:partId` — part editor: title, rich text body, "Add image" / "Add YouTube" media blocks, "Publish part" / "Save draft", "Add next part" button
- `/story/:storyId` — public story page: cover, description, tags, author card with follow button, parts list, comments
- `/story/:storyId/read/:partId` — reading view
- `/u/:username` — public author profile: avatar, bio, followers count, stories grid, follow button

New components: `StoryCard`, `StoryEditor`, `PartEditor` (textarea + media blocks), `MediaBlock` (image or YouTube embed), `FollowButton`, `StoryCommentThread`, `MatureGate` (warning gate based on prefs), `WriterDashboard`.

Hooks: `useStories`, `useStory`, `useStoryParts`, `useFollow`, `useStoryComments`, `useStoryLikes`, `useUserReadingPrefs`.

---

## Part 5 — Access barrier (matches your existing rule)

Browsing is public; any write/read-protected action (open a part to read, like, follow, comment, write) triggers the existing "please sign in" toast/redirect. We already enforce this for books — we extend the same pattern to stories.

---

## Part 6 — i18n

All new strings added to `LanguageContext.tsx` in Arabic / English / French (Feed, Explore, Write a story, Add part, Publish, Followers, Following, Mature content, etc.).

---

## Technical notes

- Stack: existing React + Vite + Tailwind + shadcn + Supabase. No new deps except possibly `react-youtube-embed` (small, optional — we can just render an `<iframe>` manually).
- Long text in parts: stored as plain text in a `text` column; rendered with whitespace-preserving wrapper. No rich-text editor in v1 (keeps scope realistic). Media is added as separate blocks, not inline HTML.
- Realtime notifications already work via the existing `notifications` table + `NotificationBell` — new-story notifications just plug into that.
- Mature gating: client-side `WHERE mature = false OR :showMature` in queries plus a confirm dialog when opening a mature story directly by URL.

---

## Order of execution

1. Run the SQL migration (tables, GRANTs, RLS, trigger).
2. Scaffold hooks + types.
3. Build bottom nav + routes shells.
4. Build profile / explore / feed pages.
5. Build write dashboard + story editor + part editor.
6. Build public story + reader + comments + follow.
7. Sweep emojis → lucide icons across the whole app, including category icons.
8. i18n keys, polish, dark/light parity check.

---

## What I'd like to confirm before starting

- The migration adds 6 new tables + 1 trigger. Approving it kicks off the rest. Ready to proceed?
- For the part editor, plain textarea (with media blocks above/below) is fine for v1, or do you want a true rich-text editor (bold/italic/headings)? Plain is faster and less buggy.
