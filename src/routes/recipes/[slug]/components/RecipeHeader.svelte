<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import Username from '#lib/components/ui/Username.svelte';
	import Details from './Details.svelte';
	import type { Recipe, RecipeVersion } from '#lib/server/db/schema.js';
	import type { RecipeContent } from '#lib/recipes/types.js';

	// Only what the header renders: the viewed version for the dish, the recipe
	// row for where it lives, the version list for the byline and its history.
	type HeaderContent = Pick<
		RecipeContent,
		'title' | 'description' | 'servings' | 'prepTimeMinutes' | 'cookTimeMinutes' | 'imageUrl'
	>;
	type HeaderVersion = Pick<RecipeVersion, 'id' | 'versionNumber' | 'commitMessage'>;

	interface HeaderRecipe extends Pick<Recipe, 'slug' | 'parentId'> {
		author?: { id: string; username: string } | null;
		parent?: { slug: string; title: string; author?: { username: string } | null } | null;
	}

	let {
		recipe,
		currentVersion,
		versions,
		forkCount,
		isViewingHistory,
		tags,
		actions
	}: {
		recipe: HeaderRecipe;
		currentVersion: HeaderVersion & HeaderContent;
		/** Every version, newest first. */
		versions: HeaderVersion[];
		/** Public forks. */
		forkCount: number;
		isViewingHistory: boolean;
		tags: { id: number; name: string; slug: string }[];
		/** The action row (Fork or Edit, Favorite), the last line of the header. */
		actions?: Snippet;
	} = $props();

	const count = $derived(versions.length);
	const latest = $derived(Math.max(...versions.map((v) => v.versionNumber)));
	const n = $derived(currentVersion.versionNumber);

	let open = $state(false);
	let toggle: HTMLButtonElement | undefined = $state();

	// SvelteKit keeps this component mounted when only the query changes, so
	// the history's own links would otherwise leave it open over the next view.
	afterNavigate(() => (open = false));

	function onWindowKeydown(event: KeyboardEvent) {
		if (!open || event.key !== 'Escape') return;
		open = false;
		toggle?.focus();
	}
</script>

