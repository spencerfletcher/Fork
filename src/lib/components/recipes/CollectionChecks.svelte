<script lang="ts" module>
	/** A collection as a menu lists it: `has` is whether the recipe (or all the selection, or some: 'mixed') is in it. */
	export type Collection = { id: number; name: string; has?: boolean | 'mixed' };

	/** What a press or a new collection changed: its name, in or out, and the action's answer. */
	export type Collected = { name: string; member: boolean; data?: Record<string, unknown> };
</script>

<script lang="ts">
	import { deserialize } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import { onDestroy, onMount, tick } from 'svelte';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import NameStep from '#lib/components/ui/NameStep.svelte';
	import { plusIcon } from '#lib/components/Icons.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import CollectionToggle from './CollectionToggle.svelte';

	// A menu's Collections group: a check per collection (a recipe may be in
	// several), then New collection, named in place and made with the recipe
	// in it. The ⋯ menu's (MoreActions) for one recipe, and select mode's Add
	// to collection for many, whose `fields` (the ids) ride on every form. It
	// mounts as its menu opens, so each opening starts clean and asks again.
	let {
		collections,
		listAction,
		collectAction,
		newAction,
		fields = {},
		naming = $bindable(false),
		oncollected
	}: {
		/**
		 * The page's list, loaded with it, or 'on-open': asked of `listAction`
		 * as the menu opens. That list is the menu's own: a press changes it in
		 * place and reloads nothing, so a paged list keeps its place.
		 */
		collections: Collection[] | 'on-open';
		listAction?: string;
		collectAction: string;
		newAction: string;
		/** Hidden fields every form here sends, and the list's request too. */
		fields?: Record<string, string>;
		/** The New collection box is open (the host's panel is a form then, not a menu). */
		naming?: boolean;
		/** A collection was checked, unchecked or made; the host reloads its counts. */
		oncollected?: (change: Collected) => void;
	} = $props();

	const onOpen = $derived(collections === 'on-open');

	let root: HTMLElement | undefined = $state();
	let error = $state('');

	// Asked for on open: undefined while the answer is out, null when refused.
	let fetched = $state<Collection[] | null | undefined>(undefined);
	let loadError = $state('');
	const rows = $derived(collections === 'on-open' ? fetched : collections);
	let loadingRow: HTMLElement | undefined = $state();

	// Only the latest request's answer is used, and none once the menu has
	// closed. Focus held on the Loading row moves to the first row once the
	// list is in; a reader who has moved on is left where they are.
	let requests = 0;
	let gone = false;
	onDestroy(() => (gone = true));
	async function load() {
		const request = ++requests;
		loadError = '';
		let list: Collection[] | null = null;
		try {
			const body = new FormData();
			for (const [name, value] of Object.entries(fields)) body.set(name, value);
			const response = await fetch(listAction!, {
				method: 'POST',
				body,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await response.text());
			const answer = result.type === 'success' ? result.data?.collections : undefined;
			if (Array.isArray(answer)) list = answer;
		} catch {
			// Unreachable reads as refused, below.
		}
		if (gone || request !== requests) return;
		const held = !!loadingRow && document.activeElement === loadingRow;
		fetched = list;
		if (!list) loadError = 'Could not load your collections. Try again.';
		if (!held) return;
		await tick();
		root?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
	}
	onMount(() => {
		if (onOpen) load();
	});

	const creating = pendingEnhance({ keepFailure: true, done: () => back() });

	// The menu's own list: made, then asked for again, the page left alone.
	let creatingOwn = $state(false);
	let ownRefusal = $state<string | null>(null);
	const createOwn: SubmitFunction = ({ formData }) => {
		creatingOwn = true;
		ownRefusal = null;
		const name = String(formData.get('name') ?? '').trim();
		return async ({ result }) => {
			if (result.type === 'success') await load();
			creatingOwn = false;
			if (result.type === 'success') {
				oncollected?.({ name, member: true, data: result.data });
				return back();
			}
			const message: unknown = result.type === 'failure' ? result.data?.error : undefined;
			ownRefusal =
				typeof message === 'string' ? message : 'Could not make that collection. Try again.';
		};
	};

	async function name() {
		naming = true;
		error = '';
		await tick();
		root?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
	}

	async function back() {
		naming = false;
		await tick();
		root?.querySelector<HTMLElement>('.new-row')?.focus();
	}

	const namingError = $derived(onOpen ? ownRefusal : creating.error);
	const refusal = $derived(namingError ?? error);
</script>

<div
	class="collection-checks"
	role="group"
	aria-labelledby="more-collections"
	aria-busy={rows === undefined}
	bind:this={root}>
	<p id="more-collections" class="eyebrow-label group-label" role="presentation">Collections</p>
	{#if rows === undefined}
		<!-- A row, so opening has somewhere to put focus while the list is out. -->
		<button
			type="button"
			class="menu-row loading-row"
			role="menuitem"
			aria-disabled="true"
			aria-busy="true"
			bind:this={loadingRow}>
			Loading collections…
		</button>
	{:else if loadError}
		<p class="field-error group-note" role="alert">{loadError}</p>
	{:else if rows}
		<!-- Many collections scroll here, half a row showing that there are more. -->
		<div class="collection-rows">
			{#each rows as collection (collection.id)}
				<CollectionToggle
					{collection}
					action={collectAction}
					{fields}
					refresh={!onOpen}
					report={(message) => (error = message)}
					ondone={(change) => oncollected?.({ name: collection.name, ...change })} />
			{/each}
		</div>
		{#if naming}
			<!-- Escape goes back to the list; a second Escape closes the menu. -->
			<NameStep
				id="new-collection"
				label="New collection"
				action={newAction}
				enhance={onOpen ? createOwn : creating.submit}
				{fields}
				error={namingError}
				pending={onOpen ? creatingOwn : creating.pending}
				submitLabel="Create"
				onback={back} />
		{:else}
			<button type="button" class="menu-row new-row" role="menuitem" onclick={name}>
				{@render plusIcon()}
				New collection
			</button>
		{/if}
	{/if}
	<!-- A naming refusal is the step's own; a check's shows here. -->
	{#if !(naming && namingError)}<FieldError name="new-collection" error={refusal} />{/if}
</div>

<style>
	.group-label {
		padding: 6px 12px 4px;
	}

	.group-note {
		padding: 6px 12px;
		font-size: 0.875rem;
		color: var(--color-text-2);
	}

	.loading-row {
		font-weight: 400;
		color: var(--color-text-2);
	}

	.collection-rows {
		display: flex;
		flex-direction: column;
		max-height: calc(44px * 6.5);
		overflow-y: auto;
	}

	.new-row {
		gap: 10px;
	}

	/* New collection sits under a rule, below the list, as its name step does. */
	.new-row {
		border-top: 1px solid var(--color-border);
	}

	.collection-checks :global(.field-error) {
		padding: 6px;
	}
</style>
