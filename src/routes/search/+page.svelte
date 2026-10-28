<script lang="ts">
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
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
			<section class="results">
				<h2 class="eyebrow-label section-heading">
					{recipes.length}
					{recipes.length === 1 ? 'recipe' : 'recipes'}
				</h2>
				<div class="recipe-grid">
					{#each recipes as recipe (recipe.id)}
						<RecipeCard {recipe} />
					{/each}
				</div>
			</section>
		{:else}
			<p class="empty-state mt-6">
				{#if filtered}
					No recipes found. Try adjusting your search or clearing some filters.
				{:else}
					Enter a recipe name or select tags to find recipes.
				{/if}
			</p>
		{/if}
	</div>
</div>

<style>
	.results {
		margin-top: 26px;
	}
</style>
