// The readable form of a ForkExport: one Markdown document, each recipe a
// section with its latest version in full and its earlier ones under it.
import type { ExportRecipe, ForkExport, JournalSource, RecipeRef } from './archive.js';
import type { RecipeContent } from '#lib/recipes/types.js';
import { groupStartingAt } from '#lib/recipes/groups.js';
import { timeSpans } from '#lib/recipes/times.js';
import { AUDIENCE_LABEL } from '#lib/audience.js';

const ANNOTATION_LABEL = { tip: 'Tip', warning: 'Warning', substitution: 'Substitution' } as const;

const day = (iso: string) => iso.slice(0, 10);
const link = (r: { title: string; url: string }) => `[${r.title}](${r.url})`;
const byline = (r: RecipeRef) => (r.author ? ` by @${r.author}` : '');
// The parent linked at the version copied, when it is known.
const forkedFrom = (r: RecipeRef & { version: number | null }) =>
	r.version === null
		? link(r)
		: `${link({ title: r.title, url: `${r.url}?version=${r.version}` })}, v${r.version}`;
const hashes = (level: number) => '#'.repeat(level);

/** One version's content, its sections at `level` and its groups one under. */
function content(c: RecipeContent, level: number): string[] {
	const out: string[] = [];
	if (c.description) out.push(c.description, '');
	const facts = [
		c.servings ? `Serves ${c.servings}` : null,
		c.makes ? `Makes ${c.makes}` : null,
		...timeSpans(c).map((t) => `${t.value} ${t.word}`)
	].filter(Boolean);
	if (facts.length) out.push(facts.join(' · '), '');
	if (c.sourceName || c.sourceUrl) {
		const name = c.sourceName ?? c.sourceUrl;
		out.push(`Source: ${c.sourceUrl ? `[${name}](${c.sourceUrl})` : name}`, '');
	}
	if (c.imageUrl) out.push(`Photo: ${c.imageUrl}`, '');

	out.push(`${hashes(level)} Ingredients`, '');
	c.ingredients.forEach((row, i) => {
		const group = groupStartingAt(c.ingredients, i);
		if (group !== undefined) out.push('', `${hashes(level + 1)} ${group}`, '');
		out.push(`- ${row.text}`);
	});
	out.push('', `${hashes(level)} Method`, '');
	// Numbered straight through groups, as the recipe page numbers them.
	c.steps.forEach((step, i) => {
		const group = groupStartingAt(c.steps, i);
		if (group !== undefined) out.push('', `${hashes(level + 1)} ${group}`, '');
		out.push(`${i + 1}. ${step.text}`);
		if (step.annotation)
			out.push(`   > ${ANNOTATION_LABEL[step.annotation.type]}: ${step.annotation.text}`);
	});
	out.push('');

	const labelled = [
		['Make ahead', c.makeAhead],
		['Equipment', c.equipment],
		['Storage', c.storage],
		['Reheating', c.reheating]
	] as const;
	if (c.notes || labelled.some(([, v]) => v)) {
		out.push(`${hashes(level)} Notes`, '');
		if (c.notes) out.push(c.notes, '');
		for (const [label, value] of labelled) if (value) out.push(`**${label}:** ${value}`, '');
	}
	return out;
}

function recipe(r: ExportRecipe): string[] {
	const latest = r.versions.at(-1)!;
	const earlier = r.versions.slice(0, -1).reverse();
	const versionHeading = (v: ExportRecipe['versions'][number]) =>
		`v${v.number} · ${day(v.date)} · ${v.message}`;
	const meta = [
		`Link: ${r.url}`,
		`Audience: ${AUDIENCE_LABEL[r.audience]}`,
		r.tags.length ? `Tags: ${r.tags.join(', ')}` : null,
		r.forkedFrom === 'deleted'
			? 'Forked from a recipe since deleted'
			: r.forkedFrom === 'hidden'
				? 'Forked from a recipe you can no longer see'
				: r.forkedFrom
					? `Forked from ${forkedFrom(r.forkedFrom)}${byline(r.forkedFrom)}`
					: null,
		r.inTrashSince ? `In the Trash since ${day(r.inTrashSince)}` : null
	].filter(Boolean);

	const out = [`## ${latest.content.title}`, '', ...meta.map((m) => `- ${m}`), ''];
	out.push(`### ${versionHeading(latest)}`, '', ...content(latest.content, 4));
	if (earlier.length) {
		out.push('### Earlier versions', '');
		for (const v of earlier) {
			out.push(`#### ${versionHeading(v)}`, '');
			if (v.content.title !== latest.content.title) out.push(`Titled “${v.content.title}”`, '');
			out.push(...content(v.content, 5));
		}
	}
	return out;
}

function source(s: JournalSource): string {
	if (s.kind === 'recipe') return `${link(s)}${s.version ? ` v${s.version}` : ''}`;
	if (s.kind === 'link') return s.url;
	if (s.kind === 'improvised') return 'Improvised';
	if (s.kind === 'deleted') return 'A recipe since deleted';
	return 'A recipe you can no longer see';
}

export function toMarkdown(ex: ForkExport): string {
	const out = [
		`# Fork export: @${ex.profile.username}`,
		'',
		`Exported ${day(ex.exportedAt)} from ${ex.profile.url}. Photos are linked, not included: open each link to save the picture.`,
		''
	];
	for (const r of ex.recipes) out.push(...recipe(r));

	if (ex.saves.length) {
		out.push('## Saved recipes', '');
		for (const s of ex.saves) {
			const kept = s.keptCopy ? ` (you keep a copy of v${s.keptCopy})` : '';
			const pinned = s.keptVersion ? ` · opens at v${s.keptVersion}` : '';
			out.push(`- ${link(s)}${byline(s)}${pinned}${kept}`);
			if (s.note) out.push(`  - Your note: ${s.note}`);
		}
		out.push('');
	}
	if (ex.collections.length) {
		out.push('## Collections', '');
		for (const c of ex.collections) {
			out.push(`### ${c.name}`, '');
			out.push(
				...(c.recipes.length ? c.recipes.map((r) => `- ${link(r)}${byline(r)}`) : ['Empty.'])
			);
			out.push('');
		}
	}
	if (ex.journal.length) {
		out.push('## Journal', '');
		for (const e of ex.journal) {
			const serves = e.servings ? ` · serves ${e.servings}` : '';
			out.push(`### ${e.cookedOn} · ${e.dish}`, '', `From: ${source(e.source)}${serves}`, '');
			for (const text of [e.caption, e.note]) if (text) out.push(text, '');
			if (e.photoUrl) out.push(`Photo: ${e.photoUrl}`, '');
		}
	}
	return out.join('\n').replace(/\n{3,}/g, '\n\n');
}
