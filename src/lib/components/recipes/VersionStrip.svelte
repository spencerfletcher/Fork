<script lang="ts">
	import { afterNavigate } from '$app/navigation';

	type StripVersion = {
		id: number;
		versionNumber: number;
		commitMessage: string;
		createdAt?: Date | null;
		creator?: { id: string; username: string } | null;
	};

	let {
		versions,
		currentVersionNumber,
		recipeSlug,
		isViewingHistory = false,
		forkCount = 0
	}: {
		versions: StripVersion[];
		currentVersionNumber: number;
		recipeSlug: string;
		isViewingHistory?: boolean;
		/** Public forks, shown beside the version count. */
		forkCount?: number;
	} = $props();

	let open = $state(false);
	let nav: HTMLElement | undefined = $state();
	let toggle: HTMLButtonElement | undefined = $state();

	// SvelteKit keeps this component mounted when only the query or slug
	// changes, so the panel's own links would otherwise leave it open over the
	// next page.
	afterNavigate(() => (open = false));

	function onWindowKeydown(event: KeyboardEvent) {
		if (!open || event.key !== 'Escape') return;
		open = false;
		toggle?.focus();
	}

	function onWindowClick(event: MouseEvent) {
		if (open && nav && !nav.contains(event.target as Node)) open = false;
	}

	const current = $derived(
		versions.find((v) => v.versionNumber === currentVersionNumber) ?? versions[0]
	);
	const canCompare = $derived(!isViewingHistory && current.versionNumber > 1);
	const count = $derived(versions.length);

	const when = (d: Date | null | undefined) =>
		d?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	// One string, so a missing creator or date leaves no orphaned separator.
	const byline = $derived(
		[current.creator && `@${current.creator.username}`, when(current.createdAt)]
			.filter(Boolean)
			.join(' · ')
	);
</script>

<svelte:window onkeydown={onWindowKeydown} onclick={onWindowClick} />

<nav class="version-strip" aria-label="Version history" bind:this={nav}>
	<!-- Shaped like a repository's latest-commit bar: what the current version
	     is, who made it and when, then the ways into the history. -->
	<div class="version-card">
		<p class="version-head">
			<span class="version-current">v{current.versionNumber}</span>
			<span class="version-message">{current.commitMessage}</span>
		</p>
		{#if byline}
			<p class="version-by">{byline}</p>
		{/if}
		<p class="version-foot">
			{#if count > 1}
				<button
					type="button"
					class="version-toggle"
					bind:this={toggle}
					aria-expanded={open}
					aria-controls="version-history"
					onclick={() => (open = !open)}>
					<svg viewBox="0 0 16 16" aria-hidden="true">
						<path
							d="M8 2.5a5.5 5.5 0 1 0 5.5 5.5M8 5v3l2 1.5M2.5 3v3h3"
							fill="none"
							stroke="currentColor"
							stroke-width="1.3"
							stroke-linecap="round"
							stroke-linejoin="round" />
					</svg>
					{count} versions
				</button>
			{:else}
				<span class="version-count">1 version</span>
			{/if}
			{#if forkCount > 0}
				<span class="version-forks">
					<svg viewBox="0 0 16 16" aria-hidden="true">
						<path
							d="M4 3.5v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2M8 7.5v5"
							fill="none"
							stroke="currentColor"
							stroke-width="1.3"
							stroke-linecap="round" />
						<circle cx="4" cy="2.5" r="1.3" fill="currentColor" />
						<circle cx="12" cy="2.5" r="1.3" fill="currentColor" />
						<circle cx="8" cy="13.5" r="1.3" fill="currentColor" />
					</svg>
					{forkCount}
					{forkCount === 1 ? 'fork' : 'forks'}
				</span>
			{/if}
			{#if canCompare}
				<a
					href="/recipes/{recipeSlug}/diff?from={current.versionNumber -
						1}&to={current.versionNumber}"
					class="version-compare">
					Compare with v{current.versionNumber - 1}
				</a>
			{/if}
		</p>
	</div>

	{#if count > 1}
		<div id="version-history" class="version-history" hidden={!open}>
			{#each versions as version (version.id)}
				{@const isCurrent = version.versionNumber === currentVersionNumber}
				<div class="version-entry">
					<a
						href="/recipes/{recipeSlug}?version={version.versionNumber}"
						class="version-number"
						class:is-current={isCurrent}
						aria-current={isCurrent ? 'true' : undefined}>
						v{version.versionNumber}
					</a>
					<span class="version-message">{version.commitMessage}</span>
					{#if version.versionNumber > 1 && !isViewingHistory}
						<a
							href="/recipes/{recipeSlug}/diff?from={version.versionNumber -
								1}&to={version.versionNumber}"
							class="version-compare">
							Compare
						</a>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</nav>

<style>
	.version-strip {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.version-card {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 12px 14px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.version-head {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin: 0;
	}

	.version-current {
		flex-shrink: 0;
		padding: 0 5px;
		border-radius: 3px;
		background: var(--color-marigold);
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.version-head .version-message {
		font-family: var(--font-sans);
		font-size: 0.875rem;
		line-height: 1.4;
		color: var(--color-text);
		overflow-wrap: anywhere;
	}

	.version-by {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-3);
	}

	.version-foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 14px;
		margin: 2px 0 0;
		padding-top: 8px;
		border-top: 1px solid var(--color-border);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-3);
	}

	.version-foot svg {
		width: 14px;
		height: 14px;
		margin-right: 4px;
		vertical-align: -2px;
	}

	.version-toggle,
	.version-forks {
		display: inline-flex;
		align-items: center;
	}

	.version-toggle {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		color: var(--color-text-2);
		cursor: pointer;
	}

	.version-toggle:hover,
	.version-toggle[aria-expanded='true'] {
		color: var(--color-text);
	}

	.version-compare {
		margin-left: auto;
		color: var(--color-accent);
		text-decoration: none;
	}

	.version-compare:hover {
		color: var(--color-text);
	}

	.version-history {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}

	.version-entry {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.version-entry .version-message {
		flex: 1;
		overflow-wrap: anywhere;
		color: var(--color-text-2);
	}

	.version-entry .version-compare {
		margin-left: 0;
	}

	.version-number {
		flex-shrink: 0;
		font-weight: 600;
		color: var(--color-text-3);
		text-decoration: none;
	}

	.version-number.is-current {
		color: var(--color-text);
		background: var(--color-marigold);
		padding: 0 5px;
		border-radius: 3px;
	}
</style>
