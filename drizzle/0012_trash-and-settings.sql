ALTER TABLE "profiles" ADD COLUMN "default_visibility" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "measurement" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "deleted_at" timestamp;