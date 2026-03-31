<script lang="ts">
	import type { Recipe, RecipeVersion, Tag } from '$lib/server/db/schema';
	import { formatTime } from '$lib/helpers';

	interface RecipeWithRelations extends Recipe {
		author?: { id: string; username: string } | null;
		parent?: { slug: string; title: string; author?: { username: string } | null } | null;
	}

	let {
		recipe,
		currentVersion,
		isViewingHistory,
		tags,
		totalMinutes
	}: {
		recipe: RecipeWithRelations;
		currentVersion: RecipeVersion | null;
		isViewingHistory: boolean;
		tags: Tag[];
		totalMinutes: number;
	} = $props();
</script>

<header class="recipe-hero">
	<div class="hero-inner">
		{#if isViewingHistory && currentVersion}
			<div class="history-banner">
				Viewing v{currentVersion.versionNumber}: "{currentVersion.commitMessage}"
				<a href="/recipes/{recipe.slug}">Current version →</a>
			</div>
		{/if}

		<!-- Breadcrumb -->
		<nav class="breadcrumb" aria-label="Recipe location">
			{#if recipe.author}
				<a href="/users/{recipe.author.username}" class="hero-link">@{recipe.author.username}</a>
				<span class="breadcrumb-sep">/</span>
			{/if}
			<span class="breadcrumb-slug">{recipe.slug}</span>
		</nav>

		<!-- Title + version -->
		<div class="title-row">
			<h1 class="recipe-title">{recipe.title}</h1>
			{#if currentVersion}
				<span class="recipe-version">v{currentVersion.versionNumber}</span>
			{/if}
		</div>

		<!-- Fork attribution -->
		{#if recipe.parent}
			<p class="fork-credit">
				Forked from
				<a href="/recipes/{recipe.parent.slug}">{recipe.parent.title}</a>
				{#if recipe.parent.author}by @{recipe.parent.author.username}{/if}
			</p>
		{/if}

		<!-- Badges row -->
		<div class="hero-badges">
			{#each tags as tag (tag.id)}
				<a href="/tags/{tag.slug}" class="hero-badge badge-tag">{tag.name}</a>
			{/each}
			{#if totalMinutes > 0}
				<span class="hero-badge badge-time">{formatTime(totalMinutes)}</span>
			{/if}
			{#if recipe.servings}
				<span class="hero-meta-text">Serves {recipe.servings}</span>
			{/if}
			{#if recipe.author}
				<span class="hero-meta-sep">·</span>
				<a href="/users/{recipe.author.username}" class="hero-link hero-meta-author"
					>@{recipe.author.username}</a
				>
			{/if}
		</div>
	</div>
</header>

<style>
	.recipe-hero {
		background: var(--color-hero-bg);
		padding: var(--space-6) var(--space-5);
		width: 100%;
		box-sizing: border-box;
	}

	.hero-inner {
		max-width: var(--max-width);
		margin: 0 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.history-banner {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text-tan);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.history-banner a {
		color: var(--color-accent);
	}

	.breadcrumb {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--color-text-bronze);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	/* Shared style for monospace bronze links in the hero */
	.hero-link {
		color: var(--color-text-bronze);
		text-decoration: none;
		transition: color 0.15s;
	}

	.hero-link:hover {
		color: var(--color-text-tan);
	}

	.breadcrumb-sep {
		color: var(--color-text-bronze);
		opacity: 0.5;
	}

	.breadcrumb-slug {
		color: var(--color-accent);
	}

	.fork-credit {
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 0.9rem;
		color: var(--color-text-bronze);
		margin: 0;
	}

	.fork-credit a {
		color: var(--color-accent);
	}

	.title-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-4);
		margin: 0;
		flex-wrap: wrap;
	}

	.recipe-title {
		font-family: var(--font-serif);
		font-size: clamp(2.4rem, 5vw, 4rem);
		font-weight: 700;
		color: var(--color-text-cream);
		margin: 0;
		line-height: 1.05;
		letter-spacing: -0.02em;
	}

	.recipe-version {
		font-family: var(--font-mono);
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-accent);
		flex-shrink: 0;
	}

	.hero-badges {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}

	/* Shared base for pill badges */
	.hero-badge {
		font-family: var(--font-sans);
		font-size: 0.78rem;
		font-weight: 600;
		border-radius: var(--radius-pill);
		padding: 4px 12px;
		text-decoration: none;
	}

	.badge-tag {
		background: var(--color-accent);
		color: var(--color-hero-bg);
		transition: opacity 0.15s;
	}

	.badge-tag:hover {
		opacity: 0.85;
	}

	.badge-time {
		background: var(--color-paprika);
		color: var(--color-text-cream);
	}

	.hero-meta-text {
		font-size: 0.9rem;
		color: var(--color-text-bronze);
	}

	.hero-meta-author {
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}

	.hero-meta-author:hover {
		color: var(--color-accent);
	}

	.hero-meta-sep {
		color: var(--color-text-bronze);
		opacity: 0.4;
	}
</style>
