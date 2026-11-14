import { sql } from "drizzle-orm";
import {
  check,
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
  },
  (t) => [primaryKey({ columns: [t.itemId, t.locale] })]
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
