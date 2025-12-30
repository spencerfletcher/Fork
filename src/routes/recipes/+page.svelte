<script lang="ts">
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
	<!-- Hero Section -->
	<Hero
		title="My Cookbook"
		body="Your personal collection of recipes. Keep track of your favorite dishes and culinary creations."
	/>

	{#if data.recipes && data.recipes.length > 0}
		<!-- Recipe Grid -->
		<RecipeGrid recipes={data.recipes} />
	{:else}
		<!-- Empty State -->
		<div class="py-20 text-center">
			<h3 class="mb-4 text-2xl text-gray-800">No recipes yet</h3>
			<p class="mb-8 text-gray-600">
				Start building your personal cookbook by creating your first recipe.
			</p>
			<a
				href="/recipes/new"
				class="inline-block rounded-md bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
			>
				Create Your First Recipe
			</a>
		</div>
	{/if}
</div>
