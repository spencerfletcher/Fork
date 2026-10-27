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
		isViewingHistory = false
	}: {
		versions: StripVersion[];
		currentVersionNumber: number;
		recipeSlug: string;
		isViewingHistory?: boolean;
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
	<span class="version-current">v{current.versionNumber}</span>
	<span class="version-message">{current.commitMessage}</span>
	{#if canCompare}
		<a
			href="/recipes/{recipeSlug}/diff?from={current.versionNumber - 1}&to={current.versionNumber}"
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

	{#if open}
		<div id="version-history" class="version-history">
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
	/* One line at every width: the current version, its message, and two
	   links. The full history opens underneath instead of pushing the recipe
	   down, which is the problem the old scrolling strip existed to solve. */
	.version-strip {
		position: relative;
		display: flex;
		align-items: center;
		gap: 14px;
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 10px var(--space-5);
		border-top: 1px dotted var(--color-input-border);
		border-bottom: 1px dotted var(--color-input-border);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		white-space: nowrap;
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
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--color-text);
	}

	.version-compare,
	.version-toggle,
	.version-count {
		flex-shrink: 0;
		color: var(--color-text-3);
	}

	.version-compare,
	.version-toggle {
		text-decoration: underline;
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

	.version-history {
		position: absolute;
		top: 100%;
		left: var(--space-5);
		right: var(--space-5);
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
		white-space: normal;
	}

	.version-entry {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.version-entry .version-message {
		flex: 1;
		overflow: visible;
		white-space: normal;
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

	@media (max-width: 860px) {
		.version-strip {
			padding: 9px 18px;
			gap: 8px;
		}

		.version-history {
			left: 18px;
			right: 18px;
		}
	}
</style>
