<script lang="ts">
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Hero Section -->
	<section class="mb-6">
		<h2 class="mb-3 text-5xl">{data.tag.name}</h2>
		<p class="max-w-3xl text-xl text-gray-600">
			Explore all recipes tagged with {data.tag.name.toLowerCase()}.
		</p>
	</section>

	{#if data.recipes.length > 0}
		<!-- Recipe Grid -->
		<RecipeGrid recipes={data.recipes} />
	{:else}
		<!-- Empty State -->
		<div class="py-20 text-center">
			<h3 class="mb-4 text-2xl text-gray-800">No recipes found</h3>
			<p class="mb-8 text-gray-600">
				There are no recipes with this tag yet. Check back later or explore other recipes.
			</p>
			<a
				href="/"
				class="inline-block rounded-md bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
			>
				Explore All Recipes
			</a>
		</div>
	{/if}
</div>
