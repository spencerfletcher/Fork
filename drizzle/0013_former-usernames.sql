CREATE TABLE "former_usernames" (
	"username" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "former_usernames" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "former_usernames" ADD CONSTRAINT "former_usernames_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "former_usernames_profile_idx" ON "former_usernames" USING btree ("profile_id");