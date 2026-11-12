<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import Dropdown from '#lib/components/ui/Dropdown.svelte';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import { chevronIcon, plusIcon } from '#lib/components/Icons.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { COLLECTION_NAME_MAX } from '#lib/collections.js';
	import { hrefWith } from '#lib/listPage.js';
	import { plural } from '#lib/helpers.js';
	import { tagKey } from '#lib/recipes/tags.js';
	import type { TagChip } from '#lib/recipes/types.js';

	// The Cookbook's collection and tag filters (F3 hybrid, Spencer, 12
	// November 2026): two buttons opening one panel, a find box over both
	// groups, the group whose button opened it first. One collection at a
	// time; tags are ticks. Every row is a link to its filtered URL, so a
	// reload, Back and a shared link all land on the same list. The chosen
	// collection's Rename and Delete sit under its row (owner, 12 November
	// 2026: "drop the heading"), so its name shows once, on its button.
	let {
		collections,
		collection,
		allTags,
		selectedTags,
		total
	}: {
		collections: { id: number; name: string; count: number }[];
		collection: { id: number; name: string } | null;
		allTags: TagChip[];
		/** The URL's known tags, by slug. */
		selectedTags: string[];
		/** The current list's count, for Show N recipes. */
		total: number;
	} = $props();

	type Group = 'collections' | 'tags';
	const PANEL_ID = 'cookbook-picker';
	const PHONE = '(max-width: 767px)';

	let first = $state<Group>('collections');
	let query = $state('');
	let naming = $state(false);
	let renaming = $state(false);
	let deleting = $state(false);
	let closePanel: (() => void) | undefined;

	const collectionHref = (id: number | null) =>
		hrefWith(page.url, { collection: id === null ? null : String(id) });
	const tagsHref = (slugs: string[]) =>
		hrefWith(page.url, { tags: slugs.length > 0 ? slugs.join(',') : null });
	const toggledHref = (slug: string) =>
		tagsHref(
			selectedTags.includes(slug) ? selectedTags.filter((s) => s !== slug) : [...selectedTags, slug]
		);

	// Anywhere in the name, as TagInput finds; the names that start with it first.
	const typed = $derived(tagKey(query));
	function found<T extends { name: string }>(rows: T[]): T[] {
		if (!typed) return rows;
		const hits = rows.filter((r) => tagKey(r.name).includes(typed));
		return [
			...hits.filter((r) => tagKey(r.name).startsWith(typed)),
			...hits.filter((r) => !tagKey(r.name).startsWith(typed))
		];
	}
	const shownCollections = $derived(found(collections));
	const shownTags = $derived(found(allTags));
	// At rest the opened group alone; typing adds the other's matches under it.
	const groups = $derived(
		(first === 'collections'
			? (['collections', 'tags'] as const)
			: (['tags', 'collections'] as const)
		).filter((g) =>
			typed ? (g === 'collections' ? shownCollections : shownTags).length > 0 : g === first
		)
	);
	const matches = $derived(
		`${plural(shownCollections.length, 'collection')}, ${plural(shownTags.length, 'tag')}`
	);
	const nothingFound = $derived(!!typed && shownCollections.length + shownTags.length === 0);

	// Opened from one button with the panel already up, the panel turns to it,
	// and Escape then hands focus back to that button.
	function opener(
		group: Group,
		toggle: (e: MouseEvent) => void,
		claim: (e: MouseEvent) => void,
		open: boolean
	) {
		return (e: MouseEvent) => {
			const turning = open && first !== group;
			first = group;
			if (turning) return claim(e);
			query = '';
			naming = false;
			renaming = false;
			deleting = false;
			toggle(e);
		};
	}

	// The keyboard stays down on a phone, for browsing; a desktop types at once.
	const focusOnOpen = (root: HTMLElement) =>
		window.matchMedia?.(PHONE).matches
			? root.querySelector<HTMLElement>('[role^="menuitem"]')
			: root.querySelector<HTMLElement>('input[type="search"]');

	// A row is a link (no script: it simply goes); with script it stays on the
	// page. A collection returns to the recipes; a tag leaves the panel open.
	async function choose(e: MouseEvent, href: string, closes: boolean) {
		if (modified(e)) return;
		e.preventDefault();
		await goto(href, { reset: false });
		if (closes) closePanel?.();
	}

	// A click for a new tab or window is the browser's.
	const modified = (e: MouseEvent) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

	// Menu items take Space as well as Enter; a link alone takes Enter.
	function spaceTakes(e: KeyboardEvent) {
		if (e.key !== ' ') return;
		e.preventDefault();
		(e.currentTarget as HTMLElement).click();
	}

	// A pill's tag dropped in place; focus to the pill now in its place, else
	// the one before, else Tags.
	let pills: HTMLElement | undefined = $state();
	let tagsButton: HTMLElement | undefined = $state();
	async function dropTag(e: MouseEvent, slug: string) {
		if (modified(e)) return;
		const at = selectedTags.indexOf(slug);
		e.preventDefault();
		await goto(toggledHref(slug), { reset: false });
		await tick();
		const left = pills?.querySelectorAll<HTMLElement>('a') ?? [];
		(left[at] ?? left[at - 1] ?? tagsButton)?.focus();
	}

	// Made, the action redirects to the new collection; the panel closes on it.
	const creating = pendingEnhance({ keepFailure: true, done: () => closePanel?.() });

	async function stopNaming() {
		naming = false;
		await tick();
		document.querySelector<HTMLElement>('.picker-new')?.focus();
	}

	// Renamed or deleted, the panel closes; its button names what is chosen now.
	const renamed = pendingEnhance({ keepFailure: true, done: () => closePanel?.() });
	const removed = pendingEnhance({
		keepOnError: true,
		keepFailure: true,
		done: () => closePanel?.()
	});

	async function stopRenaming() {
		renaming = false;
		await tick();
		document.querySelector<HTMLElement>('.picker-rename')?.focus();
	}

	async function startRenaming() {
		renaming = true;
		await tick();
		const box = document.getElementById('picker-rename') as HTMLInputElement | null;
		box?.focus();
		box?.select();
	}

	async function startNaming() {
		naming = true;
		await tick();
		document.getElementById('picker-new-collection')?.focus();
	}
