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
				<div class="flex flex-col items-center gap-5 py-8 text-center">
					<p class="text-[1.1rem] text-text-2">You have no recipes yet.</p>
					<a href="/recipes/new" class="btn-primary">Create your first recipe</a>
				</div>
			{/if}
		{:else}
			<div class="page-header">
				<h1>My Recipes</h1>
				<p class="page-subtitle">Please <a href="/login">log in</a> to see your recipes.</p>
			</div>
		{/if}
	</div>
</div>
