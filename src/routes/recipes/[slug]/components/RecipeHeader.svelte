<script lang="ts">
	import type { Snippet } from 'svelte';
	import Username from '#lib/components/ui/Username.svelte';
	import Details from './Details.svelte';
	import { forkIcon, starIcon } from './Icons.svelte';
	import type { Recipe } from '#lib/server/db/schema.js';
	import type { RecipeContent, TagChip } from '#lib/recipes/types.js';

	// Only what the header renders: the viewed version for the dish and the
	// recipe row for where it lives. The version bar below the hero carries
	// the history.
	type HeaderContent = Pick<
		RecipeContent,
		'title' | 'description' | 'servings' | 'prepTimeMinutes' | 'cookTimeMinutes' | 'imageUrl'
	>;

	interface HeaderRecipe extends Pick<Recipe, 'slug' | 'parentId'> {
		author?: { id: string; username: string } | null;
		parent?: { slug: string; title: string } | null;
	}

	let {
		recipe,
		currentVersion,
		storedServings,
		forkCount,
		favoriteCount,
		versionCount,
		tags,
		actions
	}: {
		recipe: HeaderRecipe;
		currentVersion: HeaderContent;
		/** The version's own servings, when `currentVersion.servings` is the scaled serves. */
		storedServings?: number | null;
		/** Public forks. */
		forkCount: number;
		favoriteCount: number;
		/** Every version of the recipe; the bar under the band lists them from two up. */
		versionCount: number;
		tags: TagChip[];
		/** The action row (Fork or Edit, Favorite), the last line of the header. */
		actions?: Snippet;
	} = $props();

	// "No forks", "1 fork", "2 forks".
	const counted = (n: number, word: string) =>
		n === 0 ? `No ${word}s` : `${n} ${word}${n === 1 ? '' : 's'}`;
</script>

<!-- One face below the title. The byline carries who and the parent, the stats row the counts; the
     version and its note sit in the bar under the band. Then the description,
     the tags, the measure on one line, the actions (the order of the title
     band, 31 October 2026). Nothing is boxed and nothing is pinned. -->
<header class="recipe-header">
	<h1 class="title m-0 font-serif font-medium">{currentVersion.title}</h1>

	<!-- Who, and what it was forked from (the parent's title, not its author,
	     who is one click away). One line; there is no separate attribution
	     line. Decided 29 October 2026. -->
	<p class="byline m-0 font-sans">
		{#if recipe.author}By <Username username={recipe.author.username} />{/if}
		{#if recipe.parent}
			{#if recipe.author}·{/if}
			forked from
			<a href="/recipes/{recipe.parent.slug}">{recipe.parent.title}</a>
		{:else if recipe.parentId}
			{#if recipe.author}·{/if}
			forked from a private recipe
		{/if}
	</p>

	<!-- The stats row (Spencer, 31 October 2026: "I like the stats row 1b"):
	     each count an icon and its words, no dots; the icons separate. A count
	     links only where there is something to open: the forks list, and the
	     version bar, which exists from two versions up. -->
	<p class="stats m-0 font-sans">
		<span class="stat">
			{@render forkIcon()}
			{#if forkCount > 0}
				<a href="/recipes/{recipe.slug}/forks">{counted(forkCount, 'fork')}</a>
			{:else}
				{counted(forkCount, 'fork')}
			{/if}
		</span>
		<span class="stat">
			{@render starIcon(false)}
			{counted(favoriteCount, 'favorite')}
		</span>
		<span class="stat">
			<svg
				class="size-4"
				viewBox="0 0 16 16"
				aria-hidden="true"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round">
				<path d="M8 1.5v13" />
				<circle cx="8" cy="3" r="1.6" fill="var(--color-band)" />
				<circle cx="8" cy="8" r="1.6" fill="var(--color-band)" />
				<circle cx="8" cy="13" r="1.6" fill="currentColor" />
			</svg>
			{#if versionCount > 1}
				<a href="#versions">{counted(versionCount, 'version')}</a>
			{:else}
				{counted(versionCount, 'version')}
			{/if}
		</span>
	</p>

	{#if currentVersion.description}
		<p class="description m-0">{currentVersion.description}</p>
	{/if}

	{#if tags.length > 0}
		<p class="tags text-text-2 m-0 font-sans">
			{#each tags as tag, i (tag.id)}
				{#if i > 0},&#32;{/if}
				<a href="/tags/{tag.slug}" class="text-accent font-semibold">{tag.name}</a>
			{/each}
		</p>
	{/if}

	<Details content={currentVersion} {storedServings} />

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

	/* Who and the forks: one line, 600, links clay. "By" and the forks are
	   sans; the handle keeps the Username face, mono at this line's size
	   (decided 29 October 2026). */
	.byline {
		margin-top: 8px;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.5;
	}

	/* The counts at the byline's size, so the header keeps one metadata size;
	   Ink 2 with Ink 2 icons, links clay and 600 like the byline's. */
	.stats {
		margin-top: 8px;
		display: flex;
		flex-wrap: wrap;
		column-gap: 20px;
		row-gap: 4px;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--color-text-2);
	}

	.stat {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
	}

	.stat svg {
		flex-shrink: 0;
	}

	/* Capped at a reading measure for the one-column widths and the no-photo
	   page, where the column is wider than the photo would leave it. Three
	   lines at every width, then an ellipsis, so the band keeps its height. */
	.description {
		max-width: 65ch;
		margin-top: 8px;
		font-size: 1.0625rem;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
	}

	.byline :global(a),
	.stats a {
		color: var(--color-accent);
		text-decoration: none;
	}

	.stats a {
		font-weight: 600;
	}

	.byline :global(a:hover),
	.stats a:hover {
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
	.stats a,
	.tags a {
		padding: 4px 0;
		margin: -4px 0;
	}

	/* On a phone the same links reach a thumb's 44px, as the bar's do. */
	@media (max-width: 699px) {
		.byline :global(a),
		.stats a,
		.tags a {
			display: inline-block;
			padding: 11px 0;
			margin-block: -11px;
		}
	}
</style>
