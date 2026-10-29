<script lang="ts">
	import type { Snippet } from 'svelte';
	import Username from '#lib/components/ui/Username.svelte';
	import Details from './Details.svelte';
	import type { Recipe } from '#lib/server/db/schema.js';
	import type { RecipeContent } from '#lib/recipes/types.js';

	// Only what the header renders: the viewed version for the dish and the
	// recipe row for where it lives. The version bar below the hero carries
	// the history.
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
		forkCount,
		tags,
		actions
	}: {
		recipe: HeaderRecipe;
		currentVersion: HeaderContent;
		/** Public forks. */
		forkCount: number;
		tags: { id: number; name: string; slug: string }[];
		/** The action row (Fork or Edit, Favorite), the last line of the header. */
		actions?: Snippet;
	} = $props();
</script>

<!-- One face below the title. The byline carries who and the forks; the
     version and its note sit in the bar under the hero. Then the description,
     the measure on one line, the tags, the actions. Nothing is boxed and
     nothing is pinned: the column ends where it ends. Decided 29 October 2026. -->
<header class="recipe-header">
	<h1 class="title m-0 font-serif font-medium">{currentVersion.title}</h1>

	<p class="byline m-0 font-sans">
		{#if recipe.author}By <Username username={recipe.author.username} />{/if}
		{#if forkCount > 0}
			{#if recipe.author}·{/if}
			{forkCount}
			{forkCount === 1 ? 'fork' : 'forks'}
		{/if}
	</p>

	{#if recipe.parent}
		<p class="attribution text-text-3 m-0 font-sans text-[0.875rem]">
			Forked from
			<a href="/recipes/{recipe.parent.slug}" class="text-accent">{recipe.parent.title}</a>
			{#if recipe.parent.author}by <Username username={recipe.parent.author.username} />{/if}
		</p>
	{:else if recipe.parentId}
		<p class="attribution text-text-3 m-0 font-sans text-[0.875rem]">
			Forked from a private recipe
		</p>
	{/if}

	{#if currentVersion.description}
		<p class="description m-0">{currentVersion.description}</p>
	{/if}

	<Details content={currentVersion} />

	{#if tags.length > 0}
		<p class="tags text-text-2 m-0 font-sans">
			{#each tags as tag, i (tag.id)}
				{#if i > 0},&#32;{/if}
				<a href="/tags/{tag.slug}" class="text-accent font-semibold">{tag.name}</a>
			{/each}
		</p>
	{/if}

	{#if actions}
		<div class="actions-row">{@render actions()}</div>
	{/if}
</header>

<style>
	/* 8, 8, 8, 8, 16 down the column: each line sets its own gap above. */
	.recipe-header {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* clamp() for fluid typography: 28px on a phone, 40px on a desktop. */
	.title {
		font-size: clamp(1.75rem, 1.2rem + 1.8vw, 2.5rem);
		line-height: 1.15;
		color: var(--color-accent);
	}

	/* Who and the forks: one sans line, 600, links clay; the username keeps
	   the byline's own face and size. */
	.byline {
		margin-top: 8px;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.5;
	}

	.byline :global(.username) {
		font-family: inherit;
		font-size: inherit;
	}

	.attribution {
		margin-top: 8px;
	}

	/* Capped at a reading measure for the one-column widths and the no-photo
	   page, where the column is wider than the photo would leave it. */
	.description {
		max-width: 65ch;
		margin-top: 8px;
		font-size: 1.0625rem;
		line-height: 1.5;
	}

	.byline :global(a) {
		color: var(--color-accent);
		text-decoration: none;
	}

	.byline :global(a:hover) {
		color: var(--color-text);
	}

	.recipe-header :global(.details) {
		margin-top: 8px;
	}

	.tags {
		margin-top: 8px;
		font-size: 1rem;
		line-height: 1.5;
	}

	/* Links like every other link on the site: clay, bold, ink on hover. */
	.tags a {
		text-decoration: none;
	}

	.tags a:hover {
		color: var(--color-text);
	}

	/* Logged out the snippet renders nothing; an empty row must not take a gap. */
	.actions-row {
		margin-top: 16px;
	}

	.actions-row:empty {
		display: none;
	}

	/* Inline links reach a 24px hit without moving the text. Last, so nothing
	   above resets it, and :global so the Username component's element takes it. */
	.byline :global(a),
	.tags a {
		padding: 4px 0;
		margin: -4px 0;
	}
</style>
