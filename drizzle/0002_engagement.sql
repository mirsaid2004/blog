CREATE TABLE "content_stats" (
	"content_id" text PRIMARY KEY NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"rating_sum" integer DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rating" (
	"user_id" text NOT NULL,
	"content_id" text NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rating_user_id_content_id_pk" PRIMARY KEY("user_id","content_id"),
	CONSTRAINT "rating_value_range" CHECK ("rating"."value" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "view_event" (
	"content_id" text NOT NULL,
	"visitor_hash" text NOT NULL,
	"day" date NOT NULL,
	"locale" text NOT NULL,
	CONSTRAINT "view_event_content_id_visitor_hash_day_pk" PRIMARY KEY("content_id","visitor_hash","day")
);
--> statement-breakpoint
ALTER TABLE "content_translations" ADD COLUMN "search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector((case "locale" when 'en' then 'english'::regconfig when 'ru' then 'russian'::regconfig else 'simple'::regconfig end), "title"), 'A') || setweight(to_tsvector((case "locale" when 'en' then 'english'::regconfig when 'ru' then 'russian'::regconfig else 'simple'::regconfig end), "summary"), 'B') || setweight(to_tsvector((case "locale" when 'en' then 'english'::regconfig when 'ru' then 'russian'::regconfig else 'simple'::regconfig end), "body"), 'D')) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rating_content_id" ON "rating" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "view_event_day" ON "view_event" USING btree ("day");--> statement-breakpoint
CREATE INDEX "content_translations_search" ON "content_translations" USING gin ("search");