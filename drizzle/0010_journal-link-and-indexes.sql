ALTER TABLE "log_entries" ADD COLUMN "source_url" text;--> statement-breakpoint
CREATE INDEX "favorites_created_at_idx" ON "favorites" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "recipe_versions_created_at_idx" ON "recipe_versions" USING btree ("created_at");