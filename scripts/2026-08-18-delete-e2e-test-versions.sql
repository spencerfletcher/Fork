-- Delete the "e2e test commit" versions the e2e suite wrote into the live
-- Chicken Tikka Masala.
--
-- Why this is not a violation of the append-only rule: these rows are not
-- history. They are test pollution. e2e/authenticated.test.ts appends a version
-- on every run, and playwright.config.ts loaded only .env — the production
-- DATABASE_URL — into process.env, which the preview server inherits. A built
-- SvelteKit app resolves $env/dynamic/private from process.env at runtime, so
-- the whole suite wrote to production. No cook made these edits.
--
-- The config is fixed (it now loads .env.local with override, and refuses to run
-- against a non-local host), so this should not need running again. It stays in
-- the repo because it was run against production and that should be recorded.
--
-- Safety properties:
--   * Every predicate must hold: the recipe is Tikka, owned by the expected
--     author, AND the commit message is exactly 'e2e test commit'. That message
--     is written only by the test suite, so real history cannot match. The
--     version range is deliberately not pinned — reruns kept appending, so the
--     numbers drift, and the message is the meaningful guard.
--   * No foreign key references recipe_versions, so nothing cascades. Verified
--     against information_schema.
--   * Asserts it deleted at least one row, so a no-op run is loud rather than
--     silently "successful".
--   * The count is asserted in plpgsql via GET DIAGNOSTICS. An earlier draft
--     asserted it with `CASE ... ELSE (SELECT 1/0)`, which Postgres constant-folds
--     at plan time — it raised unconditionally, aborting a correct run while
--     looking exactly like a genuine refusal. Do not reintroduce that.
--   * RAISE aborts the surrounding transaction, so a failed assertion deletes
--     nothing.
--   * Rows were dumped to JSON before the first run; restoring them is an INSERT.
--
-- Note: profiles' commit counts are derived from recipe_versions, so the author's
-- commit count on /users/spencerfletcher drops accordingly. That is the correct
-- number, not a regression.
--
-- Run with:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/2026-08-18-delete-e2e-test-versions.sql

BEGIN;

DO $$
DECLARE
	deleted_count integer;
BEGIN
	DELETE FROM recipe_versions v
	USING recipes r, profiles p
	WHERE v.recipe_id = r.id
	  AND r.author_id = p.id
	  AND r.slug LIKE 'chicken-tikka-masala-%'
	  AND p.username = 'spencerfletcher'
	  AND v.commit_message = 'e2e test commit';

	GET DIAGNOSTICS deleted_count = ROW_COUNT;

	IF deleted_count = 0 THEN
		RAISE EXCEPTION
			'matched no e2e test versions. Either they are already gone, or the recipe slug or author differs from what this script expects; refusing rather than guessing.';
	END IF;

	RAISE NOTICE 'deleted % e2e test versions', deleted_count;
END $$;

COMMIT;
