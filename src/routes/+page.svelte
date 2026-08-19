<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import VersionDiff from '$lib/components/VersionDiff.svelte';
	import LandingHero from './LandingHero.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

{#if data.mode === 'landing'}
	<LandingHero isLoggedIn={!!data.user} />
	{#if data.sampleDiff}
		<!-- Wider than the site's reading column: the diff renders two panels side
		     by side here, which needs the room. -->
		<section class="mx-auto max-w-[1200px] px-6 py-10">
			<h2 class="eyebrow-label mb-3">A real change, diffed</h2>
			<!-- The premise is that every edit carries a reason, so the sample has to
			     show the reason and not only the change. -->
			<div class="commit-bar">
				<span class="commit-bar__versions">
					v{data.sampleDiff.fromVersion} → v{data.sampleDiff.toVersion}
				</span>
				{#if data.sampleDiff.commitMessage}
					<span class="commit-bar__message">{data.sampleDiff.commitMessage}</span>
				{/if}
			</div>
			<VersionDiff
				ingredientDiff={data.sampleDiff.ingredientDiff}
				stepDiff={data.sampleDiff.stepDiff}
			/>
			<!-- The hero's "See a diff" button pointed here and was redundant beside
			     the diff itself. The route to the interactive compare view still needs
			     a signpost, so it sits under the thing it opens. -->
			<a
				class="diff-open-link"
				href="/recipes/{data.sampleDiff.recipeSlug}/diff?from={data.sampleDiff.fromVersion}&to={data
					.sampleDiff.toVersion}"
			>
				Open the full comparison →
			</a>
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
			<p class="empty-state">
				No recipes yet. <a href="/recipes/new">Create the first one →</a>
			</p>
		{/if}
	</div>
</div>
