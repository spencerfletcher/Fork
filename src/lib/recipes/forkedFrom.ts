// A fork's first history entry. The fork action stores no handle in v1's
// message (a rename would leave it stale): every reader of v1 of a fork reads
// its line from the parent instead, through these, at read time.

/**
 * Where a fork came from, as its reader may know it: the parent's author by
 * current handle (null once their account is gone), or that the parent was
 * deleted, or is one the reader may not open.
 */
export type ForkOrigin = { author: string | null } | 'deleted' | 'hidden';

/** "Forked from @ana, v3"; the version copied is left out when not recorded. */
export function forkedFromLine(origin: ForkOrigin, version: number | null): string {
	const from =
		origin === 'deleted'
			? 'a deleted recipe'
			: origin === 'hidden'
				? 'a private recipe'
				: origin.author && `@${origin.author}`;
	const parts = [from, version !== null && `v${version}`].filter(Boolean).join(', ');
	return parts ? `Forked from ${parts}` : 'Forked';
}

/** A fork's parent as the recipe page's data gives it: the row the reader may open (else null), and whether it was deleted. */
export type Lineage = {
	parent: { author?: { username: string } | null } | null;
	parentDeleted: boolean;
};

export function originOf({ parent, parentDeleted }: Lineage): ForkOrigin {
	if (parentDeleted) return 'deleted';
	return parent ? { author: parent.author?.username ?? null } : 'hidden';
}

/** `versions` with a fork's v1 message read from its parent; any other version's, and any recipe's that is no fork, as stored. */
export function withForkLine<V extends { versionNumber: number; commitMessage: string }>(
	versions: V[],
	recipe: Lineage & { parentId: number | null; parentVersion: number | null }
): V[] {
	if (recipe.parentId === null) return versions;
	const line = forkedFromLine(originOf(recipe), recipe.parentVersion);
	return versions.map((v) => (v.versionNumber === 1 ? { ...v, commitMessage: line } : v));
}
