/** The longest collection name, in characters; the name box's maxlength too. */
export const COLLECTION_NAME_MAX = 40;

/** Made once for each cook, the first time they need a collection; renamed or deleted like any other. */
export const STARTER_COLLECTIONS = ['To cook', 'Favorites'] as const;

/** What a refused name is told. */
export const COLLECTION_NAME_ERROR = {
	empty: 'Name the collection.',
	long: `Keep the name to ${COLLECTION_NAME_MAX} characters.`,
	taken: (name: string) => `You already have a collection called “${name}”.`
} as const;

/** A typed name trimmed, or why it is refused. */
export function collectionName(raw: string): { name: string } | { error: string } {
	const name = raw.trim().replace(/\s+/g, ' ');
	if (!name) return { error: COLLECTION_NAME_ERROR.empty };
	if ([...name].length > COLLECTION_NAME_MAX) return { error: COLLECTION_NAME_ERROR.long };
	return { name };
}
