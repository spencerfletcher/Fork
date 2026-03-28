<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Dialog } from 'bits-ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { recipe, currentVersion, allVersions, isViewingHistory, forkCount } = $derived(data);

	const VERSIONS_SHOWN = 3;
	let showAllVersions = $state(false);
	const visibleVersions = $derived(
		showAllVersions ? allVersions : allVersions.slice(0, VERSIONS_SHOWN)
	);
	const user = $derived(data.user);

	const tags = $derived(recipe.recipesToTags?.map((r) => r.tag) ?? []);
	const isOwner = $derived(user?.id === recipe.authorId);
	const canFork = $derived(!!user && !isOwner && !isViewingHistory);
	const canFavorite = $derived(!!user && !isViewingHistory);

	let isFavorited = $state(data.isFavorited);
	let forkDialogOpen = $state(false);
	let forkCommitMessage = $state('');

	function formatTime(minutes: number): string {
		if (minutes < 60) return `${minutes} min`;
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	}

	function formatRelativeTime(date: Date | string | null): string {
		if (!date) return '';
		const d = new Date(date);
		const now = new Date();
		const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
		if (days === 0) return 'today';
		if (days === 1) return 'yesterday';
		if (days < 7) return `${days} days ago`;
		if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
		if (days < 365) return `${Math.floor(days / 30)} months ago`;
		return `${Math.floor(days / 365)} years ago`;
	}

	function zeroPad(n: number): string {
		return String(n).padStart(2, '0');
	}

	const totalMinutes = $derived(
		(recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0)
	);
</script>

