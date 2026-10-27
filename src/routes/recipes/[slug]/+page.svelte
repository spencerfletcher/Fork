<script lang="ts">
	import type { PageData } from './$types';
	import RecipeHeader from './components/RecipeHeader.svelte';
	import RecipeIngredients from './components/RecipeIngredients.svelte';
	import RecipeMethod from './components/RecipeMethod.svelte';
	import RecipeActions from './components/RecipeActions.svelte';
	import Details from './components/Details.svelte';
	import VersionStrip from '#lib/components/recipes/VersionStrip.svelte';

	let { data }: { data: PageData } = $props();

	const { recipe, currentVersion, allVersions, isViewingHistory } = $derived(data);

	const tags = $derived(recipe.recipesToTags?.map((r) => r.tag) ?? []);
	const user = $derived(data.user);
	const isOwner = $derived(user?.id === recipe.authorId);
	const canFork = $derived(!!user && !isOwner && !isViewingHistory);
	const canFavorite = $derived(!!user && !isViewingHistory);

	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
	const counts = $derived(
		plural(allVersions.length, 'version') +
			(data.forkCount > 0 ? ` · ${plural(data.forkCount, 'fork')}` : '')
	);
</script>

<article class="min-h-screen">
	<RecipeHeader {recipe} {currentVersion} {isViewingHistory} {tags} />

	{#if allVersions.length > 0}
		<VersionStrip
			versions={allVersions}
			currentVersionNumber={currentVersion.versionNumber}
			recipeSlug={recipe.slug}
			{isViewingHistory} />
	{/if}

	<!-- The sidebar comes first in the DOM so the phone stack (actions, details,
	     then the recipe) needs no reordering; the desktop grid places it in the
	     right-hand column. -->
	<div class="content-layout">
		<aside class="min-w-0">
			<div class="sidebar-sticky">
				<Details content={currentVersion} />
				<RecipeActions
					{recipe}
					{canFork}
					{canFavorite}
					{isOwner}
					{isViewingHistory}
					initialFavorited={data.isFavorited} />
				<p class="recipe-counts text-text-3 m-0 font-mono text-[0.75rem]">{counts}</p>
			</div>
		</aside>

		<div class="main min-w-0">
			<RecipeIngredients ingredients={currentVersion.ingredients} grams={data.grams} />
			<RecipeMethod steps={currentVersion.steps} />
		</div>
	</div>
</article>

<style>
	/* Fixed sidebar width + responsive column flip can't be expressed as Tailwind utilities */
	.content-layout {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 30px var(--space-5) 40px;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 320px;
		column-gap: 56px;
		align-items: start;
	}

	.main {
		grid-column: 1;
		grid-row: 1;
		display: flex;
		flex-direction: column;
		gap: 34px;
	}

	aside {
		grid-column: 2;
		grid-row: 1;
	}

	.sidebar-sticky {
		position: sticky;
		top: 76px;
		display: flex;
		flex-direction: column;
		gap: 22px;
	}

	@media (max-width: 860px) {
		.content-layout {
			grid-template-columns: minmax(0, 1fr);
			padding: 16px 18px 32px;
			row-gap: 20px;
		}

		.main,
		aside {
			grid-column: 1;
			grid-row: auto;
		}

		.sidebar-sticky {
			position: static;
			gap: 12px;
		}

		/* Fork and Favorite side by side, Fork taking the room. */
		.sidebar-sticky > :global(.actions) {
			flex-direction: row;
		}

		.sidebar-sticky > :global(.actions > .btn-primary),
		.sidebar-sticky > :global(.actions > a) {
			flex: 1;
		}

		/* Prep, cook and serves as one row of three. */
		.sidebar-sticky > :global(dl.details) {
			flex-direction: row;
		}

		.sidebar-sticky > :global(dl.details > div) {
			flex: 1;
			flex-direction: column;
			align-items: flex-start;
			gap: 2px;
			border-bottom: 1px solid var(--color-border);
		}
	}
</style>
