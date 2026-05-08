<script lang="ts">
	import { enhance } from '$app/forms';
	import { Dialog } from 'bits-ui';
	import type { Recipe } from '$lib/server/db/schema';

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

	let isFavorited = $state(initialFavorited);
	let forkDialogOpen = $state(false);
	let forkCommitMessage = $state('');
</script>

{#if canFavorite || canFork || (isOwner && !isViewingHistory)}
	<div class="flex flex-col gap-2">
		{#if canFavorite}
			<form
				method="POST"
				action="?/toggleFavorite"
				use:enhance={() => {
					isFavorited = !isFavorited;
					return async ({ update }) => update({ reset: false });
				}}
			>
				<button
					type="submit"
					class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-pill border-[1.5px] border-accent bg-transparent px-4 py-3 text-center font-sans text-[0.9rem] font-semibold text-accent no-underline transition-opacity duration-150 hover:opacity-75"
					aria-label={isFavorited ? 'Unsave' : 'Save'}
				>
					<svg
						class="size-4 transition-[fill] duration-150"
						class:fill-accent={isFavorited}
						class:fill-none={!isFavorited}
						class:text-accent={isFavorited}
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						stroke-width="1.8"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
						/>
					</svg>
					{isFavorited ? 'Saved' : 'Save recipe'}
				</button>
			</form>
		{/if}

		{#if canFork}
			<Dialog.Root bind:open={forkDialogOpen}>
				<Dialog.Trigger class="btn-primary w-full py-3">Fork this recipe</Dialog.Trigger>
				<Dialog.Portal>
					<Dialog.Overlay class="dialog-overlay" />
					<Dialog.Content class="dialog-content">
						<Dialog.Title class="dialog-title">Fork this recipe?</Dialog.Title>
						<Dialog.Description class="dialog-desc">
							A copy will be added to your recipes. You can edit it independently.
						</Dialog.Description>
						<form
							method="POST"
							action="?/fork"
							use:enhance={() => {
								return async ({ result, update }) => {
									if (result.type === 'redirect') {
										window.location.href = result.location;
									} else {
										await update();
									}
									forkDialogOpen = false;
								};
							}}
						>
							<div class="mb-5">
								<label for="fork-commit" class="mb-2 block text-[0.85rem] font-medium text-text-2">
									Initial commit message
								</label>
								<input
									id="fork-commit"
									name="commitMessage"
									type="text"
									placeholder="Forked from {recipe.title}"
									bind:value={forkCommitMessage}
								/>
							</div>
							<div class="dialog-actions">
								<Dialog.Close class="btn-ghost">Cancel</Dialog.Close>
								<button type="submit" class="btn-primary">Fork</button>
							</div>
						</form>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		{/if}

		{#if isOwner && !isViewingHistory}
			<a
				href="/recipes/{recipe.slug}/edit"
				class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-pill border-[1.5px] border-accent bg-transparent px-4 py-3 text-center font-sans text-[0.9rem] font-semibold text-accent no-underline transition-opacity duration-150 hover:opacity-75"
			>
				Edit recipe
			</a>
		{/if}
	</div>
{/if}
