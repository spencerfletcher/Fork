-- Enable row level security on every application table.
--
-- Why this is needed: PUBLIC_SUPABASE_ANON_KEY ships to the browser by design,
-- and with RLS disabled anyone holding it could read every table straight from
-- PostgREST — including profiles and favorites. Verified against production
-- before this migration: all six tables returned rows to an anonymous caller.
--
-- Why no policies are defined: the application never reads or writes tables
-- through the Supabase client. It uses Supabase only for auth and storage, and
-- reaches Postgres exclusively through Drizzle over DATABASE_URL as the
-- `postgres` role, which has BYPASSRLS. Enabling RLS with no policies therefore
-- denies the anon and authenticated roles everything while leaving the app
-- untouched.
--
-- If a browser-side Supabase client is ever added, it will read nothing until
-- explicit policies are added here. That is the intended failure mode: closed
-- by default rather than open by default.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes_to_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
