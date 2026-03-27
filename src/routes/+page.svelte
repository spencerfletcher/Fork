<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-header">
			<h1>Fork</h1>
			<p class="page-subtitle">Recipes worth forking.</p>
		</div>

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
	.page {
		padding: var(--space-7) var(--space-5);
	}

	.page-inner {
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: var(--space-7);
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: var(--color-text-2);
		margin: var(--space-2) 0 0;
	}

	.recipe-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-6);
	}

	@media (min-width: 640px) {
		.recipe-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.recipe-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.empty-state {
		color: var(--color-text-3);
		text-align: center;
		padding: var(--space-8) 0;
	}
</style>
