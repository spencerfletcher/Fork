<script lang="ts">
	import type { Recipe, RecipeVersion } from '#lib/server/db/schema.js';
	import type { RecipeContent } from '#lib/recipes/types.js';
	import { formatTime } from '#lib/helpers.js';

	// Only what the header renders: the viewed version for the dish, the recipe
	// row for where it lives.
	type HeaderContent = Pick<
		RecipeContent,
		'title' | 'description' | 'servings' | 'prepTimeMinutes' | 'cookTimeMinutes' | 'imageUrl'
	>;

	interface HeaderRecipe extends Pick<Recipe, 'slug' | 'parentId'> {
		author?: { id: string; username: string } | null;
		parent?: { slug: string; title: string; author?: { username: string } | null } | null;
	}

	let {
		recipe,
		currentVersion,
		isViewingHistory,
		tags
	}: {
		recipe: HeaderRecipe;
		currentVersion: Pick<RecipeVersion, 'versionNumber' | 'commitMessage'> & HeaderContent;
		isViewingHistory: boolean;
		tags: { id: number; name: string; slug: string }[];
	} = $props();

	const totalMinutes = $derived(
		(currentVersion.prepTimeMinutes ?? 0) + (currentVersion.cookTimeMinutes ?? 0)
	);
</script>

<header class="recipe-header">
	{#if isViewingHistory}
		<div
			class="bg-tint text-text flex flex-wrap items-center justify-between gap-3 rounded-md px-4 py-3 font-mono text-[0.8rem]">
			Viewing v{currentVersion.versionNumber}: "{currentVersion.commitMessage}"
			<a href="/recipes/{recipe.slug}" class="text-accent">Current version →</a>
		</div>
	{/if}

	{#if recipe.author}
		<p class="author-line text-text-3 m-0 font-mono text-[0.75rem]">
			<a href="/users/{recipe.author.username}" class="text-text-3 hover:text-text no-underline">
				@{recipe.author.username}
			</a>
		</p>
	{/if}

	<div class="title-row flex flex-wrap items-baseline gap-4">
		<!-- clamp() for fluid typography must stay inline -->
		<h1
			class="text-accent m-0 font-serif leading-[1.1] font-medium"
			style="font-size: clamp(1.75rem, 4vw, 2.75rem)">
			{currentVersion.title}
		</h1>
		<span
			class="bg-marigold text-text shrink-0 rounded-sm px-2.5 py-0.5 font-mono text-[1.0625rem] font-semibold">
			v{currentVersion.versionNumber}
		</span>
	</div>

	{#if recipe.parent}
		<p class="attribution text-text-3 m-0 font-sans text-[0.875rem]">
			Forked from
			<a href="/recipes/{recipe.parent.slug}" class="text-accent">{recipe.parent.title}</a>
			{#if recipe.parent.author}by @{recipe.parent.author.username}{/if}
		</p>
	{:else if recipe.parentId}
		<p class="attribution text-text-3 m-0 font-sans text-[0.875rem]">
			Forked from a private recipe
		</p>
	{/if}

	{#if currentVersion.description}
		<p class="description text-text-2 m-0 max-w-[720px] text-[1.0625rem] leading-[1.5]">
			{currentVersion.description}
		</p>
	{/if}

	<p class="meta text-text-2 m-0 flex flex-wrap items-center gap-2.5 text-[0.875rem]">
		{#if totalMinutes > 0}
			<span>{formatTime(totalMinutes)}</span>
		{/if}
		{#if currentVersion.servings}
			{#if totalMinutes > 0}<span class="text-text-3">·</span>{/if}
			<span>Serves {currentVersion.servings}</span>
		{/if}
		{#if tags.length > 0}
			{#if totalMinutes > 0 || currentVersion.servings}<span class="text-text-3">·</span>{/if}
			<span class="tags">
				{#each tags as tag, i (tag.id)}
					{#if i > 0},&#32;{/if}
					<a href="/tags/{tag.slug}" class="text-text-2 hover:text-text">{tag.name}</a>
				{/each}
			</span>
		{/if}
	</p>

	{#if currentVersion.imageUrl}
		<figure class="recipe-photo m-0">
			<img
				src={currentVersion.imageUrl}
				alt={currentVersion.title}
				class="h-[420px] w-full rounded-lg object-cover" />
		</figure>
	{/if}
</header>

<style>
	.recipe-header {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 34px var(--space-5) 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* Explicit order so the photo can move between the title and the
	   description on a phone without touching the DOM. */
	.author-line {
		order: 1;
	}
	.title-row {
		order: 2;
	}
	.attribution {
		order: 4;
	}
	.description {
		order: 5;
	}
	.meta {
		order: 6;
	}
	.recipe-photo {
		order: 7;
	}

	@media (max-width: 860px) {
		.recipe-header {
			padding: 16px 18px 0;
			gap: 8px;
		}

		.recipe-photo {
			order: 3;
			margin: 4px -18px 4px;
			width: calc(100% + 36px);
		}

		.recipe-photo img {
			height: auto;
			aspect-ratio: 2 / 1;
			border-radius: 0;
		}
	}
</style>
