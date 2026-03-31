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
	<div class="sidebar-actions">
		{#if canFavorite}
			<form
				method="POST"
				action="?/toggleFavorite"
				use:enhance={() => {
					isFavorited = !isFavorited;
					return async ({ update }) => update({ reset: false });
				}}
			>
				<button type="submit" class="action-btn" aria-label={isFavorited ? 'Unsave' : 'Save'}>
					<svg
						class="action-icon"
						class:filled={isFavorited}
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
				<Dialog.Trigger class="action-btn action-btn-primary">Fork this recipe</Dialog.Trigger>
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
							<div class="dialog-field">
								<label for="fork-commit" class="dialog-label">Initial commit message</label>
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
			<a href="/recipes/{recipe.slug}/edit" class="action-btn">Edit recipe</a>
		{/if}
	</div>
{/if}

<style>
	.sidebar-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-accent);
		background: transparent;
		border: 1.5px solid var(--color-accent);
		border-radius: var(--radius-pill);
		cursor: pointer;
		text-decoration: none;
		text-align: center;
		transition: opacity 0.15s;
	}

	.action-btn:hover {
		opacity: 0.75;
	}

	:global(.action-btn-primary) {
		background: var(--color-accent) !important;
		color: var(--color-hero-bg) !important;
		border: 1.5px solid var(--color-accent) !important;
		border-radius: var(--radius-pill) !important;
		font-family: var(--font-sans) !important;
		font-size: 0.9rem !important;
		font-weight: 600 !important;
		padding: var(--space-3) var(--space-4) !important;
		cursor: pointer !important;
		transition: opacity 0.15s !important;
	}

	:global(.action-btn-primary:hover) {
		opacity: 0.88;
	}

	.action-icon {
		width: 16px;
		height: 16px;
		fill: none;
		transition: fill 0.15s;
	}

	.action-icon.filled {
		fill: var(--color-accent);
		color: var(--color-accent);
	}

	/* ── Fork dialog ── */
	:global(.dialog-overlay) {
		position: fixed;
		inset: 0;
		background: rgba(26, 20, 8, 0.5);
		z-index: 100;
	}

	:global(.dialog-content) {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-surface);
		border: 1px solid var(--color-border-2);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-raised);
		padding: var(--space-6);
		width: min(480px, calc(100vw - 48px));
		z-index: 101;
	}

	:global(.dialog-title) {
		font-family: var(--font-serif);
		font-size: 1.4rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 var(--space-3);
	}

	:global(.dialog-desc) {
		font-size: 0.9rem;
		color: var(--color-text-2);
		margin: 0 0 var(--space-5);
		line-height: 1.6;
	}

	:global(.dialog-actions) {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
	}

	.dialog-field {
		margin-bottom: var(--space-5);
	}

	.dialog-label {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text-2);
		margin-bottom: var(--space-2);
	}
</style>
