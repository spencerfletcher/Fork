// src/app.d.ts

import type {Session, SupabaseClient, User} from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			session: Session | null;
			user: User | null;
		}

		interface PageData {
			user: User | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};