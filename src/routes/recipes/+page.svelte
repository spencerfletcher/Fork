<script lang="ts">
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import SearchFilters from '$lib/components/SearchFilters.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
	<!-- Hero Section -->
	<Hero
		title="My Cookbook"
		body="Your personal collection of recipes. Keep track of your favorite dishes and culinary creations."
	/>

	<!-- Search Filters -->
	<SearchFilters
		initialQuery={data.searchQuery}
		initialTags={data.selectedTags}
		availableTags={data.allTags}
	/>

	<div class="mt-8">
		{#if data.recipes && data.recipes.length > 0}
			<!-- Recipe Grid -->
			<RecipeGrid recipes={data.recipes} />
		{:else}
			<!-- Empty State -->
			<div class="py-20 text-center">
				{#if data.searchQuery || data.selectedTags?.length > 0}
					<h3 class="mb-4 text-2xl text-foreground">No recipes match your filters</h3>
					<p class="mb-8 text-muted-foreground">
						Try adjusting your search or clearing filters.
					</p>
				{:else}
					<h3 class="mb-4 text-2xl text-foreground">No recipes yet</h3>
					<p class="mb-8 text-muted-foreground">
						Start building your personal cookbook by creating your first recipe.
					</p>
					<a
						href="/recipes/new"
						class="inline-block rounded-md bg-foreground px-6 py-3 font-medium text-white transition-colors hover:bg-[color:var(--foreground)]"
					>
						Create Your First Recipe
					</a>
				{/if}
			</div>
		{/if}
	</div>
</div>
