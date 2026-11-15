CREATE TABLE "comment" (
	"id" text PRIMARY KEY NOT NULL,
	"content_id" text NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"locale" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"hidden_at" timestamp with time zone,
	CONSTRAINT "comment_body_length" CHECK (char_length("comment"."body") between 1 and 2000)
);
--> statement-breakpoint
CREATE TABLE "scheduled_publish" (
	"folder" text NOT NULL,
	"slug" text NOT NULL,
	"publish_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	CONSTRAINT "scheduled_publish_folder_slug_pk" PRIMARY KEY("folder","slug")
);
--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_content_created" ON "comment" USING btree ("content_id","created_at");--> statement-breakpoint
CREATE INDEX "comment_user_created" ON "comment" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "scheduled_publish_at" ON "scheduled_publish" USING btree ("publish_at");