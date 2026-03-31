<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		{#if data.user}
			<div class="page-header">
				<h1>My Recipes</h1>
				<p class="page-subtitle">Your personal collection.</p>
			</div>

			{#if data.recipes && data.recipes.length > 0}
				<div class="recipe-grid">
					{#each data.recipes as recipe (recipe.id)}
						<RecipeCard {recipe} />
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<p>You have no recipes yet.</p>
					<a href="/recipes/new" class="btn-primary">Create your first recipe</a>
				</div>
			{/if}
		{:else}
			<div class="auth-prompt">
				<h1>My Recipes</h1>
				<p>Please <a href="/login">log in</a> to see your recipes.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.empty-state {
		text-align: center;
		padding: var(--space-8) 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-5);
	}

	.empty-state p {
		color: var(--color-text-2);
		font-size: 1.1rem;
	}

	.auth-prompt {
		text-align: center;
		padding: var(--space-8) 0;
	}
</style>
