// $app/env/private for scripts (app-env.ts): the variables the server modules
// read, from the env files of the target loadEnv guards.
import { loadEnv, targetFromEnv } from '../src/lib/server/db/env';

export const { DATABASE_URL } = loadEnv(targetFromEnv());
export const MODERATOR_IDS = process.env.MODERATOR_IDS ?? '';
// One connection: Supabase's session pooler gives the whole project 15.
export const DB_POOL_MAX = 1;
