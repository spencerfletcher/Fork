-- Baseline schema.
--
-- Production was built with `drizzle-kit push` rather than migrations, so no
-- migration history describes how it got there. This file is that history,
-- written after the fact to match production exactly as it stood before the
-- full-text search column was added.
--
-- For a fresh database, this and the migrations that follow it produce the
-- schema declared in src/lib/server/db/schema.ts.
--
-- For the existing production database, this migration is already satisfied.
-- Mark it applied without running it:
--   supabase migration repair --status applied 20260813154000
--
-- Two constraints that schema.ts declares are deliberately absent here because
-- production never had them; 20260813160000_align_constraints.sql adds them.

CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);

CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"servings" integer,
	"prep_time_minutes" integer,
	"cook_time_minutes" integer,
	"parent_id" integer,
	"forked_at" timestamp,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "recipes_slug_unique" UNIQUE("slug")
);

CREATE TABLE "recipe_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"commit_message" text NOT NULL,
	"ingredients" jsonb NOT NULL,
	"steps" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" text
);

CREATE TABLE "recipes_to_tags" (
	"recipe_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "recipes_to_tags_recipe_id_tag_id_pk" PRIMARY KEY("recipe_id","tag_id")
);

CREATE TABLE "favorites" (
	"user_id" text NOT NULL,
	"recipe_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "favorites_user_id_recipe_id_pk" PRIMARY KEY("user_id","recipe_id")
);

-- recipes.parent_id has no foreign key: fork lineage is resolved through
-- Drizzle relations, matching production.

ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_profiles_id_fk"
	FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE set null;

ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_recipe_id_recipes_id_fk"
	FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade;

ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_created_by_profiles_id_fk"
	FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null;

ALTER TABLE "recipes_to_tags" ADD CONSTRAINT "recipes_to_tags_recipe_id_recipes_id_fk"
	FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade;

ALTER TABLE "recipes_to_tags" ADD CONSTRAINT "recipes_to_tags_tag_id_tags_id_fk"
	FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade;

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_recipe_id_recipes_id_fk"
	FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade;
