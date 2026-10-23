import { defineEnvVars } from '@sveltejs/kit/env';

// Dynamic variables are read at runtime, so the built app (and the e2e suite) uses whatever
// DATABASE_URL the process starts with. A missing value becomes '', which callers treat as unset.
export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: { public: true, static: true },
	PUBLIC_SUPABASE_ANON_KEY: { public: true, static: true },
	DATABASE_URL: { schema: (input) => input ?? '' }
});
