<script lang="ts">
	import RecipeGrid from '#lib/components/recipes/RecipeGrid.svelte';
	import { formatDate, plural } from '#lib/helpers.js';
	import { enhance } from '$app/forms';
	import MoreMenu from '../../friends/MoreMenu.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { profile, recipes, commitCount, privateCount } = $derived(data);

	// data.user is the signed-in viewer, from the root layout.
	const isOwner = $derived(data.user?.id === profile.id);

	const memberSince = $derived(formatDate(profile.createdAt, { month: 'long', year: 'numeric' }));
</script>

<div class="page">
	<div class="page-inner">
		<header class="profile-header">
			<div class="profile-avatar" aria-hidden="true">{profile.username[0].toUpperCase()}</div>
			<div class="profile-text">
				<h1>@{profile.username}</h1>
				<!-- The body face, like the owner's line under it (mono is for
				     identifiers only, Spencer, 31 October 2026): the changes and the member date share
				     one line; the recipe count is the section eyebrow's. The dot
				     between the items is drawn by CSS, never typed. -->
				<p class="profile-stats">
					<span class="stat">{plural(commitCount, 'change')}</span>
					<span class="stat profile-since">Member since {memberSince}</span>
				</p>
				<!-- Nothing on your own profile or signed out; a blocked person reads 'none'. -->
				{#if data.relation === 'none'}
					<form class="relation" method="POST" action="/friends?/request" use:enhance>
						<input type="hidden" name="userId" value={profile.id} />
						<button type="submit" class="btn-ghost">Add friend</button>
					</form>
				{:else if data.relation === 'sent'}
					<p class="relation relation-state">Request sent</p>
				{:else if data.relation === 'received'}
					<form class="relation" method="POST" action="/friends?/accept" use:enhance>
						<input type="hidden" name="userId" value={profile.id} />
						<button type="submit" class="btn-primary">Accept request</button>
					</form>
				{:else if data.relation === 'friends'}
					<div class="relation">
						<span class="relation-state">Friends ✓</span>
						<MoreMenu
							userId={profile.id}
							username={profile.username}
							items={['unfriend', 'block']}
							label="More for @{profile.username}" />
					</div>
				{:else if data.relation === 'blocked'}
					<form class="relation" method="POST" action="/friends?/unblock" use:enhance>
						<input type="hidden" name="userId" value={profile.id} />
						<button type="submit" class="btn-ghost">Unblock</button>
					</form>
				{/if}
				{#if privateCount > 0}
					<!-- A way on for the owner: the Cookbook lists the private ones too. -->
					<p class="profile-private">
						<a href="/cookbook">
							You also have {plural(privateCount, 'private recipe')}
						</a>
					</p>
				{/if}
			</div>
		</header>

		{#if recipes.length > 0}
			<RecipeGrid {recipes} />
		{:else}
			<p class="empty-state">No public recipes yet.</p>
		{/if}

		<!-- The page's one action, for its owner only. -->
		{#if isOwner}
			<p class="profile-new"><a href="/recipes/new" class="arrow-link">New recipe →</a></p>
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
		/* Inside the fixed size; shows only under forced colours, where the tint
		   goes and the border keeps the circle. */
		border: 1px solid transparent;
		background: var(--color-tint);
		color: var(--color-accent);
		font-family: var(--font-serif);
		font-size: 1.75rem;
		font-weight: 500;
	}

	.profile-stats {
		display: flex;
		flex-wrap: wrap;
		margin: 0;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-3);
	}

	.stat + .stat::before {
		content: '·';
		margin: 0 6px;
	}

	/* The owner's one line, the stats line's size and colour. */
	.profile-private {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-3);
	}

	.profile-new {
		margin: var(--space-4) 0 0;
	}

	.relation {
		display: flex;
		align-items: center;
		gap: 16px;
		margin: 8px 0 0;
	}

	.relation button {
		min-height: 44px;
	}

	.relation-state {
		font-weight: 600;
		color: var(--color-text-2);
	}

	/* From 768 the bar shows + New recipe, so this line would repeat it. */
	@media (min-width: 768px) {
		.profile-new {
			display: none;
		}
	}

	@media (max-width: 699px) {
		.profile-header {
			gap: 14px;
		}

		.profile-avatar {
			width: 56px;
			height: 56px;
			font-size: 1.375rem;
		}
	}
</style>
