<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-header">
			<h1>{data.tag.name}</h1>
			<p class="page-subtitle">Recipes tagged with {data.tag.name}.</p>
		</div>

		{#if data.recipes.length > 0}
			<div class="recipe-grid">
				{#each data.recipes as recipe (recipe.id)}
					<RecipeCard {recipe} />
				{/each}
			</div>
		{:else}
			<p class="empty-state">No recipes with this tag yet. <a href="/">Explore all →</a></p>
		{/if}
	</div>
</div>

<style>
	.empty-state {
		color: var(--color-text-3);
		text-align: center;
		padding: var(--space-8) 0;
	}
</style>
