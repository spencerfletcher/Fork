<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';

	// This receives the { recipes: [...] } object from your updated load function
	let { data } = $props();
</script>

<div class="p-4 sm:p-6 lg:p-8">
	<div class="container mx-auto">
		<h1 class="text-3xl font-bold text-gray-900">All Recipes</h1>

		<div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.recipes as recipe (recipe.id)}
				<RecipeCard {recipe} />
			{/each}
		</div>
	</div>
</div>
