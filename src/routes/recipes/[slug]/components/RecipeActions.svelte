<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { Recipe } from '#lib/server/db/schema.js';
	import { forkIcon, starIcon } from './Icons.svelte';

	let {
		recipe,
		canFork,
		canFavorite,
		isOwner,
		isViewingHistory,
		initialFavorited,
		loginHref,
		cooking,
		oncook
	}: {
		recipe: Pick<Recipe, 'slug' | 'title'>;
		canFork: boolean;
		canFavorite: boolean;
		isOwner: boolean;
		isViewingHistory: boolean;
		initialFavorited: boolean;
		/** Logged out: where Fork and Favorite send the visitor to sign in and come back. */
		loginHref?: string;
		/** Cooking mode: Fork and Favorite step aside, the screen is kept awake. */
		cooking: boolean;
		oncook: (cooking: boolean) => void;
	} = $props();

	// Writable derived: the click flips it optimistically, and it resets to the
	// prop whenever the page loads another recipe or reloads this one.
	let isFavorited = $derived(initialFavorited);
	let forking = $state(false);
	let error = $state('');

	// The URL carries ?cook=1 so a reload or a shared link stays in the mode.
	// The scaler's shallow replace leaves page.url behind, so the newest URL
	// is page.shallow's when there is one.
	function toggleCook() {
		const url = new URL((page.shallow?.url ?? page.url).href);
		if (cooking) url.searchParams.delete('cook');
		else url.searchParams.set('cook', '1');
		oncook(!cooking);
		goto(url, { shallow: true, replace: true, state: page.state });
	}

	// The screen stays awake while cooking. The browser drops the lock when
	// the tab hides, so coming back asks again. Where the API is missing or
	// refuses, the mode works without it and never throws.
	let noWakeLock = $state(false);
	$effect(() => {
		if (!cooking) return;
		if (!('wakeLock' in navigator)) {
			noWakeLock = true;
			return;
		}
		let lock: WakeLockSentinel | undefined;
		let done = false;
		const request = () =>
			navigator.wakeLock.request('screen').then(
				(next) => {
					if (done) next.release().catch(() => {});
					else lock = next;
				},
				() => {}
			);
		const release = () => lock?.release().catch(() => {});
		const onVisibility = () => {
			if (document.visibilityState === 'visible' && (!lock || lock.released)) request();
		};
		request();
		document.addEventListener('visibilitychange', onVisibility);
		// Unload; a page kept in the back-forward cache asks again when shown.
		window.addEventListener('pagehide', release);
		return () => {
			done = true;
			release();
			document.removeEventListener('visibilitychange', onVisibility);
			window.removeEventListener('pagehide', release);
		};
	});
</script>

