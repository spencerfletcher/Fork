import type { User, SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			user: User | null;
		}

		interface Error {
			message: string;
			// The compare 400 for a missing numbered version names the range.
			versionCount?: number;
		}

		interface PageData {
			user: User | null;
		}
	}
}

export {};
