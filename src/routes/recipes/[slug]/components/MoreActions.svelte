<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import Dropdown from '#lib/components/ui/Dropdown.svelte';
	import { moreIcon, plusIcon } from '#lib/components/Icons.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { COLLECTION_NAME_MAX } from '#lib/collections.js';
	import { EXPORT_FORMATS, FORMAT_LABEL, exportHref } from '#lib/export/archive.js';
	import CollectionToggle from './CollectionToggle.svelte';

	// The ⋯ at the action row's end. For a recipe in the reader's library it
	// lists their collections first, each a check (a recipe may be in
	// several), and New collection, named in place and made with this recipe
	// in it; then Print, for everyone. One flat menu, so the arrow keys walk
	// every row and a toggle leaves it open.
	let {
		collections,
		exportSlug = null
	}: {
		/** Null outside the reader's library: the menu holds Print alone. */
		collections: { id: number; name: string; has?: boolean }[] | null;
		/** The owner's recipe: an Export row per format after Print; null for anyone else. */
		exportSlug?: string | null;
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

	// The menu goes first, so the print dialog opens over the page alone.
	async function print(close: () => void) {
		close();
		await tick();
		window.print();
	}

	const refusal = $derived(creating.error ?? error);
</script>

<Dropdown
	onopen={() => {
		naming = false;
		error = '';
	}}>
	{#snippet trigger(props)}
		<button
			type="button"
			class="more-button"
			aria-haspopup="menu"
			aria-label="More actions"
			{...props}>
			{@render moreIcon()}
		</button>
	{/snippet}
	{#snippet panel(close)}
		<div
			class="menu-panel more-panel"
			role={naming ? undefined : 'menu'}
			aria-label="More actions"
			bind:this={panelEl}>
			{#if collections}
				<div role="group" aria-labelledby="more-collections">
					<p id="more-collections" class="eyebrow-label group-label" role="presentation">
						Collections
					</p>
					<!-- Many collections scroll here, half a row showing that there are more. -->
					<div class="collection-rows">
						{#each collections as collection (collection.id)}
							<CollectionToggle {collection} report={(message) => (error = message)} />
						{/each}
					</div>
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
				<hr class="rule" />
			{/if}
			<button type="button" class="menu-row print-row" role="menuitem" onclick={() => print(close)}>
				<svg
					class="size-4"
					viewBox="0 0 16 16"
					aria-hidden="true"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round">
					<path d="M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2M4.5 9.5h7v4h-7z" />
				</svg>
				Print
			</button>
			<!-- A download, not a navigation: Dropdown closes on a menu link's click. -->
			{#if exportSlug}
				{#each EXPORT_FORMATS as format (format)}
					<a
						class="menu-row export-row"
						role="menuitem"
						href={exportHref(format, exportSlug)}
						download>
						<svg
							class="size-4"
							viewBox="0 0 16 16"
							aria-hidden="true"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round">
							<path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
						</svg>
						Export {FORMAT_LABEL[format]}
					</a>
				{/each}
			{/if}
		</div>
	{/snippet}
</Dropdown>

<style>
	/* Under the trigger, from its right edge: the trigger ends the row, so
	   the panel opens back over the pills, inside the column. */
	.more-panel {
		--menu-top: calc(100% + 4px);
	}

	.group-label {
		padding: 6px 12px 4px;
	}

	.collection-rows {
		display: flex;
		flex-direction: column;
		max-height: calc(44px * 6.5);
		overflow-y: auto;
	}

	.new-row,
	.print-row,
	.export-row {
		gap: 10px;
	}

	/* New collection sits under a rule, below the list. */
	.new-row,
	.name-step {
		border-top: 1px solid var(--color-border);
	}

	.rule {
		margin: 6px 0;
		border: 0;
		border-top: 1px solid var(--color-border);
	}

	.name-step {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px 6px 6px;
	}

	/* A form's button, not one of the row's pills, whose corner it would inherit. */
	.more-panel .name-step .btn-primary {
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
