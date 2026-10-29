<script lang="ts">
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import SearchFilters from '#lib/components/ui/SearchFilters.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const recipes = $derived(data.favoriteRecipes);
	const filtered = $derived(!!data.searchQuery || data.selectedTags.length > 0);
</script>

<div class="page">
	<div class="page-inner">
		<div class="browse-header">
			<h1>Favorites</h1>
		</div>

		<!-- No filters over an empty list: a search box with nothing to find
		     invites a query. They stay while a filter is active so it can be
		     widened again (decided 29 October 2026). -->
		{#if recipes.length > 0 || filtered}
			<SearchFilters
				initialQuery={data.searchQuery}
				initialTags={data.selectedTags}
				availableTags={data.allTags} />
		{/if}

		{#if recipes.length > 0}
			<section class="results">
				<h2 class="eyebrow-label section-heading">
					{recipes.length}
					{recipes.length === 1 ? 'recipe' : 'recipes'}
				</h2>
				<div class="recipe-grid">
					{#each recipes as recipe, i (recipe.id)}
						<RecipeCard {recipe} index={i} />
					{/each}
				</div>
			</section>
		{:else}
			<p class="empty-state mt-6">
				{#if filtered}
					No favorites match your filters. Try adjusting your search.
				{:else}
					No favorites yet. <a href="/" class="explore-link">Explore recipes →</a>
				{/if}
			</p>
		{/if}
	</div>
</div>

<style>
	.results {
		margin-top: 26px;
	}

	/* On a phone the one link reaches a thumb's 44px by padding, not a button. */
	@media (max-width: 699px) {
		.explore-link {
			display: inline-block;
			padding: 11px 0;
		}
	}
</style>
