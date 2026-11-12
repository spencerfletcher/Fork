<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import RecipeRow from '#lib/components/recipes/RecipeRow.svelte';
	import SearchFilters from '#lib/components/ui/SearchFilters.svelte';
	import EmptyPanel from '#lib/components/ui/EmptyPanel.svelte';
	import ResultStatus from '#lib/components/ui/ResultStatus.svelte';
	import ShowMore from '#lib/components/ui/ShowMore.svelte';
	import Dropdown from '#lib/components/ui/Dropdown.svelte';
	import CookbookDrafts from './CookbookDrafts.svelte';
	import CookbookPicker, { mark, modified, spaceTakes } from './CookbookPicker.svelte';
	import CookbookSheet from './CookbookSheet.svelte';
	import CookbookSort from './CookbookSort.svelte';
	import SelectBar from './SelectBar.svelte';
	import { selection } from './selection.svelte.js';
	import { CARD_SORTS, hrefWith, withoutPlace, type CardSort } from '#lib/listPage.js';
	import { pagedList } from '#lib/pagedList.svelte.js';
	import {
		COOKBOOK_FILTERS,
		COOKBOOK_VIEWS,
		SORT_LABELS,
		type CookbookFilter,
		type CookbookView
	} from './filters.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const list = pagedList(
		() => data,
		(d) => ({ items: d.recipes, next: d.next })
	);
	let grid = $state<HTMLElement>();

	const LABELS: Record<CookbookFilter, string> = { all: 'All', mine: 'Mine', saved: 'Saved' };
	const VIEW_LABELS: Record<CookbookView, string> = { grid: 'Grid', list: 'List' };

	const filtered = $derived(
		!!data.searchQuery || data.selectedTags.length > 0 || data.filter !== 'all' || !!data.collection
	);

	// A filter link keeps the search and tags; All is the bare page. Either
	// starts the list over at its first page.
	function filterHref(filter: CookbookFilter, without: string[] = []): string {
		return hrefWith(page.url, {
			filter: filter === 'all' ? null : filter,
			...Object.fromEntries(without.map((key) => [key, null]))
		});
	}

	// Grid | List keeps the filters and starts the list over, as a filter does.
	// Grid is named too, not dropped: the device may remember List, and the
	// URL wins over it (the server keeps the choice for this device).
	const viewHref = (view: CookbookView) => hrefWith(page.url, { view });

	// The newest change is the bare order, as the Sort select writes it.
	const sortHref = (sort: CardSort) =>
		hrefWith(page.url, { sort: sort === 'newest' ? null : sort });

	// A phone's View sheet holds the order and All · Mine · Saved; with it
	// closed, a choice other than the default still shows, as a pill that
	// undoes it. A sort a search has set aside waits unshown.
	const viewPills = $derived([
		...(data.sort !== 'newest' && !data.searchQuery
			? [{ label: SORT_LABELS[data.sort], href: sortHref('newest') }]
			: []),
		...(data.filter !== 'all' ? [{ label: LABELS[data.filter], href: filterHref('all') }] : [])
	]);

	const VIEW_SHEET = 'cookbook-view-sheet';
	let viewButton = $state<HTMLButtonElement>();

	// A link in the View sheet goes in place, as the picker's rows do, then
	// the sheet closes with focus back on View.
	async function pick(e: MouseEvent, close: () => void) {
		const link = e.target instanceof Element ? e.target.closest('a[href]') : null;
		if (!link || modified(e)) return;
		e.preventDefault();
		await goto(link.getAttribute('href')!, { reset: false });
		close();
	}

	// The library changed (a card's ⋯, select mode's bar). The page loads
	// again at the URL the address bar shows, `?page=N` from Show more
	// included, which loads every page shown: the cards and the counts follow,
	// and the cook keeps their place (scroll and focus left alone; an open
	// menu stays open).
	async function refresh() {
		await goto((page.shallow?.url ?? page.url).href, {
			replace: true,
			reset: false,
			refreshAll: true
		});
	}

	// A card that went hands focus to the card now in its place, else the one
	// before, else the page title, as the Drafts list's does.
	async function reload(recipe: { id: number }): Promise<'kept' | 'gone'> {
		const at = list.items.findIndex((r) => r.id === recipe.id);
		await refresh();
		await tick();
		if (list.items.some((r) => r.id === recipe.id)) return 'kept';
		const links = grid?.querySelectorAll<HTMLElement>('.card-stretched-link, .row-link') ?? [];
		const next = links[Math.min(at, links.length - 1)];
		(next ?? document.querySelector<HTMLElement>('h1'))?.focus();
		return 'gone';
	}

	// Moved to the Trash, a kept copy removed, or unchecked out of the
	// collection being viewed.
	type Removed =
		{ title: string; how: 'trash' | 'copy' } | { title: string; how: 'collection'; from: string };
	let removed = $state<Removed | null>(null);

	async function takeAway(recipe: { id: number; title: string }, how: 'trash' | 'copy') {
		removed = { title: recipe.title, how };
		await reload(recipe);
	}

	async function collected(recipe: { id: number; title: string }) {
		const from = data.collection?.name;
		if ((await reload(recipe)) === 'gone' && from)
			removed = { title: recipe.title, how: 'collection', from };
	}

	// Select mode: the page's state alone. A new list (its filters, sort or
	// view; not Show more) clears the choice.
	const sel = selection(() => withoutPlace(page.url.searchParams).toString());
	const chosen = $derived(list.items.filter((r) => sel.has(r.id)));
	let selectButton = $state<HTMLButtonElement>();
	// Where leaving hands focus: the row's Select, or a phone's View.
	let selectFrom: 'row' | 'view' = 'row';

	// Select needs script, so it is drawn only once the page has it.
	let hydrated = $state(false);
	onMount(() => (hydrated = true));

	function startSelect(from: 'row' | 'view') {
		selectFrom = from;
		sel.start();
	}

	async function leaveSelect() {
		sel.stop();
		await tick();
		(selectFrom === 'view' ? viewButton : selectButton)?.focus();
	}

	const choosing = (recipe: { id: number }) =>
		sel.on
			? { checked: sel.has(recipe.id), onchange: (on: boolean) => sel.set(recipe.id, on) }
			: undefined;
