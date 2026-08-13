-- Add the two constraints schema.ts declares but production never had.
--
-- These drifted because production was built with `drizzle-kit push` against a
-- schema that kept moving. A fresh database gets them from this migration too,
-- so both paths converge.
--
-- The username uniqueness constraint is safe as-is: production has no duplicate
-- usernames.
--
-- The favorites foreign key is not, on its own. One favorites row references an
-- auth user with no profiles row — an account that signed up before signup
-- started creating profiles. The backfill below fixes the cause rather than
-- deleting the favorite, and derives the username exactly the way
-- src/routes/signup/+page.server.ts does.

-- Backfill profiles for any user who has favorited something but has no
-- profile. Skips anyone whose derived username is already taken.
INSERT INTO public.profiles (id, username)
SELECT u.id::text, split_part(u.email, '@', 1)
FROM auth.users u
WHERE u.id::text IN (SELECT user_id FROM public.favorites)
	AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id::text)
	AND NOT EXISTS (
		SELECT 1 FROM public.profiles p2 WHERE p2.username = split_part(u.email, '@', 1)
	);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_id_profiles_id_fk
	FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE cascade;
