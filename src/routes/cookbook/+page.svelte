<script lang="ts">
	import { page } from '$app/state';
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import SearchFilters from '#lib/components/ui/SearchFilters.svelte';
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
		<div class="cookbook-head">
			<div>
				<h1>Cookbook</h1>
				{#if data.counts.all > 0}
					<p class="count">
						{plural(data.counts.all, 'recipe')}: {data.counts.mine} yours, {data.counts.saved} saved from
						other cooks.
					</p>
				{/if}
			</div>
			<!-- The top bar carries New recipe from 768; a phone's tab bar has no room. -->
			{#if data.counts.all > 0}
				<a href="/recipes/new" class="btn-primary cookbook-new">New recipe</a>
			{/if}
		</div>

		{#if data.counts.all === 0}
			<!-- No filters over an empty library (decided 29 October 2026). -->
			<div class="cookbook-empty">
				<h2>Your cookbook is empty</h2>
				<p>Recipes you write and recipes you save from others live here.</p>
				<div class="actions">
					<a href="/recipes/new" class="btn-primary">New recipe</a>
					<a href="/discover" class="arrow-link">Explore Discover →</a>
				</div>
			</div>
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

			<!-- Always in the DOM so screen readers announce the count when it changes. -->
			<p class="status" role="status">
				{#if filtered}{plural(data.recipes.length, 'recipe')}
					{data.recipes.length === 1 ? 'matches' : 'match'}{/if}
			</p>

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
		margin-bottom: var(--space-5);
	}

	.cookbook-head h1 {
		margin: 0;
	}

	.count {
		margin: 4px 0 0;
		color: var(--color-text-2);
	}

	@media (min-width: 768px) {
		.cookbook-new {
			display: none;
		}
	}

	.cookbook-filters {
		display: flex;
		flex-direction: column;
		gap: 14px;
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
		text-decoration: none;
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

	/* A phone: the strip spans the column, three equal segments, 44px hits. */
	@media (max-width: 767px) {
		.seg {
			align-self: stretch;
		}

		.seg a {
			flex: 1;
			min-height: 40px;
		}
	}

	@media (forced-colors: active) {
		.seg a[aria-current='page'] {
			outline: 2px solid CanvasText;
		}
	}

	.status {
		min-height: 1.3em;
		margin: 14px 0 18px;
		font-size: 0.875rem;
		color: var(--color-text-3);
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

	.cookbook-empty {
		max-width: 46ch;
		margin: 0 auto;
		padding: 56px 0 24px;
		text-align: center;
	}

	.cookbook-empty p {
		margin: 8px 0 0;
		color: var(--color-text-2);
	}

	.cookbook-empty .actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 12px 24px;
		margin-top: 24px;
	}
</style>
