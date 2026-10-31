import { eq, or, type SQL } from 'drizzle-orm';
import { recipes } from './db/schema.js';

type Viewer = { id: string } | null | undefined;

/** A recipe is visible when it is public or the viewer wrote it. */
export function canView(
	row: { isPublic: boolean; authorId: string | null },
	user: Viewer
): boolean {
	return row.isPublic || (user != null && row.authorId === user.id);
}

/** The same rule as a query condition on `recipes`. */
export function visibleTo(user: Viewer): SQL {
	return user
		? (or(eq(recipes.isPublic, true), eq(recipes.authorId, user.id)) as SQL)
		: eq(recipes.isPublic, true);
}