{#snippet chevron()}
	<svg
		class="chevron"
		class:up={open}
		viewBox="0 0 12 12"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.6"
		stroke-linecap="round"
		stroke-linejoin="round">
		<path d="M2.5 4.5 6 8l3.5-3.5" />
	</svg>
{/snippet}

<svelte:window onkeydown={onWindowKeydown} />

<!-- One face below the title. The byline carries who, the forks, the version
     chip and the history toggle; the commit message lives only in the history
     it opens. Then the description, the measure on one line, the tags, the
     actions. Nothing is boxed and nothing is pinned: the column ends where it
     ends. Decided 29 October 2026. -->
<header class="recipe-header">
	<h1 class="title m-0 font-serif font-medium">{currentVersion.title}</h1>

	<p class="byline m-0 font-sans">
		{#if isViewingHistory}
			{#if recipe.author}By <Username username={recipe.author.username} /> ·
			{/if}
			<span class="version font-mono">
				<span class="sr-only">Version {n} of {count}, replaced</span>
				<span aria-hidden="true">v{n}</span>
			</span>
			·
			<button
				type="button"
				class="versions-toggle"
				bind:this={toggle}
				aria-expanded={open}
				aria-controls="version-history"
				aria-label="Version history, v{n} of {count}"
				onclick={() => (open = !open)}>
				v{n} of {count}
				{@render chevron()}
			</button>
			· Older version ·
			<a href="/recipes/{recipe.slug}">Back to v{latest}</a>
		{:else}
			{#if recipe.author}By <Username username={recipe.author.username} /> ·
			{/if}
			{#if forkCount > 0}
				{forkCount} {forkCount === 1 ? 'fork' : 'forks'} ·
			{/if}
			<span class="version font-mono">
				<span class="sr-only">Version {n}, the latest</span>
				<span aria-hidden="true">v{n}</span>
			</span>
			{#if count > 1}
				·
				<button
					type="button"
					class="versions-toggle"
					bind:this={toggle}
					aria-expanded={open}
					aria-controls="version-history"
					onclick={() => (open = !open)}>
					{count} versions
					{@render chevron()}
				</button>
			{/if}
		{/if}
	</p>

	<!-- Every version, newest first, under the byline. The one being read keeps
	     its chip and its message; each other row, number and message, is the
	     link to that version, with a second link that compares it with the one
	     being read, older to newer. -->
	{#if count > 1}
		<ul id="version-history" class="history m-0 list-none p-0 font-mono" hidden={!open}>
			{#each versions as version (version.id)}
				{@const v = version.versionNumber}
				<li class:current={v === n}>
					{#if v === n}
						<span class="version" aria-hidden="true">v{v}</span>
						<span class="sr-only">Version {v}, {v === latest ? 'latest' : 'being read'}:</span>
						<span class="message text-text">{version.commitMessage}</span>
					{:else}
						<a href="/recipes/{recipe.slug}?version={v}" class="version-link">
							<span class="version-number">v{v}</span>
							<span class="message text-text-2">{version.commitMessage}</span>
						</a>
						<a
							href="/recipes/{recipe.slug}/diff?from={Math.min(v, n)}&to={Math.max(v, n)}"
							class="compare whitespace-nowrap">
							Compare with v{n}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

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
				<a href="/tags/{tag.slug}">{tag.name}</a>
			{/each}
		</p>
	{/if}

	{#if actions}
		<div class="actions-row">{@render actions()}</div>
	{/if}
</header>

<style>
	/* 8, 8, 8, 2, 16 down the column: each line sets its own gap above. */
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

	/* Who, the forks, the chip, the history: one sans line, 600, links clay;
	   the username keeps the byline's own face and size. */
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

	.byline a,
	.versions-toggle {
		color: var(--color-accent);
		text-decoration: none;
	}

	.byline a:hover,
	.versions-toggle:hover,
	.versions-toggle[aria-expanded='true'] {
		color: var(--color-text);
	}

	/* The toggle is a word in the sentence, not a button, with a chevron that
	   flips while the history is open. */
	.versions-toggle {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		cursor: pointer;
	}

	.chevron {
		width: 12px;
		height: 12px;
		transition: transform 0.15s ease;
	}

	.chevron.up {
		transform: rotate(180deg);
	}

	/* The marigold chip: a badge, not a control. */
	.version {
		display: inline-block;
		flex-shrink: 0;
		padding: 0 6px;
		border-radius: var(--radius-sm);
		background: var(--color-marigold);
		color: var(--color-text);
		font-size: 0.75rem;
		font-weight: 600;
		line-height: 1.5;
		vertical-align: 1px;
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

	/* Lifted paper, a rule, no shadow: the list sits in the flow under the
	   byline, it does not float. */
	.history {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 10px;
		padding: 10px 14px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.history li {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	/* The message shrinks and wraps under itself; the chip and the compare
	   link keep their width. */
	.history .message {
		flex: 1 1 0;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	/* The row is the link: the number in clay, the message in Ink 2 that
	   darkens on hover, so the link reads as a row and not as a clay line. */
	.history .version-link {
		display: flex;
		flex: 1 1 0;
		min-width: 0;
		align-items: baseline;
		gap: 10px;
		color: inherit;
		text-decoration: none;
	}

	.history .version-link:hover .message {
		color: var(--color-text);
	}

	/* The same width as the chip, so the numbers and the messages line up. */
	.history .version-number {
		flex-shrink: 0;
		padding: 0 6px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-accent);
	}

	.history .compare {
		margin-left: auto;
		flex-shrink: 0;
		color: var(--color-accent);
		text-decoration: none;
	}

	.history .compare:hover {
		color: var(--color-text);
	}

	.recipe-header :global(.details) {
		margin-top: 8px;
	}

	.tags {
		margin-top: 2px;
		font-size: 1rem;
		line-height: 1.5;
	}

	.tags a {
		color: inherit;
		text-decoration: none;
	}

	.tags a:hover {
		color: var(--color-accent);
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
	.byline .versions-toggle,
	.tags a,
	.history a {
		padding: 4px 0;
		margin: -4px 0;
	}

	/* On a phone each row is a thumb's height: the row link fills its li. */
	@media (max-width: 699px) {
		.history {
			gap: 0;
		}

		.history li {
			flex-wrap: wrap;
			row-gap: 4px;
			padding: 11px 0;
		}

		.history .version-link {
			padding: 11px 0;
			margin: -11px 0;
		}

		.history .compare {
			flex-basis: 100%;
			margin-left: 36px; /* chip width plus the row gap */
		}
	}
</style>
