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
	<!-- Logged out, the home page is one column on the site's own gutters: the
	     hero, the sample diff, then the newest recipes under the browse page's
	     section pattern, ending on a way to the rest (decided 29 October 2026). -->
	<div class="page">
		<div class="page-inner">
			<LandingHero isLoggedIn={!!data.user} />
			{#if data.sampleDiff}
				<section class="pt-10 pb-8">
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
						class="arrow-link"
						href="/recipes/{data.sampleDiff.recipeSlug}/diff?from={data.sampleDiff
							.fromVersion}&to={data.sampleDiff.toVersion}">
						Open the full comparison →
					</a>
				</section>
			{/if}

			<section class="browse-section">
				<h2 class="eyebrow-label section-heading">Recent</h2>
				{#if data.recipes.length > 0}
					<div class="recipe-grid">
						<!-- No index: the grid sits below the fold at every width, so no
						     photo here is worth fetching eagerly. -->
						{#each data.recipes as recipe (recipe.id)}
							<RecipeCard {recipe} />
						{/each}
					</div>
					<p class="all-recipes"><a href="/recipes" class="arrow-link">All recipes →</a></p>
				{:else}
					<p class="empty-state">
						No recipes yet. <a href="/recipes/new">Create the first one →</a>
					</p>
				{/if}
			</section>
		</div>
	</div>
{:else}
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
{/if}

<style>
	.browse-section + .browse-section {
		margin-top: 34px;
	}

	.all-recipes {
		margin: var(--space-4) 0 0;
	}
</style>
