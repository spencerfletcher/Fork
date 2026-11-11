<script lang="ts" generics="T extends ComponentProps<typeof RecipeCard>['recipe'] & { id: number }">
	import type { ComponentProps, Snippet } from 'svelte';
	import RecipeCard from './RecipeCard.svelte';
	import ShowMore from '#lib/components/ui/ShowMore.svelte';
	import { plural } from '#lib/helpers.js';
	import type { PagedList } from '#lib/pagedList.svelte.js';

	// A counted list of cards: "3 recipes" over the shared grid. card replaces
	// the plain card when a page shows more under each (the forks list's note).
	// A paged list passes its total (the count is the whole list's, not the
	// cards shown) and `more`, which ends the grid in Show more.
	let {
		recipes,
		total,
		more,
		noun = 'recipe',
		class: className,
		card
	}: {
		recipes: T[];
		total?: number;
		more?: PagedList;
		noun?: string;
		class?: string;
		card?: Snippet<[T, number]>;
	} = $props();

	let grid = $state<HTMLElement>();
</script>

<section class={className}>
	<h2 class="eyebrow-label section-heading">
		{plural(total ?? recipes.length, noun)}
	</h2>
	<div class="recipe-grid" bind:this={grid}>
		{#each recipes as recipe, i (recipe.id)}
			{#if card}
				{@render card(recipe, i)}
			{:else}
				<RecipeCard {recipe} index={i} />
			{/if}
		{/each}
	</div>
	{#if more}<ShowMore list={more} container={grid} {noun} />{/if}
</section>
