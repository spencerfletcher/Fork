<script lang="ts">
	import type {
		IngredientDiffRow,
		InlineSegment,
		MetaDiffRow,
		MetaField,
		StepDiffRow
	} from '#lib/recipes/diff.js';

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

	const LABEL: Record<MetaField, string> = {
		title: 'Title',
		description: 'Description',
		imageUrl: 'Photo',
		servings: 'Servings',
		prepTimeMinutes: 'Prep time',
		cookTimeMinutes: 'Cook time'
	};

	// Zero is a value; only null is "not set".
	const show = (value: string | number | null) => (value === null ? '—' : String(value));

	const GUTTER = { added: '+', removed: '−', modified: '~', unchanged: ' ' } as const;
</script>

<!-- The gutter glyph carries the same information as the row colour, for anyone
     who cannot rely on colour alone. -->
{#snippet gutter(status: keyof typeof GUTTER)}
	<span class="diff-gutter">{GUTTER[status]}</span>
{/snippet}

<!-- Word-level segments inside a modified row; diffWords keeps the spacing. -->
{#snippet segments(list: InlineSegment[])}{#each list as seg, i (i)}{#if seg.type === 'added'}<span
				class="diff-added">
				{seg.text}
			</span>{:else if seg.type === 'removed'}<span class="diff-removed">
				{seg.text}
			</span>{:else}{seg.text}{/if}{/each}{/snippet}

{#snippet panel(title: string, isEmpty: boolean, rows: import('svelte').Snippet)}
	<section class="diff-section">
		<svelte:element this={`h${headingLevel}`} class="eyebrow-label mb-3">{title}</svelte:element>
		<div class="diff-panel">
			{@render rows()}
			{#if isEmpty}
				<p class="diff-empty">No changes</p>
			{/if}
		</div>
	</section>
{/snippet}

<!-- Two columns where there is room for them. This is a container query, not a
     viewport one: the landing page and the compare page both give the diff a
     column wide enough to split at 48rem, and it stacks on its own below that. -->
<!-- Title, description, servings and times. Only rendered when something
     changed: an empty Details panel would be noise above every diff. -->
{#if metaDiff.length > 0}
	{#snippet metaRows()}
		{#each metaDiff as row (row.field)}
			<div class="diff-row diff-modified">
				{@render gutter('modified')}
				<span class="diff-content">
					{LABEL[row.field]}:
					{#if row.field === 'imageUrl'}
						{#if row.from}<img
								class="diff-thumb diff-removed"
								src={String(row.from)}
								alt="Before" />{:else}<span class="diff-removed">—</span>{/if}
						{#if row.to}<img
								class="diff-thumb diff-added"
								src={String(row.to)}
								alt="After" />{:else}<span class="diff-added">—</span>{/if}
					{:else}
						<span class="diff-removed">{show(row.from)}</span>
						<span class="diff-added">{show(row.to)}</span>
						{#if (row.field === 'prepTimeMinutes' || row.field === 'cookTimeMinutes') && row.to !== null}min{/if}
					{/if}
				</span>
			</div>
		{/each}
	{/snippet}
	{@render panel('Details', false, metaRows)}
{/if}

<div class="@container">
	<div class="grid gap-x-8 @3xl:grid-cols-2">
		{#snippet ingredientRows()}
			{#each ingredientDiff as row, i (i)}
				<div class="diff-row diff-{row.status}">
					{@render gutter(row.status)}
					<span class="diff-content">
						{#if row.status === 'modified'}
							{@render segments(row.segments)}
						{:else}
							{row.ingredient.text}
						{/if}
					</span>
				</div>
			{/each}
		{/snippet}
		{@render panel('Ingredients', ingredientDiff.length === 0, ingredientRows)}

		{#snippet stepRows()}
			{#each stepDiff as row, i (i)}
				<div class="diff-row diff-{row.status}">
					{@render gutter(row.status)}
					<!-- A removed step has no position in the new version, so numbering it
					     would imply the steps after it had shifted. -->
					{#if row.status !== 'removed'}
						<span class="step-num">{row.stepNumber}</span>
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
			{/each}
		{/snippet}
		{@render panel('Steps', stepDiff.length === 0, stepRows)}
	</div>
</div>

<style>
	.diff-section {
		margin-bottom: 1.75rem;
	}

	.diff-panel {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		font-family: var(--font-mono);
		font-size: 0.875rem;
	}

	.diff-empty {
		margin: 0;
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

	.diff-gutter {
		width: 1ch;
		flex-shrink: 0;
		font-weight: 700;
		user-select: none;
	}

	.diff-content {
		flex: 1;
		max-width: 72ch;
		line-height: 1.5;
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

	.diff-unchanged,
	.diff-modified {
		color: var(--color-text-2);
	}

	.diff-modified .diff-gutter {
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
	.diff-content .diff-added {
		background: var(--color-add-bg);
		color: var(--color-add);
		text-decoration: underline;
	}

	.diff-content .diff-removed {
		background: var(--color-remove-bg);
		color: var(--color-remove);
		text-decoration: line-through;
	}

	/* A replaced word renders as a removed run immediately followed by an added
	   run. A thin gap keeps "Cool" + "Sprinkle" from reading as one word without
	   adding characters to the copyable text. */
	.diff-content .diff-removed + .diff-added,
	.diff-content .diff-added + .diff-removed {
		margin-left: 0.4em;
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
