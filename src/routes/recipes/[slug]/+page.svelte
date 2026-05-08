<script lang="ts">
	import type { PageData } from './$types';
	import RecipeHero from './components/RecipeHero.svelte';
	import RecipeIngredients from './components/RecipeIngredients.svelte';
	import RecipeMethod from './components/RecipeMethod.svelte';
	import RecipeActions from './components/RecipeActions.svelte';
	import VersionHistory from './components/VersionHistory.svelte';
	import Details from './components/Details.svelte';

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

	<!-- Two-column layout: kept in scoped CSS because of fixed 320px sidebar + responsive reorder -->
	<div class="content-layout">
		<div class="min-w-0">
			{#if currentVersion}
				<RecipeIngredients {currentVersion} />
				<RecipeMethod steps={currentVersion.steps} />
			{:else}
				<p class="py-7 text-base text-text-3">
					No recipe content yet.
					{#if isOwner}<a href="/recipes/{recipe.slug}/edit">Add content →</a>{/if}
				</p>
			{/if}
		</div>

		<aside class="min-w-0">
			<div class="sidebar-sticky">
				{#if recipe.imageUrl}
					<img
						src={recipe.imageUrl}
						alt={recipe.title}
						class="w-full rounded-lg border border-border-2 object-cover [aspect-ratio:4/3]"
					/>
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
				<VersionHistory
					{allVersions}
					{currentVersion}
					recipeSlug={recipe.slug}
					{isViewingHistory}
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

	@media (max-width: 860px) {
		.content-layout {
			grid-template-columns: 1fr;
			padding: var(--space-5);
		}

		.content-layout aside {
			order: -1;
		}
	}

	.sidebar-sticky {
		position: sticky;
		top: 76px;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
