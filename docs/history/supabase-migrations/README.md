# Retired Supabase migration chain

These SQL files built the schema from 2026-08 until 2026-10-27, applied by the Supabase CLI. Migrations now come from `drizzle-kit generate` into `drizzle/`, with `pnpm db:migrate`; see the README's "Database changes" section. The hosted project was marked at the Drizzle baseline (`drizzle/0000_baseline.sql`) by hand after the last of these files had run (the one-off script that did it has since been removed). Kept as history, not applied anywhere.
