// Tag identity rules, shared by the form, the parser and the save action so
// they cannot disagree about whether two tag lists are the same.

/** The identity of a tag name: case and surrounding space do not count. */
export const tagKey = (name: string): string => name.trim().toLowerCase();

/** Trimmed, blanks dropped, duplicates removed by identity; the first spelling is kept. */
export function normaliseTagNames(names: string[]): string[] {
	const seen = new Set<string>();
	const kept: string[] = [];
	for (const raw of names) {
		const name = raw.trim();
		const key = tagKey(name);
		if (name === '' || seen.has(key)) continue;
		seen.add(key);
		kept.push(name);
	}
	return kept;
}

/** The same set of tags by identity, whatever the order, case or repeats. */
export function sameTags(a: string[], b: string[]): boolean {
	const keysA = new Set(a.map(tagKey));
	const keysB = new Set(b.map(tagKey));
	return keysA.size === keysB.size && [...keysA].every((key) => keysB.has(key));
}
