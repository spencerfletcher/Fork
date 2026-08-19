-- Append version 3 to the live "Classic Chocolate Chip Cookies".
--
-- Why this exists: the landing page showcases a real diff drawn from real rows.
-- Production only had v1 -> v2 (a vanilla tweak plus espresso powder, with every
-- step unchanged), which is a poor advertisement for version control. This adds
-- the version that src/lib/server/db/seed.ts already seeds locally, so the live
-- site and the fixture show the same diff.
--
-- Safety properties:
--   * Append-only. Inserts one row and mutates nothing, matching the versioning
--     model. Reversible by deleting the row the RETURNING clause reports.
--   * version_number is derived from MAX(version_number) + 1 rather than
--     hardcoded, so it cannot collide if production has versions this file does
--     not know about.
--   * The WHERE clause pins both the slug prefix and the author, so it cannot
--     append to a recipe owned by anyone else.
--   * Wrapped in a transaction. If the SELECT matches zero rows or more than one,
--     roll back rather than commit.
--
-- Run with:  psql "$DATABASE_URL" -f scripts/2026-08-18-append-cookie-v3.sql

BEGIN;

INSERT INTO recipe_versions
	(recipe_id, version_number, commit_message, ingredients, steps, created_by, created_at)
SELECT
	r.id,
	(SELECT COALESCE(MAX(v.version_number), 0) + 1
	   FROM recipe_versions v
	  WHERE v.recipe_id = r.id),
	'Chill the dough and shift the sugar toward brown — thicker cookies, less cloying',
	'[
		{ "amount": "2¼", "unit": "cups",  "name": "all-purpose flour" },
		{ "amount": "1",  "unit": "tsp",   "name": "baking soda" },
		{ "amount": "1",  "unit": "tsp",   "name": "salt" },
		{ "amount": "1",  "unit": "cup",   "name": "unsalted butter, softened" },
		{ "amount": "½",  "unit": "cup",   "name": "granulated sugar" },
		{ "amount": "1",  "unit": "cup",   "name": "packed brown sugar" },
		{ "amount": "2",  "unit": "tsp",   "name": "vanilla extract" },
		{ "amount": "2",  "unit": "large", "name": "eggs" },
		{ "amount": "2",  "unit": "cups",  "name": "chocolate chips" },
		{ "amount": "¼",  "unit": "tsp",   "name": "espresso powder" },
		{ "amount": "1",  "unit": "tsp",   "name": "flaky sea salt, for topping" }
	]'::jsonb,
	'[
		{ "step": 1, "text": "Preheat oven to 375°F (190°C). Line two baking sheets with parchment paper." },
		{ "step": 2, "text": "Whisk flour, baking soda, and salt in a medium bowl. Set aside." },
		{ "step": 3, "text": "Beat butter and both sugars with an electric mixer on medium speed until light and fluffy, about 3 minutes." },
		{ "step": 4, "text": "Add eggs one at a time, beating well after each addition. Beat in vanilla extract." },
		{ "step": 5, "text": "Gradually stir in the flour mixture until just combined. Fold in chocolate chips, reserving a handful to press into the tops. Cover and chill the dough at least 2 hours — cold dough spreads less, so the extra brown sugar reads as chew rather than sprawl." },
		{ "step": 6, "text": "Drop rounded tablespoons of chilled dough onto prepared baking sheets, pressing the reserved chips into the tops. Bake 9–11 minutes until edges are golden. Sprinkle with flaky sea salt while still hot, then cool on baking sheet for 5 minutes before transferring." }
	]'::jsonb,
	r.author_id,
	NOW()
FROM recipes r
JOIN profiles p ON p.id = r.author_id
WHERE r.slug LIKE 'classic-chocolate-chip-cookies-%'
  AND p.username = 'spencerfletcher'
RETURNING id, recipe_id, version_number, commit_message;

COMMIT;
