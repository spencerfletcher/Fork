<script lang="ts">
	import type { PageData } from './$types';
	import RecipeHero from './components/RecipeHero.svelte';
	import RecipeIngredients from './components/RecipeIngredients.svelte';
	import RecipeMethod from './components/RecipeMethod.svelte';
	import RecipeActions from './components/RecipeActions.svelte';
	import Details from './components/Details.svelte';
	import VersionStrip from '$lib/components/VersionStrip.svelte';

	let { data }: { data: PageData } = $props();

	const { recipe, currentVersion, allVersions, isViewingHistory } = $derived(data);

	const tags = $derived(recipe.recipesToTags?.map((r) => r.tag) ?? []);
	const user = $derived(data.user);
	const isOwner = $derived(user?.id === recipe.authorId);
	const canFork = $derived(!!user && !isOwner && !isViewingHistory);
	const canFavorite = $derived(!!user && !isViewingHistory);
	const totalMinutes = $derived((recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0));
</script>

<article class="min-h-screen">
	<RecipeHero {recipe} {currentVersion} {isViewingHistory} {tags} {totalMinutes} />

	{#if allVersions.length > 0}
		<VersionStrip
			versions={allVersions}
			currentVersionNumber={currentVersion?.versionNumber ?? 0}
			recipeSlug={recipe.slug}
			{isViewingHistory}
		/>
	{/if}

	<!-- Two-column layout: kept in scoped CSS because of fixed 320px sidebar + responsive reorder -->
	<div class="content-layout">
		<div class="min-w-0">
			{#if currentVersion}
				<RecipeIngredients {currentVersion} />
				<RecipeMethod steps={currentVersion.steps} />
			{:else}
				<p class="text-text-3 py-7 text-base">
					No recipe content yet.
					{#if isOwner}<a href="/recipes/{recipe.slug}/edit">Add content →</a>{/if}
				</p>
			{/if}
		</div>

		<aside class="min-w-0">
			<div class="sidebar-sticky">
				{#if recipe.imageUrl}
					<div class="recipe-photo">
						<img
							src={recipe.imageUrl}
							alt={recipe.title}
							class="border-border-2 [aspect-ratio:4/3] w-full rounded-lg border object-cover"
						/>
					</div>
				{/if}
				<Details {recipe} />
				<RecipeActions
					{recipe}
					{canFork}
					{canFavorite}
					{isOwner}
					{isViewingHistory}
					initialFavorited={data.isFavorited}
				/>
			</div>
		</aside>
	</div>
</article>

<style>
	/* Fixed sidebar width + responsive column flip can't be expressed as Tailwind utilities */
	.content-layout {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-7) var(--space-5);
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: var(--space-8);
		align-items: start;
	}

	/* Keep this above the max-width:860px block: that block overrides `display`
	   at equal specificity, so it only wins by source order. */
	.sidebar-sticky {
		position: sticky;
		top: 76px;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	@media (max-width: 860px) {
		.content-layout {
			grid-template-columns: 1fr;
			padding: var(--space-5);
			/* .sidebar-sticky's own 16px gap stops applying once it becomes
			   display: contents, so the grid supplies the rhythm instead. */
			row-gap: var(--space-4);
		}

		/* Promote the sidebar's children to grid items so the photo can lead on its
		   own. <aside> follows the main column in the DOM, so everything else falls
		   into the right order without an explicit rule. Desktop is untouched:
		   the aside stays a normal sticky block there. */
		.content-layout > aside,
		.sidebar-sticky {
			display: contents;
		}

		/* <aside class="min-w-0"> supplied this before display:contents removed its
		   box; without it, nowrap content in the sidebar blows out the grid column.
		   :global() is required because Details/RecipeActions are separate
		   components — their root elements don't carry this file's scoped-CSS
		   hash, so an un-globaled `*` would silently never match them. */
		.sidebar-sticky > :global(*) {
			min-width: 0;
		}

		.recipe-photo {
			order: -1;
		}
	}
</style>
