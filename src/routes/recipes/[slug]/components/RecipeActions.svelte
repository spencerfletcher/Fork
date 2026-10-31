<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Recipe } from '#lib/server/db/schema.js';

	let {
		recipe,
		canFork,
		canFavorite,
		isOwner,
		isViewingHistory,
		initialFavorited,
		loginHref
	}: {
		recipe: Pick<Recipe, 'slug' | 'title'>;
		canFork: boolean;
		canFavorite: boolean;
		isOwner: boolean;
		isViewingHistory: boolean;
		initialFavorited: boolean;
		/** Logged out: where Fork and Favorite send the visitor to sign in and come back. */
		loginHref?: string;
	} = $props();

	// Writable derived: the click flips it optimistically, and it resets to the
	// prop whenever the page loads another recipe or reloads this one.
	let isFavorited = $derived(initialFavorited);
	let forking = $state(false);
	let error = $state('');
</script>

{#snippet forkIcon()}
	<svg
		class="size-4"
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round">
		<path d="M4 3.5v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2M8 7.5v5" />
		<circle cx="4" cy="2.5" r="1.3" fill="currentColor" />
		<circle cx="12" cy="2.5" r="1.3" fill="currentColor" />
		<circle cx="8" cy="13.5" r="1.3" fill="currentColor" />
	</svg>
{/snippet}

{#snippet starIcon(filled: boolean)}
	<svg
		class="size-4 transition-[fill] duration-150"
		class:fill-marigold={filled}
		class:fill-none={!filled}
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		aria-hidden="true"
		stroke-width="1.8"
		stroke="currentColor">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1L3.2 9.7l6.1-.9z" />
	</svg>
{/snippet}

{#if loginHref && !isViewingHistory}
	<!-- Logged out, the same two pills lead to sign-in and back to this page. -->
	<div class="actions">
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
	</div>
{:else if canFavorite || canFork || (isOwner && !isViewingHistory)}
	<div class="actions">
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
		{#if error}
			<p class="form-error m-0 basis-full" role="alert">{error}</p>
		{/if}
	</div>
{/if}

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
	.favorite[aria-pressed='true'] {
		background: var(--color-marigold-tint);
		border-color: var(--color-marigold);
	}

	.favorite[aria-pressed='true']:hover {
		background: var(--color-marigold-tint-hover);
	}

	/* Forced colours strip the tint and the marigold star, so pressed keeps a
	   heavier border and paints its star in Highlight, as the ticks do. */
	@media (forced-colors: active) {
		.favorite[aria-pressed='true'] {
			border-width: 2px;
		}

		.favorite[aria-pressed='true'] svg {
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
	}
</style>