</script>

<div class="page">
	<div class="page-inner">
		<!-- New recipe is the top bar's, at every width. -->
		<div class="page-head">
			<!-- Focusable for the Drafts list, which hands focus here once its last row goes. -->
			<h1 tabindex="-1">Cookbook</h1>
			<!-- What a card's ⋯ just took away; empty until then, so it is heard when it fills. -->
			<p class="page-sub" role="status">
				{#if removed?.how === 'trash'}
					Moved {removed.title} to your Trash.
					<a href="/cookbook/trash" class="inline-action">Open Trash</a>
				{:else if removed?.how === 'collection'}
					Removed {removed.title} from {removed.from}.
				{:else if removed}
					Removed your copy of {removed.title}.
				{/if}
			</p>
		</div>

		{#if data.user}<CookbookDrafts userId={data.user.id} />{/if}

		{#if data.counts.all === 0}
			<!-- No filters over an empty library (decided 29 October 2026). -->
			<EmptyPanel title="Your cookbook is empty" centered>
				Recipes you write and recipes you save from others live here.
				{#snippet action()}
					<a href="/recipes/new" class="btn-primary">New recipe</a>
					<a href="/discover" class="arrow-link">Explore Discover →</a>
				{/snippet}
			</EmptyPanel>
		{:else}
			{#if data.collection && data.inView.all === 0}
				<!-- No filters over an empty collection, as over an empty cookbook, but
				     the picker, the way to another collection. -->
				<div class="cookbook-tools alone">{@render picker(false)}</div>
				<EmptyPanel title="Nothing in {data.collection.name} yet">
					Open a recipe from your Cookbook and choose this collection in its ⋯ menu.
				</EmptyPanel>
			{:else}
				<!-- One set of controls in the tree at any width: below 768 (with
				     script) the segments and the Sort row are display:none and View's
				     sheet draws the same pieces; from 768 View is display:none. -->
				<div class="cookbook-filters">
					{@render showSegments()}
					<!-- The search alone: no tags given, so no tag tabs; the chosen tags
					     still ride along with a search, as the URL's other params do. -->
					<SearchFilters
						initialQuery={data.searchQuery}
						initialTags={data.selectedTags}
						availableTags={[]} />
					<div class="cookbook-tools">
						{@render picker(true)}
						<div class="cookbook-view">
							<CookbookSort sort={data.sort} searching={!!data.searchQuery} />
							{@render viewSegments()}
							<!-- Gone while selecting: the bar's Cancel is the one way out. -->
							{#if hydrated && !sel.on}
								<button
									type="button"
									class="text-btn text-btn--ink cookbook-select"
									bind:this={selectButton}
									onclick={() => startSelect('row')}>
									Select
								</button>
							{/if}
						</div>
					</div>
				</div>
				<!-- The page outline names the collection; its button shows the name once. -->
				{#if data.collection}<h2 class="sr-only">{data.collection.name}</h2>{/if}

				<!-- Screen readers only (Spencer, 9 November 2026): the cards say the count. -->
				<ResultStatus count={data.total} {filtered} />

				{#if list.items.length > 0}
					{#if data.view === 'list'}
						<ul class="row-list" aria-label="Recipes" bind:this={grid}>
							{#each list.items as recipe (recipe.id)}
								<RecipeRow
									{recipe}
									saved={recipe.saved}
									kept={recipe.kept}
									select={choosing(recipe)}
									onremoved={(how) => takeAway(recipe, how)}
									oncollected={() => collected(recipe)} />
							{/each}
						</ul>
					{:else}
						<div class="cookbook-grid" bind:this={grid}>
							{#each list.items as recipe, i (recipe.id)}
								<RecipeCard
									{recipe}
									index={i}
									variant="cookbook"
									saved={recipe.saved}
									kept={recipe.kept}
									select={choosing(recipe)}
									onremoved={(how) => takeAway(recipe, how)}
									oncollected={() => collected(recipe)} />
							{/each}
						</div>
					{/if}
					<ShowMore {list} container={grid} noun="recipe" />
				{:else}
					<div class="cookbook-none">
						{#if data.searchQuery}
							<h2>No recipes match “{data.searchQuery}”.</h2>
							<a class="inline-action hit-link" href={filterHref(data.filter, ['q'])}>
								Clear search
							</a>
						{:else}
							<!-- The pills, the picker and the segments undo each filter. -->
							<h2>No recipes match these filters.</h2>
						{/if}
					</div>
				{/if}
			{/if}
		{/if}

		<!-- At the foot, not among the filters: the Trash is a rare errand, not a
		     view of the library, so it stays out of the way until something is in it. -->
		{#if data.counts.trash > 0}
			<p class="cookbook-trash" class:centered={data.counts.all === 0}>
				<a href="/cookbook/trash" class="arrow-link">Trash ({data.counts.trash}) →</a>
			</p>
		{/if}
	</div>
</div>

{#if sel.on}
	<SelectBar
		{sel}
		{chosen}
		shownIds={list.items.map((r) => r.id)}
		allTags={data.allTags}
		trashCount={data.counts.trash}
		onchanged={refresh}
		onleave={leaveSelect} />
{/if}

<!-- An empty collection has the picker alone, so no View and no pills of its. -->
{#snippet picker(withView: boolean)}
	<CookbookPicker
		collections={data.collections}
		collection={data.collection}
		allTags={data.allTags}
		selectedTags={data.selectedTags}
		total={data.total}
		beside={withView ? viewMenu : undefined}
		viewPills={withView ? viewPills : []} />
{/snippet}

<!-- All · Mine · Saved; the page's group from 768, the sheet's (labelled by its heading) below. -->
{#snippet showSegments(labelledby?: string)}
	<div
		class="seg"
		role="group"
		aria-label={labelledby ? undefined : 'Show'}
		aria-labelledby={labelledby}>
		{#each COOKBOOK_FILTERS as f (f)}
			<a href={filterHref(f)} aria-current={data.filter === f ? 'page' : undefined}>
				{LABELS[f]}
				<span class="n">{data.inView[f]}</span>
			</a>
		{/each}
	</div>
{/snippet}

<!-- Grid | List, the same two places. -->
{#snippet viewSegments(labelledby?: string)}
	<div
		class="seg"
		role="group"
		aria-label={labelledby ? undefined : 'View'}
		aria-labelledby={labelledby}>
		{#each COOKBOOK_VIEWS as v (v)}
			<a href={viewHref(v)} aria-current={data.view === v ? 'page' : undefined}>
				{@render viewIcon(v)}
				{VIEW_LABELS[v]}
			</a>
		{/each}
	</div>
{/snippet}

<!-- A phone's View (P2; owner, 12 November 2026): one button beside the
     pickers opening their sheet with Sort, Show as, All · Mine · Saved and
     Select recipes. Every choice is a link to its URL, so a reload and Back
     keep it. Without script a phone keeps the rows instead (the style). -->
{#snippet viewMenu()}
	<div class="view-menu">
		<Dropdown>
			{#snippet trigger({ 'aria-expanded': open, onclick })}
				<button
					type="button"
					class="btn-ghost btn-sm picker-trigger view-button"
					class:showing={open}
					aria-label="View"
					aria-expanded={open}
					aria-controls={open ? VIEW_SHEET : undefined}
					bind:this={viewButton}
					{onclick}>
					{@render slidersIcon()}
				</button>
			{/snippet}
			{#snippet panel(close)}
				<CookbookSheet id={VIEW_SHEET} total={data.total} {close}>
					<!-- Clicks from the links inside, Enter on a link included. -->
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<div class="view-sheet" onclick={(e) => pick(e, close)}>
						<p id="view-sort" class="eyebrow-label view-heading">Sort</p>
						{#if data.searchQuery}
							<p class="view-note">Best match while you search</p>
						{:else}
							<div role="menu" aria-labelledby="view-sort">
								{#each CARD_SORTS as s (s)}
									<a
										href={sortHref(s)}
										class="menu-row view-row"
										role="menuitemradio"
										aria-checked={data.sort === s}
										onkeydown={spaceTakes}>
										{@render mark(data.sort === s)}
										{SORT_LABELS[s]}
									</a>
								{/each}
							</div>
						{/if}
						<p id="view-as" class="eyebrow-label view-heading">Show as</p>
						{@render viewSegments('view-as')}
						<p id="view-show" class="eyebrow-label view-heading">Show</p>
						{@render showSegments('view-show')}
						<div class="view-select" role="menu" aria-label="Selection">
							<button
								type="button"
								class="menu-row"
								role="menuitem"
								onclick={() => {
									close();
									startSelect('view');
								}}>
								Select recipes
							</button>
						</div>
					</div>
				</CookbookSheet>
			{/snippet}
		</Dropdown>
	</div>
{/snippet}

<!-- View's mark, the sliders: drawn here alone, the 16px line art. -->
{#snippet slidersIcon()}
	<svg
		class="icon"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="2.25"
		stroke-linecap="round"
		stroke-linejoin="round">
		<path d="M4 7h9M19 7h1M4 17h3M11 17h9" />
		<circle cx="16" cy="7" r="2.5" />
		<circle cx="9" cy="17" r="2.5" />
	</svg>
{/snippet}

<!-- Drawn here alone, so not in Icons.svelte; its line art and 16px box. -->
{#snippet viewIcon(view: CookbookView)}
	<svg
		class="icon"
		width="16"
		height="16"
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round">
		{#if view === 'grid'}
			<rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
			<rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
			<rect x="2.5" y="9" width="4.5" height="4.5" rx="1" />
			<rect x="9" y="9" width="4.5" height="4.5" rx="1" />
		{:else}
			<path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
		{/if}
	</svg>
{/snippet}

<style>
	/* A step under the grid's 32px row gap: the first cards belong to the tags
	   above them (Spencer, 10 November 2026: "maybe a bit tighter"). */
	.cookbook-filters {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin-bottom: var(--space-5);
	}

	/* All · Mine · Saved: one bordered strip, the current segment marigold-tinted. */
	.seg {
		display: inline-flex;
		align-self: flex-start;
		padding: 3px;
		border: 1px solid var(--color-border-2);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.seg a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		/* 44px with the strip's border and padding: the tools row's one height. */
		min-height: 36px;
		padding: 0 14px;
		border-radius: 4px;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text-2);
	}

	.seg a:hover {
		color: var(--color-text);
	}

	.seg a[aria-current='page'] {
		background: var(--color-marigold-tint);
		color: var(--color-text);
		box-shadow: inset 0 0 0 1px var(--color-marigold);
	}

	.seg .n {
		font-weight: 400;
		color: var(--color-text-3);
	}

	/* From 768 the segments and the search box share a row, the box filling to
	   the container's edge; the tools (Collections, Tags, their pills, then
	   Sort, Grid | List and Select) take the row below. */
	@media (min-width: 768px) {
		.cookbook-filters {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr);
			align-items: center;
			gap: 14px 16px;
		}

		.cookbook-filters > :global(.search-filters) {
			display: contents;
		}

		.cookbook-filters > :global(.search-filters > form.relative) {
			max-width: none;
		}

		.cookbook-tools {
			grid-column: 1 / -1;
		}
	}

	/* The pickers and the pills first, Sort, Grid | List and Select at the
	   row's end; wrapping, each keeps its line rather than squeezing. */
	.cookbook-tools {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px 16px;
	}

	/* An empty collection: the pickers alone over its empty panel. */
	.cookbook-tools.alone {
		margin-bottom: var(--space-5);
	}

	/* Sort, then Grid | List; on the narrowest phone the switch wraps under
	   the select rather than squeezing it. */
	.cookbook-view {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px 16px;
		margin-left: auto;
	}

	/* A phone: a strip spans its column, equal segments, each a 44px target
	   inside the strip's 52px (its 3px padding and 1px border). */
	@media (max-width: 767px) {
		.cookbook-filters > .seg {
			align-self: stretch;
		}

		.seg a {
			flex: 1;
			min-height: 44px;
		}

		/* Without script, Sort, Grid | List and Select take their own row under
		   the pickers. */
		.cookbook-view {
			flex: 1 1 100%;
		}

		/* The words alone there, so Sort keeps room for its longest order. */
		.cookbook-view .seg a :global(.icon) {
			display: none;
		}

		/* Collections, Tags and View on one row, 8px apart as the two are. */
		.cookbook-tools {
			column-gap: 8px;
		}
	}

	/* With script a phone's segments and Sort row are View's sheet instead
	   (display:none, so out of the accessibility tree too). The pickers' row
	   is then the last before the pills and the cards. */
	@media (max-width: 767px) and (scripting: enabled) {
		.cookbook-filters > .seg,
		.cookbook-view {
			display: none;
		}
	}

	/* And from 768, or without script, View is gone. */
	@media (min-width: 768px), (scripting: none) {
		.view-menu {
			display: none;
		}
	}

	/* A 44px square, the sliders centred by the button's own row. */
	.view-button {
		width: 44px;
		padding: 0;
		justify-content: center;
	}

	.view-heading {
		padding: 10px 12px 6px;
	}

	.view-row {
		gap: 10px;
	}

	.view-note {
		padding: 0 12px 6px;
		color: var(--color-text-2);
	}

	/* The two strips across the sheet, inset to the rows' text. */
	.view-sheet .seg {
		display: flex;
		margin: 0 6px;
	}

	.view-select {
		margin-top: 10px;
		border-top: 1px solid var(--color-border);
		padding-top: 4px;
	}

	/* At the tools' end, wherever they wrap. */
	.cookbook-select {
		margin-left: auto;
	}

	@media (forced-colors: active) {
		.seg a[aria-current='page'] {
			outline: 2px solid CanvasText;
		}
	}

	.cookbook-trash {
		margin-top: var(--space-6);
	}

	/* Under the empty cookbook's centred panel. */
	.cookbook-trash.centered {
		text-align: center;
	}

	.cookbook-none {
		max-width: 46ch;
		padding: 16px 0 24px;
	}

	.cookbook-none h2 {
		font-size: 1.375rem;
	}

	/* The words 28px under the heading; .hit-link's padding reaches the hit. */
	.cookbook-none a {
		display: inline-block;
		margin-top: calc(28px - var(--hit));
		font-weight: 600;
	}
</style>
