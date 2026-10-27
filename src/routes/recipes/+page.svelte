<script lang="ts">
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-header">
			<h1>{data.mine ? 'My Recipes' : 'Recipes'}</h1>
			<p class="page-subtitle">
				{data.mine ? 'Your personal collection.' : 'Everything shared on Fork.'}
			</p>
		</div>

		{#if data.recipes.length > 0}
			<div class="recipe-grid">
				{#each data.recipes as recipe (recipe.id)}
					<RecipeCard {recipe} />
				{/each}
			</div>
		{:else if data.mine}
			<div class="flex flex-col items-center gap-5 py-8 text-center">
				<p class="text-text-2 text-[1.1rem]">You have no recipes yet.</p>
				<a href="/recipes/new" class="btn-primary">Create your first recipe</a>
			</div>
		{:else}
			<p class="empty-state">No public recipes yet.</p>
		{/if}
	</div>
</div>
