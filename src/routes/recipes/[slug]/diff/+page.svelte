<script lang="ts">
	import { goto } from '$app/navigation';
	import VersionDiff from '$lib/components/VersionDiff.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { recipe, ingredientDiff, stepDiff, allVersions } = $derived(data);

	let fromSelect = $state(data.fromVersion.versionNumber);
	let toSelect = $state(data.toVersion.versionNumber);

	const fromVersion = $derived(data.fromVersion);
	const toVersion = $derived(data.toVersion);

	function navigate() {
		goto(`?from=${fromSelect}&to=${toSelect}`);
	}
</script>

<div class="page">
	<div class="mx-auto max-w-[720px]">
		<div class="page-header">
			<a href="/recipes/{recipe.slug}" class="back-link">← Back to recipe</a>
			<h1 class="m-0 mb-1">Compare versions</h1>
			<p class="text-text-2 m-0 text-base">{recipe.title}</p>
		</div>

		<!-- Version selectors -->
		<div class="mb-6 flex items-end gap-4">
			<div class="flex flex-1 flex-col gap-1">
				<label
					for="from-select"
					class="text-text-3 text-[0.75rem] font-semibold tracking-[0.05em] uppercase"
				>
					From
				</label>
				<select id="from-select" bind:value={fromSelect} onchange={navigate}>
					{#each allVersions as v (v.versionNumber)}
						<option value={v.versionNumber}>v{v.versionNumber}: {v.commitMessage}</option>
					{/each}
				</select>
			</div>
			<span class="text-text-3 pb-2 text-[1.25rem]">→</span>
			<div class="flex flex-1 flex-col gap-1">
				<label
					for="to-select"
					class="text-text-3 text-[0.75rem] font-semibold tracking-[0.05em] uppercase"
				>
					To
				</label>
				<select id="to-select" bind:value={toSelect} onchange={navigate}>
					{#each allVersions as v (v.versionNumber)}
						<option value={v.versionNumber}>v{v.versionNumber}: {v.commitMessage}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Commit context -->
		<div class="border-border bg-surface-2 mb-7 flex flex-col gap-2 rounded-md border p-4">
			<div class="flex items-center gap-3 text-sm">
				<span class="text-accent font-mono text-[0.8rem] font-semibold">
					v{fromVersion.versionNumber}
				</span>
				<span>{fromVersion.commitMessage}</span>
				{#if fromVersion.creator}
					<span class="text-text-3 text-[0.8rem]">by @{fromVersion.creator.username}</span>
				{/if}
			</div>
			<div class="text-text-3 pl-3 text-sm">↓</div>
			<div class="flex items-center gap-3 text-sm">
				<span class="text-accent font-mono text-[0.8rem] font-semibold">
					v{toVersion.versionNumber}
				</span>
				<span>{toVersion.commitMessage}</span>
				{#if toVersion.creator}
					<span class="text-text-3 text-[0.8rem]">by @{toVersion.creator.username}</span>
				{/if}
			</div>
		</div>

		<VersionDiff {ingredientDiff} {stepDiff} />
	</div>
</div>
