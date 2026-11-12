// Each varied recipe's versions in full, from the data's first version and
// changes (or, for a fork, its parent's copied version). Pure, so the data test
// and the loader read the same versions.
import { parseDraftContent, type RecipeDraft } from '../../../recipes/validation.js';
import { formatDuration } from '../../../recipes/times.js';
import { restoredCommitMessage } from '../../../recipes/content.js';
import type { RecipeContent } from '../../../recipes/types.js';
import type { SeedRecipe, SeedVersion } from '../seedData.js';
import type { Content, Restore, VariedRecipe } from './types.js';

export type BuiltVersion = { content: Content; message: string; daysAgo: number };

const isRestore = (c: object): c is Restore => 'restore' in c;

/**
 * `recipe`'s versions, oldest first. A fork's v1 is its parent's `version`
 * with no message (the fork action stores none); a restore carries the
 * restored version's content under "Restore vN".
 */
export function versionsOf(recipe: VariedRecipe, byKey: Map<string, VariedRecipe>): BuiltVersion[] {
	let first: BuiltVersion;
	if (recipe.first) {
		// The base seed's fork carries its own first version.
		const message = recipe.forkOf ? '' : 'Initial recipe';
		first = { content: recipe.first, message, daysAgo: recipe.daysAgo };
	} else if (recipe.forkOf) {
		const parent = byKey.get(recipe.forkOf.key);
		if (!parent) throw new Error(`${recipe.key} forks ${recipe.forkOf.key}, which is not seeded`);
		const copied = versionsOf(parent, byKey)[recipe.forkOf.version - 1];
		if (!copied) throw new Error(`${recipe.key} forks v${recipe.forkOf.version} of ${parent.key}`);
		first = { content: copied.content, message: '', daysAgo: recipe.daysAgo };
	} else {
		throw new Error(`${recipe.key} has neither a first version nor a parent`);
	}
	const versions = [first];
	for (const change of recipe.changes ?? []) {
		if (isRestore(change)) {
			const source = versions[change.restore - 1];
			if (!source) throw new Error(`${recipe.key} restores v${change.restore}, which it lacks`);
			versions.push({
				content: source.content,
				message: restoredCommitMessage(change.restore),
				daysAgo: change.daysAgo
			});
		} else {
			const { message, daysAgo, ...changed } = change;
			versions.push({ content: { ...versions.at(-1)!.content, ...changed }, message, daysAgo });
		}
	}
	return versions;
}

/** A version as the editor's form would hold it, typed times and all. */
export function seedDraft(c: Content, commitMessage = ''): RecipeDraft {
	const time = (minutes: number | null) => (minutes === null ? '' : formatDuration(minutes));
	const words = (s: string | null) => s ?? '';
	return {
		title: c.title,
		description: words(c.description),
		servings: c.servings?.toString() ?? '',
		makes: words(c.makes),
		prepTimeMinutes: time(c.prepTimeMinutes),
		cookTimeMinutes: time(c.cookTimeMinutes),
		restTimeMinutes: time(c.restTimeMinutes),
		sourceName: words(c.sourceName),
		sourceUrl: words(c.sourceUrl),
		ingredients: c.ingredientsText,
		steps: c.stepsText,
		notes: words(c.notes),
		makeAhead: words(c.makeAhead),
		equipment: words(c.equipment),
		storage: words(c.storage),
		reheating: words(c.reheating),
		commitMessage,
		editRevision: '',
		visibility: 'private',
		tags: [],
		hadPhoto: false,
		removeImage: false
	};
}

/** A version's content as the editor's save stores it, or a throw naming what the editor would refuse. */
export function storedContent(c: Content): RecipeContent {
	const parsed = parseDraftContent(seedDraft(c));
	if (!parsed.ok) throw new Error(`${c.title}: ${parsed.error}`);
	return { ...parsed.value, imageUrl: c.imageUrl };
}

/** Whole days from `iso` to `today`. */
export function daysBefore(today: Date, iso: string): number {
	return Math.round((today.getTime() - new Date(iso).getTime()) / 86_400_000);
}

/** The base seed's recipes in the varied shape, so a varied fork or save can name one by its slug prefix. */
export function baseAsVaried(base: SeedRecipe[], today: Date): VariedRecipe[] {
	return base.map((recipe) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const toContent = ({ commitMessage, createdAt, ...c }: SeedVersion): Content => c;
		const [first, ...later] = recipe.versions;
		return {
			key: recipe.slug,
			author: recipe.author ?? 'spencerfletcher',
			tags: recipe.tags,
			visibility: recipe.visibility,
			daysAgo: daysBefore(today, first.createdAt),
			first: toContent(first),
			forkOf: recipe.forkOf && { key: recipe.forkOf.slug, version: recipe.forkOf.version },
			changes: later.map((v) => ({
				...toContent(v),
				message: v.commitMessage,
				daysAgo: daysBefore(today, v.createdAt)
			}))
		};
	});
}
