<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-gradient-to-b from-amber-50 to-white">
	<!-- Hero Section -->
	<section class="border-b border-amber-100 py-16 sm:py-24">
		<div class="container mx-auto px-4 text-center">
			<h1 class="font-serif text-5xl sm:text-6xl font-bold text-amber-900 mb-4">Your Cookbook</h1>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Discover and share delicious recipes. Build your personal collection of culinary inspiration.
			</p>
		</div>
	</section>

	<!-- Recipes Grid -->
	<section class="py-16 sm:py-20">
		<div class="container mx-auto px-4">
			{#if data.recipes.length > 0}
				<div class="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.recipes as recipe (recipe.id)}
						<RecipeCard {recipe} />
					{/each}
				</div>
			{:else}
				<div class="text-center py-16">
					<h2 class="text-2xl font-serif text-gray-800 mb-4">No recipes yet</h2>
					<p class="text-gray-600 mb-8">Start building your cookbook by creating your first recipe.</p>
					<a href="/recipes/new" class="inline-block bg-amber-800 text-white px-6 py-3 rounded-md hover:bg-amber-900 transition-colors font-medium">
						Create Recipe
					</a>
				</div>
			{/if}
		</div>
	</section>
</div>
