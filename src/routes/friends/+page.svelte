<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Username from '#lib/components/ui/Username.svelte';
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import { dayLabel } from '#lib/journal.js';
	import EmptyPanel from '#lib/components/ui/EmptyPanel.svelte';
	import ShowMore from '#lib/components/ui/ShowMore.svelte';
	import { pagedList } from '#lib/pagedList.svelte.js';
	import FeedEntry from './FeedEntry.svelte';
	import { onMount } from 'svelte';
	import { plural } from '#lib/helpers.js';
	import type { Notice } from '#lib/notifications.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	// The rows new on arrival. Accept, Decline or a Like reloads the data with
	// everything seen by then, so the band keeps what it showed.
	// svelte-ignore state_referenced_locally
	const notices = data.notices;
	const hasBand = $derived(data.requests.length > 0 || notices.length > 0);

	// Seen once the page is really shown: the loader also runs for a hover's
	// preload, which must not mark anything seen. A failure leaves the dot for
	// the next visit to clear.
	onMount(() => {
		if (!data.unseen) return;
		fetch('/notifications?/seen', {
			method: 'POST',
			body: new FormData(),
			headers: { accept: 'application/json' }
		}).catch(() => {});
	});

	const list = pagedList(
		() => data,
		(d) => ({ items: d.feed, next: d.next })
	);
	let feed = $state<HTMLElement>();

	const inviteLink = $derived(
		data.profile ? `${page.url.origin}/users/${data.profile.username}` : page.url.origin
	);
	let copied = $state(false);

	async function copyInvite() {
		// The share sheet on a phone, the clipboard elsewhere.
		if (navigator.share) {
			await navigator.share({ url: inviteLink }).catch(() => {});
			return;
		}
		await navigator.clipboard.writeText(inviteLink);
		copied = true;
	}
</script>

