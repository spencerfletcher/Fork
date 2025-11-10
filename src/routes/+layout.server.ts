import type {LayoutServerLoad} from './$types';

export const load: LayoutServerLoad = async ({locals: {user}}) => {
	// Return verified user to the client
	// (session is not returned to avoid Supabase warnings about unverified data)
	return {
		user,
	};
};