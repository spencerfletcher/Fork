<script lang="ts">
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
</script>

<nav class="version-strip" aria-label="Version history">
	{#each versions as version (version.id)}
		{@const isCurrent = version.versionNumber === currentVersionNumber}
		<div class="version-entry" aria-label={isCurrent ? 'Current version' : undefined}>
			<a
				href="/recipes/{recipeSlug}?version={version.versionNumber}"
				class="version-number"
				class:is-current={isCurrent}
			>
				v{version.versionNumber}
			</a>
			<span class="version-message">{version.commitMessage}</span>
			{#if version.versionNumber > 1 && !isViewingHistory}
				<a
					href="/recipes/{recipeSlug}/diff?from={version.versionNumber -
						1}&to={version.versionNumber}"
					class="version-compare"
				>
					Compare
				</a>
			{/if}
		</div>
	{/each}
</nav>

<style>
	/* Scrolls rather than wraps: a wrapped history grows tall and pushes the
	   recipe down, which is the problem this component exists to solve. */
	.version-strip {
		display: flex;
		gap: var(--space-5);
		overflow-x: auto;
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-border);
		font-family: var(--font-mono);
		font-size: 0.78rem;
	}

	.version-entry {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.version-number {
		font-weight: 600;
		color: var(--color-text-3);
		text-decoration: none;
	}

	/* Version identity is one of the two jobs amber is allowed to do. */
	.version-number.is-current {
		color: var(--color-accent);
	}

	.version-message {
		color: var(--color-text-2);
		white-space: nowrap;
	}

	.version-compare {
		color: var(--color-text-3);
		text-decoration: none;
		font-size: 0.7rem;
	}

	.version-compare:hover {
		color: var(--color-accent);
	}
</style>
