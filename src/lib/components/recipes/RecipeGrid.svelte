<script lang="ts" generics="T extends ComponentProps<typeof RecipeCard>['recipe'] & { id: number }">
	import type { ComponentProps, Snippet } from 'svelte';
	import RecipeCard from './RecipeCard.svelte';
	import { plural } from '#lib/helpers.js';

	// A counted list of cards: "3 recipes" over the shared grid. card replaces
	// the plain card when a page shows more under each (the forks list's note).
	let {
		recipes,
		noun = 'recipe',
		class: className,
		card
	}: { recipes: T[]; noun?: string; class?: string; card?: Snippet<[T, number]> } = $props();
</script>

<section class={className}>
	<h2 class="eyebrow-label section-heading">
		{plural(recipes.length, noun)}
	</h2>
	<div class="recipe-grid">
		{#each recipes as recipe, i (recipe.id)}
			{#if card}
				{@render card(recipe, i)}
			{:else}
				<RecipeCard {recipe} index={i} />
			{/if}
		{/each}
	</div>
</section>
