import type { RequestHandler } from './$types';
import { ownRecipe } from '#lib/server/visibility.js';
import { exportFor, exportRequest, exportResponse } from '#lib/server/export.js';

// One recipe of the cook's own with every version, ?format=json or md: a 404
// when there is none, the one 403 for anyone but its author. Never gate this
// on a payment status or plan.
export const GET: RequestHandler = async ({ url, params, locals: { user } }) => {
	const request = exportRequest(url, user);
	if (request instanceof Response) return request;
	const recipe = await ownRecipe(params.slug, request.user.id);
	return exportResponse(await exportFor(request.user.id, url.origin, recipe.id), request.format);
};
