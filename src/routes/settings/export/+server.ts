import type { RequestHandler } from './$types';
import { exportFor, exportRequest, exportResponse } from '#lib/server/export.js';

// The cook's whole library, ?format=json or md. Never gate this on a payment
// status or plan: leaving with your own recipes is not a paid feature.
export const GET: RequestHandler = async ({ url, locals: { user } }) => {
	const request = exportRequest(url, user);
	if (request instanceof Response) return request;
	return exportResponse(await exportFor(request.user.id, url.origin), request.format);
};
