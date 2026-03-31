<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-header">
			<h1>Recipes</h1>
			<p class="page-subtitle">Recipes worth forking.</p>
		</div>

		<hr class="section-rule" />

		{#if data.recipes.length > 0}
			<div class="recipe-grid">
				{#each data.recipes as recipe (recipe.id)}
					<RecipeCard {recipe} />
				{/each}
			</div>
		{:else}
			<p class="empty-state">No recipes yet. <a href="/recipes/new">Create the first one →</a></p>
		{/if}
	</div>
</div>

<style>
	.section-rule {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 0 0 var(--space-5);
	}

	.empty-state {
		color: var(--color-text-3);
		text-align: center;
		padding: var(--space-8) 0;
	}
</style>
