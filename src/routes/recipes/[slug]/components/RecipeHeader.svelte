<script lang="ts">
	import type { Snippet } from 'svelte';
	import Username from '#lib/components/ui/Username.svelte';
	import { plural } from '#lib/helpers.js';
	import { dayLabel } from '#lib/journal.js';
	import Details from './Details.svelte';
	import { forkIcon, versionsIcon } from '#lib/components/Icons.svelte';
	import type { Recipe } from '#lib/server/db/schema.js';
	import type { RecipeContent, TagChip } from '#lib/recipes/types.js';
	import { sourceLabel } from '#lib/recipes/validation.js';

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
		| 'restTimeMinutes'
		| 'sourceName'
		| 'sourceUrl'
		| 'imageUrl'
	>;

	interface HeaderRecipe extends Pick<Recipe, 'slug' | 'parentId'> {
		/** The parent's version the fork copied; null or absent for a fork from before it was recorded. */
		parentVersion?: number | null;
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
		actions,
		journal = null,
		stats = true,
		saver
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
		/** The action row (Cook, then Save and Fork or Edit), the last line of the header. */
		actions?: Snippet;
		/** Signed in: the personal line under the actions; null signed out. */
		journal?: {
			lastEntry: { id: number; cookedOn: string; timesCooked: number } | null;
			addHref: string;
		} | null;
		/** The forks and versions counts; off for a saver's kept copy, which has neither. */
		stats?: boolean;
		/** The saver's own lines under the personal line: the version they keep, their note. */
		saver?: Snippet;
	} = $props();

	// "No forks", "1 fork", "2 forks".
	const counted = (n: number, word: string) => (n === 0 ? `No ${word}s` : plural(n, word));
</script>

<!-- One face below the title. The byline carries who and the parent; then the
     description, the measure, the tags, the stats row's counts and the
     actions (the decided title band, 9 Nov 2026). The version and its note sit
     in the bar under the band. Nothing is boxed and nothing is pinned. -->
<header class="recipe-header">
	<h1 class="title font-serif font-medium">{currentVersion.title}</h1>

	<!-- Who, and what it was forked from (the parent's title, not its author,
	     who is one click away). One line; there is no separate attribution
	     line. Decided 29 October 2026. -->
	<p class="byline dot-list font-sans [overflow-wrap:anywhere]">
		{#if recipe.author}<span>
				By <Username username={recipe.author.username} class="hit-link" />
			</span>{/if}
		{#if recipe.parent}
			<span>
				<!-- The exact version copied, when the fork recorded it (exact origins). -->
				forked from {#if recipe.parentVersion}<a
						class="hit-link"
						href="/recipes/{recipe.parent.slug}?version={recipe.parentVersion}">
						{recipe.parent.title},
						<span class="mono-id">v{recipe.parentVersion}</span>
					</a>{:else}<a class="hit-link" href="/recipes/{recipe.parent.slug}">
						{recipe.parent.title}
					</a>{/if}
			</span>
		{:else if recipe.parentDeleted}
			<span>Original recipe deleted</span>
		{:else if recipe.parentId}
			<span>forked from a private recipe</span>
		{/if}
	</p>

	<!-- Where the recipe came from outside Fork, apart from who wrote it here
	     and what it was forked from. The link is the author's, never fetched,
	     and passes no referrer or ranking on. -->
	{#if currentVersion.sourceName || currentVersion.sourceUrl}
		<p class="source font-sans [overflow-wrap:anywhere]">
			Source:
			{#if currentVersion.sourceUrl}
				<a class="hit-link" href={currentVersion.sourceUrl} rel="noopener noreferrer nofollow">
					{sourceLabel(currentVersion.sourceName, currentVersion.sourceUrl)}
				</a>
			{:else}
				{currentVersion.sourceName}
			{/if}
		</p>
	{/if}

	{#if currentVersion.description}
		<p class="description">{currentVersion.description}</p>
	{/if}

	<Details content={currentVersion} {storedServings} />

	{#if tags.length > 0}
		<p class="tags text-text-2 font-sans">
			{#each tags as tag, i (tag.id)}
				{#if i > 0},&#32;{/if}
				<a href="/tags/{tag.slug}" class="hit-link font-semibold">{tag.name}</a>
			{/each}
		</p>
	{/if}

	<!-- The stats row (Spencer, 31 October 2026: "I like the stats row 1b"):
	     each count an icon and its words, no dots; the icons separate. A count
	     links only where there is something to open: the forks list, and the
	     version bar, which exists from two versions up. -->
	{#if stats}
		<p class="stats font-sans">
			<span class="stat">
				{@render forkIcon()}
				{#if forkCount > 0}
					<a class="hit-link" href="/recipes/{recipe.slug}/forks">{counted(forkCount, 'fork')}</a>
				{:else}
					{counted(forkCount, 'fork')}
				{/if}
			</span>
			<span class="stat">
				{@render versionsIcon()}
				{#if versionCount > 1}
					<a class="hit-link" href="#versions">{counted(versionCount, 'version')}</a>
				{:else}
					{counted(versionCount, 'version')}
				{/if}
			</span>
		</p>
	{/if}

	{#if actions}
		<div class="actions-row">{@render actions()}</div>
	{/if}

	<!-- The personal line: how often and when last the reader logged this
	     recipe. Logging it again is the Add to Journal pill in the action row. -->
	{#if journal?.lastEntry}
		<p class="personal personal-line font-sans">
			You cooked this {journal.lastEntry.timesCooked > 1
				? `${plural(journal.lastEntry.timesCooked, 'time')}, last on`
				: 'on'}
			<a class="hit-link" href="/journal#entry-{journal.lastEntry.id}">
				{dayLabel(journal.lastEntry.cookedOn)}
			</a>
		</p>
	{/if}

	{@render saver?.()}
</header>

<style>
	/* 8, 8, 8, 8, 16 down the column: each line sets its own gap above. */
	.recipe-header {
		display: flex;
		flex-direction: column;
	}

	/* Who and the forks: one line, 600, links clay. "By" and the forks are
	   sans; the handle keeps the Username face, mono at this line's size
	   (decided 29 October 2026). */
	.byline {
		--dot-space: 0 0.25em 0 0;
		margin-top: 8px;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.5;
	}

	/* At the byline's size in Ink 2, the link clay and 600, as the stats row's. */
	.source {
		margin-top: 8px;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--color-text-2);
	}

	.source a {
		font-weight: 600;
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

	/* Fills the words column (Spencer, 9 November 2026: no early cap). Three
	   lines at every width, then an ellipsis, so the band keeps its height. */
	.description {
		margin-top: 8px;
		font-size: 1.0625rem;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
	}

	.stats a {
		font-weight: 600;
	}

	.recipe-header :global(.details) {
		margin-top: 8px;
	}

	.tags {
		margin-top: 8px;
		font-size: 1rem;
		line-height: 1.5;
	}

	/* Logged out the snippet renders nothing; an empty row must not take a gap. */
	.actions-row {
		margin-top: 16px;
	}

	.actions-row:empty {
		display: none;
	}

	/* The personal line (app.css) at the byline's size, its link clay and 600
	   like the stats row's. */
	.personal a {
		font-weight: 600;
	}
</style>
