<script lang="ts">
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import BrowseSections from '#lib/components/recipes/BrowseSections.svelte';
	import VersionDiff from '#lib/components/recipes/VersionDiff.svelte';
	import LandingHero from './LandingHero.svelte';
	import TagTabs from '#lib/components/ui/TagTabs.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Chromium does not scroll the phone strip to a card that takes keyboard
	// focus, so the card is brought in by hand. No behavior is passed: the
	// strip's CSS scroll-behavior decides, which honours reduced motion.
	function revealFocusedCard(event: FocusEvent) {
		const card = (event.target as Element).closest('.recent-strip > *');
		card?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}
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
					<!-- Folded wherever the panels stack, so the food comes up sooner. -->
					<div class="sample-diff">
						<VersionDiff
							fold
							metaDiff={data.sampleDiff.metaDiff}
							ingredientDiff={data.sampleDiff.ingredientDiff}
							stepDiff={data.sampleDiff.stepDiff} />
					</div>
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
					<div class="recipe-grid recent-strip" onfocusin={revealFocusedCard}>
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
			<p class="signup-close"><a href="/signup" class="btn-ghost">Sign up to fork one</a></p>
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
				<BrowseSections recipes={data.recipes} />
			{/if}
		</div>
	</div>
{/if}

<style>
	/* A phone drops the sample's Details panel, the only section at the diff's
	   top level (Ingredients and Method sit inside its columns), so the first
	   photo comes up a screen sooner; the compare page keeps it. */
	@media (max-width: 699px) {
		.sample-diff > :global(.diff-section) {
			display: none;
		}
	}

	.all-recipes {
		margin: var(--space-4) 0 0;
	}

	/* A quiet closing line under the last section: on the column's left edge,
	   centred on a phone. The ghost button is already a 44px+ hit. */
	.signup-close {
		margin: var(--space-6) 0 0;
	}

	@media (max-width: 699px) {
		.signup-close {
			text-align: center;
		}
	}

	/* Six recent cards, never more than two rows: 4 + 2 at four columns, 3 + 3
	   at three. Two columns would need three, so a phone flows the cards into
	   two rows by column and the strip scrolls sideways, bleeding to the
	   screen edge like the tag tabs. Columns are sized at 2.25 to the screen,
	   so the third peeks in and shows there is more. The block padding keeps
	   focus rings inside the scroll box. */
	@media (max-width: 699px) {
		.recent-strip {
			grid-auto-flow: column;
			grid-template-rows: repeat(2, auto);
			grid-template-columns: none;
			grid-auto-columns: calc((100% - var(--space-5)) / 2.25);
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			scroll-padding-inline: 18px;
			scrollbar-width: none;
			margin: -4px -18px;
			padding: 4px 18px;
		}

		.recent-strip::-webkit-scrollbar {
			display: none;
		}

		.recent-strip > :global(*) {
			scroll-snap-align: start;
		}
	}

	@media (max-width: 699px) and (prefers-reduced-motion: no-preference) {
		.recent-strip {
			scroll-behavior: smooth;
		}
	}
</style>
