<script lang="ts">
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import SearchFilters from '$lib/components/SearchFilters.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<div class="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
	<!-- Hero Section -->
	<Hero
		title="My Favorites"
		body="Recipes you've saved for later. Keep track of your must-try dishes and family favorites."
	/>

	<!-- Search Filters -->
	<SearchFilters
		initialQuery={data.searchQuery}
		initialTags={data.selectedTags}
		availableTags={data.allTags}
	/>

	<div class="mt-8">
		{#if data.favoriteRecipes.length > 0}
			<!-- Recipe Grid -->
			<RecipeGrid recipes={data.favoriteRecipes} />
		{:else}
			<!-- Empty State -->
			<div class="py-20 text-center">
				{#if data.searchQuery || data.selectedTags?.length > 0}
					<h3 class="mb-4 text-2xl text-foreground">No favorites match your filters</h3>
					<p class="mb-8 text-muted-foreground">
						Try adjusting your search or clearing filters.
					</p>
				{:else}
					<h3 class="mb-4 text-2xl text-foreground">No favorites yet</h3>
					<p class="mb-8 text-muted-foreground">
						Start exploring recipes and save your favorites for easy access later.
					</p>
					<a
						href="/"
						class="inline-block rounded-md bg-foreground px-6 py-3 font-medium text-white transition-colors hover:bg-[color:var(--foreground)]"
					>
						Explore Recipes
					</a>
				{/if}
			</div>
		{/if}
	</div>
</div>
