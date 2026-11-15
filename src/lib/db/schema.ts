import { sql, type SQL } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Content index (PLAN.md phase 2). The content repo on GitHub is the source of
 * truth; these tables are a derived copy that pages read, rebuilt by the webhook
 * and `npm run content:sync`.
 */

/** Raw mirror of the content files on `main`, keyed by path. Lets a sync download only changed blobs. */
export const contentFiles = pgTable("content_files", {
  path: text("path").primaryKey(),
  /** Git blob sha. */
  sha: text("sha").notNull(),
  text: text("text").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per article, post or series (its meta.yml). */
export const contentItems = pgTable(
  "content_items",
  {
    /** Stable id from meta.yml. */
    id: text("id").primaryKey(),
    kind: text("kind", { enum: ["article", "post", "series"] }).notNull(),
    slug: text("slug").notNull(),
    originalLocale: text("original_locale").notNull(),
    /** YYYY-MM-DD */
    publishedAt: text("published_at").notNull(),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    cover: text("cover"),
    /** Series only: article and post ids in reading order. */
    seriesItems: text("series_items").array(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("content_items_kind_slug").on(t.kind, t.slug)]
);

const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });

/**
 * Text-search configuration per language. Postgres has no Uzbek stemmer, so uz
 * uses `simple` (lower-cased words, no stemming). Search queries must use the
 * same expression so query words are stemmed like the indexed text.
 */
export const searchConfig = (locale: unknown) =>
  sql`(case ${locale} when 'en' then 'english'::regconfig when 'ru' then 'russian'::regconfig else 'simple'::regconfig end)`;

/** One row per language of an item (its <locale>.mdx). */
export const contentTranslations = pgTable(
  "content_translations",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    status: text("status", { enum: ["draft", "published"] }).notNull(),
    readMinutes: integer("read_minutes").notNull(),
    /** MDX without frontmatter. */
    body: text("body").notNull(),
    /** Blob sha of the original-language file this translation was last brought up to date with. */
    translatedFrom: text("translated_from"),
    /** Title (weight A), summary (B) and body (D), stemmed for the row's language. */
    search: tsvector("search")
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector(${searchConfig(sql.raw('"locale"'))}, "title"), 'A') || setweight(to_tsvector(${searchConfig(sql.raw('"locale"'))}, "summary"), 'B') || setweight(to_tsvector(${searchConfig(sql.raw('"locale"'))}, "body"), 'D')`
      ),
  },
  (t) => [primaryKey({ columns: [t.itemId, t.locale] }), index("content_translations_search").using("gin", t.search)]
);

/** Result of the last sync: which commit is indexed and which files were rejected. */
export const contentSync = pgTable(
  "content_sync",
  {
    id: smallint("id").primaryKey().default(1),
    commitSha: text("commit_sha").notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
    errors: jsonb("errors").$type<{ path: string; message: string }[]>().notNull().default([]),
  },
  (t) => [check("content_sync_single_row", sql`${t.id} = 1`)]
);

// --- Auth (Better Auth core schema; see src/lib/auth.ts) -------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id").on(t.userId)]
);

/** One row per sign-in method. For GitHub, `accountId` is the numeric GitHub user id. */
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_id").on(t.userId), uniqueIndex("account_provider_account").on(t.providerId, t.accountId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verification_identifier").on(t.identifier)]
);

// --- Engagement (PLAN.md 2.6) -------------------------------------------------------
// Keyed by content id without a foreign key: views and ratings survive a piece
// being briefly invalid or re-synced, and ids never change.

/** Denormalised counters, read on every list. Ratings are recomputed from `rating` on each change. */
export const contentStats = pgTable("content_stats", {
  contentId: text("content_id").primaryKey(),
  views: integer("views").notNull().default(0),
  ratingSum: integer("rating_sum").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
});

/** One rating per reader per piece, whichever language they read it in. */
export const rating = pgTable(
  "rating",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contentId: text("content_id").notNull(),
    value: smallint("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.contentId] }),
    index("rating_content_id").on(t.contentId),
    check("rating_value_range", sql`${t.value} between 1 and 5`),
  ]
);

/**
 * One row per piece, visitor and day, so reloads don't count twice. The visitor
 * hash is an HMAC of IP, user agent and day: no raw IPs are stored, and hashes
 * can't be linked across days. Rows older than 90 days are pruned daily.
 */
export const viewEvent = pgTable(
  "view_event",
  {
    contentId: text("content_id").notNull(),
    visitorHash: text("visitor_hash").notNull(),
    day: date("day").notNull(),
    locale: text("locale").notNull(),
  },
  (t) => [primaryKey({ columns: [t.contentId, t.visitorHash, t.day] }), index("view_event_day").on(t.day)]
);

// --- Media (PLAN.md 2.3) ------------------------------------------------------------

/**
 * One row per uploaded image. The row is inserted before the upload, so no R2
 * object can exist without one. An image is deletable only while `published_at`
 * is null: discarding its draft branch deletes it, publishing makes it permanent.
 */
export const asset = pgTable(
  "asset",
  {
    /** R2 key: `content/<contentId>/<sha256-16-hex>.<ext>`. */
    key: text("key").primaryKey(),
    contentId: text("content_id").notNull(),
    /** The draft branch it was uploaded from (`draft/<folder>/<slug>`). */
    draftBranch: text("draft_branch"),
    bucket: text("bucket").notNull(),
    bytes: integer("bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [index("asset_draft_branch").on(t.draftBranch), index("asset_content_id").on(t.contentId)]
);

// --- Phase 6 --------------------------------------------------------------------------

/**
 * Reader comments: plain text, shown as soon as they're posted. The admin can
 * hide a comment (kept, but shown only to the admin) or delete it; authors can
 * delete their own. Deleting a user deletes their comments.
 */
export const comment = pgTable(
  "comment",
  {
    id: text("id").primaryKey(),
    contentId: text("content_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    /** The language the reader was viewing, for the admin. */
    locale: text("locale").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    hiddenAt: timestamp("hidden_at", { withTimezone: true }),
  },
  (t) => [
    index("comment_content_created").on(t.contentId, t.createdAt),
    index("comment_user_created").on(t.userId, t.createdAt),
    check("comment_body_length", sql`char_length(${t.body}) between 1 and 2000`),
  ]
);

/**
 * Drafts waiting to be published at a set time. An hourly job publishes the
 * ones that are due with the same checks as the Publish button; whatever is on
 * the draft branch at that moment is what goes live.
 */
export const scheduledPublish = pgTable(
  "scheduled_publish",
  {
    folder: text("folder", { enum: ["articles", "posts", "series"] }).notNull(),
    slug: text("slug").notNull(),
    publishAt: timestamp("publish_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Set when a due publish failed (e.g. invalid content); it's retried every hour. */
    lastError: text("last_error"),
  },
  (t) => [primaryKey({ columns: [t.folder, t.slug] }), index("scheduled_publish_at").on(t.publishAt)]
);