</script>

<div class="picker">
	<Dropdown {focusOnOpen}>
		{#snippet trigger({ 'aria-expanded': open, onclick }, claim)}
			<div class="picker-buttons">
				<button
					type="button"
					class="btn-ghost btn-sm picker-trigger"
					class:showing={open && first === 'collections'}
					aria-expanded={open}
					aria-controls={open ? PANEL_ID : undefined}
					aria-label={collection ? `Collection: ${collection.name}` : undefined}
					onclick={opener('collections', onclick, claim, open)}>
					<span class="picker-label">{collection?.name ?? 'Collections'}</span>
					{@render chevronIcon(open && first === 'collections')}
				</button>
				<button
					type="button"
					class="btn-ghost btn-sm picker-trigger"
					class:showing={open && first === 'tags'}
					aria-expanded={open}
					aria-controls={open ? PANEL_ID : undefined}
					bind:this={tagsButton}
					onclick={opener('tags', onclick, claim, open)}>
					Tags
					{@render chevronIcon(open && first === 'tags')}
				</button>
			</div>
		{/snippet}
		{#snippet panel(close)}
			<!-- A phone's backdrop: the page and the tab bar under the sheet read as
			     inactive, and a press on them closes it. Inside the dropdown, so the
			     press is the picker's own. -->
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (a pointer convenience: Escape and Show N recipes close it from the keyboard) -->
			<div class="picker-scrim" aria-hidden="true" onclick={close}></div>
			<div
				class="menu-panel picker-panel"
				id={PANEL_ID}
				{@attach () => {
					closePanel = close;
					return () => (closePanel = undefined);
				}}>
				<div class="picker-find">
					<label for="picker-find" class="sr-only">Find a collection or tag</label>
					<input
						id="picker-find"
						type="search"
						autocomplete="off"
						placeholder="Find a collection or tag…"
						bind:value={query} />
				</div>
				<div class="picker-lists" role="menu" aria-label="Collections and tags">
					{#each groups as group (group)}
						<div role="group" aria-labelledby="picker-{group}">
							<p id="picker-{group}" class="eyebrow-label picker-heading" role="presentation">
								{group === 'collections' ? 'Collections' : 'Tags'}
							</p>
							{#if group === 'collections'}
								{#if !typed}
									<a
										href={collectionHref(null)}
										class="menu-row picker-row"
										role="menuitemradio"
										aria-checked={!collection}
										onclick={(e) => choose(e, collectionHref(null), true)}
										onkeydown={spaceTakes}>
										{@render mark(!collection)}
										<span class="picker-name">All collections</span>
									</a>
								{/if}
								{#each shownCollections as c (c.id)}
									{@const href = collectionHref(c.id)}
									<a
										{href}
										class="menu-row picker-row"
										role="menuitemradio"
										aria-checked={collection?.id === c.id}
										onclick={(e) => choose(e, href, true)}
										onkeydown={spaceTakes}>
										{@render mark(collection?.id === c.id)}
										<span class="picker-name">{c.name}</span>
										<span class="picker-count">{c.count}</span>
										{#if typed && collection && collection.id !== c.id}
											<span class="picker-note">Replaces {collection.name}</span>
										{/if}
									</a>
									{#if !typed && collection?.id === c.id}
										{@render chosenActions(collection)}
									{/if}
								{/each}
								{#if !typed && !naming}
									<button
										type="button"
										class="menu-row picker-row picker-new"
										role="menuitem"
										onclick={startNaming}>
										{@render plusIcon()}
										New collection
									</button>
								{/if}
							{:else}
								{#each shownTags as tag (tag.id)}
									{@const on = selectedTags.includes(tag.slug)}
									{@const href = toggledHref(tag.slug)}
									<a
										{href}
										class="menu-row picker-row"
										role="menuitemcheckbox"
										aria-checked={on}
										onclick={(e) => choose(e, href, false)}
										onkeydown={spaceTakes}>
										{@render mark(on)}
										<span class="picker-name">{tag.name}</span>
									</a>
								{/each}
							{/if}
						</div>
					{/each}
				</div>
				<!-- Said to a screen reader as the find box narrows, as ResultStatus says a list's count. -->
				<p class="sr-only" role="status">
					{#if typed}{matches}{/if}
				</p>
				{#if nothingFound}
					<p class="picker-none">No collection or tag called “{query.trim()}”.</p>
				{/if}
				{#if naming}
					<form
						method="POST"
						action="?/createCollection"
						class="picker-naming"
						use:enhance={creating.submit}>
						<label for="picker-new-collection">New collection</label>
						<input
							id="picker-new-collection"
							name="name"
							type="text"
							maxlength={COLLECTION_NAME_MAX}
							required
							autocomplete="off"
							aria-invalid={creating.error ? true : undefined}
							aria-describedby={creating.error ? 'picker-new-collection-error' : undefined}
							onkeydown={(e) => {
								// Back to the list; a second Escape closes the panel.
								if (e.key === 'Escape') {
									e.stopPropagation();
									stopNaming();
								}
							}} />
						<button type="submit" class="btn-primary btn-sm" disabled={creating.pending}>
							Create
						</button>
						<FieldError name="picker-new-collection" error={creating.error} />
					</form>
				{/if}
				<!-- A phone's way back to the recipes, the count as it stands now. -->
				<div class="picker-foot">
					<button type="button" class="btn-primary picker-show" onclick={close}>
						Show {plural(total, 'recipe')}
					</button>
				</div>
			</div>
		{/snippet}
	</Dropdown>
</div>

{#if selectedTags.length > 0}
	<div class="picker-pills" bind:this={pills}>
		{#each selectedTags as slug (slug)}
			{@const tag = allTags.find((t) => t.slug === slug)}
			<a
				href={toggledHref(slug)}
				class="tag picker-pill"
				aria-label="Remove {tag?.name ?? slug}"
				onclick={(e) => dropTag(e, slug)}>
				{tag?.name ?? slug}
				<span aria-hidden="true">×</span>
			</a>
		{/each}
	</div>
{/if}

<!-- Without script the panel never opens: the two groups as plain links. -->
<noscript>
	<nav class="tag-tabs" aria-label="Collections">
		<a href={collectionHref(null)} aria-current={collection ? undefined : 'page'}>
			All collections
		</a>
		{#each collections as c (c.id)}
			<a href={collectionHref(c.id)} aria-current={collection?.id === c.id ? 'page' : undefined}>
				{c.name}
			</a>
		{/each}
	</nav>
	<nav class="tag-tabs" aria-label="Tags">
		{#each allTags as tag (tag.id)}
			<a
				href={toggledHref(tag.slug)}
				aria-current={selectedTags.includes(tag.slug) ? 'true' : undefined}>
				{tag.name}
			</a>
		{/each}
	</nav>
</noscript>

<!-- Under the chosen collection's row: Rename and Delete, quiet, at the names' edge. -->
{#snippet chosenActions(chosen: { id: number; name: string })}
	{#if renaming}
		<form
			method="POST"
			action="?/renameCollection"
			class="picker-naming picker-indent"
			use:enhance={renamed.submit}>
			<input type="hidden" name="id" value={chosen.id} />
			<label for="picker-rename" class="sr-only">Collection name</label>
			<input
				id="picker-rename"
				name="name"
				type="text"
				maxlength={COLLECTION_NAME_MAX}
				required
				autocomplete="off"
				value={chosen.name}
				aria-invalid={renamed.error ? true : undefined}
				aria-describedby={renamed.error ? 'picker-rename-error' : undefined}
				onkeydown={(e) => {
					// Back to the row; a second Escape closes the panel.
					if (e.key === 'Escape') {
						e.stopPropagation();
						stopRenaming();
					}
				}} />
			<button type="submit" class="btn-primary btn-sm" disabled={renamed.pending}>Save</button>
			<FieldError name="picker-rename" error={renamed.error} />
		</form>
	{:else}
		<div class="picker-chosen picker-indent">
			{#if !deleting}
				<button
					type="button"
					class="menu-row picker-quiet picker-rename"
					role="menuitem"
					aria-label="Rename {chosen.name}"
					onclick={startRenaming}>
					Rename
				</button>
			{/if}
			<ConfirmStep
				bind:open={deleting}
				trigger="Delete collection"
				triggerClass="menu-row picker-quiet"
				triggerRole="menuitem"
				label="Delete {chosen.name}?"
				explanation="Only the collection goes; its recipes stay in your Cookbook."
				confirmLabel="Delete collection"
				pendingLabel="Deleting…"
				keepLabel="Keep"
				action="?/deleteCollection"
				enhance={removed.submit}
				pending={removed.pending}
				error={removed.error}>
				{#snippet fields()}<input type="hidden" name="id" value={chosen.id} />{/snippet}
			</ConfirmStep>
		</div>
	{/if}
{/snippet}

<!-- The check of a chosen row; its room kept while unchosen, so the names line up. -->
{#snippet mark(on: boolean)}
	<svg
		class="picker-mark"
		class:on
		width="16"
		height="16"
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.75"
		stroke-linecap="round"
		stroke-linejoin="round">
		<path d="m3.5 8.5 3 3 6-7" />
	</svg>
{/snippet}

<style>
	.picker-buttons {
		display: flex;
		gap: 8px;
	}

	/* The words, then the chevron, centred on their line by the row. The
	   select's own look (app.css), so the row's controls share one light edge
	   with Sort beside them (owner, 12 November 2026: "lighten to match"). */
	.picker-trigger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		max-width: 16rem;
		border-color: var(--color-input-border);
		background: var(--color-surface);
	}

	/* Both buttons control the open panel; the band marks the group it shows,
	   and the ghost's hover. */
	.picker-trigger.showing,
	.picker-trigger:hover {
		background: var(--color-band);
	}

	.picker-trigger :global(.chevron) {
		flex: none;
		width: 12px;
		height: 12px;
		color: var(--color-text-2);
	}

	.picker-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Under the buttons from their left edge, wider than a menu. Dropdown's
	   panel look; only its place and width are the picker's. */
	.picker :global(.menu-panel.picker-panel) {
		right: auto;
		left: 0;
		top: calc(100% + 6px);
		width: 22rem;
		max-width: calc(100vw - 36px);
	}

	.picker-find {
		padding: 2px 2px 6px;
	}

	.picker-find input {
		width: 100%;
	}

	/* Fifty of each scroll here, half a row showing that there are more; the
	   page under it never moves. */
	.picker-lists {
		max-height: calc(44px * 8.5);
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.picker-heading {
		padding: 8px 12px 4px;
	}

	.picker-row {
		gap: 10px;
	}

	.picker-name {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.picker-count,
	.picker-note {
		font-weight: 400;
		color: var(--color-text-3);
	}

	.picker-note {
		font-size: 0.875rem;
	}

	.picker-mark {
		flex: none;
		visibility: hidden;
	}

	.picker-mark.on {
		visibility: visible;
	}

	.picker-new {
		border-top: 1px solid var(--color-border);
	}

	/* The chosen collection's actions start at its name: the row's 12px side,
	   the 16px check and the row's 10px gap. */
	.picker-indent {
		padding-left: 38px;
	}

	.picker-chosen {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}

	/* Quiet: Ink 2 at the row's weight less a step, as wide as their words. */
	.picker-chosen :global(.picker-quiet) {
		width: auto;
		padding: 0 10px;
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--color-text-2);
	}

	.picker-chosen :global(.picker-quiet:first-child) {
		margin-left: -10px;
	}

	.picker-chosen :global(.confirm-step) {
		padding: 6px 6px 6px 0;
	}

	.picker-none {
		padding: 10px 12px;
		color: var(--color-text-2);
	}

	.picker-naming {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 8px 6px 6px;
		border-top: 1px solid var(--color-border);
	}

	.picker-naming label {
		flex-basis: 100%;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.picker-naming input {
		flex: 1 1 10rem;
		min-width: 0;
	}

	.picker-naming :global(.field-error) {
		flex-basis: 100%;
	}

	/* Show N recipes and the backdrop are a phone's; a desktop panel closes on
	   a press outside. */
	.picker-foot,
	.picker-scrim {
		display: none;
	}

	.picker-pills {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.picker-pill {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	/* A phone: the buttons share their row half and half, and the panel is a
	   sheet over the foot of the screen, over the tab bar (z-index 40), so
	   neither the bar nor anything else covers Show N recipes. */
	@media (max-width: 767px) {
		.picker {
			flex: 1 1 100%;
		}

		.picker-buttons > .picker-trigger {
			flex: 1 1 0;
			justify-content: space-between;
			max-width: none;
			min-width: 0;
		}

		.picker :global(.menu-panel.picker-panel) {
			position: fixed;
			top: auto;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: 51;
			width: auto;
			max-width: none;
			max-height: 80dvh;
			padding-bottom: calc(6px + env(safe-area-inset-bottom));
			border-width: 1px 0 0;
			border-radius: var(--radius-md) var(--radius-md) 0 0;
		}

		/* Over the tab bar (40) and the top bar (50, earlier in the page, so
		   the same layer covers it), under the sheet; the page's ink, faint. */
		.picker-scrim {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 50;
			background: color-mix(in srgb, var(--color-text) 32%, transparent);
		}

		.picker-lists {
			max-height: none;
			flex: 1 1 auto;
			min-height: 0;
		}

		.picker-foot {
			display: block;
			padding: 8px 6px 2px;
			border-top: 1px solid var(--color-border);
		}

		.picker-show {
			width: 100%;
		}

		/* The 24px pill reaches 44px for a finger, into the row gaps around it
		   and not the layout (a hit-link's negative margin pulled it up). */
		.picker-pill::after {
			content: '';
			position: absolute;
			inset: -10px 0;
		}
	}
</style>
