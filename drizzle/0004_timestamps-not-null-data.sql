-- Every row's times come from the column defaults or server code, so none
-- should be null; fill any that are before 0005 makes the columns NOT NULL.
-- A recipe with no update time was last changed when it was made.
UPDATE "profiles" SET "created_at" = now() WHERE "created_at" IS NULL;--> statement-breakpoint
UPDATE "recipes" SET "created_at" = now() WHERE "created_at" IS NULL;--> statement-breakpoint
UPDATE "recipes" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;--> statement-breakpoint
UPDATE "favorites" SET "created_at" = now() WHERE "created_at" IS NULL;--> statement-breakpoint
UPDATE "recipe_versions" SET "created_at" = now() WHERE "created_at" IS NULL;
