<script lang="ts">
	import type { IngredientDiffRow, InlineSegment, StepDiffRow } from '$lib/utils/diff';

	let {
		ingredientDiff,
		stepDiff
	}: {
		ingredientDiff: IngredientDiffRow[];
		stepDiff: StepDiffRow[];
	} = $props();

	const GUTTER = { added: '+', removed: '−', modified: '~', unchanged: ' ' } as const;
</script>

<!-- The gutter glyph carries the same information as the row colour, for anyone
     who cannot rely on colour alone. -->
{#snippet gutter(status: keyof typeof GUTTER)}
	<span class="diff-gutter">{GUTTER[status]}</span>
{/snippet}

<!--
	Word-level segments inside a modified row.

	`spaced` exists because the two callers tokenise differently. Ingredient rows
	are diffed as "amount unit name", where the segment boundaries fall on the
	spaces and the joining whitespace is lost; step rows are diffed as prose and
	keep their own spacing. Without the flag, ingredients run together and steps
	gain double spaces.
-->
{#snippet segments(list: InlineSegment[], spaced: boolean)}
	{#each list as seg, i (i)}
		{#if seg.type === 'added'}<span class="diff-added">{seg.text}</span>
		{:else if seg.type === 'removed'}<span class="diff-removed">{seg.text}</span>
		{:else}{seg.text}{/if}
		{#if spaced}<span> </span>{/if}
	{/each}
{/snippet}

{#snippet panel(title: string, isEmpty: boolean, rows: import('svelte').Snippet)}
	<section class="diff-section">
		<h3 class="eyebrow-label mb-3">{title}</h3>
		<div class="diff-panel">
			{@render rows()}
			{#if isEmpty}
				<p class="diff-empty">No changes</p>
			{/if}
		</div>
	</section>
{/snippet}

<!-- Two columns where there is room for them. This is a container query, not a
     viewport one: the compare page constrains the diff to a 720px reading column
     and must stay stacked even on a wide screen, while the landing page gives it
     the full width and should split. -->
<div class="@container">
	<div class="grid gap-x-8 @3xl:grid-cols-2">
		{#snippet ingredientRows()}
			{#each ingredientDiff as row, i (i)}
				<div class="diff-row diff-{row.status}">
					{@render gutter(row.status)}
					<span class="diff-content">
						{#if row.status === 'modified'}
							{@render segments(row.segments, true)}
						{:else}
							{row.ingredient.amount}
							{row.ingredient.unit}
							{row.ingredient.name}
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
					{#if row.status === 'modified'}
						<span class="step-num">{row.stepNumber}</span>
					{:else if row.status !== 'removed'}
						<span class="step-num">{row.step.step}</span>
					{/if}
					<span class="diff-content">
						{#if row.status === 'modified'}
							{@render segments(row.segments, false)}
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
		line-height: 1.5;
	}

	.step-num {
		flex-shrink: 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-sienna);
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

	/* opacity-85 was a utility class an e2e test asserted on directly. It is a
	   visual property, so it lives here now and the test measures the computed
	   value instead. --color-remove is already darkened to stay AA once this
	   blend is applied — see the note in app.css. */
	.diff-row.diff-removed {
		background: var(--color-remove-bg);
		color: var(--color-remove);
		text-decoration: line-through;
		opacity: 0.85;
	}

	/* ── Inline segments within a modified row ──────────────────────────────── */

	.diff-content .diff-added {
		background: var(--color-add-bg);
		color: var(--color-add);
	}

	.diff-content .diff-removed {
		background: var(--color-remove-bg);
		color: var(--color-remove);
		text-decoration: line-through;
	}
</style>
