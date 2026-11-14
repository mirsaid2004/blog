# Development Plan — M_DEV Blog

_Last updated: 2026-11-14_

## Goals

- Public content: **articles**, **posts**, **series**. A series is an ordered collection of **existing** articles and posts, mixed freely.
- **Multilingual content:** any article, post, series or note can be written in **en**, **ru** and/or **uz**.
- Private **notes** (admin only).
- **Authentication** via GitHub / Google OAuth.
- **Ratings** and **view counts** for every article, post and series.
- A custom **MDX editor** for writing and publishing.
- Content stored in a **separate GitHub repo**; users, ratings and views in **Neon (Postgres)**.

## Summary of recommendations

The overall architecture holds up: content in git, metadata and stats in Postgres, OAuth for login. Key recommendations:

1. **Use Better Auth instead of NextAuth.** Auth.js (NextAuth) has been in security-only maintenance since its maintainers handed it to the Better Auth team in September 2025. Those maintainers now point new projects to Better Auth, and Auth.js v5 never left beta.
2. **Don't treat GitHub as your database.** Keep the MDX bodies in GitHub, but put a content index (slug, title, tags, series, status) in Neon, synced by webhook. Otherwise every list page and search has to call the GitHub API.
3. **Keep drafts in GitHub too, on a branch per piece.** All content, drafts included, lives in git, so you get searchable history. Use explicit or idle commits, never one commit per keystroke autosave.
4. **Store images in Cloudflare R2, not in git.** Use content-hashed, immutable keys so every git commit still renders. Track each upload in a small Neon `asset` table, so discarding a draft deletes exactly the images that never reached `main`.
5. **One folder per piece, one file per language.** A shared `meta.yml` holds language-independent fields, and `en.mdx`, `ru.mdx` and `uz.mdx` hold the translations. All translations share one `id`, slug, images, ratings and views, and each language has its own publish status.

Neon holds only what git can't do well: users, sessions, ratings, views, the published-content index and image bookkeeping.

---

## 1. What's missing today

| Area | Current state |
|---|---|
| Detail pages | `BlogCard` links to `/blog/[slug]`, but no detail route exists, so every card leads to a 404. There are no article, post or series pages. |
| Data | All content is hardcoded mock data, copied across `LatestBlogs`, `TopPicks` and the three list pages. There are no content types or schema. |
| Content pipeline | No MDX rendering, no content source, no caching or revalidation. |
| Auth / DB | None. There are no dependencies, environment config or API routes for either. |
| Editor / admin | None. |
| Notes | Not started. |
| Search / filters | The search box and category pills exist in the UI, but nothing is wired up behind them. |
| Content i18n | next-intl translates the UI strings only. There's no model yet for content written in several languages. |
| Footer | Links to `/contact`, `/blog`, `/#about` and `/#projects` don't exist. They look copied from a portfolio site. |
| SEO | No per-page metadata, sitemap, RSS feed or Open Graph images. |
| Next 16 | `middleware.ts` still works, but Next 16 renamed it `proxy.ts`. |
| Small items | The `serieses` route should be `/series`. Images hotlink from Google's image CDN. The README is still boilerplate. |

---

## 2. Target architecture

```
┌──────────────── content repo (GitHub, private) ────────────────────┐
│ main            ← published content only                           │
│ draft/<slug>    ← one branch per piece in progress                 │
│                                                                    │
│ articles|posts|series/<slug>/                                      │
│   meta.yml   ← shared: id, tags, cover, dates, series items        │
│   en.mdx  ru.mdx  uz.mdx   ← one file per available language       │
└───────▲ Save → commit to draft/<slug>      │ push to main → webhook ┘
        │ Publish → merge into main          ▼
   MDX editor (/admin) ──► Next.js app ──► /api/webhooks/github (main only)
   (IndexedDB autosave)      │   │   │       ├─ parse frontmatter → upsert `content` index in Neon
        │                    │   │   │       └─ revalidateTag("content:<slug>")
        │                    │   │   └─ page render: fetch MDX by path (cached) → compile (RSC)
        │                    │   └─ Neon: users/sessions, published-content index, ratings, views, assets
        │                    └─ presigned PUT URL (admin only) + `asset` row
        ▼
   Cloudflare R2  ── blog-media (public, img.<domain>, CDN-cached)
                  └─ blog-notes-media (private, signed GET URLs)
```

