// Lets a tsx script load the app's server modules (the db, the write-path
// helpers), which import SvelteKit's $app/env: `tsx --import ./scripts/app-env.ts`.
// Each name resolves to a module of process.env's values, read once loadEnv has
// chosen the database (appEnvPrivate.ts), so the target guard runs first.
import { registerHooks } from 'node:module';

const MODULES: Record<string, string> = {
	'$app/env': 'data:text/javascript,export const dev = false;',
	'$app/env/private': new URL('./appEnvPrivate.ts', import.meta.url).href
};

registerHooks({
	resolve(specifier, context, next) {
		const url = MODULES[specifier];
		return url ? { url, shortCircuit: true } : next(specifier, context);
	}
});
