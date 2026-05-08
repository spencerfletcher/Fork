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
	<div class="rounded-lg border border-border-2 bg-surface p-5">
		<h4 class="eyebrow-label m-0 mb-4">Version History</h4>
		<div class="flex flex-col">
			{#each visibleVersions as version (version.id)}
				{@const isCurrent = version.versionNumber === currentVersion?.versionNumber}
				<div
					class="group flex cursor-pointer gap-3 items-start border-b border-border py-3 transition-opacity duration-150 [&:last-child]:border-b-0 [&:last-child]:pb-0 hover:opacity-80"
					role="link"
					tabindex="0"
					onclick={() => goto(`/recipes/${recipeSlug}?version=${version.versionNumber}`)}
					onkeydown={(e) =>
						e.key === 'Enter' && goto(`/recipes/${recipeSlug}?version=${version.versionNumber}`)}
				>
					<span
						class="mt-[5px] size-[9px] shrink-0 rounded-full transition-[background] duration-150"
						class:bg-accent={isCurrent}
						class:bg-dot-inactive={!isCurrent}
					></span>
					<div class="flex min-w-0 flex-col gap-[2px] font-mono">
						<span
							class="overflow-hidden text-ellipsis whitespace-nowrap text-[0.8rem] font-medium transition-colors duration-150 group-hover:text-accent"
							class:text-accent={isCurrent}
							class:text-text={!isCurrent}
						>
							v{version.versionNumber} — {version.commitMessage}
						</span>
						<span class="text-[0.72rem] text-text-3">
							@{version.creator?.username ?? 'unknown'} · {formatRelativeTime(version.createdAt)}
						</span>
						{#if version.versionNumber > 1 && !isViewingHistory}
							<a
								href="/recipes/{recipeSlug}/diff?from={version.versionNumber -
									1}&to={version.versionNumber}"
								class="mt-[2px] inline-block text-[0.7rem] text-text-3 no-underline hover:text-accent"
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
			<button
				class="mt-3 w-full cursor-pointer border-none bg-transparent py-2 text-left font-sans text-[0.78rem] text-text-3 transition-colors duration-150 hover:text-accent"
				onclick={() => (showAllVersions = !showAllVersions)}
			>
				{showAllVersions
					? 'Show less'
					: `Show ${allVersions.length - VERSIONS_SHOWN} older version${allVersions.length - VERSIONS_SHOWN === 1 ? '' : 's'}`}
			</button>
		{/if}
	</div>
{/if}
