-- Search's text of a version, as functions so a GIN index can be built on it
-- (an index expression may not hold a subquery; a function's body may).
-- IMMUTABLE honestly: jsonb_array_elements, ->>, string_agg, coalesce, || and
-- to_tsvector with a named config all are. concat_ws (STABLE) is not used:
-- blanks do not shift tsvector positions, so '' joined by spaces reads the same.
-- search_path is empty so a REINDEX or restore (which runs with a safe
-- search_path) reads the same functions.

CREATE FUNCTION public.recipe_ingredient_names(ingredients jsonb) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = ''
RETURN coalesce((SELECT string_agg(i->>'name', ' ') FROM jsonb_array_elements(ingredients) i), '');
--> statement-breakpoint
CREATE FUNCTION public.recipe_version_doc(
	title text, description text, source_name text, ingredients jsonb, steps jsonb,
	notes text, make_ahead text, equipment text, storage text, reheating text
) RETURNS tsvector
LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = ''
RETURN to_tsvector('english'::regconfig,
	coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(source_name, '') || ' ' ||
	public.recipe_ingredient_names(ingredients) || ' ' ||
	coalesce((SELECT string_agg(s->>'text', ' ') FROM jsonb_array_elements(steps) s), '') || ' ' ||
	coalesce(notes, '') || ' ' || coalesce(make_ahead, '') || ' ' || coalesce(equipment, '') || ' ' ||
	coalesce(storage, '') || ' ' || coalesce(reheating, ''));
