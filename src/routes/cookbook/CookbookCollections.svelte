<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { COLLECTION_NAME_MAX } from '#lib/collections.js';

	// The cook's collections as a row of tabs over the Cookbook's filters, a
	// way to make one, and for the chosen one its name with Rename and Delete.
	// A collection is a view of the Cookbook (`?collection=`), so the segments,
	// search and tags keep working inside it.
	let {
		collections,
		collection
	}: {
		collections: { id: number; name: string; count: number }[];
		collection: { id: number; name: string } | null;
	} = $props();

	// The page's other filters kept; null is the whole Cookbook.
	function hrefFor(id: number | null): string {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams(page.url.search);
		if (id === null) params.delete('collection');
		else params.set('collection', String(id));
		const query = params.toString();
		return query ? `?${query}` : page.url.pathname;
	}

	// A form action's own query replaces the page's, and SvelteKit lands on what
	// is left of it: a rename carries the page's query so the cook stays in the
	// collection, with its search and filters.
	const keptQuery = $derived(page.url.search ? `&${page.url.search.slice(1)}` : '');

	let creating = $state(false);
	let renaming = $state(false);
	let newButton: HTMLButtonElement | undefined = $state();
	let renameButton: HTMLButtonElement | undefined = $state();
	let box: HTMLInputElement | undefined = $state();

	const create = pendingEnhance({ keepFailure: true, done: () => (creating = false) });
	const rename = pendingEnhance({ keepFailure: true, done: () => (renaming = false) });
	const deleting = pendingEnhance({ keepOnError: true, keepFailure: true });

	async function open(which: 'create' | 'rename') {
		if (which === 'create') creating = true;
		else renaming = true;
		await tick();
		box?.focus();
		box?.select();
	}

	async function close(which: 'create' | 'rename') {
		if (which === 'create') creating = false;
		else renaming = false;
		await tick();
		(which === 'create' ? newButton : renameButton)?.focus();
	}
</script>

{#snippet nameForm(which: 'create' | 'rename', state: typeof create)}
	<form
		method="POST"
		action={which === 'create' ? '?/createCollection' : `?/renameCollection${keptQuery}`}
		class="name-form"
		use:enhance={state.submit}>
		{#if which === 'rename' && collection}
			<input type="hidden" name="id" value={collection.id} />
		{/if}
		<label for="collection-{which}" class="sr-only">Collection name</label>
		<input
			id="collection-{which}"
			name="name"
			type="text"
			maxlength={COLLECTION_NAME_MAX}
			required
			autocomplete="off"
			value={which === 'rename' ? collection?.name : ''}
			placeholder={which === 'create' ? 'Like Quick or Good for parties' : undefined}
			aria-invalid={state.error ? true : undefined}
			aria-describedby={state.error ? `collection-${which}-error` : undefined}
			bind:this={box}
			onkeydown={(e) => {
				if (e.key === 'Escape') close(which);
			}} />
		<button type="submit" class="btn-primary btn-sm" disabled={state.pending}>
			{which === 'create' ? 'Create' : 'Save'}
		</button>
		<button type="button" class="btn-ghost btn-sm" onclick={() => close(which)}>Cancel</button>
		{#if state.error}
			<p id="collection-{which}-error" class="field-error" role="alert">{state.error}</p>
		{/if}
	</form>
{/snippet}

<section class="cookbook-collections" aria-labelledby="collections-heading">
	<div class="collections-head">
		<h2 id="collections-heading" class="eyebrow-label">Collections</h2>
		{#if !creating}
			<button type="button" class="text-btn" bind:this={newButton} onclick={() => open('create')}>
				New collection
			</button>
		{/if}
	</div>
	{#if creating}{@render nameForm('create', create)}{/if}

	<nav class="tag-tabs" aria-label="Collections">
		<a href={hrefFor(null)} aria-current={collection ? undefined : 'page'}>All recipes</a>
		{#each collections as c (c.id)}
			<a href={hrefFor(c.id)} aria-current={collection?.id === c.id ? 'page' : undefined}>
				{c.name}
				<span class="n">{c.count}</span>
			</a>
		{/each}
	</nav>

	{#if collection}
		<div class="collection-bar">
			{#if renaming}
				{@render nameForm('rename', rename)}
			{:else}
				<h2 class="collection-name">{collection.name}</h2>
				<div class="collection-actions">
					<button
						type="button"
						class="text-btn text-btn--ink"
						aria-label="Rename {collection.name}"
						bind:this={renameButton}
						onclick={() => open('rename')}>
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
		</div>
	{/if}
</section>

<style>
	.cookbook-collections {
		margin-bottom: var(--space-5);
	}

	.collections-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		margin-bottom: var(--space-2);
	}

	.tag-tabs .n {
		margin-left: 4px;
		font-weight: 400;
		color: var(--color-text-3);
	}

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

	.name-form .field-error {
		flex-basis: 100%;
	}

	/* The chosen collection's name, a step under the page title, its actions beside it. */
	.collection-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-5);
		margin-top: var(--space-5);
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
