<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import VersionDiff from '$lib/components/VersionDiff.svelte';
	import LandingHero from './LandingHero.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

{#if data.mode === 'landing'}
	<LandingHero
		sampleSlug={data.sampleDiff?.recipeSlug}
		fromVersion={data.sampleDiff?.fromVersion}
		toVersion={data.sampleDiff?.toVersion}
	/>
	{#if data.sampleDiff}
		<section class="mx-auto max-w-[900px] px-6 py-10">
			<h2 class="eyebrow-label mb-3">A real change, diffed</h2>
			<VersionDiff
				ingredientDiff={data.sampleDiff.ingredientDiff}
				stepDiff={data.sampleDiff.stepDiff}
			/>
		</section>
	{/if}
{/if}

<div class="page">
	<div class="page-inner">
		<div class="page-header">
			<!-- Landing mode already has an h1 in the hero above — this heading is
			     demoted to h2 there so the page has exactly one h1. -->
			<svelte:element this={data.mode === 'landing' ? 'h2' : 'h1'}>Recipes</svelte:element>
			<p class="page-subtitle">Recipes worth forking.</p>
		</div>

		<hr class="border-border mb-5 border-0 border-t" />

		{#if data.recipes.length > 0}
			<div class="recipe-grid">
				{#each data.recipes as recipe (recipe.id)}
					<RecipeCard {recipe} />
				{/each}
			</div>
		{:else}
			<p class="text-text-3 py-8 text-center">
				No recipes yet. <a href="/recipes/new">Create the first one →</a>
			</p>
		{/if}
	</div>
</div>
