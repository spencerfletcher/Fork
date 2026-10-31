-- Tag pages look slugs up lowercased, so a stored capital made the hosted
-- Baking tag unreachable. Lowercase every slug before 0003 adds the check.
UPDATE "tags" SET "slug" = lower("slug") WHERE "slug" <> lower("slug");
