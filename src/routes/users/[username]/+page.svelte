<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { profile, recipes, commitCount } = $derived(data);

	const memberSince = $derived(
		new Date(profile.createdAt ?? Date.now()).toLocaleDateString('en-US', {
			month: 'long',
			year: 'numeric'
		})
	);
</script>

<article class="profile-article">
	<!-- Hero -->
	<div class="profile-hero">
		<div class="hero-inner">
			<div class="profile-avatar">
				{profile.username[0].toUpperCase()}
			</div>
			<div class="profile-meta">
				<h1 class="profile-username">@{profile.username}</h1>
				<p class="profile-since">Member since {memberSince}</p>
				<div class="profile-stats">
					<span class="stat">
						<span class="stat-value">{recipes.length}</span>
						<span class="stat-label">{recipes.length === 1 ? 'recipe' : 'recipes'}</span>
					</span>
					<span class="stat-divider">·</span>
					<span class="stat">
						<span class="stat-value">{commitCount}</span>
						<span class="stat-label">{commitCount === 1 ? 'commit' : 'commits'}</span>
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Recipe grid -->
	<div class="content">
		<div class="content-inner">
			{#if recipes.length > 0}
				<h2 class="section-label">Recipes</h2>
				<div class="recipe-grid">
					{#each recipes as recipe (recipe.id)}
						<RecipeCard {recipe} />
					{/each}
				</div>
			{:else}
				<p class="empty-state">No public recipes yet.</p>
			{/if}
		</div>
	</div>
</article>

<style>
	.profile-article {
		min-height: 100vh;
	}

	/* ── Hero ── */
	.profile-hero {
		background: var(--color-hero-bg);
		padding: var(--space-8) var(--space-5);
	}

	.hero-inner {
		max-width: var(--max-width);
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}

	.profile-avatar {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--color-accent);
		color: var(--color-hero-bg);
		font-family: var(--font-serif);
		font-size: 2rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.profile-meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.profile-username {
		font-family: var(--font-serif);
		font-size: clamp(1.6rem, 3vw, 2.4rem);
		font-weight: 700;
		color: var(--color-text-cream);
		margin: 0;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}

	.profile-since {
		font-size: 0.85rem;
		color: var(--color-text-bronze);
		margin: 0;
	}

	.profile-stats {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-top: var(--space-1);
	}

	.stat {
		display: flex;
		align-items: baseline;
		gap: 5px;
	}

	.stat-value {
		font-family: var(--font-mono);
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-accent);
	}

	.stat-label {
		font-size: 0.82rem;
		color: var(--color-text-tan);
	}

	.stat-divider {
		color: var(--color-text-bronze);
		font-size: 0.85rem;
	}

	/* ── Content ── */
	.content {
		padding: var(--space-7) var(--space-5);
	}

	.content-inner {
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.section-label {
		font-family: var(--font-sans);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-3);
		margin: 0 0 var(--space-5);
	}

	.recipe-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-5);
	}

	.empty-state {
		color: var(--color-text-3);
		font-size: 0.95rem;
		padding: var(--space-8) 0;
	}
</style>
