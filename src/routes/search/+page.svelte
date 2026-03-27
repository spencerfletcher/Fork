<script lang="ts">
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import SearchFilters from '$lib/components/SearchFilters.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
	<Hero title="Search Recipes" body="Search through our collection of recipes by title and tags" />

	<SearchFilters
		initialQuery={data.searchQuery}
		initialTags={data.selectedTags}
		availableTags={data.allTags}
	/>

	<div class="mt-8">
		{#if data.recipes.length === 0 && (data.searchQuery || data.selectedTags.length > 0)}
			<div class="py-20 text-center">
				<h3 class="text-foreground mb-4 text-2xl">No recipes found</h3>
				<p class="text-muted-foreground">Try adjusting your search or clearing some filters.</p>
			</div>
		{:else if data.recipes.length === 0}
			<div class="py-20 text-center">
				<h3 class="text-foreground mb-4 text-2xl">Start searching</h3>
				<p class="text-muted-foreground">Enter a recipe name or select tags to find recipes.</p>
			</div>
		{:else}
			<RecipeGrid recipes={data.recipes} />
		{/if}
	</div>
</div>
