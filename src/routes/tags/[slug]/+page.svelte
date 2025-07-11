<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const recipes = data.recipes;
</script>

<div class="bg-gray-50 p-4 sm:p-6 lg:p-8">
	<div class="container mx-auto">
		<h1 class="text-3xl font-bold text-gray-900">
			Recipes tagged with:
			<span class="text-green-600">{data.tag.name}</span>
		</h1>

		{#if recipes.length > 0}
			<div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each recipes as recipe (recipe.id)}
					<RecipeCard {recipe} />
				{/each}
			</div>
		{:else}
			<p class="mt-8 text-center text-gray-500">There are no recipes with this tag yet.</p>
		{/if}
	</div>
</div>
