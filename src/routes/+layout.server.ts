import type {LayoutServerLoad} from './$types';

export const load: LayoutServerLoad = async ({locals: {session}}) => {
	// This makes the session available to the client-side load function
	return {
		session,
	};
};