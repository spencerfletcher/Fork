ALTER TABLE "friendships" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "notifications_seen_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "muted_notifications" text[] DEFAULT '{}' NOT NULL;