<script lang="ts">
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
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

<div class="page">
	<div class="page-inner">
		<header class="profile-header">
			<div class="profile-avatar" aria-hidden="true">{profile.username[0].toUpperCase()}</div>
			<div class="profile-text">
				<h1>@{profile.username}</h1>
				<p class="profile-since">Member since {memberSince}</p>
				<p class="profile-stats">
					{recipes.length}
					{recipes.length === 1 ? 'recipe' : 'recipes'} · {commitCount}
					{commitCount === 1 ? 'commit' : 'commits'}
				</p>
			</div>
		</header>

		{#if recipes.length > 0}
			<section>
				<h2 class="eyebrow-label section-heading">
					{recipes.length}
					{recipes.length === 1 ? 'recipe' : 'recipes'}
				</h2>
				<div class="recipe-grid">
					{#each recipes as recipe (recipe.id)}
						<RecipeCard {recipe} />
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
	}

	.profile-text h1 {
		margin: 0;
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

	.profile-since {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-3);
	}

	.profile-stats {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-3);
	}

	@media (max-width: 699px) {
		.profile-avatar {
			width: 56px;
			height: 56px;
			font-size: 1.5rem;
		}
	}
</style>