{#snippet who(notice: Notice)}
	{#if notice.username}<Username username={notice.username} class="hit-link" />{:else}A cook{/if}
	{#if notice.others > 0}and {plural(notice.others, 'other')}{/if}
{/snippet}

<!-- Requests until answered, then what is new since the cook last looked; no band when neither. -->
{#snippet forYou()}
	<section class="for-you" aria-labelledby="for-you-heading">
		<h2 class="eyebrow-label" id="for-you-heading">For you</h2>
		{#each data.requests as request (request.id)}
			<div class="event req">
				<Avatar username={request.username} size={36} />
				<p>
					<Username username={request.username} class="hit-link" /> wants to be friends
					<small>Sent {dayLabel(request.sentAt)}</small>
				</p>
				<div class="btns">
					<form method="POST" action="?/accept" use:enhance>
						<input type="hidden" name="userId" value={request.id} />
						<button type="submit" class="btn-ghost btn-sm">
							Accept <span class="sr-only">@{request.username}</span>
						</button>
					</form>
					<form method="POST" action="?/decline" use:enhance>
						<input type="hidden" name="userId" value={request.id} />
						<button type="submit" class="text-btn">
							Decline <span class="sr-only">@{request.username}</span>
						</button>
					</form>
				</div>
			</div>
		{/each}
		{#each notices as notice (notice.id)}
			<article class="event">
				<Avatar username={notice.username ?? '?'} size={36} />
				<p>
					{@render who(notice)}
					{#if notice.kind === 'accepted'}
						accepted your {notice.others > 0 ? 'requests' : 'request'}
					{:else if notice.kind === 'like'}
						liked your entry
						<a class="hit-link" href="/journal#entry-{notice.entry.id}">{notice.entry.dish}</a>
					{:else if notice.kind === 'save'}
						saved <a class="hit-link" href="/recipes/{notice.recipe.slug}">{notice.recipe.title}</a>
					{:else if notice.kind === 'fork'}
						forked <a class="hit-link" href="/recipes/{notice.recipe.slug}">
							{notice.recipe.title}
						</a>
						{#if notice.fork && notice.others === 0}
							as <a class="hit-link" href="/recipes/{notice.fork.slug}">{notice.fork.title}</a>
						{/if}
					{/if}
					<small>{dayLabel(notice.at)}</small>
				</p>
			</article>
		{/each}
	</section>
{/snippet}

{#snippet invite()}
	<section class="rail-sec" aria-labelledby="invite-heading">
		<h2 class="eyebrow-label" id="invite-heading">Invite a friend</h2>
		<p class="invite-line">Fork is better with the people you cook for.</p>
		<div class="link-row">
			<label class="sr-only" for="invite">Your invite link</label>
			<input id="invite" type="text" readonly value={inviteLink} />
			<button class="btn-ghost btn-sm" type="button" onclick={copyInvite}>Copy invite link</button>
		</div>
		<p class="copied" role="status">{copied ? 'Link copied' : ''}</p>
	</section>
{/snippet}

<div class="page">
	<div class="page-inner">
		<div class="page-head">
			<h1>Friends</h1>
		</div>
		<!-- Accept and Decline post here; the ⋯ menu shows its own refusals. -->
		{#if form && 'error' in form}
			<p class="form-error" role="alert">{form.error}</p>
		{/if}

		{#if data.feed.length === 0}
			<!-- A waiting request is the fastest way out of empty, so it comes first. -->
			{#if hasBand}
				<div class="empty-req">{@render forYou()}</div>
			{/if}
			<EmptyPanel title={data.friendCount === 0 ? 'No friends yet' : 'Nothing from friends yet'}>
				When friends share what they cook, it shows up here, newest first.
				{#snippet action()}
					<button class="btn-ghost empty-invite" type="button" onclick={copyInvite}>
						Invite a friend
					</button>
					<p class="copied empty-copied" role="status">
						{copied ? `Link copied: ${inviteLink}` : ''}
					</p>
				{/snippet}
			</EmptyPanel>
		{:else}
			<div class="f-layout">
				{#if hasBand}{@render forYou()}{/if}
				<div class="feed-col">
					<div class="feed" bind:this={feed}>
						{#each list.items as item (item.id)}
							{#if item.kind === 'entry'}
								<FeedEntry {item} />
							{:else}
								<article class="event">
									<Avatar username={item.username} size={36} />
									<p>
										<Username username={item.username} class="hit-link" />
										{#if item.versionNumber === 1}
											shared <a class="hit-link" href="/recipes/{item.slug}">{item.title}</a>
											{item.visibility === 'friends' ? 'with friends' : 'publicly'}
										{:else}
											changed
											<!-- The comma against the title: prettier would break the line before it. -->
											<!-- prettier-ignore -->
											<span><a class="hit-link" href="/recipes/{item.slug}">{item.title}</a>,</span>
											<a
												class="diff hit-link"
												href="/recipes/{item.slug}/diff?from={item.versionNumber -
													1}&to={item.versionNumber}">
												<span class="mono-id">v{item.versionNumber - 1}</span>
												→
												<span class="mono-id">v{item.versionNumber}</span>
											</a>
										{/if}
										<small>{dayLabel(item.at)}</small>
									</p>
								</article>
							{/if}
						{/each}
					</div>
					<ShowMore {list} container={feed} noun="update" />
				</div>
				<aside class="rail" aria-label="Invite">
					{@render invite()}
				</aside>
			</div>
		{/if}
	</div>
</div>

<style>
	/* The feed fills the container; the 280px rail beside it from 1024. */
	.f-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 280px;
		grid-template-areas: 'feed rail';
		gap: 64px;
		align-items: start;
	}

	/* For you heads the feed's column; the rail stays at the top beside both. */
	.f-layout:has(> .for-you) {
		grid-template-areas: 'band rail' 'feed rail';
		grid-template-rows: auto 1fr;
		row-gap: var(--space-6);
	}

	.f-layout > .for-you {
		grid-area: band;
	}

	.feed-col {
		grid-area: feed;
	}

	/* Lifted paper on the page's paper, a step in tone with a Rule edge. */
	.for-you {
		padding: 16px 20px 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.for-you > h2 + .event {
		border-top: 0;
	}

	.req {
		align-items: center;
	}

	.req p {
		flex: 1;
		min-width: 0;
	}

	.feed > :global(:first-child) {
		border-top: 0;
		padding-top: 0;
	}

	.event {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 18px 0;
		border-top: 1px solid var(--color-border);
	}

	.event p {
		line-height: 1.5;
		overflow-wrap: anywhere;
	}

	.event a {
		font-weight: 600;
	}

	.event small {
		display: block;
		font-size: 0.875rem;
		color: var(--color-text-3);
	}

	.rail {
		grid-area: rail;
		position: sticky;
		top: 24px;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.rail-sec {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.rail-sec > h2 {
		padding-bottom: 8px;
		border-bottom: 1px solid var(--color-border);
	}

	.rail-sec p {
		font-size: 0.9375rem;
		color: var(--color-text-2);
	}

	.btns {
		flex: none;
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.link-row {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.link-row input {
		min-width: 0;
		color: var(--color-text-2);
		text-overflow: ellipsis;
	}

	.link-row .btn-ghost {
		align-self: flex-start;
	}

	.copied:empty {
		display: none;
	}

	.empty-invite {
		min-height: 44px;
	}

	.empty-copied {
		margin: 8px 0 0;
		color: var(--color-text-2);
	}

	.empty-req {
		max-width: 560px;
		margin-bottom: var(--space-6);
	}

	/* Below 1024 the rail becomes a strip above the feed, under For you; the
	   invite drops its sentence. */
	@media (max-width: 1023px) {
		.f-layout {
			grid-template-columns: minmax(0, 1fr);
			grid-template-areas: 'rail' 'feed';
			gap: var(--space-5);
		}

		.f-layout:has(> .for-you) {
			grid-template-areas: 'band' 'rail' 'feed';
			grid-template-rows: none;
		}

		.rail {
			position: static;
			padding-bottom: var(--space-5);
			border-bottom: 1px solid var(--color-border-2);
		}

		.invite-line {
			display: none;
		}

		.link-row {
			flex-direction: row;
		}

		.link-row input {
			flex: 1;
		}
	}

	@media (max-width: 699px) {
		.for-you {
			padding-inline: 16px;
		}

		/* Accept and Decline take their own line, under the words. */
		.req {
			flex-wrap: wrap;
		}

		.req .btns {
			width: 100%;
			padding-left: 48px;
		}

		.link-row {
			flex-direction: column;
		}

		.link-row .btn-ghost {
			align-self: stretch;
		}
	}
</style>
