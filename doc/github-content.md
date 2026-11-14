# How content flows through GitHub

This explains the GitHub keys in `.env`, what each one is for, and what we're
building with them (PLAN.md phase 2, plus the editor in phase 5).

## The idea in one paragraph

Articles, posts, series and notes live as files in a **private GitHub repo**
(`blog-db`), not in this app's repo and not in the database. Git gives us
history, diffs and drafts for free, and you can still write in VS Code and
`git push`. The blog app talks to that repo through a **GitHub App**: it reads
files when rendering, writes commits when you save or publish from the editor,
and GitHub tells it about every push through a **webhook**, so the site updates
within seconds.

```
            you, in VS Code                 you, in the /admin editor (phase 5)
                   │ git push                          │ Save / Publish
                   ▼                                   ▼
   ┌───────────── blog-db (private repo) ──────────────────────┐
   │ main          published content                                │
   │ draft/<slug>  one branch per piece in progress                 │
   └───────┬─────────────────────────────────────────────▲──────────┘
           │ push to main → webhook (signed)             │ read files, write commits
           ▼                                             │ (installation token)
   ┌──────────────────────── blog app (this repo) ──────────────────┐
   │ /api/webhooks/github                                           │
   │   1. verify signature with GITHUB_WEBHOOK_SECRET               │
   │   2. read changed meta.yml / <locale>.mdx, validate with Zod   │
   │   3. upsert the content index in Neon                          │
   │   4. revalidateTag → affected pages re-render                  │
   │                                                                │
   │ pages: read the Neon index (cached until the next sync)        │
   └────────────────────────────────────────────────────────────────┘
```

## The keys, one by one

| Variable | What it is | Analogy |
|---|---|---|
| `GITHUB_CONTENT_REPO` | `owner/name` of the content repo | The address |
| `GITHUB_APP_ID` | Public number that identifies the app | A username |
| `GITHUB_APP_PRIVATE_KEY` | RSA key that proves a request really comes from the app | The password. Secret. |
| `GITHUB_APP_INSTALLATION_ID` | Which install of the app to act as (you installed it on `blog-db` only) | Which door the key opens |
| `GITHUB_WEBHOOK_SECRET` | Shared secret GitHub uses to sign webhook requests | A wax seal on letters GitHub sends us |

### How the app logs in to GitHub

A GitHub App never uses your personal password or a long-lived token. Every
time the app needs GitHub, it goes through two short-lived steps:

1. **App JWT (10 minutes).** The app signs a small token with
   `GITHUB_APP_PRIVATE_KEY`, saying "I am app `GITHUB_APP_ID`". GitHub checks it
   with the public half of the key, which it kept when you generated the key.
   This token can only manage the app itself, not read any repo.
2. **Installation token (1 hour).** The app exchanges the JWT for a token for
   installation `GITHUB_APP_INSTALLATION_ID`. That token can do exactly what you
   allowed when installing: **Contents read and write on `blog-db` only**.
   It can't touch your other repos, and it expires on its own.

`@octokit/auth-app` does both steps and refreshes the token automatically.

Why not a personal access token? A PAT acts as *you*, often across all your
repos, and lives until you revoke it. If it leaked, everything would be
exposed. The App's access is limited to one repo, one permission, and tokens
that expire within an hour.

### How the webhook works

When anything is pushed to `blog-db`, GitHub sends an HTTP `POST` to the
app's webhook URL with a JSON description of the push: the branch, the commits,
and which files were added, modified or removed.

Anyone on the internet could send a fake request to that URL, so GitHub signs
every request: it computes an HMAC-SHA256 of the body with
`GITHUB_WEBHOOK_SECRET` and sends it in the `X-Hub-Signature-256` header. The
app recomputes the signature with its copy of the secret and rejects the
request if they differ. Only GitHub and the app know the secret, so a valid
signature proves the request is genuine and unmodified.

**smee.io (local development only).** GitHub can't reach `localhost`. smee.io
is a public relay: GitHub sends to your smee URL, and `npm run webhook:dev`
(the `smee-client` package) forwards each request to
`http://localhost:3000/api/webhooks/github`. In production the webhook URL is
the real site, and smee isn't involved.

## What we're building

### Phase 2: GitHub as the content source (built)

1. **The content lives in `blog-db`**, same layout as before
   (`<type>/<slug>/meta.yml` + `<locale>.mdx`), at the repo root.
2. **A content index in Neon** (`src/lib/db/schema.ts`):
   - `content_files`: a raw copy of every content file on `main`, with its git
     blob sha. A sync compares shas and downloads only files that changed.
   - `content_items` / `content_translations`: one row per piece and one per
     language (title, summary, status, reading time, tags, series order and the
     MDX body). Pages read only these, so rendering never calls GitHub.
   - `content_sync`: which commit is indexed and which files were rejected.
3. **The sync** (`src/lib/content/sync.ts`): read `main`'s file tree (one
   request), download changed blobs, validate every piece with the Zod schemas,
   then update Neon in one transaction. An invalid piece is reported and keeps
   its last good version, so one typo never takes a page down.
4. **`/api/webhooks/github`**: verifies the signature, ignores anything that
   isn't a push to `main` of the content repo, runs the sync, and revalidates the
   `content` cache tag so pages show the new version on their next visit.
5. **Other ways to sync:** `npm run content:sync` (local),
   `/api/content/sync` with `Authorization: Bearer $CRON_SECRET` (by hand), and
   the daily Netlify scheduled function (`/api/cron/daily`) in case a webhook was missed.
6. **Offline:** `CONTENT_SOURCE=local` with `CONTENT_DIR` pointing at a clone
   of `blog-db` parses files directly, without Neon.

### Phase 5: writing from the editor

The editor uses the same installation token to **write**:

- **Save** commits to `draft/<slug>`, creating the branch from `main` the first
  time. One commit can contain several files (via the Git Data API: blob → tree
  → commit → update ref).
- **Publish** merges `draft/<slug>` into `main` with a merge commit, which
  keeps the draft's history. That push to `main` triggers the webhook, so
  publishing from the editor and pushing from VS Code take the same path.
- **Drafts list** = the repo's `draft/*` branches. **History** = the commits of
  a file.

### Rate limits

An installation token allows about 5,000 API requests per hour. Pages never
call GitHub: they read Neon, cached until a sync invalidates it. Only the sync
and the editor call GitHub, and a sync downloads only changed files.

## If a key leaks

- **Private key:** app settings → **Private keys** → delete it and generate a
  new one. Old installation tokens die within an hour.
- **Webhook secret:** generate a new one, update it in the app settings and in
  `.env`.
- Keep the downloaded `.pem` somewhere safe (a password manager), or delete it
  once it's in `.env`. You can always generate a new key.
