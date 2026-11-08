// Groups ("Dough", "To finish") are typed as "# Name" lines in the ingredient
// and step boxes, so a pasted recipe keeps its sections. Each row stores the
// group it sits under; rows before the first heading have none, and a recipe
// with no heading stores exactly what it did before groups existed.

import { plural } from '../helpers.js';

// A space or the line's end after the #, as Markdown has it, so "#10 can
// tomatoes" stays a line. A bare "#" is a heading with an empty name, which
// validation refuses rather than saving "#" as a row.
const HEADING = /^\s*#(?:\s+(.*))?$/;

export type Section = { group: string | undefined; text: string };

/** The box's text cut at each heading line. A heading with nothing under it
 *  is kept, so validation can name it; the run before the first heading is
 *  dropped when it is blank. */
export function splitGroups(text: string): Section[] {
	const sections: { group: string | undefined; lines: string[] }[] = [
		{ group: undefined, lines: [] }
	];
	for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
		const heading = HEADING.exec(line);
		if (heading) sections.push({ group: (heading[1] ?? '').trim(), lines: [] });
		else sections.at(-1)!.lines.push(line);
	}
	return sections
		.map(({ group, lines }) => ({ group, text: lines.join('\n') }))
		.filter((section, i) => i > 0 || section.text.trim().length > 0);
}

/** The group name to print above row `i`: its group, where that differs from
 *  the row before; undefined for an ungrouped row or one inside a run. */
export function groupStartingAt(rows: Array<{ group?: string }>, i: number): string | undefined {
	const { group } = rows[i];
	return group !== undefined && group !== rows[i - 1]?.group ? group : undefined;
}

/** The inverse of splitGroups: rows printed with `separator` between them, and
 *  a "# Name" line, a blank line above it, wherever the group changes. */
export function joinGroups<T extends { group?: string }>(
	rows: T[],
	print: (row: T) => string,
	separator: string
): string {
	let out = '';
	rows.forEach((row, i) => {
		const heading = groupStartingAt(rows, i);
		if (i > 0) out += heading !== undefined ? '\n\n' : separator;
		if (heading !== undefined) out += `# ${heading}\n`;
		out += print(row);
	});
	return out;
}

/** Each section parsed by `parse`, its rows given the section's group. */
export function parseGrouped<T extends object>(
	text: string,
	parse: (text: string) => T[]
): Array<{ group: string | undefined; rows: T[] }> {
	return splitGroups(text).map(({ group, text }) => ({
		group,
		rows: parse(text).map((row) => (group === undefined ? row : { ...row, group }))
	}));
}

/** What the editor prints under a grouped box ("Reads as 2 groups: Dough 10
 *  lines · To finish 1 line"), so the split is seen before it is saved; null
 *  for a box with no heading, which reads as it always has. A part with no
 *  name is the run before the first heading. */
export function readBack(
	sections: Array<{ group: string | undefined; rows: unknown[] }>,
	items: 'ingredients' | 'steps'
): { lead: string; parts: Array<{ name: string | undefined; detail: string }> } | null {
	const named = sections.filter((s) => s.group !== undefined).length;
	if (named === 0) return null;
	let count = 0;
	const parts = sections.map(({ group, rows }) => {
		const first = count + 1;
		count += rows.length;
		const detail =
			rows.length === 0
				? 'empty'
				: items === 'ingredients'
					? plural(rows.length, 'line')
					: first === count
						? String(first)
						: `${first}–${count}`;
		return { name: group, detail };
	});
	const groups = plural(named, 'group');
	const lead =
		items === 'steps' ? `Reads as ${plural(count, 'step')} in ${groups}:` : `Reads as ${groups}:`;
	return { lead, parts };
}
