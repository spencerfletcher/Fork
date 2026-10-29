<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import Username from '#lib/components/ui/Username.svelte';
	import Details from './Details.svelte';
	import type { Recipe, RecipeVersion } from '#lib/server/db/schema.js';
	import type { RecipeContent } from '#lib/recipes/types.js';

	// Only what the header renders: the viewed version for the dish, the recipe
	// row for where it lives, the version list for the bar and its history.
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

<svelte:window onkeydown={onWindowKeydown} />

<header class="recipe-header">
	<!-- Three blocks: the recipe's own words, then the version's note and its
	     history, then one quiet line of measure and tags. -->
	<div class="lede">
		<h1 class="title m-0 font-serif leading-[1.15] font-medium">{currentVersion.title}</h1>

		{#if currentVersion.description}
			<p class="description text-text-2 m-0">{currentVersion.description}</p>
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
	</div>

	<!-- The version bar, unboxed: the version being read and what it changed,
	     then one mono line of history. The chip and the mono face are the
	     mark; a single version has no change to tell, so the chip joins the
	     byline. -->
	<div class="version-bar">
		{#if count > 1}
			<p class="commit-line m-0">
				<span class="version">v{n}</span>
				<span class="commit">{currentVersion.commitMessage}</span>
			</p>
		{/if}
		<p class="byline m-0 font-mono">
			{#if count === 1}
				<span class="version">v{n}</span>
			{/if}
			{#if isViewingHistory}
				<span>v{n} of {count}</span>
				<span>Viewing history</span>
				<a href="/recipes/{recipe.slug}">Back to v{latest}</a>
			{:else}
				{#if recipe.author}
					<Username username={recipe.author.username} />
				{/if}
				{#if count > 1}
					<button
						type="button"
						class="versions-toggle"
						bind:this={toggle}
						aria-expanded={open}
						aria-controls="version-history"
						onclick={() => (open = !open)}>
						{count} versions
					</button>
				{/if}
				{#if forkCount > 0}
					<span>{forkCount} {forkCount === 1 ? 'fork' : 'forks'}</span>
				{/if}
				{#if n > 1}
					<a href="/recipes/{recipe.slug}/diff?from={n - 1}&to={n}">Compare with v{n - 1}</a>
				{/if}
			{/if}
		</p>
	</div>

	{#if count > 1 && !isViewingHistory}
		<ul id="version-history" class="history m-0 list-none p-0 font-mono" hidden={!open}>
			{#each versions as version (version.id)}
				{@const isCurrent = version.versionNumber === n}
				<li>
					<a
						href="/recipes/{recipe.slug}?version={version.versionNumber}"
						class="version-number"
						class:is-current={isCurrent}
						aria-current={isCurrent ? 'true' : undefined}>
						v{version.versionNumber}
					</a>
					<span class="text-text-2">{version.commitMessage}</span>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="meta">
		<Details content={currentVersion} />
		{#if tags.length > 0}
			<p class="tags text-text-2 m-0 font-sans">
				{#each tags as tag, i (tag.id)}
					{#if i > 0},&#32;{/if}
					<a href="/tags/{tag.slug}">{tag.name}</a>
				{/each}
			</p>
		{/if}
	</div>

	{#if actions}
		<div class="actions-row">{@render actions()}</div>
	{/if}
</header>

<style>
	.recipe-header {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.lede {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	/* clamp() for fluid typography: 28px on a phone, 40px on a desktop. */
	.title {
		font-size: clamp(1.75rem, 1.2rem + 1.8vw, 2.5rem);
		color: var(--color-accent);
	}

	.description {
		font-size: 1.25rem;
		line-height: 1.45;
	}

	.version-bar {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.commit-line {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.version {
		flex-shrink: 0;
		padding: 0 6px;
		border-radius: var(--radius-sm);
		background: var(--color-marigold);
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.commit {
		min-width: 0;
		font-size: 1.0625rem;
		line-height: 1.45;
		color: var(--color-text);
	}

	.byline {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 8px;
		font-size: 0.875rem;
		line-height: 1.7;
		color: var(--color-text-3);
	}

	/* The dot ends the item before it, so a wrapped line never starts with one. */
	.byline > :not(:last-child)::after {
		content: '·';
		margin-left: 8px;
		color: var(--color-text-3);
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

	/* Inline links reach a 24px hit without moving the text. */
	.byline a,
	.versions-toggle,
	.tags a {
		padding: 4px 0;
		margin: -4px 0;
	}

	/* One quiet line: the measure, then the tags, both in the body face. */
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 20px;
	}

	.tags {
		font-size: 0.875rem;
		line-height: 1.7;
	}

	.tags a {
		color: inherit;
		text-decoration: none;
	}

	.tags a:hover {
		color: var(--color-accent);
	}

	/* The toggle is a word in the sentence, not a button. */
	.versions-toggle {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		cursor: pointer;
	}

	/* The username is the byline's own size, not the mono default. */
	.byline :global(.username) {
		font-size: inherit;
	}

	.history {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px 14px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}

	.history li {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.history .text-text-2 {
		overflow-wrap: anywhere;
	}

	.version-number {
		flex-shrink: 0;
		font-weight: 600;
		color: var(--color-accent);
		text-decoration: none;
	}

	.version-number.is-current {
		color: var(--color-text);
	}

	@media (max-width: 699px) {
		.recipe-header {
			gap: 20px;
		}

		.description {
			font-size: 1.125rem;
		}
	}
</style>
