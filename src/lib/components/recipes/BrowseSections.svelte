<script lang="ts" generics="T extends ComponentProps<typeof RecipeCard>['recipe'] & BrowseRecipe">
	import type { ComponentProps } from 'svelte';
	import RecipeCard from './RecipeCard.svelte';
	import { browseSections, type BrowseRecipe } from '#lib/recipes/browse.js';

	let { recipes }: { recipes: T[] } = $props();
</script>

{#each browseSections(recipes) as section, s (section.title)}
	<section class="browse-section">
		<h2 class="eyebrow-label section-heading">{section.title}</h2>
		<div class="recipe-grid">
			<!-- Only the first section's photos can sit above the fold. -->
			{#each section.recipes as recipe, i (recipe.id)}
				<RecipeCard {recipe} index={s === 0 ? i : undefined} />
			{/each}
		</div>
	</section>
{/each}

<style>
	.browse-section + .browse-section {
		margin-top: 34px;
	}
</style>
