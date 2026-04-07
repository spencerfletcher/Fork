<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import SearchFilters from '$lib/components/SearchFilters.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-header">
			<h1>Search</h1>
			<p class="page-subtitle">Find recipes by name or tag.</p>
		</div>

		<SearchFilters
			initialQuery={data.searchQuery}
			initialTags={data.selectedTags}
			availableTags={data.allTags}
		/>

		{#if data.recipes.length === 0 && (data.searchQuery || data.selectedTags.length > 0)}
			<p class="mt-5 py-8 text-center text-text-3">
				No recipes found. Try adjusting your search or clearing some filters.
			</p>
		{:else if data.recipes.length === 0}
			<p class="mt-5 py-8 text-center text-text-3">
				Enter a recipe name or select tags to find recipes.
			</p>
		{:else}
			<div class="recipe-grid mt-5">
				{#each data.recipes as recipe (recipe.id)}
					<RecipeCard {recipe} />
				{/each}
			</div>
		{/if}
	</div>
</div>
