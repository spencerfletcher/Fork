ALTER TABLE "former_usernames" DROP CONSTRAINT "former_usernames_profile_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_reporter_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "former_usernames" ALTER COLUMN "profile_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "reporter_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "parent_version" integer;--> statement-breakpoint
ALTER TABLE "former_usernames" ADD CONSTRAINT "former_usernames_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_profiles_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;