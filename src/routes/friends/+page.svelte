<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Username from '#lib/components/ui/Username.svelte';
	import { dayLabel } from '#lib/journal.js';
	import FeedEntry from './FeedEntry.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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

	const day = (date: Date) => dayLabel(date.toISOString().slice(0, 10));
</script>

{#snippet requests()}
	<section class="rail-sec" aria-labelledby="requests-heading">
		<h2 class="eyebrow-label" id="requests-heading">Requests</h2>
		{#if data.requests.length === 0}
			<p>No requests waiting.</p>
		{/if}
		{#each data.requests as request (request.id)}
			<div class="req">
				<span class="avatar avatar--sm" aria-hidden="true">
					{request.username[0].toUpperCase()}
				</span>
				<p class="nm">
					<Username username={request.username} class="hit-link" />
					<small>Sent {day(request.sentAt)}</small>
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
			{#if data.feed.length > 0}<p class="page-sub">Newest first</p>{/if}
		</div>

		{#if data.feed.length === 0}
			<!-- A waiting request is the fastest way out of empty, so it comes first. -->
			{#if data.requests.length > 0}
				<div class="empty-req">{@render requests()}</div>
			{/if}
			<section class="f-empty">
				{#if data.friendCount === 0}
					<h2>No friends yet</h2>
				{:else}
					<h2>Nothing from friends yet</h2>
				{/if}
				<p>When friends share what they cook, it shows up here, newest first.</p>
				<button class="btn-ghost" type="button" onclick={copyInvite}>Invite a friend</button>
				<p class="copied" role="status">{copied ? `Link copied: ${inviteLink}` : ''}</p>
			</section>
		{:else}
			<div class="f-layout">
				<div class="feed">
					{#each data.feed as item (`${item.kind}-${item.kind === 'entry' ? item.entry.id : item.id}`)}
						{#if item.kind === 'entry'}
							<FeedEntry {item} />
						{:else}
							<article class="event">
								<span class="avatar" aria-hidden="true">{item.username[0].toUpperCase()}</span>
								<p>
									<Username username={item.username} class="hit-link" />
									{#if item.versionNumber === 1}
										shared <a class="hit-link" href="/recipes/{item.slug}">{item.title}</a>
										{item.visibility === 'friends' ? 'with friends' : 'publicly'}
									{:else}
										changed <a class="hit-link" href="/recipes/{item.slug}">{item.title}</a>
										,
										<a
											class="diff hit-link"
											href="/recipes/{item.slug}/diff?from={item.versionNumber -
												1}&to={item.versionNumber}">
											<span class="mono-id">v{item.versionNumber - 1}</span>
											→
											<span class="mono-id">v{item.versionNumber}</span>
										</a>
									{/if}
									<small>{day(item.at)}</small>
								</p>
							</article>
						{/if}
					{/each}
				</div>
				<aside class="rail" aria-label="Requests and invite">
					{@render requests()}
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
		gap: 64px;
		align-items: start;
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
		margin: 0;
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

	.avatar {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1px solid transparent;
		background: var(--color-tint);
		color: var(--color-accent);
		font-family: var(--font-serif);
		font-weight: 500;
	}

	.avatar--sm {
		width: 32px;
		height: 32px;
	}

	.rail {
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
		margin: 0;
		font-size: 0.9375rem;
		color: var(--color-text-2);
	}

	.req {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 10px 12px;
		align-items: center;
	}

	.req .nm {
		min-width: 0;
		line-height: 1.35;
		color: var(--color-text);
	}

	.req small {
		display: block;
		font-size: 0.8125rem;
		color: var(--color-text-3);
	}

	.btns {
		grid-column: 2;
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.btns form {
		margin: 0;
	}

	.btn-sm {
		min-height: 44px;
		padding: 0 14px;
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

	.f-empty {
		max-width: 560px;
		padding: var(--space-6) 0;
		border-top: 1px solid var(--color-border);
	}

	.f-empty h2 {
		margin: 0;
		font-size: 1.375rem;
	}

	.f-empty p {
		margin: 8px 0 0;
		color: var(--color-text-2);
	}

	.f-empty .btn-ghost {
		margin-top: 20px;
		min-height: 44px;
	}

	.empty-req {
		max-width: 560px;
		margin-bottom: var(--space-6);
	}

	/* Below 1024 the rail becomes a strip above the feed: two columns on a
	   tablet, stacked on a phone; the invite drops its sentence. */
	@media (max-width: 1023px) {
		.f-layout {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-5);
		}

		.rail {
			position: static;
			order: -1;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: var(--space-5);
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
		.rail {
			grid-template-columns: minmax(0, 1fr);
		}

		.link-row {
			flex-direction: column;
		}

		.link-row .btn-ghost {
			align-self: stretch;
		}
	}
</style>
