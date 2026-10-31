// Resets the suite's own database before every run: creates fork_e2e on the
// local stack if missing, applies the migrations, then reseeds it. Both
// scripts load .env.e2e and refuse any other database.
import { execSync } from 'node:child_process';

export default function globalSetup() {
	execSync('pnpm db:migrate:e2e', { stdio: 'inherit' });
	execSync('pnpm db:seed:e2e', { stdio: 'inherit' });
}
