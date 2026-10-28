<script lang="ts">
	import { afterNavigate } from '$app/navigation';

	type StripVersion = {
		id: number;
		versionNumber: number;
		commitMessage: string;
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
</script>

<svelte:window onkeydown={onWindowKeydown} onclick={onWindowClick} />

<nav class="version-strip" aria-label="Version history" bind:this={nav}>
	<p class="version-line">
		<span class="version-current">v{current.versionNumber}</span>
		<span class="version-message">{current.commitMessage}</span>
	</p>
	<p class="version-links">
		{#if canCompare}
			<a
				href="/recipes/{recipeSlug}/diff?from={current.versionNumber -
					1}&to={current.versionNumber}"
				class="version-compare">
				Compare with v{current.versionNumber - 1}
			</a>
		{/if}
		{#if count > 1}
			<button
				type="button"
				class="version-toggle"
				bind:this={toggle}
				aria-expanded={open}
				aria-controls="version-history"
				onclick={() => (open = !open)}>
				{count} versions
			</button>
		{:else}
			<span class="version-count">1 version</span>
		{/if}
		{#if forkCount > 0}
			<span class="version-forks">{forkCount} {forkCount === 1 ? 'fork' : 'forks'}</span>
		{/if}
	</p>

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
	/* A block in the right column: the current version and its message, then
	   the links. The full history opens in place beneath them. */
	.version-strip {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px 0;
		border-top: 1px dotted var(--color-input-border);
		border-bottom: 1px dotted var(--color-input-border);
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}

	.version-line,
	.version-links {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 6px 12px;
		margin: 0;
	}

	.version-current {
		flex-shrink: 0;
		padding: 0 5px;
		border-radius: 3px;
		background: var(--color-marigold);
		color: var(--color-text);
		font-weight: 600;
	}

	.version-message {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
		color: var(--color-text);
	}

	.version-compare,
	.version-toggle {
		color: var(--color-accent);
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
	}

	.version-toggle {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
	}

	.version-compare:hover,
	.version-toggle:hover {
		color: var(--color-text);
	}

	.version-count,
	.version-forks {
		color: var(--color-text-3);
	}

	.version-history {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-top: 4px;
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.version-entry {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.version-entry .version-message {
		flex: 1;
		color: var(--color-text-2);
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
