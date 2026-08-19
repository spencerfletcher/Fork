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

		<!-- Commit context: same .commit-bar the landing page uses for its sample
		     diff, stacked because this view shows both endpoints of the range. -->
		<div class="commit-bar commit-bar--stacked">
			<div class="commit-bar__line">
				<span class="commit-bar__versions">v{fromVersion.versionNumber}</span>
				<span>{fromVersion.commitMessage}</span>
				{#if fromVersion.creator}
					<span class="commit-bar__author">by @{fromVersion.creator.username}</span>
				{/if}
			</div>
			<div class="commit-bar__arrow">↓</div>
			<div class="commit-bar__line">
				<span class="commit-bar__versions">v{toVersion.versionNumber}</span>
				<span>{toVersion.commitMessage}</span>
				{#if toVersion.creator}
					<span class="commit-bar__author">by @{toVersion.creator.username}</span>
				{/if}
			</div>
		</div>

		<VersionDiff {ingredientDiff} {stepDiff} />
	</div>
</div>
