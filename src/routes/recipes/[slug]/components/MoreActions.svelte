<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import Dropdown from '#lib/components/ui/Dropdown.svelte';
	import { plusIcon } from '#lib/components/Icons.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { COLLECTION_NAME_MAX } from '#lib/collections.js';
	import CollectionToggle from './CollectionToggle.svelte';

	// Beside Save, for a recipe in the reader's library: a menu of their
	// collections, each a check (a recipe may be in several), and New
	// collection, named in place and made with this recipe in it. It never
	// replaces Save, whose own press is the save.
	let {
		collections
	}: {
		collections: { id: number; name: string; has?: boolean }[];
	} = $props();

	let naming = $state(false);
	let error = $state('');
	let panelEl: HTMLElement | undefined = $state();

	const creating = pendingEnhance({ keepFailure: true, done: () => back() });

	async function name() {
		naming = true;
		error = '';
		await tick();
		panelEl?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
	}

	async function back() {
		naming = false;
		await tick();
		panelEl?.querySelector<HTMLElement>('.new-row')?.focus();
	}

	const refusal = $derived(creating.error ?? error);
</script>

<Dropdown
	onopen={() => {
		naming = false;
		error = '';
	}}>
	{#snippet trigger(props)}
		<button type="button" class="btn-ghost collect" aria-haspopup="menu" {...props}>
			{@render plusIcon()}
			Add to collection
		</button>
	{/snippet}
	{#snippet panel()}
		<div
			class="menu-panel collect-panel"
			role={naming ? undefined : 'menu'}
			aria-label="Collections"
			bind:this={panelEl}>
			{#each collections as collection (collection.id)}
				<CollectionToggle {collection} report={(message) => (error = message)} />
			{/each}
			{#if naming}
				<form
					method="POST"
					action="?/newCollection"
					class="name-step"
					use:enhance={creating.submit}>
					<label for="new-collection-name">New collection</label>
					<input
						id="new-collection-name"
						name="name"
						type="text"
						maxlength={COLLECTION_NAME_MAX}
						required
						autocomplete="off"
						aria-invalid={creating.error ? true : undefined}
						aria-describedby={creating.error ? 'new-collection-error' : undefined}
						onkeydown={(e) => {
							// Back to the list; a second Escape closes the menu.
							if (e.key === 'Escape') {
								e.stopPropagation();
								back();
							}
						}} />
					<button type="submit" class="btn-primary btn-sm" disabled={creating.pending}>
						Create
					</button>
				</form>
			{:else}
				<button type="button" class="menu-row new-row" role="menuitem" onclick={name}>
					{@render plusIcon()}
					New collection
				</button>
			{/if}
			{#if refusal}
				<p id="new-collection-error" class="field-error" role="alert">{refusal}</p>
			{/if}
		</div>
	{/snippet}
</Dropdown>

<style>
	/* Under the pill, from its left edge: the row of pills starts at the
	   column's left, so a right-aligned panel would leave the screen. A pill
	   in the phone grid's right column opens from its right edge instead
	   (RecipeActions sets the two properties). */
	.collect-panel {
		--menu-top: calc(100% + 4px);
		--menu-right: var(--collect-right, auto);
		left: var(--collect-left, 0);
		min-width: 220px;
	}

	.new-row {
		gap: 10px;
		border-top: 1px solid var(--color-border);
		border-radius: 0 0 var(--radius-sm) var(--radius-sm);
	}

	.name-step {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px 6px 6px;
		border-top: 1px solid var(--color-border);
	}

	/* A form's button, not one of the row's pills, whose corner it would inherit. */
	.collect-panel .name-step .btn-primary {
		border-radius: var(--radius-md);
	}

	.name-step label {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.field-error {
		padding: 6px;
	}
</style>
