import type { User, SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			user: User | null;
		}

		interface PageData {
			user: User | null;
		}
	}
}

export {};
