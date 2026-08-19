-- Delete the five "e2e test commit" versions the e2e suite wrote into the live
-- Chicken Tikka Masala (v4 through v8).
--
-- Why this is not a violation of the append-only rule: these rows are not
-- history. They are test pollution written by e2e/authenticated.test.ts against
-- production before the suite was pointed at a local Supabase stack. No cook
-- made these edits, and v7 and v8 are byte-identical to each other.
--
-- Safety properties:
--   * Every predicate must hold: the recipe is Tikka, owned by the expected
--     author, the version number is in 4..8, AND the commit message is exactly
--     'e2e test commit'. A real version in that range would not be touched.
--   * No foreign key references recipe_versions, so nothing cascades. Verified
--     against information_schema before writing this.
--   * The row count is asserted in plpgsql via GET DIAGNOSTICS. An earlier draft
--     asserted it with `CASE ... ELSE (SELECT 1/0)`, which Postgres constant-folds
--     at plan time — it raised unconditionally, so it aborted a correct run and
--     would have looked identical to a genuine refusal. Do not reintroduce that.
--   * RAISE aborts the surrounding transaction, so a wrong count deletes nothing.
--   * The rows were dumped to JSON first; restoring them is an INSERT.
--
-- Note: profiles' commit counts are derived from recipe_versions, so the
-- author's commit count on /users/spencerfletcher drops by five. That is the
-- correct number, not a regression.
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
	  AND v.version_number BETWEEN 4 AND 8
	  AND v.commit_message = 'e2e test commit';

	GET DIAGNOSTICS deleted_count = ROW_COUNT;

	IF deleted_count <> 5 THEN
		RAISE EXCEPTION
			'expected to delete 5 e2e versions, matched %. Production is not in the state this script was written against; refusing rather than guessing.',
			deleted_count;
	END IF;

	RAISE NOTICE 'deleted % e2e test versions', deleted_count;
END $$;

COMMIT;