### 2.1 Content storage in GitHub

**Why it works:** version history, diffs and rollback come for free. You can also write in VS Code and just push, and your content isn't locked into the app.

**How to do it well:**

- **Use a GitHub App, not a personal access token.** An App's permissions can be scoped to the one content repo, and its tokens are short-lived. Authenticated requests are limited to roughly 5,000 per hour, so never fetch from GitHub on an uncached request.
- **Commit with the Git Data API** (tree → commit → update ref). That way one publish writes the MDX file and its images as a single commit. The simpler Contents API only writes one file per commit.
- **Use the webhook as the sync point.** It reacts only to pushes to `main`, so pushes to `draft/*` branches are ignored. On each push to `main`:
  1. Check the `X-Hub-Signature-256` signature.
  2. Parse `meta.yml` and the frontmatter of the changed files. The path gives the type, slug and locale.
  3. Upsert those rows in Neon.
  4. Call `revalidateTag`.

  Pages render statically and only update when content changes.
- **Make the repo private.** It holds unpublished drafts on `draft/*` branches. The app reads it through the App's token.
- **Validate frontmatter with Zod** in the webhook and in the editor, so a malformed file can never break production.

Content repo layout:

```
articles/<slug>/meta.yml
articles/<slug>/en.mdx
articles/<slug>/ru.mdx
articles/<slug>/uz.mdx
posts/<slug>/meta.yml + <locale>.mdx
series/<slug>/meta.yml + <locale>.mdx
```

