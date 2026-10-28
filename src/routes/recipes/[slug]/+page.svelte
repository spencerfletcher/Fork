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
</script>

<article class="min-h-screen">
	<RecipeHeader {recipe} {currentVersion} {isViewingHistory} {tags} />

	{#if allVersions.length > 0}
		<VersionStrip
			versions={allVersions}
			currentVersionNumber={currentVersion.versionNumber}
			recipeSlug={recipe.slug}
			{isViewingHistory}
			forkCount={data.forkCount} />
	{/if}

	<!-- Details and actions sit in the right column; the recipe itself reads
	     in a 720px column. The sidebar comes first in the DOM so the phone
	     stack needs no reordering. -->
	<div class="content-layout">
		<aside class="min-w-0">
			<div class="sidebar-sticky">
				{#if currentVersion.imageUrl}
					<figure class="recipe-photo m-0">
						<img src={currentVersion.imageUrl} alt={currentVersion.title} />
					</figure>
				{/if}
				<Details content={currentVersion} />
				<RecipeActions
					{recipe}
					{canFork}
					{canFavorite}
					{isOwner}
					{isViewingHistory}
					initialFavorited={data.isFavorited} />
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
		max-width: calc(var(--max-width) + 2 * var(--space-5));
		margin: 0 auto;
		padding: 26px var(--space-5) 40px;
		display: grid;
		grid-template-columns: minmax(0, 720px) 320px;
		justify-content: space-between;
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

	/* The aside must span the row's full height, or the sticky child has no
	   room to move inside it and scrolls away with the page. */
	aside {
		grid-column: 2;
		grid-row: 1;
		align-self: stretch;
	}

	.sidebar-sticky {
		position: sticky;
		top: 24px;
		display: flex;
		flex-direction: column;
		gap: 22px;
	}

	/* Sidebar width, 4:3, so a photo's pixels are not stretched across the page. */
	.recipe-photo img {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		border-radius: var(--radius-md);
	}

	@media (max-width: 699px) {
		.content-layout {
			padding: 16px 18px 32px;
		}
	}

	@media (max-width: 860px) {
		.content-layout {
			grid-template-columns: minmax(0, 1fr);
			row-gap: 20px;
		}

		.main,
		aside {
			grid-column: 1;
			grid-row: auto;
		}

		.sidebar-sticky {
			position: static;
			gap: 14px;
		}

		/* Full width on a phone, as a 2:1 banner. */
		.recipe-photo {
			margin: 0 -18px;
		}

		.recipe-photo img {
			aspect-ratio: 2 / 1;
			border-radius: 0;
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
