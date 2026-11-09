<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { setShallowParam } from './shallowParam';
	import type { Recipe } from '#lib/server/db/schema.js';
	import { forkIcon, saveIcon } from './Icons.svelte';

	let {
		recipe,
		canFork,
		canFavorite,
		canEdit,
		initialFavorited,
		favoriteCount,
		loginHref,
		cooking,
		oncook
	}: {
		recipe: Pick<Recipe, 'slug' | 'title'>;
		canFork: boolean;
		canFavorite: boolean;
		/** The owner on the latest version: Edit, in Fork's place. */
		canEdit: boolean;
		initialFavorited: boolean;
		/** Saves as loaded, the viewer's own included when `initialFavorited`. */
		favoriteCount: number;
		/** Logged out on the latest version: where "Log in to save" sends the visitor and back. */
		loginHref?: string;
		/** Cooking mode: Save, Fork and Edit step aside, the screen is kept awake. */
		cooking: boolean;
		oncook: (cooking: boolean) => void;
	} = $props();

	// Writable derived: the click flips it optimistically, and it resets to the
	// prop whenever the page loads another recipe or reloads this one.
	let isFavorited = $derived(initialFavorited);
	// The count follows the optimistic flip: one more or one fewer than loaded.
	const saves = $derived(favoriteCount + Number(isFavorited) - Number(initialFavorited));
	// No compact count helper exists yet; digits grouped by a thin space.
	const savesText = $derived(saves.toLocaleString('en-US').replaceAll(',', '\u2009'));
	let forking = $state(false);
	let saving = $state(false);
	let error = $state('');

	// SvelteKit keeps this component mounted across versions and recipes, so a
	// failure message would otherwise stay over the next view.
	afterNavigate(() => (error = ''));

	// The URL carries ?cook=1 so a reload or a shared link stays in the mode.
	function toggleCook() {
		const next = !cooking;
		oncook(next);
		setShallowParam('cook', next ? '1' : null);
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

<!-- Back from the new fork can restore this page from the back-forward cache,
     still disabled from the redirect; it is offered again. -->
<svelte:window
	onpageshow={(e) => {
		if (e.persisted) forking = false;
	}} />

<div class="actions">
	<!-- Cook is the one marigold fill for everyone, first in the row and in the
	     Tab order. Pressed it steps down to the outlined pill with the tint, and
	     the other actions go, so "Done cooking" growing shifts nothing. -->
	<button
		type="button"
		class={['cook', cooking ? 'btn-ghost' : 'btn-primary']}
		aria-pressed={cooking}
		onclick={toggleCook}>
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
		{#if cooking}
			<span>Done cooking</span>
		{:else}
			<span>Cook</span>
		{/if}
	</button>

	{#if cooking}
		<!-- Cooking: only the Cook toggle stays. -->
	{:else if loginHref}
		<!-- Logged out: a text link, not a pill, so Cook stays the one action. -->
		<a href={loginHref} class="login">Log in to save</a>
	{:else}
		{#if canEdit}
			<a href="/recipes/{recipe.slug}/edit" class="btn-ghost edit no-underline">
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
				use:enhance={({ cancel }) => {
					// One request at a time: two toggles in flight could race on the
					// server. Cancelled rather than disabled, so keyboard focus stays.
					if (saving) return cancel();
					saving = true;
					isFavorited = !isFavorited;
					error = '';
					return async ({ result, update }) => {
						saving = false;
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
					{@render saveIcon(isFavorited)}
					<span>
						Save
						{#if saves > 0}
							<span class="count">
								<span aria-hidden="true">·</span>
								{savesText}
							</span>
						{/if}
					</span>
				</button>
			</form>
		{/if}
		{#if canFork}
			<!-- One click. The server writes the first commit message itself. -->
			<form
				method="POST"
				action="?/fork"
				use:enhance={() => {
					forking = true;
					error = '';
					return async ({ result, update }) => {
						// Still disabled while the browser leaves for the new fork, so a
						// second click cannot fork twice.
						if (result.type === 'redirect') {
							window.location.href = result.location;
							return;
						}
						forking = false;
						if (result.type === 'success') await update();
						else error = 'Could not fork this recipe. Try again.';
					};
				}}>
				<button type="submit" class="btn-ghost" disabled={forking} aria-busy={forking || undefined}>
					{@render forkIcon()}
					Fork
				</button>
			</form>
		{/if}
	{/if}

	{#if cooking && noWakeLock}
		<p class="note text-text-2 m-0 basis-full text-sm">Your screen may still sleep.</p>
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
		align-items: center;
		gap: 10px;
	}

	/* A plain link, clay and bold like the byline's; padded to a 24px hit. */
	.login {
		margin-left: 8px;
		padding: 4px 0;
		font-weight: 600;
		color: var(--color-accent);
		text-decoration: none;
	}

	.login:hover {
		color: var(--color-text);
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

	/* Saved: the word stays "Save"; the state is the pale marigold tint and
	   border, quieter than the solid marigold Cook beside it (Spencer, 31
	   October 2026). */
	.cook[aria-pressed='true'],
	.favorite[aria-pressed='true'] {
		background: var(--color-marigold-tint);
		border-color: var(--color-marigold);
	}

	.cook[aria-pressed='true']:hover,
	.favorite[aria-pressed='true']:hover {
		background: var(--color-marigold-tint-hover);
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

	/* The page's phone width: Cook takes the whole first row, Save and Fork
	   share the row beneath. The owner's Edit and the login link have no
	   partner, so they span too. */
	@media (max-width: 699px) {
		.actions {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}

		.actions :global(.btn-primary),
		.actions :global(.btn-ghost) {
			width: 100%;
		}

		.cook,
		.edit,
		.login,
		.note {
			grid-column: 1 / -1;
		}

		/* 24px of line and 20px of padding: a thumb's 44px. */
		.login {
			justify-self: center;
			margin: 0;
			padding: 10px 0;
		}
	}
</style>
