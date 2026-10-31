/**
 * Groups the public browse page into sections. Pure, so the page's shape is
 * testable without a database: the loader hands it the rows it already has.
 */
export const RECENT_LIMIT = 8;
export const FORKED_LIMIT = 4;

export type BrowseRecipe = { id: number; updatedAt: Date | null; forkCount: number };

export type BrowseSection<T> = {
	title: 'Recent' | 'Most forked' | 'All recipes';
	recipes: T[];
};

export function browseSections<T extends BrowseRecipe>(recipes: T[]): BrowseSection<T>[] {
	// Newest first; a recipe with no date goes to the end rather than the top.
	const byDate = [...recipes].sort(
		(a, b) => (b.updatedAt?.getTime() ?? -Infinity) - (a.updatedAt?.getTime() ?? -Infinity)
	);
	const recent = byDate.slice(0, RECENT_LIMIT);
	// Only recipes not already on show as Recent, so a card never appears twice;
	// on a small site the section is simply absent. Stable sort, so equal fork
	// counts keep the Recent order.
	const older = byDate.slice(RECENT_LIMIT);
	const mostForked = older
		.filter((r) => r.forkCount > 0)
		.sort((a, b) => b.forkCount - a.forkCount)
		.slice(0, FORKED_LIMIT);
	const forkedIds = new Set(mostForked.map((r) => r.id));
	const rest = older.filter((r) => !forkedIds.has(r.id));

	const sections: BrowseSection<T>[] = [
		{ title: 'Recent', recipes: recent },
		{ title: 'Most forked', recipes: mostForked },
		{ title: 'All recipes', recipes: rest }
	];
	return sections.filter((s) => s.recipes.length > 0);
}
