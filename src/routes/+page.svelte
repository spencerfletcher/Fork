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

		<hr class="mb-5 border-0 border-t border-border" />

		{#if data.recipes.length > 0}
			<div class="recipe-grid">
				{#each data.recipes as recipe (recipe.id)}
					<RecipeCard {recipe} />
				{/each}
			</div>
		{:else}
			<p class="py-8 text-center text-text-3">
				No recipes yet. <a href="/recipes/new">Create the first one →</a>
			</p>
		{/if}
	</div>
</div>
