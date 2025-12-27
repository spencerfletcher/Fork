<script lang="ts">
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Hero Section -->
	<section class="mb-6">
		<h2 class="mb-3 text-5xl">My Cookbook</h2>
		<p class="max-w-3xl text-xl text-gray-600">
			Your personal collection of recipes. <a
				href="/recipes/new"
				class="font-semibold text-gray-900 underline transition-colors hover:text-gray-700"
				>Create new recipe</a
			>
		</p>
	</section>

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
