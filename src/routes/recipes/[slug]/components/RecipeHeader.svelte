<script lang="ts">
	import type { Snippet } from 'svelte';
	import Username from '#lib/components/ui/Username.svelte';
	import { plural } from '#lib/helpers.js';
	import { dayLabel } from '#lib/journal.js';
	import Details from './Details.svelte';
	import { forkIcon, versionsIcon } from './Icons.svelte';
	import type { Recipe } from '#lib/server/db/schema.js';
	import type { RecipeContent, TagChip } from '#lib/recipes/types.js';

	// Only what the header renders: the viewed version for the dish and the
	// recipe row for where it lives. The version bar below the hero carries
	// the history.
	type HeaderContent = Pick<
		RecipeContent,
		| 'title'
		| 'description'
		| 'servings'
		| 'makes'
		| 'prepTimeMinutes'
		| 'cookTimeMinutes'
		| 'imageUrl'
	>;

	interface HeaderRecipe extends Pick<Recipe, 'slug' | 'parentId'> {
		author?: { id: string; username: string } | null;
		parent?: { slug: string; title: string } | null;
		/** parentId points at a recipe that was deleted, rather than one withheld as private. */
		parentDeleted?: boolean;
	}

	let {
		recipe,
		currentVersion,
		storedServings,
		forkCount,
		versionCount,
		tags,
		cooking = false,
		actions,
		journal = null
	}: {
		recipe: HeaderRecipe;
		currentVersion: HeaderContent;
		/** The version's own servings, when `currentVersion.servings` is the scaled serves. */
		storedServings?: number | null;
		/** Forks the viewer can see: the public ones and their own. */
		forkCount: number;
		/** Every version of the recipe; the bar under the band lists them from two up. */
		versionCount: number;
		tags: TagChip[];
		/** Cooking mode hides the version bar, so the count does not link to it. */
		cooking?: boolean;
		/** The action row (Cook, then Save and Fork or Edit), the last line of the header. */
		actions?: Snippet;
		/** Signed in: the personal line under the actions; null signed out. */
		journal?: { lastEntry: { id: number; cookedOn: string } | null; addHref: string } | null;
	} = $props();

	// "No forks", "1 fork", "2 forks".
	const counted = (n: number, word: string) => (n === 0 ? `No ${word}s` : plural(n, word));
</script>

<!-- One face below the title. The byline carries who and the parent; then the
     description, the measure, the tags, the stats row's counts and the
     actions (the decided title band, 9 Nov 2026). The version and its note sit
     in the bar under the band. Nothing is boxed and nothing is pinned. -->
<header class="recipe-header">
	<h1 class="title m-0 font-serif font-medium [overflow-wrap:anywhere]">{currentVersion.title}</h1>

	<!-- Who, and what it was forked from (the parent's title, not its author,
	     who is one click away). One line; there is no separate attribution
	     line. Decided 29 October 2026. -->
	<p class="byline m-0 font-sans [overflow-wrap:anywhere]">
		{#if recipe.author}By <Username username={recipe.author.username} />{/if}
		{#if recipe.parent}
			{#if recipe.author}·{/if}
			forked from
			<a href="/recipes/{recipe.parent.slug}">{recipe.parent.title}</a>
		{:else if recipe.parentDeleted}
			{#if recipe.author}·{/if}
			Original recipe deleted
		{:else if recipe.parentId}
			{#if recipe.author}·{/if}
			forked from a private recipe
		{/if}
	</p>

	{#if currentVersion.description}
		<p class="description m-0">{currentVersion.description}</p>
	{/if}

	<Details content={currentVersion} {storedServings} />

	{#if tags.length > 0}
		<p class="tags text-text-2 m-0 font-sans">
			{#each tags as tag, i (tag.id)}
				{#if i > 0},&#32;{/if}
				<a href="/tags/{tag.slug}" class="text-accent font-semibold">{tag.name}</a>
			{/each}
		</p>
	{/if}

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
			{@render versionsIcon()}
			{#if versionCount > 1 && !cooking}
				<a href="#versions">{counted(versionCount, 'version')}</a>
			{:else}
				{counted(versionCount, 'version')}
			{/if}
		</span>
	</p>

	{#if actions}
		<div class="actions-row">{@render actions()}</div>
	{/if}

	<!-- The personal line: when the reader last logged this recipe, and a way
	     to log it again. Cook has its own Add to Journal beside Done cooking. -->
	{#if journal && !cooking}
		<p class="personal m-0 font-sans">
			{#if journal.lastEntry}
				You cooked this on
				<a href="/journal#entry-{journal.lastEntry.id}">{dayLabel(journal.lastEntry.cookedOn)}</a>
				·
			{/if}
			<a href={journal.addHref}>Add to Journal</a>
		</p>
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

	/* :global, because both icons come from Icons.svelte. */
	.stat :global(svg) {
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

	/* The byline's size and Ink 2, links clay and 600 like the stats row's. */
	.personal {
		margin-top: 12px;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--color-text-2);
	}

	.personal a {
		color: var(--color-accent);
		font-weight: 600;
		text-decoration: none;
	}

	.personal a:hover {
		color: var(--color-text);
	}

	/* Inline links reach a 24px hit without moving the text. Last, so nothing
	   above resets it, and :global so the Username component's element takes it. */
	.byline :global(a),
	.stats a,
	.tags a,
	.personal a {
		padding: 4px 0;
		margin: -4px 0;
	}

	/* On a phone the same links reach a thumb's 44px, as the bar's do. */
	@media (max-width: 699px) {
		.byline :global(a),
		.stats a,
		.tags a,
		.personal a {
			display: inline-block;
			padding: 11px 0;
			margin-block: -11px;
		}
	}
</style>
