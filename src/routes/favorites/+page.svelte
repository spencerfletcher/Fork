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
			<p class="empty-state" class:mt-6={filtered}>
				{#if filtered}
					No favorites match your filters. Try adjusting your search.
				{:else}
					No favorites yet. Favorite a recipe from its page.
					<a href="/" class="arrow-link">Explore recipes →</a>
				{/if}
			</p>
		{/if}
	</div>
</div>

<style>
	.results {
		margin-top: var(--space-5);
	}

	/* Under a left-aligned h1 the empty state starts on its edge, not centred
	   on a second axis; scoped while app.css's shared rule stays centred. It
	   sits the header's one gap below the h1, or the results' gap below the
	   filters, without the shared rule's 2rem on top. */
	.empty-state {
		text-align: left;
		padding-top: 0;
	}

	/* On a phone the sentence wraps, so the link takes its own line rather
	   than breaking mid-arrow. Only as wide as its words, so the tap stays on it. */
	@media (max-width: 699px) {
		.empty-state a {
			display: block;
			width: fit-content;
		}
	}
</style>
