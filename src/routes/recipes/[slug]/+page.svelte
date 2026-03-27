<script lang="ts">
	import { enhance } from '$app/forms';
	import { Dialog } from 'bits-ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { recipe, currentVersion, allVersions, isViewingHistory } = $derived(data);
	const user = $derived(data.user);

	const tags = $derived(recipe.recipesToTags?.map((r) => r.tag) ?? []);
	const isOwner = $derived(user?.id === recipe.authorId);
	const canFork = $derived(!!user && !isOwner && !isViewingHistory);
	const canFavorite = $derived(!!user && !isViewingHistory);

	let isFavorited = $state(data.isFavorited);

	let forkDialogOpen = $state(false);
	let forkCommitMessage = $state('');

	function formatDate(date: Date | string | null) {
		if (!date) return '';
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<article>
	<!-- Hero image -->
	{#if recipe.imageUrl}
		<div class="hero-image">
			<img src={recipe.imageUrl} alt={recipe.title} />
		</div>
	{/if}

	<div class="content-column">
		<!-- Viewing history banner -->
		{#if isViewingHistory && currentVersion}
			<div class="history-banner">
				Viewing v{currentVersion.versionNumber}: "{currentVersion.commitMessage}"
				<a href="/recipes/{recipe.slug}">View current version →</a>
			</div>
		{/if}

		<!-- Fork attribution -->
		{#if recipe.parent}
			<p class="fork-attribution">
				Forked from <a href="/recipes/{recipe.parent.slug}">{recipe.parent.title}</a>
				{#if recipe.parent.author}by @{recipe.parent.author.username}{/if}
			</p>
		{/if}

		<!-- Title + byline -->
		<h1>{recipe.title}</h1>

		{#if recipe.author}
			<p class="byline">by @{recipe.author.username} · {formatDate(recipe.createdAt)}</p>
		{/if}

		<!-- Tags -->
		{#if tags.length > 0}
			<div class="tags-row">
				{#each tags as tag}
					<a href="/tags/{tag.slug}" class="tag">{tag.name}</a>
				{/each}
			</div>
		{/if}

		<!-- Metadata row -->
		<div class="meta-row">
			{#if recipe.prepTimeMinutes}
				<span>Prep {recipe.prepTimeMinutes} min</span>
			{/if}
			{#if recipe.prepTimeMinutes && recipe.cookTimeMinutes}
				<span class="meta-sep">|</span>
			{/if}
			{#if recipe.cookTimeMinutes}
				<span>Cook {recipe.cookTimeMinutes} min</span>
			{/if}
			{#if (recipe.prepTimeMinutes || recipe.cookTimeMinutes) && recipe.servings}
				<span class="meta-sep">|</span>
			{/if}
			{#if recipe.servings}
				<span>Serves {recipe.servings}</span>
			{/if}
		</div>

		<!-- Actions -->
		<div class="actions-row">
			{#if canFavorite}
				<form
					method="POST"
					action="?/toggleFavorite"
					use:enhance={() => {
						isFavorited = !isFavorited;
						return async ({ update }) => update({ reset: false });
					}}
				>
					<button
						type="submit"
						class="btn-ghost favorite-btn"
						aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
					>
						<svg
							class="heart-icon"
							class:filled={isFavorited}
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							stroke-width="1.8"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
							/>
						</svg>
						{isFavorited ? 'Saved' : 'Save'}
					</button>
				</form>
			{/if}

			{#if canFork}
				<Dialog.Root bind:open={forkDialogOpen}>
					<Dialog.Trigger class="btn-primary">Fork this recipe</Dialog.Trigger>
					<Dialog.Portal>
						<Dialog.Overlay class="dialog-overlay" />
						<Dialog.Content class="dialog-content">
							<Dialog.Title class="dialog-title">Fork this recipe?</Dialog.Title>
							<Dialog.Description class="dialog-desc">
								A copy will be added to your recipes. You can edit it independently.
							</Dialog.Description>
							<form
								method="POST"
								action="?/fork"
								use:enhance={() => {
									return async ({ result, update }) => {
										if (result.type === 'redirect') {
											window.location.href = result.location;
										} else {
											await update();
										}
										forkDialogOpen = false;
									};
								}}
							>
								<div class="dialog-field">
									<label for="fork-commit" class="dialog-label">Initial commit message</label>
									<input
										id="fork-commit"
										name="commitMessage"
										type="text"
										placeholder="Forked from {recipe.title}"
										bind:value={forkCommitMessage}
									/>
								</div>
								<div class="dialog-actions">
									<Dialog.Close class="btn-ghost">Cancel</Dialog.Close>
									<button type="submit" class="btn-primary">Fork</button>
								</div>
							</form>
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
			{/if}

			{#if isOwner && !isViewingHistory}
				<a href="/recipes/{recipe.slug}/edit" class="btn-ghost">Edit recipe</a>
			{/if}
		</div>

		<hr class="divider" />

		{#if currentVersion}
			<!-- Two-column recipe body: ingredients | steps -->
			<div class="recipe-body">
				<section class="ingredients-section">
					<h4 class="section-heading">Ingredients</h4>
					<ul class="ingredient-list">
						{#each currentVersion.ingredients as ingredient}
							<li class="ingredient-item">
								{ingredient.amount}
								{ingredient.unit}
								{ingredient.name}
							</li>
						{/each}
					</ul>
				</section>

				<section class="steps-section">
					<h4 class="section-heading">Steps</h4>
					<ol class="step-list">
						{#each currentVersion.steps as step}
							<li class="step-item">
								<span class="step-number">{step.step}</span>
								<p class="step-text">{step.text}</p>
							</li>
						{/each}
					</ol>
				</section>
			</div>
		{:else}
			<p style="color: var(--color-text-3);">
				No recipe content yet. <a href="/recipes/{recipe.slug}/edit">Add content →</a>
			</p>
		{/if}

		<!-- Version history -->
		{#if allVersions.length > 0}
			<section class="recipe-section">
				<details class="version-history">
					<summary>
						<span class="version-history-label">Version History</span>
						<span class="version-count"
							>{allVersions.length} version{allVersions.length !== 1 ? 's' : ''}</span
						>
					</summary>
					<div class="version-list">
						{#each allVersions as version}
							<div class="version-row">
								<div class="version-info">
									<div class="version-main">
										<span class="version-num">v{version.versionNumber}</span>
										<span class="version-msg">{version.commitMessage}</span>
									</div>
									<div class="version-sub">
										<span class="version-date">{formatDate(version.createdAt)}</span>
										{#if version.creator}
											<span class="version-author">@{version.creator.username}</span>
										{/if}
									</div>
								</div>
								<div class="version-actions">
									<a
										href="/recipes/{recipe.slug}?version={version.versionNumber}"
										class="btn-ghost-sm">View</a
									>
									{#if version.versionNumber > 1}
										<a
											href="/recipes/{recipe.slug}/diff?from={version.versionNumber -
												1}&to={version.versionNumber}"
											class="btn-ghost-sm">Compare</a
										>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</details>
			</section>
		{/if}
	</div>
</article>

<style>
	.hero-image {
		width: 100%;
		max-height: 480px;
		overflow: hidden;
	}

	.hero-image img {
		width: 100%;
		height: 100%;
		max-height: 480px;
		object-fit: cover;
		object-position: center;
		display: block;
	}

	.content-column {
		max-width: 960px;
		margin: 0 auto;
		padding: var(--space-7) var(--space-6);
	}

	.history-banner {
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		font-size: 0.875rem;
		color: var(--color-text-2);
		margin-bottom: var(--space-5);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.fork-attribution {
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 1rem;
		color: var(--color-text-2);
		margin: 0 0 var(--space-2);
	}

	h1 {
		margin: var(--space-2) 0 var(--space-2);
	}

	.byline {
		font-size: 0.9rem;
		color: var(--color-text-2);
		margin: 0 0 var(--space-4);
	}

	.tags-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
		font-size: 0.9rem;
		color: var(--color-text-2);
		margin-bottom: var(--space-5);
	}

	.meta-sep {
		color: var(--color-border-2);
	}

	.actions-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}

	.favorite-btn {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.heart-icon {
		width: 18px;
		height: 18px;
		fill: none;
		transition:
			fill 0.15s ease,
			color 0.15s ease;
	}

	.heart-icon.filled {
		fill: var(--color-accent);
		color: var(--color-accent);
	}

	.divider {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: var(--space-5) 0;
	}

	.recipe-section {
		margin-bottom: var(--space-7);
	}

	/* Two-column grid: ingredients left, steps right */
	.recipe-body {
		display: grid;
		grid-template-columns: 5fr 7fr;
		gap: var(--space-8);
		margin-bottom: var(--space-7);
		align-items: start;
	}

	@media (max-width: 680px) {
		.recipe-body {
			grid-template-columns: 1fr;
			gap: var(--space-6);
		}
	}

	.section-heading {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-3);
		margin: 0 0 var(--space-4);
		border-top: 2px solid var(--color-text);
		padding-top: var(--space-3);
	}

	/* Ingredients: plain list, NYT-style */
	.ingredient-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.ingredient-item {
		font-size: 1rem;
		line-height: 1.5;
		color: var(--color-text);
		padding: var(--space-2) 0;
	}

	/* Steps */
	.step-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.step-item {
		display: flex;
		gap: var(--space-4);
		align-items: flex-start;
	}

	.step-number {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		background: var(--color-accent);
		color: #fdfaf4;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-sans);
		font-weight: 600;
		font-size: 0.85rem;
	}

	.step-text {
		margin: 0;
		line-height: 1.7;
		padding-top: 4px;
	}

	/* Version history */
	.version-history {
		border-left: 3px solid var(--color-accent-pale);
		padding-left: var(--space-4);
	}

	.version-history summary {
		cursor: pointer;
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		padding: var(--space-3) 0;
		user-select: none;
		list-style: none;
	}

	/* Hide the default disclosure triangle in all browsers */
	.version-history summary::-webkit-details-marker {
		display: none;
	}
	.version-history summary::marker {
		display: none;
	}

	.version-history-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-2);
		font-family: var(--font-sans);
	}

	.version-count {
		font-size: 0.8rem;
		color: var(--color-text-3);
		font-family: var(--font-sans);
	}

	.version-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding-top: var(--space-3);
	}

	.version-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		/* No flex-wrap — actions always stay pinned to the right */
		gap: var(--space-4);
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.version-row:last-child {
		border-bottom: none;
	}

	.version-info {
		flex: 1;
		min-width: 0; /* lets long text wrap instead of pushing actions off */
	}

	.version-main {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		font-size: 0.875rem;
	}

	.version-sub {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-1);
		font-size: 0.8rem;
	}

	.version-num {
		font-family: var(--font-sans);
		font-weight: 600;
		color: var(--color-accent);
		flex-shrink: 0;
	}

	.version-msg {
		color: var(--color-text);
	}

	.version-date {
		color: var(--color-text-3);
	}

	.version-author {
		color: var(--color-text-3);
		font-style: italic;
	}

	.version-actions {
		display: flex;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	/* Dialog styles */
	:global(.dialog-overlay) {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 100;
	}

	:global(.dialog-content) {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-raised);
		padding: var(--space-6);
		width: min(480px, calc(100vw - 48px));
		z-index: 101;
	}

	:global(.dialog-title) {
		font-family: var(--font-serif);
		font-size: 1.4rem;
		font-weight: 400;
		color: var(--color-text);
		margin: 0 0 var(--space-3);
	}

	:global(.dialog-desc) {
		font-size: 0.9rem;
		color: var(--color-text-2);
		margin: 0 0 var(--space-5);
		line-height: 1.6;
	}

	.dialog-field {
		margin-bottom: var(--space-5);
	}

	.dialog-label {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text-2);
		margin-bottom: var(--space-2);
	}

	:global(.dialog-actions) {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
	}
</style>
