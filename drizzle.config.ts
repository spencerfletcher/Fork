import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load .env.local with override so it wins even over shell env vars,
// then fill in any remaining vars from .env
config({ path: '.env.local', override: true });
config({ path: '.env', override: false });

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: { url: process.env.DATABASE_URL },
	verbose: true,
	strict: true
});
