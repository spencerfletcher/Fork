<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { recipe, ingredientDiff, stepDiff, allVersions } = $derived(data);

	// Local state for the selectors — initialized once from server data.
	// Navigating via goto() will cause the server to reload with new params.
	let fromSelect = $state(data.fromVersion.versionNumber);
	let toSelect = $state(data.toVersion.versionNumber);

	// Derive display values from current data (updated after navigation)
	const fromVersion = $derived(data.fromVersion);
	const toVersion = $derived(data.toVersion);

	function navigate() {
		goto(`?from=${fromSelect}&to=${toSelect}`);
	}
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-header">
			<a href="/recipes/{recipe.slug}" class="back-link">← Back to recipe</a>
			<h1>Compare versions</h1>
			<p class="recipe-title">{recipe.title}</p>
		</div>

		<!-- Version selectors -->
		<div class="version-selectors">
			<div class="selector-group">
				<label for="from-select" class="selector-label">From</label>
				<select id="from-select" bind:value={fromSelect} onchange={navigate} class="version-select">
					{#each allVersions as v}
						<option value={v.versionNumber}>v{v.versionNumber}: {v.commitMessage}</option>
					{/each}
				</select>
			</div>
			<span class="arrow">→</span>
			<div class="selector-group">
				<label for="to-select" class="selector-label">To</label>
				<select id="to-select" bind:value={toSelect} onchange={navigate} class="version-select">
					{#each allVersions as v}
						<option value={v.versionNumber}>v{v.versionNumber}: {v.commitMessage}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Commit context -->
		<div class="commit-context">
			<div class="commit-row from">
				<span class="version-badge">v{fromVersion.versionNumber}</span>
				<span class="commit-msg">{fromVersion.commitMessage}</span>
				{#if fromVersion.creator}
					<span class="commit-author">by @{fromVersion.creator.username}</span>
				{/if}
			</div>
			<div class="commit-arrow">↓</div>
			<div class="commit-row to">
				<span class="version-badge">v{toVersion.versionNumber}</span>
				<span class="commit-msg">{toVersion.commitMessage}</span>
				{#if toVersion.creator}
					<span class="commit-author">by @{toVersion.creator.username}</span>
				{/if}
			</div>
		</div>

		<!-- Ingredients diff -->
		<section class="diff-section">
			<h3 class="diff-heading">Ingredients</h3>
			<div class="diff-list">
				{#each ingredientDiff as row}
					<div class="diff-row diff-{row.status}">
						<span class="diff-prefix">
							{#if row.status === 'added'}+{:else if row.status === 'removed'}−{:else}&nbsp;{/if}
						</span>
						<span class="diff-content">
							{row.ingredient.amount}
							{row.ingredient.unit}
							{row.ingredient.name}
						</span>
					</div>
				{/each}
				{#if ingredientDiff.length === 0}
					<p class="no-changes">No changes</p>
				{/if}
			</div>
		</section>

		<!-- Steps diff -->
		<section class="diff-section">
			<h3 class="diff-heading">Steps</h3>
			<div class="diff-list">
				{#each stepDiff as row}
					<div class="diff-row diff-{row.status}">
						<span class="diff-prefix">
							{#if row.status === 'added'}+{:else if row.status === 'removed'}−{:else}&nbsp;{/if}
						</span>
						{#if row.status !== 'removed'}
							<span class="step-num">{row.step.step}</span>
						{/if}
						<span class="diff-content">{row.step.text}</span>
					</div>
				{/each}
				{#if stepDiff.length === 0}
					<p class="no-changes">No changes</p>
				{/if}
			</div>
		</section>
	</div>
</div>

<style>
	.page {
		padding: var(--space-7) var(--space-5);
	}

	.page-inner {
		max-width: var(--content-width);
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: var(--space-6);
	}

	.back-link {
		font-size: 0.875rem;
		color: var(--color-text-3);
		display: block;
		margin-bottom: var(--space-3);
	}

	.back-link:hover {
		color: var(--color-accent);
	}

	h1 {
		margin: 0 0 var(--space-1);
	}

	.recipe-title {
		color: var(--color-text-2);
		font-size: 1rem;
		margin: 0;
	}

	.version-selectors {
		display: flex;
		align-items: flex-end;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}

	.selector-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
	}

	.selector-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-3);
	}

	.version-select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text-1);
		font-size: 0.875rem;
	}

	.arrow {
		font-size: 1.25rem;
		color: var(--color-text-3);
		padding-bottom: var(--space-2);
	}

	.commit-context {
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		margin-bottom: var(--space-7);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.commit-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		font-size: 0.875rem;
	}

	.commit-arrow {
		color: var(--color-text-3);
		padding-left: var(--space-3);
		font-size: 0.875rem;
	}

	.version-badge {
		font-weight: 600;
		color: var(--color-accent);
		font-size: 0.8rem;
		font-family: monospace;
	}

	.commit-msg {
		color: var(--color-text-1);
	}

	.commit-author {
		color: var(--color-text-3);
		font-size: 0.8rem;
	}

	.diff-section {
		margin-bottom: var(--space-7);
	}

	.diff-heading {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-3);
		margin: 0 0 var(--space-3);
	}

	.diff-list {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		font-family: monospace;
		font-size: 0.875rem;
	}

	.diff-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}

	.diff-row:last-child {
		border-bottom: none;
	}

	.diff-added {
		background: var(--color-add-bg);
		color: var(--color-add);
	}

	.diff-removed {
		background: var(--color-remove-bg);
		color: var(--color-remove);
		text-decoration: line-through;
		opacity: 0.85;
	}

	.diff-unchanged {
		color: var(--color-text-2);
	}

	.diff-prefix {
		font-weight: 700;
		width: 1ch;
		flex-shrink: 0;
		user-select: none;
	}

	.step-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		background: var(--color-accent);
		color: #fdfaf4;
		border-radius: 50%;
		font-size: 0.7rem;
		font-weight: 600;
		flex-shrink: 0;
		font-family: var(--font-sans);
	}

	.diff-removed .step-num {
		background: var(--color-remove);
	}

	.diff-content {
		flex: 1;
		line-height: 1.5;
	}

	.no-changes {
		color: var(--color-text-3);
		font-size: 0.875rem;
		padding: var(--space-4);
		text-align: center;
		margin: 0;
	}
</style>
