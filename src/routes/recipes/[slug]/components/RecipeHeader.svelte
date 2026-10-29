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

<svelte:window onkeydown={onWindowKeydown} />

<!-- One face below the title. The byline carries who and how many; the
     description is plain body text; the only mono line is the version's
     note, marked by its chip and a rule in the margin; then a rule, the
     measure, the tags, the actions. -->
<header class="recipe-header">
	<h1 class="title m-0 font-serif font-medium">{currentVersion.title}</h1>

	<p class="byline m-0 font-sans">
		{#if isViewingHistory}
			{#if recipe.author}By <Username username={recipe.author.username} /> ·
			{/if}
			<button
				type="button"
				class="versions-toggle"
				bind:this={toggle}
				aria-expanded={open}
				aria-controls="version-history"
				onclick={() => (open = !open)}>
				v{n} of {count}
			</button>
			· Viewing history ·
			<a href="/recipes/{recipe.slug}">Back to v{latest}</a>
		{:else}
			{#if recipe.author}By <Username username={recipe.author.username} />{/if}
			{#if count > 1}
				{#if recipe.author}·{/if}
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
				· {forkCount} {forkCount === 1 ? 'fork' : 'forks'}
			{/if}
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

	<!-- The version's note, in the margin: a chip and the message in mono. -->
	<div class="version-bar">
		<p class="commit-line m-0 font-mono">
			<span class="sr-only">
				{isViewingHistory ? `Version ${n} of ${count}:` : `Version ${n}, latest:`}
			</span>
			<span class="version" aria-hidden="true">v{n}</span>
			<span class="commit">{currentVersion.commitMessage}</span>
		</p>
	</div>

	<!-- The other versions, newest first: the one being read is already on the
	     page, so it is not repeated. Each compares itself with the one being read,
	     older to newer. -->
	{#if count > 1}
		<ul id="version-history" class="history m-0 list-none p-0 font-mono" hidden={!open}>
			{#each versions.filter((v) => v.versionNumber !== n) as version (version.id)}
				{@const v = version.versionNumber}
				<li>
					<a href="/recipes/{recipe.slug}?version={v}" class="version-number">v{v}</a>
					<span class="text-text-2">{version.commitMessage}</span>
					<a
						href="/recipes/{recipe.slug}/diff?from={Math.min(v, n)}&to={Math.max(v, n)}"
						class="compare whitespace-nowrap">
						Compare with v{n}
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<hr class="rule" />

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
		gap: 16px;
	}

	/* clamp() for fluid typography: 28px on a phone, 40px on a desktop. */
	.title {
		font-size: clamp(1.75rem, 1.2rem + 1.8vw, 2.5rem);
		line-height: 1.15;
		color: var(--color-accent);
	}

	/* Who and how many, bold, right under the title. Links are clay like the
	   rest of the site; the username keeps the byline's own face and size. */
	.byline {
		margin-top: -8px;
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

	/* The toggle is a word in the sentence, not a button. */
	.versions-toggle {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		cursor: pointer;
	}

	.description {
		font-size: 1.0625rem;
		line-height: 1.5;
	}

	.commit-line {
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding-left: 12px;
		border-left: 2px solid var(--color-border-2);
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--color-text-2);
	}

	.version {
		flex-shrink: 0;
		padding: 0 6px;
		border-radius: var(--radius-sm);
		background: var(--color-marigold);
		color: var(--color-text);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.commit {
		min-width: 0;
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

	.history .compare {
		margin-left: auto;
		color: var(--color-accent);
		text-decoration: none;
	}

	.history .compare:hover {
		color: var(--color-text);
	}

	.rule {
		margin: 8px 0 0;
		border: 0;
		border-top: 1px solid var(--color-border-2);
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.tags {
		font-size: 0.875rem;
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
		margin-top: 8px;
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

	@media (max-width: 699px) {
		.history li {
			flex-wrap: wrap;
		}

		.history .compare {
			flex-basis: 100%;
			margin-left: 27px;
		}
	}
</style>
