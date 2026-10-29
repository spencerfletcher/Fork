<script lang="ts">
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { profile, recipes, commitCount, privateCount } = $derived(data);

	const memberSince = $derived(
		new Date(profile.createdAt ?? Date.now()).toLocaleDateString('en-US', {
			month: 'long',
			year: 'numeric'
		})
	);
</script>

<div class="page">
	<div class="page-inner">
		<header class="profile-header">
			<div class="profile-avatar" aria-hidden="true">{profile.username[0].toUpperCase()}</div>
			<div class="profile-text">
				<h1>@{profile.username}</h1>
				<!-- History and dates in mono: the commits and the member date share
				     one line; the recipe count is the section eyebrow's. The dot
				     between the items is drawn by CSS, never typed. -->
				<p class="profile-stats">
					<span class="stat">{commitCount} {commitCount === 1 ? 'commit' : 'commits'}</span>
					<span class="stat profile-since">Member since {memberSince}</span>
				</p>
				{#if privateCount > 0}
					<p class="profile-private">
						You also have {privateCount} private {privateCount === 1 ? 'recipe' : 'recipes'}
					</p>
				{/if}
			</div>
		</header>

		{#if recipes.length > 0}
			<section>
				<h2 class="eyebrow-label section-heading">
					{recipes.length}
					{recipes.length === 1 ? 'recipe' : 'recipes'}
				</h2>
				<div class="recipe-grid">
					{#each recipes as recipe, i (recipe.id)}
						<RecipeCard {recipe} index={i} />
					{/each}
				</div>
			</section>
		{:else}
			<p class="empty-state">No public recipes yet.</p>
		{/if}
	</div>
</div>

<style>
	.profile-header {
		display: flex;
		align-items: center;
		gap: 20px;
		margin-bottom: var(--space-5);
	}

	.profile-text {
		display: flex;
		flex-direction: column;
		gap: 4px;
		/* A long username must wrap inside the row, not widen the page. */
		min-width: 0;
	}

	.profile-text h1 {
		margin: 0;
		overflow-wrap: anywhere;
	}

	/* The no-photo panel's treatment: tint behind a clay initial. */
	.profile-avatar {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--color-tint);
		color: var(--color-accent);
		font-family: var(--font-serif);
		font-size: 2rem;
		font-weight: 500;
	}

	.profile-stats {
		display: flex;
		flex-wrap: wrap;
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-3);
	}

	.stat + .stat::before {
		content: '·';
		margin: 0 6px;
	}

	/* The owner's one line: sans, like the body, under the mono stats. */
	.profile-private {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-3);
	}

	@media (max-width: 699px) {
		.profile-header {
			gap: 14px;
		}

		.profile-avatar {
			width: 56px;
			height: 56px;
			font-size: 1.5rem;
		}
	}
</style>