The repo holds text only. Images live in R2 (see [2.3](#23-media-cloudflare-r2)). See [2.1.1](#211-multilingual-content) for how the languages fit together.

`meta.yml` holds the fields shared by every language:

```yaml
# articles/distributed-sagas/meta.yml
id: 01JC8Z6R4K2M9X7Q3T5V8W1Y2A   # stable ULID; never changes, even if the slug does
originalLocale: en               # the language it was written in; source for translations
publishedAt: 2026-11-07
tags: [systems, architecture]
cover: content/01JC8Z6R4K2M9X7Q3T5V8W1Y2A/3f9a1c0e7b2d4a6f.webp   # R2 key, not a URL
```

The type and slug come from the folder path (`articles/distributed-sagas/`), so they can't drift from it.

Each `<locale>.mdx` holds what differs per language:

```yaml
# articles/distributed-sagas/ru.mdx
---
title: Осваиваем распределённые саги
summary: …
status: published        # draft | published, per language (scheduled comes in Phase 6)
translatedFrom: 4e1b9c2  # optional: git sha of the source file this translation is based on
---

Тело статьи на русском…
```

Articles and posts don't declare which series they belong to. Membership and order live in the series `meta.yml` (see [2.1.2](#212-series-model)).

#### 2.1.1 Multilingual content

A piece is **one** piece in up to three languages, not three separate pieces. All translations share:

- the `id`, slug, tags, cover and images (`content/<id>/…` in R2),
- ratings and view counts (stored per piece; views also record the locale for analytics),
- series membership,
- one draft branch (`draft/<slug>`) that covers every language.

Each translation has its **own** title, summary, body and **status**, so you can publish English now and keep Russian as a `draft` in the same piece.

**Why this layout:**

- **Shared fields can't drift.** Tags, cover and dates live once in `meta.yml`, not copied into three files.
- **Translations are independent files,** so git history, diffs and the editor's history panel work per language.
- **A missing translation is just a missing file.** No placeholder content is needed.
- **Flat `en.mdx` instead of `en/content.mdx`.** Images live in R2, so a locale folder would only ever hold one file.

**Slugs:** use one shared Latin slug for all languages (`/ru/articles/distributed-sagas`). It keeps URLs stable and readable, makes translations easy to link, and avoids Cyrillic or transliterated URLs. Per-language slugs could be added later with an optional `slug` field in `<locale>.mdx` (see Open decisions).

**Routing and fallback:**

- Routes stay under the existing next-intl prefix: `/[locale]/articles/[slug]`, `/[locale]/posts/[slug]`, `/[locale]/series/[slug]`.
- **Translation exists and is published:** render it.
- **Translation missing or still a draft:** render the `originalLocale` version with a notice ("Not available in Uzbek yet — showing English") and a language switcher. Set the canonical URL to the original, and mark the fallback `noindex` so search engines don't see duplicates.
- **Lists in a locale** show pieces available in that language first. Others can appear with a language badge (`EN`) or be hidden (see Open decisions).
- **Language switcher on a piece:** lists only the languages that piece is actually published in.

**SEO:**

- `generateMetadata` emits `alternates.languages` (hreflang) for every published translation, plus `x-default` pointing at the original.
- The sitemap lists every published translation with its alternates.
- Generate one RSS feed per locale.

**Keeping translations in sync:** when the original file changes after a translation was last updated, flag the translation as **possibly outdated**. Compare commit dates, or `translatedFrom` against the source file's current sha. The editor shows the flag and a diff of what changed in the original since then.

**UI strings versus content:** next-intl's JSON files keep handling interface text (nav, buttons, footer). Article text never goes there.

#### 2.1.2 Series model

A series is an **ordered collection of existing articles and posts**, which can be mixed in one series. An article or post stays a normal standalone piece with its own URL, ratings and views. The series only groups and orders them.

**The series `meta.yml` owns membership and order,** shared by all languages:

```yaml
# series/distributed-systems/meta.yml
id: 01JC9A2B3C4D5E6F7G8H9J0K1M
originalLocale: en
publishedAt: 2026-11-07
cover: content/01JC9A2B3C4D5E6F7G8H9J0K1M/9b1e4d2a7c3f6e80.webp
items:                              # order = reading order
  - 01JC8Z6R4K2M9X7Q3T5V8W1Y2A      # article: Mastering Distributed Sagas
  - 01JC8ZB1N7P3Q5R8S2T4V6W9X0      # post: Quick note on idempotency keys
  - 01JC8ZC4D6F8G0H2J4K6M8N0P2      # article: Outbox pattern in practice
```

Each language file holds the series title, summary and intro:

```yaml
# series/distributed-systems/uz.mdx
---
title: Taqsimlangan tizimlar noldan
summary: …
status: published
---

Seriya sahifasining yuqorisida ko'rsatiladigan kirish matni.
```

**Why the series owns the list, rather than each piece declaring `series: { slug, part }`:**

- **Reordering edits one file.** You don't have to renumber `part` in every piece.
- **Existing content joins without edits.** Adding an older article or post to a series doesn't touch its file, history or published state.
- **Items are referenced by `id`, not slug,** so renaming a piece never breaks a series.
- **A piece can belong to more than one series** without conflicting frontmatter (see Open decisions).

**Rules:**

- **Only published items are shown.** Draft or scheduled items are hidden from the public series page and skipped in previous/next navigation. They appear automatically once published.
- **Validation in the webhook and editor:** every id must exist and be an article or post (series can't nest), with no duplicates. An unknown id is reported as a warning and skipped, so it never breaks the build.
- **Deleting an article or post** that a series references leaves a dangling id. The webhook flags it, and the editor offers to remove it from the series.
- **Series are content too.** They get an `id`, a row in the `content` table (`type = 'series'`), and their own ratings and views. They also go through the same draft branch flow, as `draft/series-<slug>`.

**Reading experience:**

- **Series page** (`/series/<slug>`): intro, ordered list of items with a type badge (article or post), reading time and progress, plus aggregate reading time.
- **On an article or post page:** a "Part 2 of 5 in *Distributed Systems from Scratch*" banner, previous/next links and a collapsible table of contents for the series.
- **When a piece is in several series:** the series context comes from the link the reader followed (`?series=<slug>`). Without it, show the banner for each series the piece belongs to.
- **Series in a language:** each item is shown in the reader's language if that translation is published. Otherwise it follows the fallback rule from [2.1.1](#211-multilingual-content), with a language badge on the item. One missing translation never removes an item from the series.

### 2.2 Drafts and history in git

All content, drafts included, lives in GitHub. Each piece in progress gets its own branch, so `main` stays clean and every draft has a searchable history.

```
main                 ← published content only; the webhook syncs this branch
draft/<slug>         ← one branch per piece in progress
```

**Why not commit on every autosave?** An editor autosaves every few seconds, and turning each save into a commit causes problems:

- **Noisy history.** Hundreds of "wip" commits per article bury the history you want to search.
- **Rate limits.** One commit through the Git Data API takes about four calls (blob, tree, commit, update ref). Saving every 5 seconds is about 2,900 calls an hour from one open tab, against a limit of about 5,000.
- **Latency.** Each save takes roughly 0.5–1.5 seconds and can fail.

**Workflow:**

1. **Save, with an optional idle commit.** Commit to `draft/<slug>` when you press Save, or after about 60 seconds without typing. That gives meaningful checkpoints, not keystroke noise.
2. **Keystroke autosave stays local.** Keep it in IndexedDB in the browser. It's only crash recovery between commits, not a source of truth, so Neon has no `draft` table.
3. **Publish merges into `main`.** Use a merge commit rather than a squash, so the full draft history stays reachable from `main`. Then delete the branch, or keep it.
4. **Editing published content.** Create `draft/<slug>` from `main`, edit, and merge again. Every revision appears in git history.
   - **Languages share the branch.** One `draft/<slug>` covers every language of a piece. Publishing merges all of them, and each file's `status` decides which languages are visible. To ship English now and Russian later, set `ru.mdx` to `status: draft`, publish, and flip it in a later draft.
5. **Discarding a draft.** Delete the `draft/<slug>` branch, then delete that draft's unpublished images from R2 (see [2.3](#23-media-cloudflare-r2)).
6. **Listing drafts.** One API call lists the branches matching `draft/*` (`GET /repos/{owner}/{repo}/branches`). No database index is needed.
7. **History search.** `GET /repos/{owner}/{repo}/commits?path=<file>&sha=<branch>` lists a file's commits, and `GET /repos/{owner}/{repo}/commits/{sha}` returns each diff. Cache these responses, since every history view costs API calls.
8. **Conflicts.** If `main` changed under a draft (for example you edited the file in VS Code), detect it when merging. Show the diff, or rebase the draft with the merges API.

**Simpler alternative:** keep drafts on `main` with `status: draft` in the frontmatter, and have the webhook skip them. It's less code, but drafts and published content share one noisy history.

### 2.3 Media: Cloudflare R2

**Why images don't go in git:**

- **Every version stays forever.** Git keeps every version of every image, so the repo only grows, even after you replace or delete one. Clones and API calls get slower.
- **A private repo can't serve images directly.** Every image request would go through the app with the GitHub App token. That adds latency, uses the API rate limit and gets no CDN caching.
- **Uploads through the API are inefficient.** Images go through the Git Data API base64-encoded, which adds about 33% to the size and makes publishing slower.

**Why R2:**

- No egress fees, and S3-compatible APIs, so the standard AWS SDK works.
- A custom domain (`img.<domain>`) behind Cloudflare's CDN.
- Presigned uploads straight from the browser.
- Effectively free at blog scale. Check the current R2 pricing page for the exact free allowance.

**Buckets:**

| Bucket | Access | Used for |
|---|---|---|
| `blog-media` | Public, custom domain, CDN-cached | Article, post and series images and covers |
| `blog-notes-media` | Private | Note images, served through short-lived signed GET URLs or an admin-only proxy route |

#### Keys: content-addressed and immutable

```
content/<contentId>/<sha256-first-16-hex>.webp
```

- **`contentId` is the stable `id` from the frontmatter,** not the slug, so renaming a slug never moves images. It also scopes every image to one piece, which makes per-piece deletion simple.
- **Named by content hash.** Uploading the same image twice in one piece reuses the existing key, and a changed image always gets a new key.
- **Never overwritten.** Serve with `Cache-Control: public, max-age=31536000, immutable`. Every commit in git history keeps rendering, because the images it references never change.
- **MDX stores keys, not URLs.** A rehype plugin or the `<Img>` component adds `NEXT_PUBLIC_ASSETS_URL`, so changing domains needs no content edits.

#### Upload flow

1. You paste or drop an image in the editor.
2. The client resizes it (capped width) and converts it to WebP or AVIF, then hashes it.
3. A server action checks the admin session, **inserts the `asset` row first**, then returns a presigned PUT URL for that key.
4. The browser uploads directly to R2.
5. The editor inserts `<Img src="content/<id>/<hash>.webp" width={1600} height={900} alt="…" />`. The width and height prevent layout shift.

Inserting the row before the upload means no object can exist in R2 without a record, so nothing escapes cleanup.

#### Deleting images with their draft

Every upload is recorded in Neon:

```
asset (key PK, content_id, draft_branch, bucket, bytes, created_at, published_at NULL)
```

The rule is that **an image is deletable only while it has never reached `main`**. Once published, it is part of permanent history and kept.

| Event | What happens |
|---|---|
| Upload | Insert `asset` with `draft_branch = draft/<slug>` and `published_at = NULL`. |
| Publish (merge into `main`) | `UPDATE asset SET published_at = now() WHERE draft_branch = …`. The merge commit brings all of the draft's commits into `main`'s history, so every image they reference is now permanent. |
| Discard draft | Delete the branch. Then `SELECT key FROM asset WHERE draft_branch = … AND published_at IS NULL`, delete those keys from R2 with `DeleteObjects` (up to 1,000 keys per request), and delete the rows. |
| Discard a never-published piece | Same as above. All of its images are unpublished, so the whole `content/<id>/` prefix goes. |
| Discard a re-edit of a published piece | Only the images added in that draft are deleted. Images already published stay. |
| Hard-delete a published piece | Optional "purge" action: remove the files from `main` and delete every `content/<id>/` object and row. Old commits of that piece then show broken images, which is acceptable for a piece you deleted on purpose. |

**Safety-net sweeper (weekly cron):** delete assets where `published_at IS NULL` and either

- the `draft_branch` no longer exists (for example, a branch deleted in the GitHub UI), or
- the image is no longer referenced by any commit on its draft branch (for example, pasted then removed before a Save).

Skip anything younger than 24 hours, so an in-flight upload is never deleted.

**If you choose squash merges** (see Open decisions), only images in the final squashed content reach `main`'s history. On publish, mark only those as published and delete the intermediate ones.

**Notes** use the same table with `bucket = blog-notes-media` and no draft branch. Deleting a note deletes its `content/<id>/` prefix.

#### Rendering

- Add `img.<domain>` to `images.remotePatterns` in `next.config.ts`.
- To avoid Vercel's image-optimization quota, use a custom `next/image` loader backed by Cloudflare Image Transformations, or serve the client-resized files with `unoptimized`. Check Cloudflare's free tier for transformations.

#### Tradeoffs

- **Draft images are public** if someone has the URL. The hashed keys can't be guessed, which is fine for blog images but not for anything secret. Note images use the private bucket.
- **History is split.** Git holds the text history, and R2 holds the images it refers to. Immutable keys and the published-only deletion rule keep the two in sync.

### 2.4 MDX rendering

- **Don't use `next-mdx-remote`.** Its repository was archived in April 2026. Use **`next-mdx-remote-client/rsc`**, the maintained fork.
- **Plugins:**
  - `remark-gfm`
  - `rehype-slug` and `rehype-autolink-headings`, for the table of contents
  - Shiki through `rehype-pretty-code`, for syntax highlighting at build time
- **Restrict components.** Pass an explicit allowlist (`<Callout>`, `<CodeTabs>`, `<Diagram>`, …). MDX is executable code, which is fine while you are the only author, but keep the boundary clear.

### 2.5 Auth: Better Auth with GitHub and Google

- It has GitHub and Google providers, a Drizzle adapter for Postgres, sessions in your own Neon database, and a built-in admin and roles plugin.
- **Roles:**
  - `admin` is you, matched by GitHub user ID in an environment allowlist, never by email.
  - `reader` is anyone signed in.
- Readers only need an account to **rate**. Reading, and counting views, works without login.
- **Enforce admin checks on the server.** Check in every admin server action and route handler, not only in `proxy.ts`. Middleware-only checks have caused real auth bypasses in Next.js.
- **Alternative to look at:** Neon offers a managed auth product built on Better Auth. Self-hosted Better Auth keeps you portable.

### 2.6 Database: Neon with Drizzle

Neon holds only what git can't do well: users and sessions, ratings, views, the **published**-content index for fast lists and search, and image bookkeeping. Draft content is not stored here.

Schema:

```
user / session / account / verification   ← generated by Better Auth

content       (id, type, slug UNIQUE per type, original_locale, tags[], cover,
               published_at, updated_at)
               ← one row per piece, from meta.yml; type: article | post | series
content_translation (content_id → content.id, locale, title, summary, status,
               repo_path, git_sha, reading_minutes, source_sha, search tsvector, updated_at)
               PK(content_id, locale)   ← one row per language file
series_item   (series_id → content.id, item_id → content.id, position)
               PK(series_id, item_id); index on item_id   ← rebuilt from the series meta.yml on each sync
rating        (user_id, content_id, value 1–5, created_at)   UNIQUE(user_id, content_id)
content_stats (content_id PK, views, rating_sum, rating_count)   ← denormalised, cheap reads
view_event    (content_id, locale, visitor_hash, day)   UNIQUE(content_id, visitor_hash, day)   ← dedupe; prune after 30–90 days
asset         (key PK, content_id, draft_branch, bucket, bytes, created_at, published_at)   ← R2 bookkeeping, see 2.3
```

- **Count views without slowing the page.** Increment from `after()` in the route, or from a small client beacon. Hash the IP, user agent and a daily salt, so the count is deduplicated per visitor per day without storing raw IPs. Bots inflate counts, so filter by user agent.
- **Ratings:**
  - Upsert on `(user_id, content_id)` and update `content_stats` in the same transaction.
  - Show "4.8 (24)" only once a post passes a minimum number of ratings.
- **Cold starts:** on the free tier, Neon scales to zero and the first query after idle can take a few seconds. Cache the stats reads (`"use cache"` with a short lifetime) so pages never wait on a cold database.
- **Ratings and views are per piece, not per language.** A rating applies to the piece whichever translation the reader saw. `view_event.locale` still lets the admin dashboard show views by language.
- **Search:** with the index in Postgres, a `tsvector` column per translation is enough for the hero search. You don't need an external search service.
  - Use the matching text-search configuration per language: `english` for en and `russian` for ru. Postgres has no Uzbek configuration, so use `simple` for uz.
  - Search the reader's locale first, then fall back to other languages.
- **Series queries:**
  - A series page joins `series_item` to `content` and `content_translation` (reader's locale, with fallback), filtered to published items and ordered by `position`.
  - A piece's series banners come from `series_item WHERE item_id = …`.
  - When a series `meta.yml` changes, the webhook replaces that series' `series_item` rows in one transaction.

### 2.7 Notes (private)

- Store notes in a separate private repo (`blog-notes`), or in the content repo under `notes/`, which the webhook never indexes as public.
- Serve them only under `/admin/notes`, behind the server-side admin check.
- Use the same editor and pipeline, with no ratings or views. Notes can be committed directly, without a draft branch, since they are never published.
- Use the same layout as public content: `notes/<slug>/meta.yml` + `en.mdx` / `ru.mdx` / `uz.mdx`, written in whichever languages you like.
- Note images go to the private `blog-notes-media` bucket and are deleted with the note.

### 2.8 The MDX editor

This part is the most work, so pick the editing model first:

| Option | Strengths | Weaknesses |
|---|---|---|
| **CodeMirror 6 source editor with live preview (recommended)** | Edits the actual MDX, so nothing is lost on save. The preview uses the same compiler as the live site, so what you see is what ships. Easy to add MDX/JSX syntax and snippets. Good for a developer. | Not WYSIWYG. |
| MDXEditor | True WYSIWYG for MDX on top of Lexical, with JSX component blocks. | Large bundle (one source reports about 850 kB gzipped, which matters less on admin-only pages). Some inline rendering quirks are reported. Unusual MDX can fail to round-trip. |
| Tiptap / Milkdown | Excellent rich-text editing. | Built around a rich-text model. Converting MDX with JSX in and out loses information, so you'd write the converters yourself. |

**Recommendation:** start with CodeMirror 6 in a split view. Add WYSIWYG later only if you miss it.

Features in priority order:

1. A form for `meta.yml` and the per-language frontmatter, validated by the same Zod schemas, plus the MDX body editor and a live preview.
   - **Language tabs** (EN / RU / UZ) in one piece, each with its own status. "Add translation" creates the file.
   - **Translate mode:** the original language read-only on one side, the translation on the other.
   - **"Possibly outdated" flag** on a translation when the original changed after it, with a diff of the changes.
   - **Translation matrix** in the content list: one row per piece, one column per language (published / draft / missing / outdated).
2. Local autosave to IndexedDB; **Save** (and idle commit) to `draft/<slug>`; **Publish** merges into `main`. See [2.2](#22-drafts-and-history-in-git).
3. A drafts list (the `draft/*` branches) and a history panel: commit list per file, diff view, restore an old version.
4. Paste or drag-and-drop images: client-side resize, hash, presigned upload to R2. **Discard draft** deletes the branch and its unpublished images. See [2.3](#23-media-cloudflare-r2).
5. A slash menu or snippets for your allowlisted MDX components.
6. **Series builder:** search and pick existing articles and posts, reorder by drag and drop, see each item's status (draft items are marked as hidden until published), and warn about dangling ids. It writes the `items` list in the series `meta.yml`.
7. Scheduled publishing (a cron job merges the draft branch at `publishedAt`) and a diff against `main` before publish.

---

## 3. Phased roadmap

| Phase | Scope | Done when |
|---|---|---|
| **0. Groundwork** (~2–3 days) | Zod schemas for `meta.yml` and per-language files, local `content/` fixtures in the `<type>/<slug>/{meta.yml,<locale>.mdx}` layout, a single locale-aware `getContent(locale)` data layer with fallback, rename `middleware.ts` to `proxy.ts`, fix the footer, rename `serieses` to `series`. | The mock data is gone and every list reads from one source. |
| **1. Read path** (~1 week) | Article, post and series detail pages; MDX pipeline; table of contents; series made of mixed articles and posts, with "Part X of Y" banner and previous/next navigation; per-piece language switcher, fallback notice, hreflang alternates; metadata, sitemap, RSS per locale and Open Graph images. | A blog fully readable from local files, with no backend yet. |
| **2. GitHub content and media** (~4–5 days) | Content repo, GitHub App, Neon `content` index, webhook sync (`main` only) and revalidation. R2 buckets, `img.<domain>` custom domain, `asset` table, `<Img>` component with key-to-URL resolution. | `git push` to `main` in the content repo shows up on the site within seconds, with images served from R2. |
| **3. Auth** (~3 days) | Better Auth with GitHub and Google, user menu, admin allowlist, guarded `/admin`. | You're admin and others are readers. |
| **4. Engagement** (~3–4 days) | Views with dedupe, ratings, stats on cards, "Top Picks" ranked by real data, Postgres search. | The numbers on the cards are real. |
| **5. Editor v1** (~2 weeks) | CodeMirror editor, live preview, language tabs and translate mode, translation matrix and outdated flags, IndexedDB autosave, draft branches (Save / idle commit), Publish as a merge into `main`, drafts list, history and diff panel, image upload to R2, Discard draft with image cleanup, weekly orphan sweeper. | You can write, revisit history, publish and discard without opening VS Code, and discarded drafts leave nothing behind in R2. |
| **6. Notes and polish** | Private notes, scheduled publishing, analytics dashboard in `/admin`, optional comments. | — |

Phase 1 comes before the backend on purpose. Detail pages and the MDX pipeline are the core of the product. Building them against local files means Phase 2 only replaces where content comes from.

---

## 4. Open decisions

- [x] **Content language.** Decided: any piece can be written in en, ru and/or uz, as `<type>/<slug>/meta.yml` plus one `<locale>.mdx` per language (see [2.1.1](#211-multilingual-content)).
- [ ] **Shared or per-language slugs?** One shared Latin slug for all languages (recommended), or optional localized slugs per language.
- [x] **Lists in a locale.** Decided: every published piece appears in every language's lists. A card shows which languages the piece is in when the reader's language is missing. Opening it shows a published version straight away, with a notice and buttons for the available languages. The notice says the reader's translation is "coming soon" only when that translation exists as a draft.
- [x] **Series model.** Decided: a series is an ordered list of existing articles and posts, which can be mixed (see [2.1.2](#212-series-model)).
- [x] **One series or several per piece?** Decided: several are allowed, though it will be rare. The `?series=` link decides which banner a reader sees.
- [ ] **Post versus article.** If a post is a short note with no cover or table of contents, keep one `content` table with a `type` column.
- [ ] **Publish merge style.** A merge commit keeps the full draft history reachable from `main` (recommended, since you want searchable history). A squash merge keeps `main` cleaner but leaves the history only on the draft branch. It also changes which images count as published (see [2.3](#23-media-cloudflare-r2)).
- [ ] **Image domain.** Pick the R2 custom domain, for example `img.<your-domain>`.
- [ ] **Hosting.** Vercel is the natural fit for ISR, `revalidateTag` and cron jobs. If you self-host, revalidation and cron need extra setup.

---

## 5. Proposed stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, RSC, `"use cache"`) |
| i18n | next-intl for UI strings (existing); content translations as `<locale>.mdx` files per piece, with per-language status and fallback |
| Content | Private GitHub repo + GitHub App + webhook; drafts on `draft/<slug>` branches |
| Editor autosave | IndexedDB (local crash recovery only) |
| MDX | `next-mdx-remote-client`, remark-gfm, rehype-slug, rehype-pretty-code (Shiki) |
| Validation | Zod |
| Auth | Better Auth (GitHub + Google), Drizzle adapter |
| Database | Neon Postgres + Drizzle ORM (users, ratings, views, published index, assets) |
| Editor | CodeMirror 6 + live MDX preview |
| Media | Cloudflare R2: `blog-media` (public, custom domain) and `blog-notes-media` (private); content-hashed immutable keys; `asset` table for cleanup |
| Hosting | Vercel |

---

## Sources

- [LogRocket: Best auth library for Next.js 2026](https://blog.logrocket.com/best-auth-library-nextjs-2026/)
- [startwithidentity: Auth.js status](https://startwithidentity.com/vendors/open-source/authjs.md)
- [Better Auth vs Clerk vs Auth.js (2026)](https://devtoolpicks.com/blog/better-auth-vs-clerk-vs-authjs-indie-hackers-2026)
- [PkgPulse: next-auth vs better-auth](https://www.pkgpulse.com/compare/next-auth-vs-better-auth)
- [next-mdx-remote discussion #438](https://github.com/hashicorp/next-mdx-remote/discussions/438)
- [next-mdx-remote-client on npm](https://npmjs.com/package/next-mdx-remote-client)
- [Neon: free to production FAQ](https://neon.com/faqs/postgres-services-free-to-production)
- [Neon pricing 2026 breakdown](https://www.activepieces.com/blog/neon-pricing-2026-plans-free-tier-limits-and-costs)
- [Neon free tier notes](https://agentdeals.dev/vendor/neon)
- [MDXEditor README](https://cdn.jsdelivr.net/npm/@mdxeditor/editor@4.0.1/README.md)
- [Strapi: Markdown editors for React compared](https://strapi.io/blog/top-5-markdown-editors-for-react)
- [PkgPulse: Tiptap vs Lexical vs Slate vs Quill 2026](https://www.pkgpulse.com/guides/tiptap-vs-lexical-vs-slate-vs-quill-rich-text-editor-2026)
