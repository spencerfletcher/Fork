<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Recipe } from '#lib/server/db/schema.js';

	let {
		recipe,
		canFork,
		loginHref,
		canFavorite,
		isOwner,
		isViewingHistory,
		initialFavorited
	}: {
		recipe: Pick<Recipe, 'slug' | 'title'>;
		canFork: boolean;
		/** Where Fork sends a logged-out visitor; null when Fork is not offered. */
		loginHref: string | null;
		canFavorite: boolean;
		isOwner: boolean;
		isViewingHistory: boolean;
		initialFavorited: boolean;
	} = $props();

	// Writable derived: the click flips it optimistically, and it resets to the
	// prop whenever the page loads another recipe or reloads this one.
	let isFavorited = $derived(initialFavorited);
</script>

{#if canFavorite || canFork || loginHref || (isOwner && !isViewingHistory)}
	<div class="actions">
		{#if canFork}
			<!-- One click. The server writes the first commit message itself. -->
			<form
				method="POST"
				action="?/fork"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'redirect') window.location.href = result.location;
						else await update();
					};
				}}>
				<button type="submit" class="btn-primary">Fork this recipe</button>
			</form>
		{:else if loginHref}
			<a href={loginHref} class="btn-primary no-underline">Fork this recipe</a>
		{/if}

		{#if isOwner && !isViewingHistory}
			<!-- The owner is not offered Fork, so Edit is their primary action. -->
			<a href="/recipes/{recipe.slug}/edit" class="btn-primary no-underline">Edit recipe</a>
		{/if}
		{#if canFavorite}
			<form
				method="POST"
				action="?/toggleFavorite"
				use:enhance={() => {
					isFavorited = !isFavorited;
					return async ({ update }) => update({ reset: false });
				}}>
				<button
					type="submit"
					class="btn-ghost flex items-center justify-center gap-2 no-underline"
					aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}>
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
	</div>
{/if}

<style>
	/* A row of buttons under the recipe's text; on a phone, two equal columns
	   tall enough for a thumb. */
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