<div class="actions">
	{#if cooking}
		<!-- Cooking: only the Cook toggle stays. -->
	{:else if loginHref && !isViewingHistory}
		<!-- Logged out, the same two pills lead to sign-in and back to this page. -->
		<a href={loginHref} class="btn-primary no-underline">
			{@render forkIcon()}
			<!-- Below 375 the pill's half of the row cannot hold the whole label on
			     one line (it needs 157px), so it says "Fork". One span, so the gap
			     cannot split it. -->
			<span>
				Fork
				<span class="max-[375px]:hidden">this recipe</span>
			</span>
		</a>
		<a href={loginHref} class="btn-ghost no-underline">
			{@render starIcon(false)}
			Favorite
		</a>
	{:else}
		{#if canFork}
			<!-- One click. The server writes the first commit message itself. -->
			<form
				method="POST"
				action="?/fork"
				use:enhance={() => {
					forking = true;
					error = '';
					return async ({ result, update }) => {
						forking = false;
						if (result.type === 'redirect') window.location.href = result.location;
						else if (result.type === 'success') await update();
						else error = 'Could not fork this recipe. Try again.';
					};
				}}>
				<button
					type="submit"
					class="btn-primary"
					disabled={forking}
					aria-busy={forking || undefined}>
					{@render forkIcon()}
					<span>
						Fork
						<span class="max-[375px]:hidden">this recipe</span>
					</span>
				</button>
			</form>
		{/if}

		{#if isOwner && !isViewingHistory}
			<!-- The owner is not offered Fork, so Edit is their primary action. -->
			<a href="/recipes/{recipe.slug}/edit" class="btn-primary no-underline">
				<svg
					class="size-4"
					viewBox="0 0 16 16"
					aria-hidden="true"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round">
					<path d="M11.5 2.5l2 2L5 13H3v-2z" />
				</svg>
				Edit recipe
			</a>
		{/if}
		{#if canFavorite}
			<form
				method="POST"
				action="?/toggleFavorite"
				use:enhance={() => {
					isFavorited = !isFavorited;
					error = '';
					return async ({ result, update }) => {
						if (result.type === 'success') return update({ reset: false });
						// Flip back: nothing was saved.
						isFavorited = !isFavorited;
						error = 'Could not save that. Try again.';
					};
				}}>
				<button
					type="submit"
					class="btn-ghost favorite flex items-center justify-center gap-2 no-underline"
					aria-pressed={isFavorited}>
					{@render starIcon(isFavorited)}
					Favorite
				</button>
			</form>
		{/if}
	{/if}

	<!-- Visible to everyone. Both words are laid out in one cell, the unused
	     one invisible, so the pill keeps one width either way. -->
	<button type="button" class="btn-ghost cook" aria-pressed={cooking} onclick={toggleCook}>
		<svg
			class="size-4"
			viewBox="0 0 16 16"
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round">
			<path
				d="M2 7.5h12M3.5 7.5v4a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-4M6 5c0-1 1-1.2 1-2.5M9.5 5c0-1 1-1.2 1-2.5" />
		</svg>
		<span class="cook-label">
			<span class:invisible={cooking} aria-hidden={cooking || undefined}>Cook</span>
			<!-- Below 375 "Done", as Fork drops "this recipe": half the row cannot
			     hold "Done cooking" on one line. -->
			<span class:invisible={!cooking} aria-hidden={!cooking || undefined}>
				Done
				<span class="max-[375px]:hidden">cooking</span>
			</span>
		</span>
	</button>

	{#if cooking && noWakeLock}
		<p class="note text-text-3 m-0 basis-full text-sm">Your screen may still sleep.</p>
	{/if}
	{#if error}
		<p class="form-error m-0 basis-full" role="alert">{error}</p>
	{/if}
</div>

<style>
	/* A row of pills as the last line of the recipe's text; on a phone, two
	   equal columns tall enough for a thumb. */
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.actions :global(.btn-primary),
	.actions :global(.btn-ghost) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 44px;
		padding: 8px 18px 8px 16px;
		border-radius: var(--radius-pill);
	}

	/* Favorited: the word stays "Favorite" so the pill never changes width;
	   the state is the pale marigold tint and border, quieter than the solid
	   marigold Fork beside it (Spencer, 31 October 2026). */
	.cook[aria-pressed='true'],
	.favorite[aria-pressed='true'] {
		background: var(--color-marigold-tint);
		border-color: var(--color-marigold);
	}

	.cook[aria-pressed='true']:hover,
	.favorite[aria-pressed='true']:hover {
		background: var(--color-marigold-tint-hover);
	}

	/* The word starts at the icon, not centred in the wider word's box. */
	.cook-label {
		display: inline-grid;
		justify-items: start;
	}

	.cook-label > span {
		grid-area: 1 / 1;
	}

	/* Forced colours strip the tint and the marigold star, so pressed keeps a
	   heavier border and paints its star in Highlight, as the ticks do. */
	@media (forced-colors: active) {
		.cook[aria-pressed='true'],
		.favorite[aria-pressed='true'] {
			border-width: 2px;
		}

		.favorite[aria-pressed='true'] :global(svg) {
			forced-color-adjust: none;
			fill: Highlight;
			stroke: CanvasText;
		}
	}

	@media (max-width: 699px) {
		.actions {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}

		.actions :global(.btn-primary),
		.actions :global(.btn-ghost) {
			width: 100%;
		}

		/* Cook takes its own row under Fork and Favorite, alone or not, so the
		   band reads as two clean rows (Spencer, 31 October 2026). */
		.cook,
		.note {
			grid-column: 1 / -1;
		}
	}
</style>
