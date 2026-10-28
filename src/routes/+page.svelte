<script lang="ts">
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import VersionDiff from '#lib/components/recipes/VersionDiff.svelte';
	import LandingHero from './LandingHero.svelte';
	import TagTabs from '#lib/components/ui/TagTabs.svelte';
	import { browseSections } from '#lib/recipes/browse.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

{#if data.mode === 'landing'}
	<LandingHero isLoggedIn={!!data.user} />
	{#if data.sampleDiff}
		<!-- Wider than the site's reading column: the diff renders two panels side
		     by side here, which needs the room. -->
		<section class="mx-auto max-w-[1200px] px-5 py-10">
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
				metaDiff={data.sampleDiff.metaDiff}
				ingredientDiff={data.sampleDiff.ingredientDiff}
				stepDiff={data.sampleDiff.stepDiff} />
			<!-- The hero's "See a diff" button pointed here and was redundant beside
			     the diff itself. The route to the interactive compare view still needs
			     a signpost, so it sits under the thing it opens. -->
			<a
				class="diff-open-link"
				href="/recipes/{data.sampleDiff.recipeSlug}/diff?from={data.sampleDiff.fromVersion}&to={data
					.sampleDiff.toVersion}">
				Open the full comparison →
			</a>
		</section>
	{/if}
{/if}

{#if data.mode === 'feed'}
	<!-- Signed in, the home page is browse: the same header, tabs and sections. -->
	<div class="page">
		<div class="page-inner">
			<div class="browse-header">
				<h1>Recipes</h1>
				<TagTabs tags={data.tags} active={null} allHref="/" />
			</div>
			{#if data.recipes.length === 0}
				<p class="empty-state">
					No recipes yet. <a href="/recipes/new">Create the first one →</a>
				</p>
			{:else}
				{#each browseSections(data.recipes) as section (section.title)}
					<section class="browse-section">
						<h2 class="eyebrow-label section-heading">{section.title}</h2>
						<div class="recipe-grid">
							{#each section.recipes as recipe (recipe.id)}
								<RecipeCard {recipe} />
							{/each}
						</div>
					</section>
				{/each}
			{/if}
		</div>
	</div>
{:else}
	<div class="page">
		<div class="page-inner">
			<div class="page-header">
				<h2>Recipes</h2>
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
{/if}

<style>
	.browse-section + .browse-section {
		margin-top: 34px;
	}
</style>
