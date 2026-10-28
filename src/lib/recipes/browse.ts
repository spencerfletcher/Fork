/**
 * Groups the public browse page into sections. Pure, so the page's shape is
 * testable without a database: the loader hands it the rows it already has.
 */
export const RECENT_LIMIT = 8;
export const FORKED_LIMIT = 4;

type BrowseRecipe = { id: number; updatedAt: Date | null; forkCount: number };

export type BrowseSection<T> = { title: 'Recent' | 'Most forked' | 'All recipes'; recipes: T[] };

export function browseSections<T extends BrowseRecipe>(recipes: T[]): BrowseSection<T>[] {
	// Newest first; a recipe with no date goes to the end rather than the top.
	const byDate = [...recipes].sort(
		(a, b) => (b.updatedAt?.getTime() ?? -Infinity) - (a.updatedAt?.getTime() ?? -Infinity)
	);
	const recent = byDate.slice(0, RECENT_LIMIT);
	// Stable sort, so equal fork counts keep the Recent order.
	const mostForked = byDate
		.filter((r) => r.forkCount > 0)
		.sort((a, b) => b.forkCount - a.forkCount)
		.slice(0, FORKED_LIMIT);
	const shown = new Set([...recent, ...mostForked].map((r) => r.id));
	const rest = byDate.filter((r) => !shown.has(r.id));

	return (
		[
			{ title: 'Recent', recipes: recent },
			{ title: 'Most forked', recipes: mostForked },
			{ title: 'All recipes', recipes: rest }
		] as BrowseSection<T>[]
	).filter((s) => s.recipes.length > 0);
}
