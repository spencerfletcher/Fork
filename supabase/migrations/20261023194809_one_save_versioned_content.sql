-- Pre-production: versions now own the content. Existing rows are not
-- migrated; the database is reseeded after this runs.
DELETE FROM public.recipe_versions;
DELETE FROM public.recipes;

ALTER TABLE public.recipe_versions
  ADD COLUMN title text NOT NULL,
  ADD COLUMN description text,
  ADD COLUMN servings integer,
  ADD COLUMN prep_time_minutes integer,
  ADD COLUMN cook_time_minutes integer,
  ADD CONSTRAINT recipe_versions_recipe_id_version_number_unique UNIQUE (recipe_id, version_number);

ALTER TABLE public.recipes
  ADD COLUMN edit_revision integer NOT NULL DEFAULT 0;
