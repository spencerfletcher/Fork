<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<header class="page-header">
			<div class="header-main">
				<h1 class="site-title">Fork</h1>
				<p class="site-tagline">Recipes worth forking.</p>
			</div>
			<div class="header-meta">
				{#if data.recipes.length > 0}
					<span class="recipe-count"
						>{data.recipes.length} recipe{data.recipes.length !== 1 ? 's' : ''}</span
					>
				{/if}
				<a href="/recipes/new" class="btn-primary header-cta">New Recipe</a>
			</div>
		</header>

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
	.page {
		padding: var(--space-5) var(--space-5) var(--space-7);
	}

	.page-inner {
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-5);
		margin-bottom: var(--space-4);
		flex-wrap: wrap;
	}

	.site-title {
		font-size: clamp(1.6rem, 3vw, 2.2rem);
		letter-spacing: -0.02em;
		margin: 0 0 var(--space-1);
		line-height: 1;
	}

	.site-tagline {
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 1rem;
		font-weight: 400;
		color: var(--color-text-2);
		margin: 0;
	}

	.header-meta {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		flex-shrink: 0;
	}

	.recipe-count {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text-3);
	}

	.header-cta {
		white-space: nowrap;
	}

	.section-rule {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 0 0 var(--space-5);
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
