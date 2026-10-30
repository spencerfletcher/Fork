<script lang="ts">
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<a href="/recipes/{data.recipe.slug}" class="back-link">← {data.recipe.title}</a>
		<div class="browse-header">
			<h1>Forks of {data.recipe.title}</h1>
		</div>

		{#if data.forks.length > 0}
			<section>
				<h2 class="eyebrow-label section-heading">
					{data.forks.length}
					{data.forks.length === 1 ? 'fork' : 'forks'}
				</h2>
				<div class="recipe-grid">
					{#each data.forks as recipe, i (recipe.id)}
						<RecipeCard {recipe} index={i} />
					{/each}
				</div>
			</section>
		{:else}
			<p class="empty-state">No forks yet.</p>
		{/if}
	</div>
</div>
