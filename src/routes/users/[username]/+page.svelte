<script lang="ts">
	import RecipeGrid from '#lib/components/recipes/RecipeGrid.svelte';
	import { formatDate, plural } from '#lib/helpers.js';
	import { enhance } from '$app/forms';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import { BLOCK_SENTENCE } from '#lib/journal.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { profile, recipes, commitCount } = $derived(data);

	// data.user is the signed-in viewer, from the root layout.
	const isOwner = $derived(data.user?.id === profile.id);

	const memberSince = $derived(formatDate(profile.createdAt, { month: 'long', year: 'numeric' }));

	// Friends ✓ and Block each open a step in place, as Delete recipe does;
	// only the step's button posts. While one is open the other steps aside.
	let unfriending = $state(false);
	let blocking = $state(false);
	// These forms post to /friends, so a refusal (a lapsed session) is shown
	// here, under them; a refused step stays open.
	const relating = pendingEnhance({
		keepFailure: true,
		done: () => (unfriending = blocking = false)
	});
</script>

<div class="page">
	<div class="page-inner">
		<header class="profile-header">
			<Avatar username={profile.username} size={72} responsive />
			<div class="profile-text">
				<h1>@{profile.username}</h1>
				<!-- The body face, like the owner's line under it (mono is for
				     identifiers only, Spencer, 31 October 2026): the changes and the member date share
				     one line; the recipe count is the section eyebrow's. The dot
				     between the items is drawn by CSS, never typed. -->
				<p class="profile-stats dot-list">
					<span class="stat">{plural(commitCount, 'change')}</span>
					<span class="stat profile-since">Member since {memberSince}</span>
				</p>
				<!-- Nothing on your own profile or signed out; a blocked person reads 'none'. -->
				{#if data.relation === 'none'}
					<form
						class="relation"
						method="POST"
						action="/friends?/request"
						use:enhance={relating.submit}>
						<input type="hidden" name="userId" value={profile.id} />
						<button type="submit" class="btn-ghost">Add friend</button>
					</form>
				{:else if data.relation === 'sent'}
					<p class="relation relation-state">Request sent</p>
				{:else if data.relation === 'received'}
					<form
						class="relation"
						method="POST"
						action="/friends?/accept"
						use:enhance={relating.submit}>
						<input type="hidden" name="userId" value={profile.id} />
						<button type="submit" class="btn-primary">Accept request</button>
					</form>
				{:else if data.relation === 'friends'}
					<div class="relation">
						{#snippet userId()}<input type="hidden" name="userId" value={profile.id} />{/snippet}
						{#if !blocking}
							<ConfirmStep
								bind:open={unfriending}
								trigger="Friends ✓"
								triggerClass="text-btn text-btn--ink"
								explanation="Remove @{profile.username} as a friend?"
								confirmLabel="Remove"
								keepLabel="Cancel"
								action="/friends?/unfriend"
								enhance={relating.submit}
								fields={userId} />
						{/if}
						{#if !unfriending}
							<ConfirmStep
								bind:open={blocking}
								trigger="Block"
								triggerClass="btn-ghost danger-hover"
								explanation={BLOCK_SENTENCE}
								confirmLabel="Block"
								keepLabel="Cancel"
								action="/friends?/block"
								enhance={relating.submit}
								fields={userId} />
						{/if}
					</div>
				{:else if data.relation === 'blocked'}
					<form
						class="relation"
						method="POST"
						action="/friends?/unblock"
						use:enhance={relating.submit}>
						<input type="hidden" name="userId" value={profile.id} />
						<button type="submit" class="btn-ghost">Unblock</button>
					</form>
				{/if}
				{#if relating.error}
					<p class="form-error relation-error" role="alert">{relating.error}</p>
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
		overflow-wrap: anywhere;
	}

	.profile-stats {
		display: flex;
		flex-wrap: wrap;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-3);
	}

	.profile-stats {
		--dot-space: 0 6px;
	}

	.profile-new {
		margin: var(--space-4) 0 0;
	}

	.relation {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
		margin: 8px 0 0;
	}

	.relation button:not(.text-btn) {
		min-height: 44px;
	}

	.relation-error {
		margin: 8px 0 0;
	}

	.relation-state {
		font-weight: 600;
		color: var(--color-text-2);
	}

	/* Friends ✓: the stats line's type in ink, no box. :global, because the
	   button is ConfirmStep's. */
	.relation :global(.text-btn) {
		font-size: 0.875rem;
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
	}
</style>
