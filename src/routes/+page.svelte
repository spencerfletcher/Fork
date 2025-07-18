<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';

	// This receives the { recipes: [...] } object from your updated load function
	let { data } = $props();
</script>

<div class="p-4 sm:p-6 lg:p-8">
	<div class="container mx-auto">
		<div class="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.recipes.filter((recipe) => recipe.userId !== data.session?.user.id) as recipe (recipe.id)}
				<RecipeCard {recipe} />
			{/each}
		</div>
	</div>
</div>
