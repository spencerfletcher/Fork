<script lang="ts">
	import { afterNavigate } from '$app/navigation';
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
		tags
	}: {
		recipe: HeaderRecipe;
		currentVersion: HeaderVersion & HeaderContent;
		/** Every version, newest first. */
		versions: HeaderVersion[];
		/** Public forks. */
		forkCount: number;
		isViewingHistory: boolean;
		tags: { id: number; name: string; slug: string }[];
	} = $props();

	const count = $derived(versions.length);
	const latest = $derived(Math.max(...versions.map((v) => v.versionNumber)));
	const n = $derived(currentVersion.versionNumber);

	// The commit message is the deck: the one sentence that says what this
	// version is. Version 1 has nothing to say yet, so the description stands in.
	const deck = $derived(n > 1 ? currentVersion.commitMessage : currentVersion.description);
	const showDescription = $derived(n > 1 && !!currentVersion.description);

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
	<h1 class="title m-0 font-serif leading-[1.05] font-medium">{currentVersion.title}</h1>

	{#if deck}
		<p class="deck m-0 font-serif font-medium">{deck}</p>
	{/if}

	<!-- One mono line of history: who, which version, how many, the way in. -->
	<p class="byline m-0 font-mono">
		{#if isViewingHistory}
			<span>v{n} of {count}</span>
			<span class="dot">·</span>
			<span>Viewing history</span>
			<span class="dot">·</span>
			<a href="/recipes/{recipe.slug}">Back to v{latest}</a>
		{:else}
			{#if recipe.author}
				<Username username={recipe.author.username} />
				<span class="dot">·</span>
			{/if}
			<span class="version">v{n}</span>
			{#if count > 1}
				<span class="dot">·</span>
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
				<span class="dot">·</span>
				<span>{forkCount} {forkCount === 1 ? 'fork' : 'forks'}</span>
			{/if}
			{#if n > 1}
				<span class="dot">·</span>
				<a href="/recipes/{recipe.slug}/diff?from={n - 1}&to={n}" class="whitespace-nowrap">
					Compare with v{n - 1}
				</a>
			{/if}
		{/if}
	</p>

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

	{#if showDescription}
		<p class="description text-text-2 m-0 text-[1.0625rem] leading-[1.5]">
			{currentVersion.description}
		</p>
	{/if}

	{#if tags.length > 0}
		<p class="tags text-text-2 m-0 text-[0.875rem]">
			{#each tags as tag, i (tag.id)}
				{#if i > 0},&#32;{/if}
				<a href="/tags/{tag.slug}">{tag.name}</a>
			{/each}
		</p>
	{/if}

	<Details content={currentVersion} />
</header>

<style>
	.recipe-header {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* clamp() for fluid typography: 36px on a phone, 52px on a desktop. */
	.title {
		font-size: clamp(2.25rem, 1.5rem + 2.2vw, 3.25rem);
		color: var(--color-accent);
		text-wrap: balance;
	}

	.deck {
		font-size: 1.25rem;
		line-height: 1.4;
		color: var(--color-text-2);
	}

	.byline {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 8px;
		font-size: 0.8125rem;
		line-height: 1.7;
		color: var(--color-text-3);
	}

	.byline .version {
		font-weight: 600;
		color: var(--color-text);
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
		font-size: 0.8125rem;
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

	.description {
		margin-top: 4px;
	}

	@media (max-width: 699px) {
		.recipe-header {
			gap: 10px;
		}

		.deck {
			font-size: 1.125rem;
		}
	}
</style>
