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
			// The root layout's viewer: the auth user cut to what pages read,
			// since page data is serialised into the HTML.
			user: { id: string; email?: string } | null;
		}
	}
}

export {};