<article class="recipe-article">

	<!-- ── Dark hero header ───────────────────────────────────────────── -->
	<header class="recipe-hero">
		<div class="hero-inner">

			{#if isViewingHistory && currentVersion}
				<div class="history-banner">
					Viewing v{currentVersion.versionNumber}: "{currentVersion.commitMessage}"
					<a href="/recipes/{recipe.slug}">Current version →</a>
				</div>
			{/if}

			<!-- Breadcrumb -->
			<nav class="breadcrumb" aria-label="Recipe location">
				{#if recipe.author}
					<a href="/users/{recipe.author.username}" class="breadcrumb-user">@{recipe.author.username}</a>
					<span class="breadcrumb-sep">/</span>
				{/if}
				<span class="breadcrumb-slug">{recipe.slug}</span>
			</nav>

			<!-- Fork attribution -->
			{#if recipe.parent}
				<p class="fork-credit">
					Forked from
					<a href="/recipes/{recipe.parent.slug}">{recipe.parent.title}</a>
					{#if recipe.parent.author}by @{recipe.parent.author.username}{/if}
				</p>
			{/if}

			<!-- Title -->
			<h1 class="recipe-title">{recipe.title}</h1>

			<!-- Badges row -->
			<div class="hero-badges">
				{#each tags as tag (tag.id)}
					<a href="/tags/{tag.slug}" class="badge-tag">{tag.name}</a>
				{/each}
				{#if totalMinutes > 0}
					<span class="badge-time">{formatTime(totalMinutes)}</span>
				{/if}
				{#if recipe.servings}
					<span class="hero-meta-text">Serves {recipe.servings}</span>
				{/if}
				{#if recipe.author}
					<span class="hero-meta-sep">·</span>
					<span class="hero-meta-text">{recipe.author.username}</span>
				{/if}
			</div>

			<!-- Commit bar -->
			{#if currentVersion}
				<div class="commit-bar">
					<div class="commit-left">
						<span class="commit-version">v{currentVersion.versionNumber}</span>
						<span class="commit-dot">·</span>
						<span class="commit-message">"{currentVersion.commitMessage}"</span>
					</div>
					{#if forkCount > 0}
						<span class="commit-forks">↓ {forkCount} fork{forkCount !== 1 ? 's' : ''}</span>
					{/if}
				</div>
			{/if}
		</div>
	</header>

	<!-- ── Two-column content ─────────────────────────────────────────── -->
	<div class="content-layout">

		<!-- Left: ingredients + method -->
		<div class="content-main">
			{#if currentVersion}
				<!-- Ingredients -->
				<section class="recipe-section">
					<h4 class="section-label">Ingredients</h4>
					<ul class="ingredient-list">
						{#each currentVersion.ingredients as ingredient (ingredient.name)}
							<li class="ingredient-row">
								<span class="ingredient-qty">{ingredient.amount}{ingredient.unit ? ' ' + ingredient.unit : ''}</span>
								<span class="ingredient-name">{ingredient.name}</span>
							</li>
						{/each}
					</ul>
				</section>

				<!-- Method -->
				<section class="recipe-section">
					<h4 class="section-label">Method</h4>
					<ol class="step-list">
						{#each currentVersion.steps as step (step.step)}
							<li class="step-item">
								<span class="step-number">{zeroPad(step.step)}</span>
								<div class="step-content">
									<p class="step-text">{step.text}</p>
									{#if step.annotation}
										<p class="step-annotation annotation-{step.annotation.type}">
											{step.annotation.text}
										</p>
									{/if}
								</div>
							</li>
						{/each}
					</ol>
				</section>
			{:else}
				<p class="empty-content">
					No recipe content yet.
					{#if isOwner}<a href="/recipes/{recipe.slug}/edit">Add content →</a>{/if}
				</p>
			{/if}
		</div>

		<!-- Right: sticky sidebar -->
		<aside class="content-sidebar">
			<div class="sidebar-sticky">

				<!-- Details card -->
				{#if recipe.prepTimeMinutes || recipe.cookTimeMinutes || recipe.servings}
					<div class="sidebar-card">
						<h4 class="card-label">Details</h4>
						<div class="details-grid">
							{#if recipe.prepTimeMinutes}
								<div class="detail-tile">
									<span class="detail-label">Prep</span>
									<span class="detail-value">{formatTime(recipe.prepTimeMinutes)}</span>
								</div>
							{/if}
							{#if recipe.cookTimeMinutes}
								<div class="detail-tile">
									<span class="detail-label">Cook</span>
									<span class="detail-value">{formatTime(recipe.cookTimeMinutes)}</span>
								</div>
							{/if}
							{#if recipe.servings}
								<div class="detail-tile">
									<span class="detail-label">Serves</span>
									<span class="detail-value">{recipe.servings}</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Actions -->
				{#if canFavorite || canFork || (isOwner && !isViewingHistory)}
					<div class="sidebar-actions">
						{#if canFavorite}
							<form
								method="POST"
								action="?/toggleFavorite"
								use:enhance={() => {
									isFavorited = !isFavorited;
									return async ({ update }) => update({ reset: false });
								}}
							>
								<button type="submit" class="action-btn" aria-label={isFavorited ? 'Unsave' : 'Save'}>
									<svg
										class="action-icon"
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
									{isFavorited ? 'Saved' : 'Save recipe'}
								</button>
							</form>
						{/if}

						{#if canFork}
							<Dialog.Root bind:open={forkDialogOpen}>
								<Dialog.Trigger class="action-btn action-btn-primary">
									Fork this recipe
								</Dialog.Trigger>
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
							<a href="/recipes/{recipe.slug}/edit" class="action-btn">Edit recipe</a>
						{/if}
					</div>
				{/if}

				<!-- Version history -->
				{#if allVersions.length > 0}
					<div class="sidebar-card">
						<h4 class="card-label">Version History</h4>
						<div class="version-list">
							{#each visibleVersions as version (version.id)}
								{@const isCurrent = version.versionNumber === currentVersion?.versionNumber}
								<div
									class="version-row"
									class:version-current={isCurrent}
									role="link"
									tabindex="0"
									onclick={() => goto(`/recipes/${recipe.slug}?version=${version.versionNumber}`)}
									onkeydown={(e) => e.key === 'Enter' && goto(`/recipes/${recipe.slug}?version=${version.versionNumber}`)}
								>
									<span class="version-dot" class:current={isCurrent}></span>
									<div class="version-info">
										<span class="version-label">
											v{version.versionNumber} — {version.commitMessage}
										</span>
										<span class="version-meta">
											{version.creator?.username ?? 'unknown'} · {formatRelativeTime(version.createdAt)}
										</span>
										{#if version.versionNumber > 1 && !isViewingHistory}
											<a
												href="/recipes/{recipe.slug}/diff?from={version.versionNumber - 1}&to={version.versionNumber}"
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
						<button
							class="version-toggle"
							onclick={() => (showAllVersions = !showAllVersions)}
						>
							{showAllVersions
								? 'Show less'
								: `Show ${allVersions.length - VERSIONS_SHOWN} older version${allVersions.length - VERSIONS_SHOWN === 1 ? '' : 's'}`}
						</button>
					{/if}
					</div>
				{/if}

			</div>
		</aside>
	</div>
</article>

<!-- Fork dialog styles -->
<style>
	/* ── Article wrapper ── */
	.recipe-article {
		min-height: 100vh;
	}

	/* ── Hero ── */
	.recipe-hero {
		background: var(--color-hero-bg);
		padding: var(--space-7) var(--space-5) var(--space-7);
	}

	.hero-inner {
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.history-banner {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text-tan);
		margin-bottom: var(--space-5);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.history-banner a {
		color: var(--color-accent);
	}

	.breadcrumb {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--color-text-bronze);
		margin-bottom: var(--space-6);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.breadcrumb-user {
		color: var(--color-text-bronze);
		text-decoration: none;
	}

	.breadcrumb-user:hover {
		color: var(--color-text-tan);
	}

	.breadcrumb-sep {
		color: var(--color-text-bronze);
		opacity: 0.5;
	}

	.breadcrumb-slug {
		color: var(--color-accent);
	}

	.fork-credit {
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 0.9rem;
		color: var(--color-text-bronze);
		margin: 0 0 var(--space-3);
	}

	.fork-credit a {
		color: var(--color-accent);
	}

	.recipe-title {
		font-family: var(--font-serif);
		font-size: clamp(2.4rem, 5vw, 4rem);
		font-weight: 700;
		color: var(--color-text-cream);
		margin: 0 0 var(--space-6);
		line-height: 1.05;
		letter-spacing: -0.02em;
	}

	/* ── Hero badges ── */
	.hero-badges {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-5);
	}

	.badge-tag {
		font-family: var(--font-sans);
		font-size: 0.78rem;
		font-weight: 600;
		background: var(--color-accent);
		color: var(--color-hero-bg);
		border-radius: var(--radius-pill);
		padding: 4px 12px;
		text-decoration: none;
		transition: opacity 0.15s;
	}

	.badge-tag:hover {
		opacity: 0.85;
	}

	.badge-time {
		font-family: var(--font-sans);
		font-size: 0.78rem;
		font-weight: 600;
		background: var(--color-paprika);
		color: var(--color-text-cream);
		border-radius: var(--radius-pill);
		padding: 4px 12px;
	}

	.hero-meta-text {
		font-size: 0.9rem;
		color: var(--color-text-bronze);
	}

	.hero-meta-sep {
		color: var(--color-text-bronze);
		opacity: 0.4;
	}

	/* ── Commit bar ── */
	.commit-bar {
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(200, 184, 144, 0.25);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}

	.commit-left {
		display: flex;
		align-items: center;
		gap: 0;
		flex-wrap: wrap;
		min-width: 0;
	}

	.commit-version {
		color: var(--color-accent);
		font-weight: 500;
	}

	.commit-dot {
		color: var(--color-text-tan);
		opacity: 0.5;
		margin: 0 var(--space-2);
	}

	.commit-message {
		color: var(--color-text-tan);
		font-style: italic;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.commit-forks {
		color: var(--color-accent);
		font-size: 0.75rem;
		flex-shrink: 0;
	}

	/* ── Two-column layout ── */
	.content-layout {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-7) var(--space-5);
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: var(--space-8);
		align-items: start; /* critical for sticky */
	}

	@media (max-width: 860px) {
		.content-layout {
			grid-template-columns: 1fr;
		}
	}

	/* ── Sticky sidebar ── */
	.sidebar-sticky {
		position: sticky;
		top: 76px; /* navbar height (60px) + gap */
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	/* ── Sidebar cards ── */
	.sidebar-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border-2);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
	}

	.card-label {
		font-family: var(--font-sans);
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-3);
		margin: 0 0 var(--space-4);
	}

	/* ── Details 2×2 grid ── */
	.details-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
	}

	.detail-tile {
		background: var(--color-surface-2);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.detail-label {
		font-family: var(--font-sans);
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-3);
	}

	.detail-value {
		font-family: var(--font-sans);
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-text);
	}

	/* ── Sidebar actions ── */
	.sidebar-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-2);
		background: var(--color-surface);
		border: 1.5px solid var(--color-border-2);
		border-radius: var(--radius-md);
		cursor: pointer;
		text-decoration: none;
		text-align: center;
		transition: border-color 0.15s, color 0.15s;
	}

	.action-btn:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	:global(.action-btn-primary) {
		background: var(--color-accent) !important;
		color: var(--color-hero-bg) !important;
		border-color: var(--color-accent) !important;
		border-radius: var(--radius-pill) !important;
		font-weight: 600 !important;
		padding: 12px 20px !important;
	}

	:global(.action-btn-primary:hover) {
		opacity: 0.88;
	}

	.action-icon {
		width: 16px;
		height: 16px;
		fill: none;
		transition: fill 0.15s;
	}

	.action-icon.filled {
		fill: var(--color-accent);
		color: var(--color-accent);
	}

	/* ── Version history ── */
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
		text-decoration: none;
		transition: opacity 0.15s;
	}

	.version-row:last-child {
		border-bottom: none;
		padding-bottom: 0;
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

	.version-row:hover {
		opacity: 0.8;
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

	.version-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.version-label {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.version-current .version-label {
		color: var(--color-accent);
	}

	.version-meta {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--color-text-3);
	}

	.version-diff-link {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--color-text-3);
		text-decoration: none;
		margin-top: 2px;
		display: inline-block;
	}

	.version-diff-link:hover {
		color: var(--color-accent);
	}

	/* ── Ingredients ── */
	.recipe-section {
		margin-bottom: var(--space-8);
	}

	.section-label {
		font-family: var(--font-sans);
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-3);
		margin: 0 0 var(--space-5);
		border-top: 2px solid var(--color-text);
		padding-top: var(--space-3);
	}

	.ingredient-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.ingredient-row {
		display: grid;
		grid-template-columns: 90px 1fr;
		gap: var(--space-3);
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--color-border);
		align-items: baseline;
	}

	.ingredient-row:last-child {
		border-bottom: none;
	}

	.ingredient-qty {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-sienna);
	}

	.ingredient-name {
		font-family: var(--font-sans);
		font-size: 1rem;
		color: var(--color-text);
	}

	/* ── Method / Steps ── */
	.step-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
	}

	.step-item {
		display: grid;
		grid-template-columns: 48px 1fr;
		gap: var(--space-5);
		align-items: flex-start;
		padding: var(--space-5) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.step-item:last-child {
		border-bottom: none;
	}

	.step-number {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--color-accent);
		line-height: 1.6;
		padding-top: 2px;
	}

	.step-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.step-text {
		font-family: var(--font-sans);
		font-size: 1rem;
		line-height: 1.75;
		color: var(--color-text);
		margin: 0;
	}

	/* ── Step annotations ── */
	.step-annotation {
		font-family: var(--font-sans);
		font-style: italic;
		font-size: 0.9rem;
		line-height: 1.6;
		margin: 0;
	}

	.annotation-tip {
		color: var(--color-text-3);
	}

	.annotation-warning {
		color: var(--color-paprika);
	}

	.annotation-substitution {
		color: var(--color-accent-mid);
	}

	.empty-content {
		color: var(--color-text-3);
		font-size: 1rem;
		padding: var(--space-7) 0;
	}

	/* ── Dialog ── */
	:global(.dialog-overlay) {
		position: fixed;
		inset: 0;
		background: rgba(26, 20, 8, 0.5);
		z-index: 100;
	}

	:global(.dialog-content) {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-surface);
		border: 1px solid var(--color-border-2);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-raised);
		padding: var(--space-6);
		width: min(480px, calc(100vw - 48px));
		z-index: 101;
	}

	:global(.dialog-title) {
		font-family: var(--font-serif);
		font-size: 1.4rem;
		font-weight: 600;
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
