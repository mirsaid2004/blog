CREATE TABLE "content_files" (
	"path" text PRIMARY KEY NOT NULL,
	"sha" text NOT NULL,
	"text" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"slug" text NOT NULL,
	"original_locale" text NOT NULL,
	"published_at" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"cover" text,
	"series_items" text[],
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_sync" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"commit_sha" text NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "content_sync_single_row" CHECK ("content_sync"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "content_translations" (
	"item_id" text NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"status" text NOT NULL,
	"read_minutes" integer NOT NULL,
	"body" text NOT NULL,
	CONSTRAINT "content_translations_item_id_locale_pk" PRIMARY KEY("item_id","locale")
);
--> statement-breakpoint
ALTER TABLE "content_translations" ADD CONSTRAINT "content_translations_item_id_content_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_items_kind_slug" ON "content_items" USING btree ("kind","slug");