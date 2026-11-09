import { defineEnvVars } from '@sveltejs/kit/env';

// Dynamic variables are read at runtime, so the built app (and the e2e suite) uses whatever
// DATABASE_URL the process starts with. A missing value becomes '', which callers treat as unset.
export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: { public: true, static: true },
	PUBLIC_SUPABASE_ANON_KEY: { public: true, static: true },
	DATABASE_URL: { schema: (input) => input ?? '' },
	// Connections per server process; unset, 5 in dev and 10 in production.
	DB_POOL_MAX: {
		schema: (input) => {
			if (!input) return undefined;
			const max = Number(input);
			if (!Number.isInteger(max) || max < 1)
				throw new Error('DB_POOL_MAX must be a whole number of at least 1');
			return max;
		}
	}
});
