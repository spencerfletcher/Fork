// Groups ("Dough", "To finish") are typed as "# Name" lines in the ingredient
// and step boxes, so a pasted recipe keeps its sections. Each row stores the
// group it sits under; rows before the first heading have none, and a recipe
// with no heading stores exactly what it did before groups existed.

// A space after the #, as Markdown has it, so "#10 can tomatoes" stays a line.
const HEADING = /^\s*#\s+(\S.*)$/;

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
		if (heading) sections.push({ group: heading[1].trim(), lines: [] });
		else sections.at(-1)!.lines.push(line);
	}
	return sections
		.map(({ group, lines }) => ({ group, text: lines.join('\n') }))
		.filter((section, i) => i > 0 || section.text.trim().length > 0);
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
		const heading = row.group !== undefined && row.group !== rows[i - 1]?.group;
		if (i > 0) out += heading ? '\n\n' : separator;
		if (heading) out += `# ${row.group}\n`;
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
