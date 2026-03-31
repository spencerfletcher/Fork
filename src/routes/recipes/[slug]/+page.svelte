<script lang="ts">
	import type { PageData } from './$types';
	import RecipeHero from '$lib/components/RecipeHero.svelte';
	import RecipeIngredients from '$lib/components/RecipeIngredients.svelte';
	import RecipeMethod from '$lib/components/RecipeMethod.svelte';
	import RecipeActions from '$lib/components/RecipeActions.svelte';
	import VersionHistory from '$lib/components/VersionHistory.svelte';

	let { data }: { data: PageData } = $props();

	const { recipe, currentVersion, allVersions, isViewingHistory } = $derived(data);

	const tags = $derived(recipe.recipesToTags?.map((r) => r.tag) ?? []);
	const user = $derived(data.user);
	const isOwner = $derived(user?.id === recipe.authorId);
	const canFork = $derived(!!user && !isOwner && !isViewingHistory);
	const canFavorite = $derived(!!user && !isViewingHistory);
	const totalMinutes = $derived((recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0));

	function formatTime(minutes: number): string {
		if (minutes < 60) return `${minutes} min`;
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	}
</script>

<article class="recipe-article">
	<RecipeHero {recipe} {currentVersion} {isViewingHistory} {tags} {totalMinutes} {formatTime} />

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
				{#if recipe.prepTimeMinutes || recipe.cookTimeMinutes || recipe.servings}
					<div class="sidebar-card">
						<h4 class="eyebrow-label card-label">Details</h4>
						<dl class="details-list">
							{#if recipe.prepTimeMinutes}
								<div class="detail-row">
									<dt class="detail-label">Prep</dt>
									<dd class="detail-value">{formatTime(recipe.prepTimeMinutes)}</dd>
								</div>
							{/if}
							{#if recipe.cookTimeMinutes}
								<div class="detail-row">
									<dt class="detail-label">Cook</dt>
									<dd class="detail-value">{formatTime(recipe.cookTimeMinutes)}</dd>
								</div>
							{/if}
							{#if recipe.servings}
								<div class="detail-row">
									<dt class="detail-label">Serves</dt>
									<dd class="detail-value">{recipe.servings}</dd>
								</div>
							{/if}
						</dl>
					</div>
				{/if}

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

	/* ── Sidebar cards ── */
	.sidebar-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border-2);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
	}

	.card-label {
		margin-bottom: var(--space-4);
	}

	/* ── Details list ── */
	.details-list {
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.detail-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.detail-label {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-3);
	}

	.detail-value {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text);
		margin: 0;
	}

	.empty-content {
		color: var(--color-text-3);
		font-size: 1rem;
		padding: var(--space-7) 0;
	}
</style>
