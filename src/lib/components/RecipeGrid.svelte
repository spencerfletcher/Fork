<script lang="ts">
	import RecipeCard from './RecipeCard.svelte';
	import type { Recipe } from '$lib/server/db/schema';

	interface Props {
		recipes: Recipe[];
		getRecipeTags?: (recipeId: number) => string[];
		onTagClick?: (tag: string) => void;
	}

	let { recipes, getRecipeTags, onTagClick }: Props = $props();
</script>

{#if recipes.length === 0}
	<div class="py-20 text-center">
		<p class="text-xl text-gray-500">No recipes found. Try a different search.</p>
	</div>
{:else}
	<div class="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
		{#each recipes as recipe (recipe.id)}
			<RecipeCard {recipe} />
		{/each}
	</div>
{/if}
