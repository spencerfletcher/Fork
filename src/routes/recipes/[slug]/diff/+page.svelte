<script lang="ts">
	import { goto } from '$app/navigation';
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

		<!-- Ingredients diff -->
		<section class="mb-7">
			<h3 class="eyebrow-label mb-3">Ingredients</h3>
			<div class="border-border overflow-hidden rounded-md border font-mono text-sm">
				{#each ingredientDiff as row, i (i)}
					{#if row.status === 'added' || row.status === 'removed' || row.status === 'unchanged'}
						<div
							class="border-border flex items-baseline gap-3 border-b px-4 py-2 [&:last-child]:border-b-0"
							class:diff-added={row.status === 'added'}
							class:text-add={row.status === 'added'}
							class:diff-removed={row.status === 'removed'}
							class:bg-remove-bg={row.status === 'removed'}
							class:text-remove={row.status === 'removed'}
							class:line-through={row.status === 'removed'}
							class:opacity-85={row.status === 'removed'}
							class:diff-unchanged={row.status === 'unchanged'}
							class:text-text-2={row.status === 'unchanged'}
						>
							<span class="w-[1ch] shrink-0 font-bold select-none">
								{#if row.status === 'added'}+{:else if row.status === 'removed'}−{:else}&nbsp;{/if}
							</span>
							<span class="diff-content flex-1 leading-[1.5]">
								{row.ingredient.amount}
								{row.ingredient.unit}
								{row.ingredient.name}
							</span>
						</div>
					{:else}
						<div
							class="border-border diff-modified text-text-2 flex items-baseline gap-3 border-b px-4 py-2 [&:last-child]:border-b-0"
						>
							<span class="text-text-3 w-[1ch] shrink-0 font-bold select-none">~</span>
							<span class="diff-content flex-1 leading-[1.5]">
								{#each row.segments as seg}
									{#if seg.type === 'added'}<span class="diff-added text-add">{seg.text}</span>
									{:else if seg.type === 'removed'}
										<span class="diff-removed bg-remove-bg text-remove line-through">
											{seg.text}
										</span>
									{:else}
										{seg.text}
									{/if}
									<span> </span>
								{/each}
							</span>
						</div>
					{/if}
				{/each}
				{#if ingredientDiff.length === 0}
					<p class="text-text-3 m-0 p-4 text-center text-sm">No changes</p>
				{/if}
			</div>
		</section>

		<!-- Steps diff -->
		<section class="mb-7">
			<h3 class="eyebrow-label mb-3">Steps</h3>
			<div class="border-border overflow-hidden rounded-md border font-mono text-sm">
				{#each stepDiff as row, i (i)}
					{#if row.status === 'added' || row.status === 'removed' || row.status === 'unchanged'}
						<div
							class="border-border flex items-baseline gap-3 border-b px-4 py-2 [&:last-child]:border-b-0"
							class:diff-added={row.status === 'added'}
							class:text-add={row.status === 'added'}
							class:diff-removed={row.status === 'removed'}
							class:bg-remove-bg={row.status === 'removed'}
							class:text-remove={row.status === 'removed'}
							class:line-through={row.status === 'removed'}
							class:opacity-85={row.status === 'removed'}
							class:diff-unchanged={row.status === 'unchanged'}
							class:text-text-2={row.status === 'unchanged'}
						>
							<span class="w-[1ch] shrink-0 font-bold select-none">
								{#if row.status === 'added'}+{:else if row.status === 'removed'}−{:else}&nbsp;{/if}
							</span>
							{#if row.status !== 'removed'}
								<span
									class="step-num bg-accent inline-flex size-[22px] shrink-0 items-center justify-center rounded-full font-sans text-[0.7rem] font-semibold text-[#fdfaf4]"
								>
									{row.step.step}
								</span>
							{/if}
							<span class="diff-content flex-1 leading-[1.5]">{row.step.text}</span>
						</div>
					{:else}
						<div
							class="border-border diff-modified text-text-2 flex items-baseline gap-3 border-b px-4 py-2 [&:last-child]:border-b-0"
						>
							<span class="text-text-3 w-[1ch] shrink-0 font-bold select-none">~</span>
							<span
								class="step-num bg-accent inline-flex size-[22px] shrink-0 items-center justify-center rounded-full font-sans text-[0.7rem] font-semibold text-[#fdfaf4]"
							>
								{row.stepNumber}
							</span>
							<span class="diff-content flex-1 leading-[1.5]">
								{#each row.segments as seg}
									{#if seg.type === 'added'}
										<span class="diff-added text-add">
											{seg.text}
										</span>
									{:else if seg.type === 'removed'}
										<span class="diff-removed bg-remove-bg text-remove line-through">
											{seg.text}
										</span>
									{:else}
										{seg.text}
									{/if}
								{/each}</span
							>
						</div>
					{/if}
				{/each}
				{#if stepDiff.length === 0}
					<p class="text-text-3 m-0 p-4 text-center text-sm">No changes</p>
				{/if}
			</div>
		</section>
	</div>
</div>
