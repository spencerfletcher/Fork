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

<article class="recipe-article">
	<RecipeHero {recipe} {currentVersion} {isViewingHistory} {tags} {totalMinutes} />

	<div class="content-layout">
		<!-- Left: ingredients + method -->
		<div class="content-main">
			{#if currentVersion}
				<RecipeIngredients {currentVersion} />
				<RecipeMethod steps={currentVersion.steps} />
			{:else}
				<p class="empty-content">
					No recipe content yet.
					{#if isOwner}<a href="/recipes/{recipe.slug}/edit">Add content →</a>{/if}
				</p>
			{/if}
		</div>

		<!-- Right: sticky sidebar -->
		<aside class="content-sidebar">
			<div class="sidebar-sticky">
				<!-- Details card -->
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
	.recipe-article {
		min-height: 100vh;
	}

	/* ── Two-column layout ── */
	.content-layout {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-7) var(--space-5);
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: var(--space-8);
		align-items: start;
	}

	.content-main,
	.content-sidebar {
		min-width: 0;
	}

	@media (max-width: 860px) {
		.content-layout {
			grid-template-columns: 1fr;
			padding: var(--space-5);
		}

		.content-sidebar {
			order: -1;
		}
	}

	/* ── Sticky sidebar ── */
	.sidebar-sticky {
		position: sticky;
		top: 76px;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.empty-content {
		color: var(--color-text-3);
		font-size: 1rem;
		padding: var(--space-7) 0;
	}
</style>
