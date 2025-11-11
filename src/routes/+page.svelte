<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-gradient-to-b from-amber-50 to-white">
	<!-- Hero Section -->
	<section class="border-b border-amber-100 py-16 sm:py-24">
		<div class="container mx-auto px-4 text-center">
			<h1 class="mb-4 font-serif text-5xl font-bold text-amber-900 sm:text-6xl">Our Cookbook</h1>
			<p class="mx-auto max-w-2xl text-lg text-gray-600">
				Discover and share delicious recipes. Build your personal collection of culinary
				inspiration.
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
				<div class="py-16 text-center">
					<h2 class="mb-4 font-serif text-2xl text-gray-800">No recipes yet</h2>
					<p class="mb-8 text-gray-600">
						Start building your cookbook by creating your first recipe.
					</p>
					<a
						href="/recipes/new"
						class="inline-block rounded-md bg-amber-800 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-900"
					>
						Create Recipe
					</a>
				</div>
			{/if}
		</div>
	</section>
</div>
