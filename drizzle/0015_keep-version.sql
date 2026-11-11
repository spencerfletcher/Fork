ALTER TABLE "favorites" ADD COLUMN "kept_version" integer;--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "copy_version" integer;--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "erased_at" timestamp;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_note_length" CHECK (char_length("favorites"."note") <= 2000);