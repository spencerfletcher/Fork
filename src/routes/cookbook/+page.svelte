<script lang="ts">
	import { page } from '$app/state';
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import SearchFilters from '#lib/components/ui/SearchFilters.svelte';
	import EmptyPanel from '#lib/components/ui/EmptyPanel.svelte';
	import ResultStatus from '#lib/components/ui/ResultStatus.svelte';
	import { plural } from '#lib/helpers.js';
	import { COOKBOOK_FILTERS, type CookbookFilter } from './filters.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const LABELS: Record<CookbookFilter, string> = { all: 'All', mine: 'Mine', saved: 'Saved' };

	const filtered = $derived(
		!!data.searchQuery || data.selectedTags.length > 0 || data.filter !== 'all'
	);

	// A filter link keeps the search and tags; All is the bare page.
	function filterHref(filter: CookbookFilter, without: string[] = []): string {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams(page.url.search);
		if (filter === 'all') params.delete('filter');
		else params.set('filter', filter);
		for (const key of without) params.delete(key);
		const query = params.toString();
		return query ? `?${query}` : page.url.pathname;
	}
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-head cookbook-head">
			<div>
				<h1>Cookbook</h1>
				{#if data.counts.all > 0}
					<p class="page-sub">
						{plural(data.counts.all, 'recipe')}: {data.counts.mine} yours, {data.counts.saved} saved from
						other cooks.
					</p>
				{/if}
			</div>
			<!-- The top bar carries New recipe from 768; a phone's tab bar has no room. -->
			{#if data.counts.all > 0}
				<a href="/recipes/new" class="btn-primary btn-sm cookbook-new">New recipe</a>
			{/if}
		</div>

		{#if data.counts.all === 0}
			<!-- No filters over an empty library (decided 29 October 2026). -->
			<EmptyPanel title="Your cookbook is empty" centered>
				Recipes you write and recipes you save from others live here.
				{#snippet action()}
					<a href="/recipes/new" class="btn-primary">New recipe</a>
					<a href="/discover" class="arrow-link">Explore Discover →</a>
				{/snippet}
			</EmptyPanel>
		{:else}
			<div class="cookbook-filters">
				<div class="seg" role="group" aria-label="Show">
					{#each COOKBOOK_FILTERS as f (f)}
						<a href={filterHref(f)} aria-current={data.filter === f ? 'page' : undefined}>
							{LABELS[f]}
							<span class="n">{data.counts[f]}</span>
						</a>
					{/each}
				</div>
				<SearchFilters
					initialQuery={data.searchQuery}
					initialTags={data.selectedTags}
					availableTags={data.allTags} />
			</div>

			<!-- Screen readers only (Spencer, 9 November 2026): the cards say the count. -->
			<ResultStatus count={data.recipes.length} {filtered} />

			{#if data.recipes.length > 0}
				<div class="cookbook-grid">
					{#each data.recipes as recipe, i (recipe.id)}
						<RecipeCard {recipe} index={i} variant="cookbook" saved={recipe.saved} />
					{/each}
				</div>
			{:else}
				<div class="cookbook-none">
					{#if data.searchQuery}
						<h2>No recipes match “{data.searchQuery}”.</h2>
						<p>Search looks at titles, descriptions and ingredients.</p>
						<a href={filterHref(data.filter, ['q'])}>Clear search</a>
					{:else}
						<h2>No recipes match these filters.</h2>
						<a href={filterHref('all', ['tags'])}>Show all recipes</a>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.cookbook-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
	}

	/* One line beside the title; the subtitle wraps under the title instead. */
	.cookbook-new {
		white-space: nowrap;
	}

	@media (min-width: 768px) {
		.cookbook-new {
			display: none;
		}
	}

	/* Three rows on a phone: the title, the count at full width, then New
	   recipe across the page, so the count no longer squeezes beside it. */
	@media (max-width: 699px) {
		.cookbook-head {
			flex-direction: column;
			align-items: stretch;
		}

		.cookbook-new {
			width: 100%;
		}
	}

	/* A step under the grid's 32px row gap: the first cards belong to the tags
	   above them (Spencer, 10 November 2026: "maybe a bit tighter"). */
	.cookbook-filters {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin-bottom: var(--space-5);
	}

	/* All · Mine · Saved: one bordered strip, the current segment marigold-tinted. */
	.seg {
		display: inline-flex;
		align-self: flex-start;
		padding: 3px;
		border: 1px solid var(--color-border-2);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.seg a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 38px;
		padding: 0 14px;
		border-radius: 4px;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text-2);
	}

	.seg a:hover {
		color: var(--color-text);
	}

	.seg a[aria-current='page'] {
		background: var(--color-marigold-tint);
		color: var(--color-text);
		box-shadow: inset 0 0 0 1px var(--color-marigold);
	}

	.seg .n {
		margin-left: 4px;
		font-weight: 400;
		color: var(--color-text-3);
	}

	/* From 768 the segments and the search box share a row, the box filling to
	   the container's edge; the tag tabs keep the row below. */
	@media (min-width: 768px) {
		.cookbook-filters {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr);
			align-items: center;
			gap: 14px 16px;
		}

		.cookbook-filters > :global(.search-filters) {
			display: contents;
		}

		.cookbook-filters > :global(.search-filters > form.relative) {
			max-width: none;
		}

		.cookbook-filters > :global(.search-filters > :not(form)) {
			grid-column: 1 / -1;
		}
	}

	/* A phone: the strip spans the column, three equal segments, each a 44px
	   target inside the strip's 52px (its 3px padding and 1px border). */
	@media (max-width: 767px) {
		.seg {
			align-self: stretch;
		}

		.seg a {
			flex: 1;
			min-height: 44px;
		}
	}

	@media (forced-colors: active) {
		.seg a[aria-current='page'] {
			outline: 2px solid CanvasText;
		}
	}

	.cookbook-none {
		max-width: 46ch;
		padding: 16px 0 24px;
	}

	.cookbook-none h2 {
		font-size: 1.375rem;
	}

	.cookbook-none p {
		margin: 6px 0 0;
		color: var(--color-text-2);
	}

	.cookbook-none a {
		display: inline-block;
		margin-top: 18px;
		padding-block: 10px;
		font-weight: 600;
	}
</style>
