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
	import CookbookDrafts from './CookbookDrafts.svelte';
	import CookbookCollections from './CookbookCollections.svelte';
	import CookbookSort from './CookbookSort.svelte';
	import SelectBar from './SelectBar.svelte';
	import { selection } from './selection.svelte.js';
	import { plural } from '#lib/helpers.js';
	import { hrefWith, withoutPlace } from '#lib/listPage.js';
	import { pagedList } from '#lib/pagedList.svelte.js';
	import {
		COOKBOOK_FILTERS,
		COOKBOOK_VIEWS,
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

	// Select needs script, so it is drawn only once the page has it.
	let hydrated = $state(false);
	onMount(() => (hydrated = true));

	async function leaveSelect() {
		sel.stop();
		await tick();
		selectButton?.focus();
	}

	const choosing = (recipe: { id: number }) =>
		sel.on
			? { checked: sel.has(recipe.id), onchange: (on: boolean) => sel.set(recipe.id, on) }
			: undefined;
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-head cookbook-head">
			<div>
				<!-- Focusable for the Drafts list, which hands focus here once its last row goes. -->
				<h1 tabindex="-1">Cookbook</h1>
				{#if data.counts.all > 0}
					<p class="page-sub">
						{plural(data.counts.all, 'recipe')}: {data.counts.mine} yours, {data.counts.saved} saved from
						other cooks.
					</p>
				{/if}
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
			<!-- The top bar carries New recipe from 768; a phone's tab bar has no room. -->
			{#if data.counts.all > 0}
				<a href="/recipes/new" class="btn-primary btn-sm cookbook-new">New recipe</a>
			{/if}
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
			<CookbookCollections collections={data.collections} collection={data.collection} />
			{#if data.collection && data.inView.all === 0}
				<!-- No filters over an empty collection, as over an empty cookbook. -->
				<EmptyPanel title="Nothing in {data.collection.name} yet">
					Open a recipe from your Cookbook and choose this collection in its ⋯ menu.
				</EmptyPanel>
			{:else}
				<div class="cookbook-filters">
					<div class="seg" role="group" aria-label="Show">
						{#each COOKBOOK_FILTERS as f (f)}
							<a href={filterHref(f)} aria-current={data.filter === f ? 'page' : undefined}>
								{LABELS[f]}
								<span class="n">{data.inView[f]}</span>
							</a>
						{/each}
					</div>
					<SearchFilters
						initialQuery={data.searchQuery}
						initialTags={data.selectedTags}
						availableTags={data.allTags} />
					<div class="cookbook-view">
						<CookbookSort sort={data.sort} searching={!!data.searchQuery} />
						<div class="seg" role="group" aria-label="View">
							{#each COOKBOOK_VIEWS as v (v)}
								<a href={viewHref(v)} aria-current={data.view === v ? 'page' : undefined}>
									{@render viewIcon(v)}
									{VIEW_LABELS[v]}
								</a>
							{/each}
						</div>
						{#if hydrated}
							<button
								type="button"
								class="text-btn text-btn--ink cookbook-select"
								aria-pressed={sel.on}
								bind:this={selectButton}
								onclick={() => (sel.on ? leaveSelect() : sel.start())}>
								Select
							</button>
						{/if}
					</div>
				</div>

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
							<p>Search looks at titles, descriptions and ingredients.</p>
							<a class="inline-action" href={filterHref(data.filter, ['q'])}>Clear search</a>
						{:else}
							<h2>No recipes match these filters.</h2>
							<a class="inline-action" href={filterHref('all', ['tags'])}>Show all recipes</a>
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
	.cookbook-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
	}

	/* One line beside the title; the subtitle wraps under the title instead. */
	.cookbook-new {
		white-space: nowrap;
	}

	@media (min-width: 768px) {
		.cookbook-new {
			display: none;
		}
	}

	/* Three rows on a phone: the title, the count at full width, then New
	   recipe across the page, so the count no longer squeezes beside it. */
	@media (max-width: 699px) {
		.cookbook-head {
			flex-direction: column;
			align-items: stretch;
		}

		.cookbook-new {
			width: 100%;
		}
	}

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
		min-height: 38px;
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
	   the container's edge; the tag tabs keep the row below, and Sort and
	   Grid | List a row under them. From 1100 those two end the first row. */
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

		.cookbook-filters > :global(.search-filters > :not(form)),
		.cookbook-view {
			grid-column: 1 / -1;
		}
	}

	@media (min-width: 1100px) {
		.cookbook-filters {
			grid-template-columns: auto minmax(0, 1fr) auto;
		}

		.cookbook-view {
			grid-row: 1;
			grid-column: 3;
		}
	}

	/* Sort, then Grid | List at the row's end; on the narrowest phone the
	   switch wraps under the select rather than squeezing it. */
	.cookbook-view {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px 16px;
	}

	/* A phone: the strip spans the column, three equal segments, each a 44px
	   target inside the strip's 52px (its 3px padding and 1px border). */
	@media (max-width: 767px) {
		.cookbook-filters > .seg {
			align-self: stretch;
		}

		.seg a {
			flex: 1;
			min-height: 44px;
		}

		/* The words alone, so Sort keeps room for its longest order on the row. */
		.seg a :global(.icon) {
			display: none;
		}
	}

	/* Pressed, it reads as the mode it is in: underlined, as on hover. */
	.cookbook-select[aria-pressed='true'] {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
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

	.cookbook-none p {
		margin: 6px 0 0;
		color: var(--color-text-2);
	}

	.cookbook-none a {
		display: inline-block;
		margin-top: 18px;
		padding-block: 10px;
		font-weight: 600;
	}
</style>
