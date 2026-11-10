CREATE INDEX "favorites_recipe_idx" ON "favorites" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_versions_created_by_idx" ON "recipe_versions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "recipes_author_idx" ON "recipes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "recipes_parent_idx" ON "recipes" USING btree ("parent_id");