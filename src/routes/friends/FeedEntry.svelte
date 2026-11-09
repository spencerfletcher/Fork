<script lang="ts">
	import { enhance } from '$app/forms';
	import Username from '#lib/components/ui/Username.svelte';
	import { likeIcon } from '#lib/components/journal/Icons.svelte';
	import { saveIcon } from '../recipes/[slug]/components/Icons.svelte';
	import { dayLabel } from '#lib/journal.js';
	import MoreMenu from './MoreMenu.svelte';
	import type { FeedItem } from '#lib/server/friends.js';

	let { item }: { item: Extract<FeedItem, { kind: 'entry' }> } = $props();

	const entry = $derived(item.entry);
	const source = $derived(item.source);
	const cooked = $derived(dayLabel(entry.cookedOn));
	const loggedOn = $derived(dayLabel(entry.createdAt.toISOString().slice(0, 10)));

	// Optimistic, as the recipe page's Save: the press flips at once and flips
	// back if the server refuses. Writable derived, so a reload resets them.
	let liked = $derived(item.liked);
	let likes = $derived(item.likes);
	let saved = $derived(item.saved);
	let error = $state('');
	let liking = false;
	let saving = false;
</script>

<article class="entry">
	<div class="who">
		<span class="avatar" aria-hidden="true">{item.username[0].toUpperCase()}</span>
		<p class="who-line">
			<Username username={item.username} />
			<span class="when">cooked {cooked}{loggedOn !== cooked ? ` · logged ${loggedOn}` : ''}</span>
		</p>
		<MoreMenu
			userId={entry.userId}
			username={item.username}
			report={{ type: 'log_entry', id: String(entry.id) }}
			label="More for @{item.username}'s {entry.dish}" />
	</div>
	<h2 class="dish">{entry.dish}</h2>
	{#if entry.photoUrl}
		<figure class="photo">
			<img src={entry.photoUrl} alt="@{item.username}'s photo of {entry.dish}" loading="lazy" />
		</figure>
	{/if}
	{#if entry.caption}<p class="caption">{entry.caption}</p>{/if}
	{#if source.kind === 'recipe'}
		<p class="source">
			<a
				href="/recipes/{source.slug}{source.versionNumber
					? `?version=${source.versionNumber}`
					: ''}">
				{source.title}{source.versionNumber ? ' · ' : ''}{#if source.versionNumber}<span
						class="mono-id">
						v{source.versionNumber}
					</span>{/if}
			</a>
		</p>
	{:else if source.kind === 'hidden'}
		<p class="private-line">
			@{item.username} cooked a private recipe. You can see the dish, not the recipe.
		</p>
	{:else if source.kind === 'deleted'}
		<p class="source">Recipe deleted</p>
	{/if}
	<div class="actions">
		<form
			method="POST"
			action="/friends?/like"
			use:enhance={({ cancel }) => {
				if (liking) return cancel();
				liking = true;
				liked = !liked;
				likes += liked ? 1 : -1;
				error = '';
				return async ({ result }) => {
					liking = false;
					if (result.type === 'success') return;
					liked = !liked;
					likes += liked ? 1 : -1;
					error = 'Could not like that. Try again.';
				};
			}}>
			<input type="hidden" name="entryId" value={entry.id} />
			<button type="submit" class="text-btn" aria-pressed={liked}>
				{@render likeIcon(liked)}
				<span>{likes > 0 ? `Like · ${likes}` : 'Like'}</span>
			</button>
		</form>
		<!-- Save only where a recipe the reader may see is attached, and not their own. -->
		{#if source.kind === 'recipe' && !source.own}
			<form
				method="POST"
				action="/recipes/{source.slug}?/toggleFavorite"
				use:enhance={({ cancel }) => {
					if (saving) return cancel();
					saving = true;
					saved = !saved;
					error = '';
					return async ({ result }) => {
						saving = false;
						if (result.type === 'success') return;
						saved = !saved;
						error = 'Could not save that. Try again.';
					};
				}}>
				<button type="submit" class="text-btn" aria-pressed={saved}>
					{@render saveIcon(saved)}
					{saved ? 'Saved' : 'Save'}
				</button>
			</form>
		{/if}
		{#if error}<p class="form-error" role="alert">{error}</p>{/if}
	</div>
</article>

<style>
	.entry {
		padding: 24px 0 26px;
		border-top: 1px solid var(--color-border);
	}

	.who {
		display: flex;
		align-items: center;
		gap: 12px;
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

	.who-line {
		flex: 1;
		min-width: 0;
		margin: 0;
		line-height: 1.35;
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.when {
		display: block;
		font-weight: 400;
		font-size: 0.875rem;
		color: var(--color-text-3);
	}

	.dish {
		margin: 14px 0 0;
		font-family: var(--font-serif);
		font-weight: 500;
		font-size: 1.375rem;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}

	.photo {
		margin: 12px 0 0;
	}

	.photo img {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 2;
		object-fit: cover;
		border-radius: var(--radius-md);
	}

	.caption {
		margin: 12px 0 0;
		font-size: 1.0625rem;
		line-height: 1.55;
	}

	.source {
		margin: 8px 0 0;
		font-size: 0.9375rem;
		color: var(--color-text-2);
		overflow-wrap: anywhere;
	}

	.source a {
		font-weight: 600;
	}

	/* Inline links reach a 24px hit without moving the text; 44px on a phone below. */
	.source a,
	.who-line :global(a) {
		padding: 4px 0;
		margin: -4px 0;
	}

	.private-line {
		margin: 8px 0 0;
		font-size: 0.875rem;
		color: var(--color-text-3);
	}

	.actions {
		margin-top: 12px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 24px;
	}

	.actions form {
		margin: 0;
	}

	/* Text buttons, ink, a thumb's 44px tall. */
	.text-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		padding: 0 2px;
		border: 0;
		background: none;
		font: inherit;
		font-weight: 600;
		color: var(--color-text);
		cursor: pointer;
	}

	.text-btn:hover {
		color: var(--color-accent);
	}

	.text-btn[aria-pressed='true'] :global(svg) {
		color: var(--color-accent);
	}

	.form-error {
		flex-basis: 100%;
		margin: 0;
	}

	@media (max-width: 699px) {
		.dish {
			font-size: 1.25rem;
		}

		.source a,
		.who-line :global(a) {
			display: inline-block;
			padding-block: 12px;
			margin-block: -12px;
		}
	}
</style>
