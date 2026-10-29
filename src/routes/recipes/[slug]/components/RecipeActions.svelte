<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Recipe } from '#lib/server/db/schema.js';

	let {
		recipe,
		canFork,
		canFavorite,
		isOwner,
		isViewingHistory,
		initialFavorited
	}: {
		recipe: Pick<Recipe, 'slug' | 'title'>;
		canFork: boolean;
		canFavorite: boolean;
		isOwner: boolean;
		isViewingHistory: boolean;
		initialFavorited: boolean;
	} = $props();

	// Writable derived: the click flips it optimistically, and it resets to the
	// prop whenever the page loads another recipe or reloads this one.
	let isFavorited = $derived(initialFavorited);
	let forking = $state(false);
	let error = $state('');
</script>

{#if canFavorite || canFork || (isOwner && !isViewingHistory)}
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
					Fork this recipe
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
				<button type="submit" class="btn-ghost flex items-center justify-center gap-2 no-underline">
					<svg
						class="size-4 transition-[fill] duration-150"
						class:fill-accent={isFavorited}
						class:fill-none={!isFavorited}
						class:text-accent={isFavorited}
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						stroke-width="1.8"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
					</svg>
					{isFavorited ? 'Favorited' : 'Favorite'}
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
		border-radius: 999px;
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
