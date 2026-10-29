<script lang="ts">
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import TagTabs from '#lib/components/ui/TagTabs.svelte';
	import { browseSections } from '#lib/recipes/browse.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<div class="browse-header">
			<h1>{data.mine ? 'My Recipes' : 'Recipes'}</h1>
			{#if !data.mine}
				<TagTabs tags={data.tags} active={null} />
			{/if}
		</div>

		{#if data.recipes.length === 0}
			{#if data.mine}
				<div class="flex flex-col items-center gap-5 py-8 text-center">
					<p class="text-text-2 text-[1.1rem]">You have no recipes yet.</p>
					<a href="/recipes/new" class="btn-primary">Create your first recipe</a>
				</div>
			{:else}
				<p class="empty-state">No public recipes yet.</p>
			{/if}
		{:else if data.mine}
			<section>
				<h2 class="eyebrow-label section-heading">
					{data.recipes.length}
					{data.recipes.length === 1 ? 'recipe' : 'recipes'}
				</h2>
				<div class="recipe-grid">
					{#each data.recipes as recipe, i (recipe.id)}
						<RecipeCard {recipe} index={i} />
					{/each}
				</div>
			</section>
		{:else}
			{#each browseSections(data.recipes) as section, s (section.title)}
				<section class="browse-section">
					<h2 class="eyebrow-label section-heading">{section.title}</h2>
					<div class="recipe-grid">
						{#each section.recipes as recipe, i (recipe.id)}
							<RecipeCard {recipe} index={s === 0 ? i : undefined} />
						{/each}
					</div>
				</section>
			{/each}
		{/if}
	</div>
</div>

<style>
	.browse-section + .browse-section {
		margin-top: 34px;
	}
</style>
