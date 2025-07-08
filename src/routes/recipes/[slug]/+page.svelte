<script lang="ts">
	import ClockSvg from '$lib/components/ClockSvg.svelte';
	import type { Recipe } from '$lib/types';
	let { data } = $props();
	let recipe: Recipe = data.recipe;
</script>

<h1>{recipe.title}</h1>
<p>{recipe.description}</p>
<ul class="list-disc pl-5">
	{#each recipe.ingredients as ingredient}
		<li>{ingredient}</li>
	{/each}
</ul>

<div class="flex items-center space-x-4 pt-3 text-sm text-gray-500">
	{#if recipe.cookTimeMinutes}
		<div class="flex items-center gap-1.5">
			<ClockSvg />
			<span>{recipe.cookTimeMinutes} min</span>
		</div>
	{/if}
</div>
