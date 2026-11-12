<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { COLLECTION_NAME_MAX } from '#lib/collections.js';

	// The chosen collection under the Cookbook's filters: its name, Rename and
	// Delete. Choosing one, and New collection, are the picker's
	// (CookbookPicker). A collection is a view of the Cookbook
	// (`?collection=`), so the segments, search and tags keep working inside it.
	let { collection }: { collection: { id: number; name: string } } = $props();

	let renaming = $state(false);
	let renameButton: HTMLButtonElement | undefined = $state();
	let box: HTMLInputElement | undefined = $state();

	const rename = pendingEnhance({ keepFailure: true, done: () => (renaming = false) });
	const deleting = pendingEnhance({ keepOnError: true, keepFailure: true });

	async function open() {
		renaming = true;
		await tick();
		box?.focus();
		box?.select();
	}

	async function close() {
		renaming = false;
		await tick();
		renameButton?.focus();
	}
</script>

<section class="collection-bar" aria-label="Collection">
	{#if renaming}
		<form method="POST" action="?/renameCollection" class="name-form" use:enhance={rename.submit}>
			<input type="hidden" name="id" value={collection.id} />
			<label for="collection-rename" class="sr-only">Collection name</label>
			<input
				id="collection-rename"
				name="name"
				type="text"
				maxlength={COLLECTION_NAME_MAX}
				required
				autocomplete="off"
				value={collection.name}
				aria-invalid={rename.error ? true : undefined}
				aria-describedby={rename.error ? 'collection-rename-error' : undefined}
				bind:this={box}
				onkeydown={(e) => {
					if (e.key === 'Escape') close();
				}} />
			<button type="submit" class="btn-primary btn-sm" disabled={rename.pending}>Save</button>
			<button type="button" class="btn-ghost btn-sm" onclick={close}>Cancel</button>
			<FieldError name="collection-rename" error={rename.error} />
		</form>
	{:else}
		<h2 class="collection-name">{collection.name}</h2>
		<div class="collection-actions">
			<button
				type="button"
				class="text-btn text-btn--ink"
				aria-label="Rename {collection.name}"
				bind:this={renameButton}
				onclick={open}>
				Rename
			</button>
			<ConfirmStep
				trigger="Delete collection"
				triggerClass="text-btn text-btn--ink"
				label="Delete {collection.name}?"
				explanation="Only the collection goes; its recipes stay in your Cookbook."
				confirmLabel="Delete collection"
				pendingLabel="Deleting…"
				keepLabel="Keep"
				action="?/deleteCollection"
				enhance={deleting.submit}
				pending={deleting.pending}
				error={deleting.error}>
				{#snippet fields()}<input type="hidden" name="id" value={collection.id} />{/snippet}
			</ConfirmStep>
		</div>
	{/if}
</section>

<style>
	.name-form {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.name-form input[type='text'] {
		flex: 1 1 14rem;
		max-width: 22rem;
		min-width: 0;
	}

	.name-form :global(.field-error) {
		flex-basis: 100%;
	}

	/* The chosen collection's name, a step under the page title, its actions beside it. */
	.collection-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-5);
		margin-bottom: var(--space-5);
	}

	.collection-bar .name-form {
		flex: 1 1 100%;
		margin-bottom: 0;
	}

	.collection-name {
		font-size: 1.375rem;
		overflow-wrap: anywhere;
	}

	.collection-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-5);
		max-width: 100%;
	}
</style>
