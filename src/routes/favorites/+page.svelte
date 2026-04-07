<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import SearchFilters from '$lib/components/SearchFilters.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-header">
			<h1>Favorites</h1>
			<p class="page-subtitle">Recipes you've saved.</p>
		</div>

		<SearchFilters
			initialQuery={data.searchQuery}
			initialTags={data.selectedTags}
			availableTags={data.allTags}
		/>

		{#if data.favoriteRecipes.length > 0}
			<div class="recipe-grid mt-5">
				{#each data.favoriteRecipes as recipe (recipe.id)}
					<RecipeCard {recipe} />
				{/each}
			</div>
		{:else if data.searchQuery || data.selectedTags?.length > 0}
			<p class="mt-5 py-8 text-center text-text-3">
				No favorites match your filters. Try adjusting your search.
			</p>
		{:else}
			<p class="mt-5 py-8 text-center text-text-3">
				No favorites yet. <a href="/">Explore recipes →</a>
			</p>
		{/if}
	</div>
</div>
