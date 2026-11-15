CREATE TABLE "asset" (
	"key" text PRIMARY KEY NOT NULL,
	"content_id" text NOT NULL,
	"draft_branch" text,
	"bucket" text NOT NULL,
	"bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "content_translations" ADD COLUMN "translated_from" text;--> statement-breakpoint
CREATE INDEX "asset_draft_branch" ON "asset" USING btree ("draft_branch");--> statement-breakpoint
CREATE INDEX "asset_content_id" ON "asset" USING btree ("content_id");