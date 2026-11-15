# Architecture and code map

How the blog works end to end: where every feature lives in the code, how data
flows between the app, GitHub, Neon and R2, and the conventions to keep when
changing it. The design reasoning is in [PLAN.md](../PLAN.md); this file
describes what was actually built.

Related docs:

- [setup-services.md](setup-services.md): creating the external services and filling in `.env`
- [github-content.md](github-content.md): the GitHub App, webhook and draft branches in detail
- [writing-guide.md](writing-guide.md): the content file format and how to write
- [table-of-contents.md](table-of-contents.md): how the "On this page" rail is drawn

## Contents

- [The big picture](#the-big-picture)
- [Where data lives](#where-data-lives)
- [Features and how they flow](#features-and-how-they-flow)
- [Code map](#code-map)
- [Conventions](#conventions)
- [Common changes](#common-changes)
- [Scripts and jobs](#scripts-and-jobs)

## The big picture

```
                 ┌──────────────── blog-db (private GitHub repo) ────────────────┐
                 │ main:  articles/ posts/ series/   ← published content          │
                 │        notes/                     ← private notes (never synced)│
                 │ draft/<folder>/<slug>             ← one branch per draft        │
                 └───────▲───────────────────────────────┬───────────────────────┘
   editor save / publish │ (GitHub App)                   │ push to main → webhook
                         │                                ▼
 browser ──► Next.js app (Netlify) ──────────────► /api/webhooks/github → syncContent()
   │  ▲          │   │   │                                 │
   │  │          │   │   └── Neon Postgres ◄───────────────┘ content index, users,
   │  │          │   │        ratings, views, comments, assets, schedules
   │  │          │   └────── Cloudflare R2: mdev-blog (public images),
   │  └──────────┘           mdev-blog-private (note images)
   └── presigned PUT straight to R2 for image uploads
```

Three ideas carry the whole design:

1. **Git is the source of truth for content.** Every article, post, series and
   note is a file in `blog-db`. Drafts are branches, publishing is a merge, and
   history is git history.
2. **Neon holds a derived index plus everything git can't do**: users and
   sessions, ratings, views, comments, image bookkeeping and schedules. Pages
   read only Neon, never GitHub, so rendering never spends GitHub API quota.
3. **Images live in R2 under content-hashed keys** (`content/<id>/<hash>.webp`).
   Content stores keys, not URLs, and a key never changes, so every git commit
   keeps rendering.

## Where data lives

### Content repo (`blog-db`)

```
articles/<slug>/meta.yml      id, originalLocale, publishedAt, tags, cover
articles/<slug>/<locale>.mdx  frontmatter (title, summary, status, translatedFrom?) + MDX body
posts/<slug>/…                same as articles
series/<slug>/meta.yml        same, plus items: [ids of articles/posts in reading order]
series/<slug>/<locale>.mdx
notes/<slug>/meta.yml         id, originalLocale, tags
notes/<slug>/<locale>.mdx     frontmatter (title) + MDX body
```

The folder gives the type and slug. Schemas: `src/lib/content/schema.ts`
(pieces) and `src/lib/notes/format.ts` (notes).

### Neon tables (`src/lib/db/schema.ts`, migrations in `drizzle/`)

| Table | What it holds | Written by |
|---|---|---|
| `content_files` | Raw mirror of content files on main (path, blob sha, text) | sync |
| `content_items` | One row per piece (meta.yml) | sync |
| `content_translations` | One row per language; generated `search` tsvector | sync |
| `content_sync` | Last synced commit and rejected files | sync |
| `user`, `session`, `account`, `verification` | Better Auth | auth |
| `content_stats` | Denormalised views and rating totals per piece | views, ratings |
| `rating` | One rating per reader per piece | ratings |
| `view_event` | One row per piece, visitor hash and day (pruned after 90 days) | views |
| `comment` | Reader comments; `hidden_at` for moderation | comments |
| `asset` | Every uploaded image (key, bucket, draft branch, published) | editor, notes |
| `scheduled_publish` | Drafts waiting for their publish time | editor, hourly job |

Engagement tables key on the content `id` without a foreign key, so stats
survive a piece being briefly invalid or re-synced.

### R2 buckets (`src/lib/r2.ts`)

| Bucket | Keys | Served |
|---|---|---|
| `mdev-blog` (public) | `content/<pieceId>/<sha256-16>.<ext>` | `NEXT_PUBLIC_ASSETS_URL` |
| `mdev-blog-private` | `notes/<noteId>/<sha256-16>.<ext>` | `/api/notes/assets/…` (admin only, redirect to a 5-minute signed URL) |

`assetUrl()` in `src/lib/assets.ts` turns a key into a URL for either bucket.

## Features and how they flow

### Reading (public pages)

- Routes: `src/app/[locale]/{articles,posts,series}/…`, home at `src/app/[locale]/page.tsx`.
- Data: `src/lib/content/source.ts` loads the index from Neon, cached with
  `unstable_cache` under the `content` tag (read fresh on every request in
  development). `CONTENT_SOURCE=local` parses a local checkout of `blog-db`
  instead, for offline work.
- `src/lib/content/queries.ts` turns the index into what pages need: lists in
  the reader's locale with fallback, filters and sorting, series context
  ("Part X of Y"), search results and top picks.
- Bodies are compiled per request by `src/lib/content/mdx.ts`
  (`next-mdx-remote-client`, remark-gfm, rehype-slug, rehype-pretty-code) with
  the allowlisted components in `src/components/article/mdx-components.tsx`.
- Languages: a missing or draft translation falls back to the original with a
  notice (`TranslationNotice.tsx`); SEO metadata, hreflang and OG images are in
  `src/lib/seo.ts`, `src/lib/og.tsx` and the `opengraph-image.tsx` routes.

### Content sync (GitHub → Neon)

`src/lib/content/sync.ts` (`syncContent`):

1. Read main's tree (one call) and keep paths under `articles/`, `posts/`, `series/`.
2. Download only blobs whose sha differs from `content_files`.
3. Parse and validate everything (`src/lib/content/parse.ts`). An invalid piece
   is reported and keeps its last good version.
4. Write mirror, items and translations in one Neon batch (a transaction).

Triggers: the webhook (`src/app/api/webhooks/github/route.ts`, push to main
only), `npm run content:sync`, `/api/content/sync` (cron secret), the daily job,
the "Sync now" button in `/admin`, and every Publish. Each caller then
revalidates the `content` tag.

### Search

A generated `tsvector` column on `content_translations` (title weight A, summary
B, body D), stemmed with `english` for en, `russian` for ru and `simple` for uz.
`src/lib/content/search.ts` builds prefix queries and boosts the reader's
language. The home hero search (`?q=`) uses it.

### Auth and admin

- `src/lib/auth.ts`: Better Auth with GitHub and Google, sessions in Neon.
  `getViewer()` returns the signed-in user for this request (deduped);
  `requireAdmin()` throws for anyone else.
- **Admin = a linked GitHub account whose numeric id is in `ADMIN_GITHUB_IDS`**,
  checked on the server for every request, never trusted from the session cookie.
- Client: `src/lib/auth-client.ts`; UI: `src/components/auth/UserMenu.tsx`.
- Admin pages call `getViewer()` and render `<AdminSignIn />` for signed-out
  visitors or `notFound()` for readers. Admin server actions call `requireAdmin()`.

### Views

`ViewTracker.tsx` sends a `sendBeacon` to `/api/views`. `src/lib/engagement/views.ts`
drops bots, hashes IP + user agent + day with HMAC (no raw IPs stored), and in
one statement inserts a `view_event` (deduped per visitor per day) and bumps
`content_stats.views`. The daily job prunes events older than 90 days.

### Ratings

`RatingPanel.tsx` (server) and `RatingStars.tsx` (client) call
`rateContent` in `src/lib/engagement/actions.ts`. `ratings.ts` upserts the
rating and recomputes the totals in the same transaction, then the `stats`
cache tag is updated. Averages are shown from `MIN_RATINGS` (3) ratings on.

### Comments

- UI: `src/components/engagement/Comments.tsx` (server-rendered list) and
  `CommentControls.tsx` (form, delete, hide), on article, post and series pages.
- Data and rules: `src/lib/engagement/comments.ts`; actions `postComment`,
  `removeComment`, `hideComment` in `src/lib/engagement/actions.ts`.
- Plain text only (rendered as text, so no HTML from readers reaches the page),
  2,000 characters, 5 per reader per 10 minutes. Comments post instantly; the
  author or the admin can delete, the admin can hide.

### The editor (articles, posts, series)

Pages: `/admin` (content matrix), `/admin/new`, `/admin/edit/<folder>/<slug>`.

| Piece | File |
|---|---|
| Editor UI and state | `src/components/editor/Editor.tsx` |
| CodeMirror wrapper, slash snippets, paste/drop | `src/components/editor/CodeEditor.tsx` |
| Live preview (server-rendered MDX) | `src/components/editor/Preview.tsx` |
| History and diffs | `HistoryPanel.tsx`, `DiffView.tsx` |
| Series parts builder | `SeriesItems.tsx` |
| Browser crash recovery (IndexedDB) | `local-draft.ts` |
| Image resize, hash, upload | `images.ts` |
| File model and (de)serialisation | `src/lib/editor/format.ts` |
| GitHub operations | `src/lib/editor/repo.ts` |
| Validation before publish | `src/lib/editor/validate.ts` |
| Publish and schedules | `src/lib/editor/publish.ts` |
| Image bookkeeping and sweeper | `src/lib/editor/assets.ts` |
| Server actions | `src/lib/editor/actions.ts` |
| Admin content matrix | `src/lib/editor/overview.ts`, `src/components/admin/ContentTable.tsx` |

Flow:

1. The page loads the draft branch `draft/<folder>/<slug>` if it exists, else
   main's version.
2. The editor keeps an `EditorDoc` (meta + translations) and compares its
   serialised files with the last saved version, so only real changes count.
3. **Save** (button, Cmd/Ctrl+S, or after a minute idle) commits the changed
   files to the draft branch in one commit (tree → commit → update ref). It
   sends the head it loaded, so a branch that moved elsewhere refuses the save.
4. Between saves, edits are kept in IndexedDB and offered back after a reload.
5. **Publish** (`publishBranch`): validate the files on the branch, merge into
   main with a merge commit, mark the draft's images published, delete the
   branch, clear any schedule, re-sync, revalidate.
6. **Discard** deletes the branch and the images that never reached main.
7. **Outdated translations**: a translation's `translatedFrom` is the git blob
   sha of the original file it matches. When the original's sha changes, the
   editor and the matrix flag it.

### Scheduled publishing

"Schedule" in the editor calls `scheduleDraft`, which moves `publishedAt` to the
chosen day on the draft (committing if needed) and stores the time in
`scheduled_publish`. Every hour, `netlify/functions/scheduled-publish.mts` calls
`/api/cron/publish`, which runs `publishDue()` in `src/lib/editor/publish.ts`:
each due draft goes through the same `publishBranch` as the button. A failure
is saved on the row, shown in the editor and `/admin`, and retried next hour.

### Images

1. The browser resizes to at most 1600px and encodes WebP (JPEG fallback; GIFs
   kept as is), then hashes the bytes (`images.ts`).
2. A server action records the `asset` row first, then returns a presigned PUT
   URL. If the same image already exists, no upload happens.
3. The browser uploads straight to R2 and the editor inserts
   `<Img src="content/…" width={…} height={…} alt="" />`.
4. Cleanup: publish marks a draft's images permanent, discard deletes the
   unpublished ones, and the daily sweeper removes unpublished images older
   than a day whose branch is gone or that no commit ever referenced.

### Notes (private)

- Pages: `/admin/notes` (list, search, new) and `/admin/notes/<slug>` (editor).
- Code: `src/lib/notes/{format,repo,actions}.ts`, `src/components/notes/`.
- Notes are committed straight to main (no drafts). A save names the blob shas
  it started from and is refused if a file changed elsewhere since.
- The sync never reads `notes/`. Images go to the private bucket and are
  deleted with the note.

### Analytics

`/admin/analytics` (`src/app/[locale]/admin/analytics/page.tsx`) with data from
`src/lib/analytics.ts`: totals, daily views for 30 days
(`src/components/admin/ViewsChart.tsx`), views by language, most viewed, top
rated and recent comments with moderation.

## Code map

```
src/
├── proxy.ts                     next-intl locale routing (Next 16 "proxy", formerly middleware)
├── i18n/                        locales (en, uz, ru; default uz) and message loading
├── translations/{en,ru,uz}.json UI strings, one namespace per area (Editor, Comments, …)
├── app/
│   ├── [locale]/                every page, under the locale prefix
│   │   ├── page.tsx             home
│   │   ├── articles/ posts/ series/   lists and detail pages, OG images
│   │   ├── rss.xml/             RSS per locale
│   │   └── admin/               dashboard, analytics/, new/, edit/[folder]/[slug]/, notes/
│   ├── api/
│   │   ├── auth/[...all]/       Better Auth handler
│   │   ├── webhooks/github/     content push → sync
│   │   ├── content/sync/        manual sync (cron secret)
│   │   ├── cron/daily/          sync + prune views + sweep images
│   │   ├── cron/publish/        hourly scheduled publishing
│   │   ├── views/               view beacon
│   │   └── notes/assets/        private note images (admin only)
│   ├── robots.ts, sitemap.ts
├── components/
│   ├── article/                 detail page layout, MDX components, TOC, series nav, view tracker
│   ├── archive/                 list pages (cards, filters, meta line)
│   ├── home/                    hero, latest, top picks, series strip
│   ├── engagement/              ratings and comments
│   ├── editor/                  the piece editor and its parts
│   ├── notes/                   notes list and editor
│   ├── admin/                   dashboard pieces (matrix, sync button, chart, sign-in)
│   ├── auth/                    user menu and sign-in buttons
│   └── ui/, shared/, react-bits/  primitives and visual effects
└── lib/
    ├── content/                 read path: schema, parse, sync, source, queries, search, stats, mdx
    ├── editor/                  write path: format, repo (GitHub), validate, publish, assets, actions
    ├── notes/                   notes: format, repo, actions
    ├── engagement/              views, ratings, comments and their actions
    ├── db/                      Drizzle schema and Neon client
    ├── github/app.ts            GitHub App client for the content repo
    ├── r2.ts                    R2 client: presign, head, delete
    ├── assets.ts                image key → URL
    ├── auth.ts, auth-client.ts  Better Auth server and client
    ├── analytics.ts             admin analytics queries
    ├── cron.ts                  CRON_SECRET check
    └── seo.ts, og.tsx, site.ts  metadata, OG images, site constants
netlify/functions/               daily-maintenance (04:00 UTC), scheduled-publish (hourly)
scripts/                         content-sync, webhook-dev (smee proxy)
drizzle/                         SQL migrations 0000–0004
```

## Conventions

- **Check permissions on the server, every time.** Admin pages use
  `getViewer()`; admin server actions and routes use `requireAdmin()`. Hiding a
  button is never the check.
- **Server actions return results, not exceptions**: `{ ok: true, … }` or
  `{ ok: false, error, conflict? }`, and validate input with Zod. A `conflict`
  means "reload", and the editor turns off idle auto-save when it sees one.
- **Caching**: content reads are cached under the `content` tag, stats under
  `stats`. After a change, server actions call `updateTag(tag)`; route
  handlers call `revalidateTag(tag, { expire: 0 })`.
- **GitHub calls belong to admin paths and the sync only.** Public pages read Neon.
- **Optimistic concurrency for git writes**: drafts compare the branch head,
  notes compare file blob shas. Nothing force-pushes.
- **Every upload has an `asset` row before the object exists**, so cleanup can
  always find it.
- **UI text goes in the translation files** for all three locales; content text
  never does.
- **Database changes**: edit `src/lib/db/schema.ts`, run
  `npm run db:generate`, review the SQL in `drizzle/`, then `npm run db:migrate`.
- **Next.js 16**: read `node_modules/next/dist/docs/` before using a Next API
  (see `AGENTS.md`).

## Common changes

| To… | Change |
|---|---|
| Add a field to meta.yml or the frontmatter | `src/lib/content/schema.ts`, then `parse.ts`/`sync.ts` (and a column if lists need it), and `src/lib/editor/format.ts` (parse/serialize + form field in `Editor.tsx`) |
| Add an MDX component for content | `mdx-components.tsx` (allowlist), plus a snippet in `CodeEditor.tsx` |
| Add a UI string | the same key in `src/translations/{en,ru,uz}.json` |
| Add a table or column | `src/lib/db/schema.ts` → `npm run db:generate` → `npm run db:migrate` |
| Add a scheduled task | a route under `src/app/api/cron/` checking `isCronAuthorized`, and a function in `netlify/functions/` that calls it |
| Change who is admin | `ADMIN_GITHUB_IDS` (numeric GitHub ids) |
| Change comment limits | constants at the top of `src/lib/engagement/comments.ts` (and the `comment_body_length` check in a migration for the length) |

## Scripts and jobs

| Command / job | What it does |
|---|---|
| `npm run dev` / `build` / `lint` / `typecheck` | the usual; the pre-commit hook runs lint and build |
| `npm run content:sync` | sync main of `blog-db` into Neon from your machine |
| `npm run webhook:dev` | forward GitHub webhooks to localhost through smee.io |
| `npm run db:generate` / `db:migrate` / `db:studio` | Drizzle migrations and a database browser |
| `daily-maintenance` (Netlify, 04:00 UTC) | `/api/cron/daily`: re-sync, prune view events, sweep orphan images |
| `scheduled-publish` (Netlify, hourly) | `/api/cron/publish`: publish due scheduled drafts |
