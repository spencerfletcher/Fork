import { goto } from '$app/navigation';
import { page } from '$app/state';

/**
 * Sets one query param, or drops it for null, by a shallow replace: no
 * navigation and no history entry per change (goto's form of replaceState,
 * which SvelteKit 3 deprecates). That replace leaves page.url behind, so this
 * builds on page.shallow's URL when there is one, and the serves control and
 * Cook keep each other's param.
 */
export function setShallowParam(name: string, value: string | null): Promise<void> {
	const url = new URL((page.shallow?.url ?? page.url).href);
	if (value === null) url.searchParams.delete(name);
	else url.searchParams.set(name, value);
	return goto(url, { shallow: true, replace: true, state: page.state });
}
