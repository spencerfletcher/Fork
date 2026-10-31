<script lang="ts">
	import RecipeGrid from '#lib/components/recipes/RecipeGrid.svelte';
	import SearchFilters from '#lib/components/ui/SearchFilters.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const recipes = $derived(data.recipes);
	const filtered = $derived(!!data.searchQuery || data.selectedTags.length > 0);
</script>

<div class="page">
	<div class="page-inner">
		<div class="browse-header">
			<h1>Search</h1>
		</div>

		<SearchFilters
			initialQuery={data.searchQuery}
			initialTags={data.selectedTags}
			availableTags={data.allTags} />

		{#if recipes.length > 0}
			<RecipeGrid {recipes} class="results" />
		{:else}
			<p class="empty-state mt-6">
				<!-- Each link says what it does; All recipes goes where the tabs' All
				     goes, since signed in /recipes is My Recipes (decided 29 October
				     2026). -->
				{#if data.selectedTags.length > 0}
					No recipes found. Try adjusting your search or clearing some filters.
					<!-- Clears the tags only; the query stays. -->
					<a
						href={data.searchQuery
							? `/search?q=${encodeURIComponent(data.searchQuery)}`
							: '/search'}>
						Clear filters
					</a>
				{:else if filtered}
					No recipes found. Try another search.
					<a href="/search">Clear search</a>
				{:else}
					Enter a recipe name or select tags to find recipes.
					<a href={data.user ? '/' : '/recipes'}>All recipes</a>
				{/if}
			</p>
		{/if}
	</div>
</div>
