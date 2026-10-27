-- Add the full-text search vector to recipes.
--
-- src/lib/server/db/schema.ts has declared this column since the full-text
-- search feature landed, but it was only ever applied to local databases via
-- `drizzle-kit push`. Production never got it, so every Drizzle query that
-- selects recipes ("/", "/search", "/tags/[slug]") failed with
-- 42703: column recipes.fts does not exist.
--
-- Additive and reversible: the column is generated, so no backfill is needed,
-- and dropping it restores the previous state.

ALTER TABLE public.recipes
	ADD COLUMN fts tsvector
	GENERATED ALWAYS AS (
		setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
		setweight(to_tsvector('english', coalesce(description, '')), 'B')
	) STORED;

CREATE INDEX recipes_fts_idx ON public.recipes USING gin (fts);
