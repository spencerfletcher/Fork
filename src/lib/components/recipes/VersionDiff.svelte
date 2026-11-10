<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		diffHeading,
		type IngredientDiffRow,
		type InlineSegment,
		type MetaDiffRow,
		type MetaField,
		type StepDiffRow
	} from '#lib/recipes/diff.js';
	import { formatTime } from '#lib/helpers.js';
	import { NUMBER_FIELDS, type NumberField } from '#lib/recipes/validation.js';

	let {
		metaDiff,
		ingredientDiff,
		stepDiff,
		headingLevel = 3
	}: {
		metaDiff: MetaDiffRow[];
		ingredientDiff: IngredientDiffRow[];
		stepDiff: StepDiffRow[];
		/** The panel headings' level, so the page's outline has no gap. */
		headingLevel?: 2 | 3;
	} = $props();

	// Each panel's list is named by its heading; the prefix keeps two diffs on
	// one page apart.
	const uid = $props.id();

	const LABEL = {
		title: 'Title',
		description: 'Description',
		imageUrl: 'Photo',
		makes: 'Makes'
	} as const;

	// Zero is a value; only null is "not set".
	const show = (value: string | number | null) => (value === null ? '—' : String(value));

	// The measure fields read as the recipe page's measure does: value then
	// label, "4 to 8 servings", "11 min to 13 min cook".
	type MeasureField = NumberField;
	const isMeasure = (field: MetaField): field is MeasureField => field in NUMBER_FIELDS;
	const measure = (field: MeasureField, value: string | number | null) =>
		value === null || field === 'servings' ? show(value) : formatTime(Number(value));
	const TIME_LABEL = { prepTimeMinutes: 'prep', cookTimeMinutes: 'cook' } as const;
	const measureLabel = (field: MeasureField, to: string | number | null) =>
		field === 'servings' ? (to === 1 ? 'serving' : 'servings') : TIME_LABEL[field];

	const GUTTER = { added: '+', removed: '−', modified: '~', unchanged: ' ' } as const;
	const PREFIX = { added: 'Added:', removed: 'Removed:', modified: 'Changed:' } as const;
</script>

