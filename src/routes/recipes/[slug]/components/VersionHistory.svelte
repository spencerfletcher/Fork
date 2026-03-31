<script lang="ts">
	import { goto } from '$app/navigation';
	import type { RecipeVersion } from '$lib/server/db/schema';

	interface VersionWithCreator extends RecipeVersion {
		creator?: { username: string } | null;
	}

	let {
		allVersions,
		currentVersion,
		recipeSlug,
		isViewingHistory
	}: {
		allVersions: VersionWithCreator[];
		currentVersion: RecipeVersion | null;
		recipeSlug: string;
		isViewingHistory: boolean;
	} = $props();

	const VERSIONS_SHOWN = 3;
	let showAllVersions = $state(false);
	const visibleVersions = $derived(
		showAllVersions ? allVersions : allVersions.slice(0, VERSIONS_SHOWN)
	);

	function formatRelativeTime(date: Date | string | null): string {
		if (!date) return '';
		const d = new Date(date);
		const now = new Date();
		const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
		if (days === 0) return 'today';
		if (days === 1) return 'yesterday';
		if (days < 7) return `${days} days ago`;
		const weeks = Math.floor(days / 7);
		if (days < 30) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
		const months = Math.floor(days / 30);
		if (days < 365) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
		const years = Math.floor(days / 365);
		return `${years} ${years === 1 ? 'year' : 'years'} ago`;
	}
</script>

{#if allVersions.length > 0}
	<div class="sidebar-card">
		<h4 class="eyebrow-label card-label">Version History</h4>
		<div class="version-list">
			{#each visibleVersions as version (version.id)}
				{@const isCurrent = version.versionNumber === currentVersion?.versionNumber}
				<div
					class="version-row"
					class:version-current={isCurrent}
					role="link"
					tabindex="0"
					onclick={() => goto(`/recipes/${recipeSlug}?version=${version.versionNumber}`)}
					onkeydown={(e) =>
						e.key === 'Enter' && goto(`/recipes/${recipeSlug}?version=${version.versionNumber}`)}
				>
					<span class="version-dot" class:current={isCurrent}></span>
					<div class="version-info">
						<span class="version-label">v{version.versionNumber} — {version.commitMessage}</span>
						<span class="version-meta">
							@{version.creator?.username ?? 'unknown'} · {formatRelativeTime(version.createdAt)}
						</span>
						{#if version.versionNumber > 1 && !isViewingHistory}
							<a
								href="/recipes/{recipeSlug}/diff?from={version.versionNumber -
									1}&to={version.versionNumber}"
								class="version-diff-link"
								onclick={(e) => e.stopPropagation()}
							>
								Compare ↗
							</a>
						{/if}
					</div>
				</div>
			{/each}
		</div>
		{#if allVersions.length > VERSIONS_SHOWN}
			<button class="version-toggle" onclick={() => (showAllVersions = !showAllVersions)}>
				{showAllVersions
					? 'Show less'
					: `Show ${allVersions.length - VERSIONS_SHOWN} older version${allVersions.length - VERSIONS_SHOWN === 1 ? '' : 's'}`}
			</button>
		{/if}
	</div>
{/if}

<style>
	.sidebar-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border-2);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
	}

	.card-label {
		margin: 0 0 var(--space-4);
	}

	.version-list {
		display: flex;
		flex-direction: column;
	}

	.version-row {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--color-border);
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.version-row:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.version-row:hover {
		opacity: 0.8;
	}

	.version-row:hover .version-label {
		color: var(--color-accent);
	}

	.version-toggle {
		width: 100%;
		margin-top: var(--space-3);
		padding: var(--space-2) 0;
		background: none;
		border: none;
		font-family: var(--font-sans);
		font-size: 0.78rem;
		color: var(--color-text-3);
		cursor: pointer;
		text-align: left;
		transition: color 0.15s;
	}

	.version-toggle:hover {
		color: var(--color-accent);
	}

	.version-dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--color-dot-inactive);
		flex-shrink: 0;
		margin-top: 5px;
		transition: background 0.15s;
	}

	.version-dot.current {
		background: var(--color-accent);
	}

	/* version-info uses font-family on the parent to avoid repeating it per child */
	.version-info {
		font-family: var(--font-mono);
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.version-label {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color 0.15s;
	}

	.version-current .version-label {
		color: var(--color-accent);
	}

	.version-meta {
		font-size: 0.72rem;
		color: var(--color-text-3);
	}

	.version-diff-link {
		font-size: 0.7rem;
		color: var(--color-text-3);
		text-decoration: none;
		margin-top: 2px;
		display: inline-block;
	}

	.version-diff-link:hover {
		color: var(--color-accent);
	}
</style>
