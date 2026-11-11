<script lang="ts">
	import RecipeGrid from '#lib/components/recipes/RecipeGrid.svelte';
	import SearchFilters from '#lib/components/ui/SearchFilters.svelte';
	import ResultStatus from '#lib/components/ui/ResultStatus.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const recipes = $derived(data.recipes);
	const filtered = $derived(
		!!data.searchQuery || data.selectedTags.length > 0 || !!data.friendsOnly
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

		<ResultStatus count={recipes.length} {filtered} />

		{#if recipes.length > 0}
			<RecipeGrid {recipes} class="results" />
		{:else}
			<p class="empty-state mt-6">
				<!-- Each link says what it does; All recipes goes where the tabs' All
				     goes, Discover. -->
				{#if data.selectedTags.length > 0 || data.friendsOnly}
					No recipes found. Try adjusting your search or clearing some filters.
					<!-- Clears the tags and the Friends filter; the query stays. -->
					<a
						class="inline-action"
						href={data.searchQuery
							? `/search?q=${encodeURIComponent(data.searchQuery)}`
							: '/search'}>
						Clear filters
					</a>
				{:else if filtered}
					No recipes found. Try another search.
					<a class="inline-action" href="/search">Clear search</a>
				{:else}
					Enter a recipe name or select tags to find recipes.
					<a class="inline-action" href="/discover">All recipes</a>
				{/if}
			</p>
		{/if}
	</div>
</div>