<!-- The gutter glyph carries the same information as the row colour, for anyone
     who cannot rely on colour alone; a screen reader gets the prefix instead. -->
{#snippet gutter(status: keyof typeof GUTTER)}
	{#if status !== 'unchanged'}<span class="sr-only select-none">{PREFIX[status]}</span>{/if}
	<span class="diff-gutter" aria-hidden="true">{GUTTER[status]}</span>
{/snippet}

<!-- A real space and an unseen "to" between the sides, so "¾½ cup" reads and
     copies as "¾ to ½ cup". The {' '} mustaches below are the spaces: Svelte
     would drop a bare space at a snippet's edge, so the lint rule is off here. -->
<!-- eslint-disable svelte/no-useless-mustaches -->
{#snippet toWord()}{' '}
	<span class="sr-only">to</span>
	{' '}{/snippet}

<!-- The unseen stop keeps a screen reader from running the number into the
     text: "5. Gradually stir", not "5 Gradually stir". Kept on one line: a
     break before the stop would put a space in front of it. -->
{#snippet stepNum(n: number)}
	<!-- prettier-ignore -->
	<span class="step-num">{n}<span class="sr-only">.</span></span>
{/snippet}

{#snippet change(from: string, to: string)}<del class="diff-removed">{from}</del>
	{@render toWord()}
	<ins class="diff-added">{to}</ins>{/snippet}

<!-- Word-level segments inside a modified row; diffWords keeps the spacing. A
     replacement reads "old to new"; a lone insertion or deletion opens with an
     unseen "added:" or "removed:", so it is not silent (decided 29 October
     2026). The spaces sit inside the unseen words, so nothing visible moves. -->
<!-- prettier-ignore -->
{#snippet segments(list: InlineSegment[])}{#each list as seg, i (i)}{#if seg.type === 'added'}{#if list[i - 1]?.type !== 'removed'}<span class="sr-only">{' added: '}</span>{/if}<ins class="diff-added">{seg.text}</ins>{:else if seg.type === 'removed'}{#if list[i + 1]?.type !== 'added'}<span class="sr-only">{' removed: '}</span>{/if}<del class="diff-removed">{seg.text}</del>{#if list[i + 1]?.type === 'added'}{@render toWord()}{/if}{:else}{seg.text}{/if}{/each}{/snippet}

<!-- A list of rows, so a reader hears the count; an empty panel holds only
     "No changes" and is not a list. -->
{#snippet panel(title: string, isEmpty: boolean, rows: import('svelte').Snippet)}
	<section class="diff-section">
		<svelte:element this={`h${headingLevel}`} id="{uid}-{title}" class="eyebrow-label mb-3">
			{title}
		</svelte:element>
		<div
			class="diff-panel"
			role={isEmpty ? undefined : 'list'}
			aria-labelledby={isEmpty ? undefined : `${uid}-${title}`}>
			{@render rows()}
			{#if isEmpty}
				<p class="diff-empty">No changes</p>
			{/if}
		</div>
	</section>
{/snippet}

<!-- A row that starts a group carries the group's name above it, inside its
     own list item, so the list still counts one item per row; a renamed group
     reads "old to new". Every other row is its own item, as before groups. -->
{#snippet groupItem(
	heading: ReturnType<typeof diffHeading>,
	row: Snippet<[role: 'listitem' | undefined]>
)}
	{#if heading}
		<div class="diff-item" role="listitem">
			<svelte:element this={`h${headingLevel + 1}`} class="diff-group">
				{#if heading.from !== undefined}
					{@render change(heading.from, heading.name)}
				{:else}
					{heading.name}
				{/if}
			</svelte:element>
			{@render row(undefined)}
		</div>
	{:else}
		{@render row('listitem')}
	{/if}
{/snippet}

<!-- Title, description, servings and times. Only rendered when something
     changed: an empty Details panel would be noise above every diff. -->
{#if metaDiff.length > 0}
	{#snippet metaRows()}
		{#each metaDiff as row (row.field)}
			<div class="diff-row diff-modified" role="listitem">
				{@render gutter('modified')}
				<span class="diff-content diff-content--meta">
					{#if row.field === 'imageUrl'}
						{LABEL[row.field]}:
						{#if row.from}<img
								class="diff-thumb diff-removed"
								src={String(row.from)}
								alt="Before" />{:else}<span class="diff-removed">—</span>{/if}
						{#if row.to}<img
								class="diff-thumb diff-added"
								src={String(row.to)}
								alt="After" />{:else}<span class="diff-added">—</span>{/if}
					{:else if isMeasure(row.field)}
						{@render change(measure(row.field, row.from), measure(row.field, row.to))}
						{measureLabel(row.field, row.to)}
					{:else}
						{LABEL[row.field]}:
						{@render change(show(row.from), show(row.to))}
					{/if}
				</span>
			</div>
		{/each}
	{/snippet}
	{@render panel('Details', false, metaRows)}
{/if}

<!-- Two columns where there is room for them. This is a container query, not a
     viewport one: the landing page and the compare page both put the diff in
     the site's 1200px column, which is 61rem wide at a 1024 viewport, so the
     panels sit side by side from 1024 and stack on their own below that. -->
<div class="@container">
	<!-- The compare page's version cards' grid: two equal columns 24px apart, so
	     Method starts on the To card's edge (decided 29 October 2026). -->
	<div class="diff-columns grid gap-x-5 @min-[61rem]:grid-cols-2">
		{#snippet ingredientRows()}
			{#each ingredientDiff as row, i (i)}
				{#snippet line(role: 'listitem' | undefined)}
					<div class="diff-row diff-{row.status}" {role}>
						{@render gutter(row.status)}
						<span class="diff-content">
							{#if row.status === 'modified'}
								{@render segments(row.segments)}
							{:else}
								{row.ingredient.text}
							{/if}
						</span>
					</div>
				{/snippet}
				{@render groupItem(diffHeading(ingredientDiff, i), line)}
			{/each}
		{/snippet}
		{@render panel('Ingredients', ingredientDiff.length === 0, ingredientRows)}

		{#snippet stepRows()}
			{#each stepDiff as row, i (i)}
				{#snippet line(role: 'listitem' | undefined)}
					<div class="diff-row diff-{row.status}" {role}>
						{@render gutter(row.status)}
						<!-- A removed step has no position in the new version, so numbering it
					     would imply the steps after it had shifted. -->
						{#if row.status !== 'removed'}
							{@render stepNum(row.stepNumber)}
						{/if}
						<span class="diff-content whitespace-pre-line">
							{#if row.status === 'modified'}
								{@render segments(row.segments)}
								{#if row.annotation}
									<span class="diff-annotation diff-{row.annotation.status}">
										{row.annotation.type}: {@render segments(row.annotation.segments)}
									</span>
								{/if}
							{:else}
								{row.step.text}
							{/if}
						</span>
					</div>
				{/snippet}
				{@render groupItem(diffHeading(stepDiff, i), line)}
			{/each}
		{/snippet}
		{@render panel('Method', stepDiff.length === 0, stepRows)}
	</div>
</div>

<style>
	.diff-section {
		margin-bottom: 1.5rem;
	}

	.diff-panel {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		font-family: var(--font-mono);
		font-size: 0.875rem;
	}

	.diff-empty {
		padding: 1rem;
		text-align: center;
		color: var(--color-text-3);
	}

	.diff-row {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.diff-row:last-child {
		border-bottom: 0;
	}

	/* A group's first row sits in a wrapper that draws the rule instead. */
	.diff-item {
		border-bottom: 1px solid var(--color-border);
	}

	.diff-item:last-child,
	.diff-item > .diff-row {
		border-bottom: 0;
	}

	/* A group name in the recipe page's voice: words, not an identifier, so
	   not the diff's mono. */
	.diff-group {
		padding: 0.75rem 1rem 0;
		font-family: var(--font-serif);
		font-weight: 500;
		font-size: 1.0625rem;
		line-height: 1.25;
		color: var(--color-text);
	}

	.diff-gutter {
		width: 1ch;
		flex-shrink: 0;
		font-weight: 600;
		user-select: none;
	}

	/* min-width: 0 lets the flex item shrink below a long unbroken word, which
	   then wraps instead of pushing the diff wider than a phone. */
	.diff-content {
		flex: 1;
		min-width: 0;
		max-width: 72ch;
		line-height: 1.5;
		overflow-wrap: anywhere;
	}

	/* Details runs the column, so a renamed title stays on one line. */
	.diff-content--meta {
		max-width: none;
	}

	.step-num {
		flex-shrink: 0;
		font-weight: 600;
		color: var(--color-accent);
	}

	.diff-row.diff-added .step-num {
		color: inherit;
	}

	/* ── Row status ─────────────────────────────────────────────────────────── */

	/* A modified row, its ~ included, is ink: not the grey of the unchanged rows
	   it must stand apart from, and not clay, which would read too close to the
	   removal red (decided 29 October 2026). */
	.diff-modified {
		color: var(--color-text);
	}

	/* Unchanged rows recede so the changed ones stand out. */
	.diff-unchanged,
	.diff-unchanged .step-num {
		color: var(--color-text-3);
	}

	.diff-row.diff-added {
		background: var(--color-add-bg);
		color: var(--color-add);
	}

	.diff-row.diff-removed {
		background: var(--color-remove-bg);
		color: var(--color-remove);
		text-decoration: line-through;
	}

	/* ── Inline segments within a modified row ──────────────────────────────── */

	/* Underlined as well as coloured, so a replaced word reads without colour. */
	.diff-content .diff-added,
	.diff-group .diff-added {
		background: var(--color-add-bg);
		color: var(--color-add);
		text-decoration: underline;
	}

	.diff-content .diff-removed,
	.diff-group .diff-removed {
		background: var(--color-remove-bg);
		color: var(--color-remove);
		text-decoration: line-through;
	}

	.diff-thumb {
		display: inline-block;
		height: 2.5rem;
		width: 2.5rem;
		object-fit: cover;
		border-radius: 4px;
		vertical-align: middle;
		margin-right: 0.4em;
	}

	.diff-annotation {
		display: block;
		font-style: italic;
		font-size: 0.9em;
	}
</style>
