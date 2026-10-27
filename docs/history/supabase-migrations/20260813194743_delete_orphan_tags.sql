-- Delete tags that no recipe uses.
--
-- Seven of thirteen tags matched nothing, so more than half the filter chips
-- led to an empty page. The search query now only offers tags that join to a
-- recipe, so this is cleanup of existing rows rather than a behaviour change.
--
-- Written as a general delete rather than a hard-coded list so it is correct
-- whatever the data looks like when it runs.

DELETE FROM public.tags t
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes_to_tags rt WHERE rt.tag_id = t.id
);
