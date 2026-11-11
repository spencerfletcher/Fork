<script lang="ts">
	import type { journalTwelveMonths } from '#lib/server/journal.js';
	import { formatDate, plural } from '#lib/helpers.js';
	import { day, monthLabel, monthTone, SUMMARY_MONTHS } from '#lib/journal.js';

	// The last twelve months on top of the cook's own Journal: each month's count
	// and the recipes cooked most. Nothing else: no streaks, charts or goals.
	let { summary }: { summary: NonNullable<Awaited<ReturnType<typeof journalTwelveMonths>>> } =
		$props();

	const most = $derived(Math.max(...summary.months.map((m) => m.cooks)));
	const shortName = (iso: string) => formatDate(day(iso), { month: 'short', timeZone: 'UTC' });
	// The first cell names its year, and so does a January: where the year changes.
	const yearOf = (iso: string, i: number) =>
		i === 0 || iso.slice(5, 7) === '01' ? iso.slice(0, 4) : null;
</script>

<section class="jtwelve">
	<div>
		<h2 class="eyebrow-label" id="jtwelve-months">Last {SUMMARY_MONTHS} months</h2>
		<ol class="jtwelve-months" aria-labelledby="jtwelve-months">
			{#each summary.months as { month, cooks }, i (month)}
				<!-- The number is always printed, so the tone is never the only signal. -->
				<li>
					<span class="jtwelve-cell" data-tone={monthTone(cooks, most)} aria-hidden="true">
						{cooks}
					</span>
					<span class="jtwelve-name" aria-hidden="true">{shortName(month)}</span>
					{#if yearOf(month, i)}
						<span class="jtwelve-year" aria-hidden="true">{yearOf(month, i)}</span>
					{/if}
					<span class="sr-only">{monthLabel(month)}: {plural(cooks, 'cook')}</span>
				</li>
			{/each}
		</ol>
	</div>
	{#if summary.top.length > 0}
		<div>
			<h2 class="eyebrow-label" id="jtwelve-top">
				Most cooked in the last {SUMMARY_MONTHS} months
			</h2>
			<ol class="jtwelve-top row-list" aria-labelledby="jtwelve-top">
				{#each summary.top as recipe (recipe.recipeId)}
					<li>
						<!-- A recipe the cook may no longer open reads as its dish, unlinked. -->
						{#if recipe.href}
							<a class="hit-link" href={recipe.href}>{recipe.title}</a>
						{:else}
							<span>{recipe.title}</span>
						{/if}
						<span class="jtwelve-times">{plural(recipe.times, 'time')}</span>
					</li>
				{/each}
			</ol>
		</div>
	{/if}
</section>

<style>
	.jtwelve {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: var(--space-7);
		margin-bottom: var(--space-6);
	}

	.jtwelve-months {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 6px;
		margin-top: var(--space-3);
		text-align: center;
	}

	.jtwelve-cell {
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
	.jtwelve-cell[data-tone='1'] {
		background: var(--color-marigold-tint);
	}

	.jtwelve-cell[data-tone='2'] {
		background: var(--color-marigold-tint-hover);
	}

	.jtwelve-cell[data-tone='3'] {
		background: var(--color-marigold);
		border-color: transparent;
	}

	.jtwelve-name,
	.jtwelve-year {
		display: block;
		margin-top: 4px;
		font-size: 0.75rem;
		color: var(--color-text-3);
	}

	/* Under the month name, where the year changes. */
	.jtwelve-year {
		margin-top: 0;
		font-variant-numeric: tabular-nums;
	}

	.jtwelve-top {
		margin-top: var(--space-2);
	}

	.jtwelve-top li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-4);
		padding: 6px 0;
		border-top: 1px solid var(--color-border);
		font-size: 0.9375rem;
	}

	.jtwelve-top li > :first-child {
		min-width: 0;
		font-family: var(--font-serif);
		font-weight: 500;
		overflow-wrap: anywhere;
	}

	.jtwelve-times {
		color: var(--color-text-2);
		white-space: nowrap;
	}

	/* A phone: the months in one row of twelve, the list under them, so the
	   summary pushes the entries down no more than about 330px. */
	@media (max-width: 699px) {
		.jtwelve {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-5);
		}

		.jtwelve-months {
			gap: 3px;
		}

		.jtwelve-cell {
			height: 36px;
			font-size: 0.8125rem;
		}

		.jtwelve-name,
		.jtwelve-year {
			font-size: 0.6875rem;
		}

		.jtwelve {
			margin-bottom: var(--space-5);
		}

		.jtwelve-top li {
			padding: 4px 0;
		}

		/* One line each, so a long title cannot push the entries further down. */
		.jtwelve-top li > :first-child {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}
</style>
