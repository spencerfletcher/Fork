<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import { tick } from 'svelte';
	import Dropdown from '#lib/components/ui/Dropdown.svelte';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import {
		editIcon,
		forkIcon,
		journalIcon,
		moreIcon,
		plusIcon
	} from '#lib/components/Icons.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { COLLECTION_NAME_MAX } from '#lib/collections.js';
	import { EXPORT_FORMATS, FORMAT_LABEL, exportHref } from '#lib/export/archive.js';
	import { TRASH_DAYS } from '#lib/trash.js';
	import CollectionToggle from './CollectionToggle.svelte';

	// The one ⋯ menu for a recipe: the recipe page's action row ends in it, and
	// so does a Cookbook card. For a recipe in the reader's library it lists
	// their collections first, each a check (a recipe may be in several), and
	// New collection, named in place and made with this recipe in it; then each
	// row its host asks for, in this order: Print, Add to Journal, Edit recipe,
	// the Exports, Fork, and last the one that takes the recipe out of the
	// Cookbook, asked twice in place. One flat menu, so the arrow keys walk
	// every row and a toggle leaves it open. Every form posts to the recipe's
	// own route by its full path, so a host page keeps its query.
	type Collection = { id: number; name: string; has?: boolean };
	let {
		slug,
		title,
		collections,
		label = 'More actions',
		print = false,
		journal = false,
		edit = false,
		exports = false,
		fork = false,
		trash = false,
		removeCopy = false,
		onremoved
	}: {
		slug: string;
		title: string;
		/**
		 * The page's list, loaded with it; null outside the reader's library;
		 * 'on-open' asks the recipe's collections action as the menu opens (a
		 * card, one of many on a page). That list is the menu's own: a press
		 * changes it in place and reloads nothing, so a paged list keeps its place.
		 */
		collections: Collection[] | null | 'on-open';
		/** The trigger's name: a card says which recipe. */
		label?: string;
		print?: boolean;
		journal?: boolean;
		edit?: boolean;
		/** The owner's: an Export row per format. */
		exports?: boolean;
		fork?: boolean;
		/** The owner's Move to Trash. */
		trash?: boolean;
		/** A kept copy's Remove from Cookbook. */
		removeCopy?: boolean;
		/** The recipe left the reader's library; the host takes it off the page. */
		onremoved?: (how: 'trash' | 'copy') => void;
	} = $props();

	const base = $derived(`/recipes/${slug}`);
	const onOpen = $derived(collections === 'on-open');

	let naming = $state(false);
	let confirming = $state(false);
	let error = $state('');
	let panelEl: HTMLElement | undefined = $state();

	// Asked for on open: undefined while the answer is out, null when refused.
	let fetched = $state<Collection[] | null | undefined>(undefined);
	let loadError = $state('');
	const rows = $derived(collections === 'on-open' ? fetched : collections);

	async function load() {
		loadError = '';
		try {
			const response = await fetch(`${base}?/collections`, {
				method: 'POST',
				body: new FormData(),
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result = deserialize(await response.text());
			const list = result.type === 'success' ? result.data?.collections : undefined;
			if (!Array.isArray(list)) throw new Error(result.type);
			fetched = list;
		} catch {
			fetched = null;
			loadError = 'Could not load your collections. Try again.';
		}
	}

	const creating = pendingEnhance({ keepFailure: true, done: () => back() });

	// The menu's own list: made, then asked for again, the page left alone.
	let creatingOwn = $state(false);
	let ownRefusal = $state<string | null>(null);
	const createOwn: SubmitFunction = () => {
		creatingOwn = true;
		ownRefusal = null;
		return async ({ result }) => {
			if (result.type === 'success') await load();
			creatingOwn = false;
			if (result.type === 'success') return back();
			const message: unknown = result.type === 'failure' ? result.data?.error : undefined;
			ownRefusal =
				typeof message === 'string' ? message : 'Could not make that collection. Try again.';
		};
	};

	const forking = pendingEnhance({ keepFailure: true, keepOnError: true });

	// Out of the Cookbook (the Trash, or a copy removed): the action's redirect
	// is the move done, and the host takes the card off its page in place.
	let leaving = $state(false);
	let leaveError = $state<string | null>(null);
	const leave =
		(how: 'trash' | 'copy', failed: string): SubmitFunction =>
		() => {
			leaving = true;
			leaveError = null;
			return async ({ result }) => {
				leaving = false;
				if (result.type === 'redirect') return onremoved?.(how);
				const message: unknown = result.type === 'failure' ? result.data?.error : undefined;
				leaveError = typeof message === 'string' ? message : failed;
			};
		};

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
	async function printPage(close: () => void) {
		close();
		await tick();
		window.print();
	}

	const namingError = $derived(onOpen ? ownRefusal : creating.error);
	const refusal = $derived(namingError ?? error);
</script>

<Dropdown
	onopen={() => {
		naming = false;
		confirming = false;
		error = '';
		ownRefusal = null;
		leaveError = null;
		if (onOpen) {
			fetched = undefined;
			load();
		}
	}}>
	{#snippet trigger(props)}
		<button type="button" class="more-button" aria-haspopup="menu" aria-label={label} {...props}>
			{@render moreIcon()}
		</button>
	{/snippet}
	{#snippet panel(close)}
		<div
			class="menu-panel more-panel"
			role={naming || confirming ? undefined : 'menu'}
			aria-label="More actions"
			bind:this={panelEl}>
			{#if rows !== null || loadError}
				<div role="group" aria-labelledby="more-collections" aria-busy={rows === undefined}>
					<p id="more-collections" class="eyebrow-label group-label" role="presentation">
						Collections
					</p>
					{#if rows === undefined}
						<p class="group-note" role="presentation">Loading…</p>
					{:else if loadError}
						<p class="field-error group-note" role="alert">{loadError}</p>
					{:else if rows}
						<!-- Many collections scroll here, half a row showing that there are more. -->
						<div class="collection-rows">
							{#each rows as collection (collection.id)}
								<CollectionToggle
									{collection}
									action="{base}?/collect"
									refresh={!onOpen}
									report={(message) => (error = message)} />
							{/each}
						</div>
						{#if naming}
							<form
								method="POST"
								action="{base}?/newCollection"
								class="name-step"
								use:enhance={onOpen ? createOwn : creating.submit}>
								<label for="new-collection-name">New collection</label>
								<input
									id="new-collection-name"
									name="name"
									type="text"
									maxlength={COLLECTION_NAME_MAX}
									required
									autocomplete="off"
									aria-invalid={namingError ? true : undefined}
									aria-describedby={namingError ? 'new-collection-error' : undefined}
									onkeydown={(e) => {
										// Back to the list; a second Escape closes the menu.
										if (e.key === 'Escape') {
											e.stopPropagation();
											back();
										}
									}} />
								<button
									type="submit"
									class="btn-primary btn-sm"
									disabled={onOpen ? creatingOwn : creating.pending}>
									Create
								</button>
							</form>
						{:else}
							<button type="button" class="menu-row new-row" role="menuitem" onclick={name}>
								{@render plusIcon()}
								New collection
							</button>
						{/if}
					{/if}
					<FieldError name="new-collection" error={refusal} />
				</div>
				<hr class="rule" />
			{/if}
			{#if print}
				<button
					type="button"
					class="menu-row icon-row"
					role="menuitem"
					onclick={() => printPage(close)}>
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
			{/if}
			{#if journal}
				<a
					class="menu-row icon-row"
					role="menuitem"
					href="/journal/new?recipe={encodeURIComponent(slug)}">
					{@render journalIcon()}
					Add to Journal
				</a>
			{/if}
			{#if edit}
				<a class="menu-row icon-row" role="menuitem" href="{base}/edit">
					{@render editIcon()}
					Edit recipe
				</a>
			{/if}
			<!-- A download, not a navigation: Dropdown closes on a menu link's click. -->
			{#if exports}
				{#each EXPORT_FORMATS as format (format)}
					<a class="menu-row icon-row" role="menuitem" href={exportHref(format, slug)} download>
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
			{#if fork}
				<!-- One press, as the action row's Fork: the server writes the first commit message. -->
				<form method="POST" action="{base}?/fork" role="none" use:enhance={forking.submit}>
					<button
						type="submit"
						class="menu-row icon-row"
						role="menuitem"
						disabled={forking.pending}
						aria-busy={forking.pending || undefined}>
						{@render forkIcon()}
						Fork
					</button>
				</form>
				<FieldError name="fork" error={forking.error} />
			{/if}
			{#if trash || removeCopy}
				<hr class="rule" />
				<!-- The recipe page's own words: Delete recipe's, and a kept copy's Remove. -->
				{#if trash}
					<ConfirmStep
						bind:open={confirming}
						trigger="Move to Trash"
						triggerClass="menu-row icon-row danger"
						triggerRole="menuitem"
						triggerIcon={trashIcon}
						label="Move {title} to Trash?"
						explanation="Moves {title} to your Trash. You can restore it for {TRASH_DAYS} days."
						confirmLabel="Move to Trash"
						pendingLabel="Moving…"
						keepLabel="Keep recipe"
						action="{base}/edit?/deleteRecipe"
						enhance={leave('trash', 'Could not move that to the Trash. Try again.')}
						pending={leaving}
						error={leaveError} />
				{:else}
					<ConfirmStep
						bind:open={confirming}
						trigger="Remove from Cookbook"
						triggerClass="menu-row icon-row danger"
						triggerRole="menuitem"
						label="Remove your copy of {title}?"
						explanation="Your copy and your note go for good."
						confirmLabel="Remove"
						pendingLabel="Removing…"
						keepLabel="Keep"
						action="{base}?/removeCopy"
						enhance={leave('copy', 'Could not remove your copy. Try again.')}
						pending={leaving}
						error={leaveError} />
				{/if}
			{/if}
		</div>
	{/snippet}
</Dropdown>

{#snippet trashIcon()}
	<svg
		class="size-4"
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round">
		<path d="M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.7 9h6.6l.7-9" />
	</svg>
{/snippet}

<style>
	/* Under the trigger, from its right edge: the trigger ends its row (the
	   action row, a card's first line), so the panel opens back over it. */
	.more-panel {
		--menu-top: calc(100% + 4px);
	}

	.group-label {
		padding: 6px 12px 4px;
	}

	.group-note {
		padding: 6px 12px;
		font-size: 0.875rem;
		color: var(--color-text-2);
	}

	.collection-rows {
		display: flex;
		flex-direction: column;
		max-height: calc(44px * 6.5);
		overflow-y: auto;
	}

	.new-row,
	.icon-row {
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

	.more-panel :global(.field-error) {
		padding: 6px;
	}

	/* The step's sentence and buttons, inside the panel's edge. */
	.more-panel :global(.confirm-step) {
		padding: 6px;
	}
</style>
