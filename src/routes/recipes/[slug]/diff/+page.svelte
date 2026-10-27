<script lang="ts">
	import { goto } from '$app/navigation';
	import VersionDiff from '#lib/components/recipes/VersionDiff.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { recipe, metaDiff, ingredientDiff, stepDiff, allVersions } = $derived(data);

	// Writable derived: the pickers can change them, and they reset to the loaded
	// range whenever the page data changes, including on back/forward.
	let fromSelect = $derived(data.fromVersion.versionNumber);
	let toSelect = $derived(data.toVersion.versionNumber);

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

		<div class="version-picker">
			{#snippet picker(id: string, label: string, value: number, set: (v: number) => void)}
				<div class="version-picker__field">
					<label class="version-picker__label" for={id}>{label}</label>
					<select
						{id}
						{value}
						onchange={(e) => {
							set(Number(e.currentTarget.value));
							navigate();
						}}>
						{#each allVersions as v (v.versionNumber)}
							<option value={v.versionNumber}>v{v.versionNumber}: {v.commitMessage}</option>
						{/each}
					</select>
				</div>
			{/snippet}
			{@render picker('from-select', 'From', fromSelect, (v) => (fromSelect = v))}
			<span class="version-picker__arrow">→</span>
			{@render picker('to-select', 'To', toSelect, (v) => (toSelect = v))}
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

		<VersionDiff {metaDiff} {ingredientDiff} {stepDiff} />
	</div>
</div>

<style>
	.version-picker {
		display: flex;
		align-items: flex-end;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.version-picker__field {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.25rem;
		/* Without this a long commit message in an <option> sets the select's
		   intrinsic width and the two fields stop being equal. */
		min-width: 0;
	}

	.version-picker__label {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-text-3);
	}

	.version-picker__arrow {
		padding-bottom: 0.5rem;
		font-size: 1.25rem;
		color: var(--color-text-3);
	}
</style>
