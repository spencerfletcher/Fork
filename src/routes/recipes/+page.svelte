<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-gradient-to-b from-amber-50 to-white">
	{#if data.session?.user}
		<!-- Header Section -->
		<section class="border-b border-amber-100 py-16 sm:py-24">
			<div class="container mx-auto px-4 text-center">
				<h1 class="font-serif text-5xl sm:text-6xl font-bold text-amber-900 mb-4">My Cookbook</h1>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					Your personal collection of recipes. <a href="/recipes/new" class="text-amber-700 font-semibold hover:text-amber-800 transition-colors">Create new recipe</a>
				</p>
			</div>
		</section>

		<!-- Recipes Grid -->
		<section class="py-16 sm:py-20">
			<div class="container mx-auto px-4">
				{#if data.recipes && data.recipes.length > 0}
					<div class="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
						{#each data.recipes as recipe (recipe.id)}
							<RecipeCard {recipe} />
						{/each}
					</div>
				{:else}
					<div class="text-center py-16">
						<h2 class="text-2xl font-serif text-gray-800 mb-4">No recipes yet</h2>
						<p class="text-gray-600 mb-8">Start building your personal cookbook by creating your first recipe.</p>
						<a href="/recipes/new" class="inline-block bg-amber-800 text-white px-6 py-3 rounded-md hover:bg-amber-900 transition-colors font-medium">
							Create Your First Recipe
						</a>
					</div>
				{/if}
			</div>
		</section>
	{:else}
		<div class="min-h-screen flex items-center justify-center">
			<div class="text-center max-w-md">
				<h1 class="font-serif text-4xl font-bold text-gray-900 mb-4">
					Welcome
				</h1>
				<p class="text-gray-600 mb-8">
					Sign in to your account to view and manage your personal recipe collection.
				</p>
				<div class="flex gap-4">
					<a href="/login" class="flex-1 bg-amber-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-900 transition-colors">
						Sign In
					</a>
					<a href="/signup" class="flex-1 border border-amber-800 text-amber-800 px-6 py-3 rounded-lg font-medium hover:bg-amber-50 transition-colors">
						Sign Up
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>
