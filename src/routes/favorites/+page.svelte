<script lang="ts">
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<div class="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
	<!-- Hero Section -->
	<Hero
		title="My Favorites"
		body="Recipes you've saved for later. Keep track of your must-try dishes and family favorites."
	/>

	{#if data.favoriteRecipes.length > 0}
		<!-- Recipe Grid -->
		<RecipeGrid recipes={data.favoriteRecipes} />
	{:else}
		<!-- Empty State -->
		<div class="py-20 text-center">
			<h3 class="mb-4 text-2xl text-gray-800">No favorites yet</h3>
			<p class="mb-8 text-gray-600">
				Start exploring recipes and save your favorites for easy access later.
			</p>
			<a
				href="/"
				class="inline-block rounded-md bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
			>
				Explore Recipes
			</a>
		</div>
	{/if}
</div>
