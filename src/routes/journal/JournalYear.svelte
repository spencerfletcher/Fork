<script lang="ts">
	import type { journalYear } from '#lib/server/journal.js';
	import { formatDate, plural } from '#lib/helpers.js';
	import { monthTone } from '#lib/journal.js';

	// The year on top of the cook's own Journal: each month's count and the
	// recipes cooked most. Nothing else: no streaks, charts or goals.
	let { year }: { year: NonNullable<Awaited<ReturnType<typeof journalYear>>> } = $props();

	const most = $derived(Math.max(...year.months.map((n) => n ?? 0)));
	const monthName = (m: number, month: 'short' | 'long') =>
		formatDate(new Date(Date.UTC(year.year, m, 1)), { month, timeZone: 'UTC' });
</script>

<section class="jyear">
	<div>
		<h2 class="eyebrow-label" id="jyear-months">{year.year} so far</h2>
		<ol class="jyear-months" aria-labelledby="jyear-months">
			{#each year.months as cooks, m (m)}
				<!-- The number is always printed, so the tone is never the only signal. -->
				<li>
					<span
						class="jyear-cell"
						class:to-come={cooks === null}
						data-tone={monthTone(cooks, most)}
						aria-hidden="true">
						{cooks ?? '–'}
					</span>
					<span class="jyear-name" aria-hidden="true">{monthName(m, 'short')}</span>
					<span class="sr-only">
						{monthName(m, 'long')}: {cooks === null ? 'to come' : plural(cooks, 'cook')}
					</span>
				</li>
			{/each}
		</ol>
	</div>
	{#if year.top.length > 0}
		<div>
			<h2 class="eyebrow-label" id="jyear-top">Most cooked this year</h2>
			<ol class="jyear-top row-list" aria-labelledby="jyear-top">
				{#each year.top as recipe (recipe.recipeId)}
					<li>
						<!-- A recipe the cook may no longer open reads as its dish, unlinked. -->
						{#if recipe.href}
							<a class="hit-link" href={recipe.href}>{recipe.title}</a>
						{:else}
							<span>{recipe.title}</span>
						{/if}
						<span class="jyear-times">{plural(recipe.times, 'time')}</span>
					</li>
				{/each}
			</ol>
		</div>
	{/if}
</section>

<style>
	.jyear {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: var(--space-7);
		margin-bottom: var(--space-6);
	}

	.jyear-months {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 6px;
		margin-top: var(--space-3);
		text-align: center;
	}

	.jyear-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 40px;
		border: 1px solid var(--color-border-2);
		border-radius: 4px;
		background: var(--color-surface);
		font-weight: 600;
		font-size: 0.9375rem;
		font-variant-numeric: tabular-nums;
	}

	/* The count scale: the one fill, marigold, in steps from its pale tint. */
	.jyear-cell[data-tone='1'] {
		background: var(--color-marigold-tint);
	}

	.jyear-cell[data-tone='2'] {
		background: var(--color-marigold-tint-hover);
	}

	.jyear-cell[data-tone='3'] {
		background: var(--color-marigold);
		border-color: transparent;
	}

	/* A month still to come: a dashed outline on the paper, a dash in Ink 3. */
	.jyear-cell.to-come {
		border-style: dashed;
		background: transparent;
		color: var(--color-text-3);
		font-weight: 400;
	}

	.jyear-name {
		display: block;
		margin-top: 4px;
		font-size: 0.75rem;
		color: var(--color-text-3);
	}

	.jyear-top {
		margin-top: var(--space-2);
	}

	.jyear-top li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-4);
		padding: 6px 0;
		border-top: 1px solid var(--color-border);
		font-size: 0.9375rem;
	}

	.jyear-top li > :first-child {
		min-width: 0;
		font-family: var(--font-serif);
		font-weight: 500;
		overflow-wrap: anywhere;
	}

	.jyear-times {
		color: var(--color-text-2);
		white-space: nowrap;
	}

	/* A phone: the months in one row of twelve, the list under them, so the
	   summary pushes the entries down no more than about 330px. */
	@media (max-width: 699px) {
		.jyear {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-5);
		}

		.jyear-months {
			gap: 3px;
		}

		.jyear-cell {
			height: 36px;
			font-size: 0.8125rem;
		}

		.jyear-name {
			font-size: 0.6875rem;
		}

		.jyear {
			margin-bottom: var(--space-5);
		}

		.jyear-top li {
			padding: 4px 0;
		}

		/* One line each, so a long title cannot push the entries further down. */
		.jyear-top li > :first-child {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}
</style>
