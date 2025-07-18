<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';

	// This receives the { recipes: [...] } object from your updated load function
	let { data } = $props();
</script>

<div class="p-4 sm:p-6 lg:p-8">
	<div class="container mx-auto">
		{#if data.session?.user}
			<div class="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#if data.recipes != null}
					{#each data.recipes.filter((recipe) => recipe.userId === data.session?.user.id) as recipe (recipe.id)}
						<RecipeCard {recipe} />
					{/each}
				{:else}
					<p class="col-span-full text-gray-500">
						You have no recipes yet. Start by
						<a href="/new" class="text-blue-500 hover:underline">adding one!</a>
					</p>
				{/if}
			</div>
		{:else}
			<p class="text-gray-500">
				Please <a href="/login" class="text-blue-500 hover:underline">log in</a> to see your recipes.
			</p>
		{/if}
	</div>
</div>
