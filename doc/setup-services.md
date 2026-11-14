# Setting up the external services

The backend (PLAN.md phases 2–6) needs five services. Create each one, then
copy `.env.example` to `.env` and fill in the values. Keep `.env` private:
never commit it or paste it into chats or issues.

Set everything up for **local development** (`http://localhost:3000`) first.
The production values for `blog.mirsaidmirakhmedov.uz` are listed at the end.

## 1. Neon (database)

1. Create a project at [console.neon.tech](https://console.neon.tech). Pick
   the region closest to your readers (for example AWS Frankfurt,
   `eu-central-1`).
2. Keep the default `neondb` database, or create one named `blog`.
3. In **Connect**, copy two connection strings:
   - with **Connection pooling** on → `DATABASE_URL`
   - with **Connection pooling** off → `DATABASE_URL_UNPOOLED`

## 2. Content repo and GitHub App

**Repo:** create a **private** repository, for example `mirsaid2004/blog-db`.
Set `GITHUB_CONTENT_REPO` to `owner/name`. Private notes live in the same repo
under `notes/`; the webhook never indexes them.

**App:** GitHub → Settings → Developer settings → GitHub Apps → **New GitHub App**.

| Field | Value |
|---|---|
| Name | anything, e.g. `mdev-blog-content` |
| Homepage URL | `https://blog.mirsaidmirakhmedov.uz` |
| Webhook | **Active**. URL: a forwarding URL for local development (see below). Secret: a random string → `GITHUB_WEBHOOK_SECRET` (`openssl rand -hex 32`) |
| Repository permissions | **Contents: Read and write** (Metadata: read-only is added automatically) |
| Subscribe to events | **Push** |
| Where can it be installed | Only on this account |

Then:

1. Note the **App ID** → `GITHUB_APP_ID`.
2. **Generate a private key**. GitHub creates the key and your browser
   downloads it as a `.pem` file; GitHub keeps only the public half, so this
   file is the only copy. `.env` values must fit on one line, so the key is
   stored with each newline written as `\n` inside double quotes. Next.js turns
   `\n` back into real newlines when it loads `.env`. This command validates the
   key and writes it into `.env` without printing it:

   ```bash
   node -e '
   const fs = require("fs"), crypto = require("crypto");
   const pem = fs.readFileSync(process.argv[1], "utf8").trim();
   crypto.createPrivateKey(pem); // throws if the file is not a valid key
   const line = "GITHUB_APP_PRIVATE_KEY=\"" + pem.replace(/\r?\n/g, "\\n") + "\"";
   const env = fs.readFileSync(".env", "utf8");
   fs.writeFileSync(".env", /^GITHUB_APP_PRIVATE_KEY=/m.test(env)
     ? env.replace(/^GITHUB_APP_PRIVATE_KEY=.*$/m, () => line)
     : env + "\n" + line + "\n");
   console.log("written");
   ' ~/Downloads/<your-app>.<date>.private-key.pem
   ```

   Afterwards, store the `.pem` in a password manager or delete it. If it's
   lost, generate a new key in the app settings and delete the old one.
3. **Install App** → only select the content repo. The installation id is the
   number at the end of the page URL
   (`…/settings/installations/<id>`) → `GITHUB_APP_INSTALLATION_ID`. To find
   it again later: [github.com/settings/installations](https://github.com/settings/installations)
   → **Configure** next to the app.

`GITHUB_CONTENT_REPO` is `owner/name` (e.g. `mirsaid2004/blog-db`), not the
full URL.

**Webhook URL for local development:** GitHub can't reach `localhost`. Open
[smee.io](https://smee.io), click **Start a new channel**, and use that URL as
the webhook URL, and put the same URL in `SMEE_URL`. With `npm run dev`
running, `npm run webhook:dev` forwards each delivery to
`http://localhost:3000/api/webhooks/github`.

**Database and first sync:**

```bash
npm run db:migrate     # create the tables in Neon
npm run content:sync   # index the content repo's main branch
```

Run `content:sync` again whenever the webhook wasn't running. It downloads only
files that changed.

## 3. Sign-in (GitHub and Google OAuth)

`BETTER_AUTH_SECRET`: run `openssl rand -base64 32`.
`BETTER_AUTH_URL`: `http://localhost:3000`.

**GitHub:** Settings → Developer settings → **OAuth Apps** → New OAuth App.
This is separate from the GitHub App above.

- Homepage URL: `https://blog.mirsaidmirakhmedov.uz`
- Redirect URIs (an OAuth App accepts up to 10, so one app covers both):
  - `http://localhost:3000/api/auth/callback/github`
  - `https://blog.mirsaidmirakhmedov.uz/api/auth/callback/github`
- Leave **Allow wildcard matching** and **Enable Device Flow** off.
- Copy the Client ID and generate a client secret → `GITHUB_CLIENT_ID`,
  `GITHUB_CLIENT_SECRET`

**Google:** [console.cloud.google.com](https://console.cloud.google.com) → create
a project, then APIs & Services:

1. **OAuth consent screen**: External, app name, your email. Scopes: the
   defaults (`email`, `profile`, `openid`).
2. **Credentials** → Create credentials → OAuth client ID → Web application.
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
3. Copy the client ID and secret → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

**Admin:** `ADMIN_GITHUB_IDS` holds the numeric GitHub user ids that get the
admin role. Yours (`mirsaid2004`) is `66273717`. Admin is matched by GitHub id,
never by email.

## 4. Cloudflare R2 (images)

R2 has a free tier but needs a payment method on the Cloudflare account.

1. Cloudflare dashboard → **R2** → note the **Account ID** → `R2_ACCOUNT_ID`.
2. Create two buckets:
   - `mdev-blog` (`R2_PUBLIC_BUCKET`): public images. Under **Settings → Public access**, either
     connect a custom domain such as `img.mirsaidmirakhmedov.uz` (the domain
     must use Cloudflare DNS) or enable the **r2.dev** URL for now. Put that
     URL in `NEXT_PUBLIC_ASSETS_URL`.
   - `mdev-blog-private` (`R2_PRIVATE_BUCKET`): private note images. Leave
     public access off.
3. On **both** buckets, **Settings → CORS policy**, so the browser can upload
   directly:

   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://blog.mirsaidmirakhmedov.uz"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["content-type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

4. **R2 → Manage API tokens → Create API token**: permission **Object Read &
   Write**, limited to these two buckets. Copy the Access Key ID and Secret
   Access Key → `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.

## 5. Cron secret

`CRON_SECRET`: run `openssl rand -base64 32`. It guards `/api/content/sync`
(a daily Vercel cron re-syncs content in case a webhook was missed), and later
scheduled publishing and the image sweeper. To re-sync production by hand:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://blog.mirsaidmirakhmedov.uz/api/content/sync
```

## Production (when you deploy)

- `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL`: `https://blog.mirsaidmirakhmedov.uz`
- GitHub App webhook URL: `https://blog.mirsaidmirakhmedov.uz/api/webhooks/github`
- GitHub OAuth App: nothing to change if both redirect URIs were added
- Google client: add the production origin and
  `https://blog.mirsaidmirakhmedov.uz/api/auth/callback/google`
- Neon: optionally a separate branch for production
