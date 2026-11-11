<script lang="ts">
	import RecipeGrid from '#lib/components/recipes/RecipeGrid.svelte';
	import SearchFilters from '#lib/components/ui/SearchFilters.svelte';
	import ResultStatus from '#lib/components/ui/ResultStatus.svelte';
	import { pagedList } from '#lib/pagedList.svelte.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const list = pagedList(
		() => data,
		(d) => ({ items: d.recipes, next: d.next })
	);
	const recipes = $derived(list.items);
	const hasFilters = $derived(data.selectedTags.length > 0 || !!data.friendsOnly);
	const filtered = $derived(!!data.searchQuery || hasFilters);

	// The empty state's ways out, each dropping one half of the search.
	const href = (params: [string, string][]) =>
		params.length
			? `/search?${params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`
			: '/search';
	const withoutFilters = $derived(href(data.searchQuery ? [['q', data.searchQuery]] : []));
	const withoutQuery = $derived(
		href([
			...(data.selectedTags.length
				? [['tags', data.selectedTags.join(',')] as [string, string]]
				: []),
			...(data.friendsOnly ? [['friends', '1'] as [string, string]] : [])
		])
	);
</script>

<div class="page">
	<div class="page-inner">
		<div class="browse-header">
			<h1>Search</h1>
		</div>

		<SearchFilters
			initialQuery={data.searchQuery}
			initialTags={data.selectedTags}
			availableTags={data.allTags}
			friendsOnly={data.friendsOnly} />

		<ResultStatus count={data.total} {filtered} />

		{#if recipes.length > 0}
			<RecipeGrid {recipes} total={data.total} more={list} class="results" />
		{:else}
			<p class="empty-state mt-6">
				<!-- Each way out says what it does and keeps the rest: Clear filters
				     keeps the query, Clear search keeps the tags and Friends. All
				     recipes goes where the tabs' All goes, Discover. -->
				{#if data.searchQuery && hasFilters}
					No recipes match “{data.searchQuery}” with these filters.
					<a class="inline-action" href={withoutFilters}>Clear filters</a>
					or
					<a class="inline-action" href={withoutQuery}>Clear search</a>
				{:else if hasFilters}
					No recipes match these filters.
					<a class="inline-action" href={withoutFilters}>Clear filters</a>
				{:else if data.searchQuery}
					No recipes match “{data.searchQuery}”.
					<a class="inline-action" href="/search">Clear search</a>
				{:else}
					Enter a recipe name or select tags to find recipes.
					<a class="inline-action" href="/discover">All recipes</a>
				{/if}
			</p>
		{/if}
	</div>
</div>
