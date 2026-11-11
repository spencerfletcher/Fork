<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { on } from 'svelte/events';
	import TagTabs from './TagTabs.svelte';
	import { friendsIcon, searchIcon } from '#lib/components/Icons.svelte';
	import type { TagChip } from '#lib/recipes/types.js';

	let {
		initialQuery = '',
		initialTags = [],
		availableTags,
		friendsOnly
	}: {
		initialQuery?: string;
		initialTags?: string[];
		availableTags: TagChip[];
		/** Offers the friends' recipes toggle (`friends=1`) when set; undefined hides it. */
		friendsOnly?: boolean;
	} = $props();

	// The params this component writes. Any other (Cookbook's `filter`) is the
	// page's own and rides along untouched.
	const OWN = ['q', 'tags', 'friends'];
	const otherParams = $derived([...page.url.searchParams].filter(([key]) => !OWN.includes(key)));

	// Writable derived: typing and pressing change them, and the URL stays the
	// source of truth: a navigation (back button, a shared link) changes the
	// props, and the fields follow rather than keeping stale input.
	let searchQuery = $derived(initialQuery);
	let selectedTags = $derived([...initialTags]);
	let friends = $derived(friendsOnly ?? false);

	// Navigates to the filtered URL. `reset: false` (SvelteKit 3's keepFocus and
	// noScroll): a pressed filter keeps keyboard focus rather than dropping it to
	// the body, and the page stays where it was (decided 29 October 2026).
	function applyFilters() {
		// A throwaway built into a URL and dropped, not state: nothing reads it reactively.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams(otherParams);

		if (searchQuery) {
			params.set('q', searchQuery);
		}

		if (selectedTags.length > 0) {
			params.set('tags', selectedTags.join(','));
		}

		if (friends) {
			params.set('friends', '1');
		}

		const queryString = params.toString();
		const newURL = queryString ? `?${queryString}` : page.url.pathname;

		return goto(newURL, { reset: false });
	}

	// Tags apply on click; the search box applies on submit. Both read the
	// current query, so a tag click right after typing carries the new text.
	async function handleTagToggle(tagSlug: string) {
		selectedTags = selectedTags.includes(tagSlug)
			? selectedTags.filter((slug) => slug !== tagSlug)
			: [...selectedTags, tagSlug];
		await applyFilters();
	}

	let filters: HTMLDivElement;

	// Clear all leaves the row with the press, so focus moves to the first tag
	// (a tag's button carries its label; the friends filter's does not).
	async function handleClear() {
		selectedTags = [];
		await applyFilters();
		filters.querySelector<HTMLButtonElement>('.tag-tabs button[data-label]')?.focus();
	}
</script>

<div class="search-filters" bind:this={filters}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			applyFilters();
		}}
		class="relative">
		{@render searchIcon(
			'text-text-3 pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4'
		)}
		<!-- Named fields so the form also works as a plain GET before hydration. -->
		{#each otherParams as [name, value], i (i)}
			<input type="hidden" {name} {value} />
		{/each}
		{#if friends}
			<input type="hidden" name="friends" value="1" />
		{/if}
		{#if selectedTags.length > 0}
			<input type="hidden" name="tags" value={selectedTags.join(',')} />
		{/if}
		<input
			type="search"
			name="q"
			bind:value={searchQuery}
			{@attach (field) =>
				// The native × empties the field and fires `search` (so does Enter,
				// which the form's submit already handles); only the emptied field
				// needs applying here, so the results and the URL drop the query.
				// initialQuery is the URL's q: without one there is nothing to clear,
				// and Enter's submit would navigate a second time.
				// Svelte's element types have no `onsearch`, hence `on`.
				on(field, 'search', () => {
					if (!searchQuery && initialQuery) applyFilters();
				})}
			aria-label="Search by name or ingredient"
			placeholder="Search by name or ingredient…"
			class="pl-10" />
	</form>

	<!-- The friends filter leads the tag row, so one row is the filter bar
	     (Spencer, 11 November 2026). It is a tab in look, marked as the other
	     kind, an audience, by its icon and the divider before the tags. -->
	<TagTabs
		tags={availableTags}
		selected={selectedTags}
		onToggle={handleTagToggle}
		onClear={handleClear}
		leading={friendsOnly === undefined ? undefined : friendsFilter} />
</div>

{#snippet friendsFilter()}
	<button
		type="button"
		class="friends-filter"
		aria-pressed={friends}
		onclick={() => {
			friends = !friends;
			applyFilters();
		}}>
		{@render friendsIcon(16)}
		<span data-label="Friends’ recipes">Friends’ recipes</span>
	</button>
	{#if availableTags.length > 0}
		<span class="filter-divider" aria-hidden="true"></span>
	{/if}
{/snippet}

<style>
	.search-filters {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	/* The native × in the field's ink rather than the browser's blue: a 16px
	   glyph masked onto currentColor, centred in a 24px hit. */
	.search-filters input::-webkit-search-cancel-button {
		-webkit-appearance: none;
		width: 24px;
		height: 24px;
		margin-right: -4px;
		background-color: currentColor;
		mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 4l8 8M12 4l-8 8' stroke='black' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")
			center / 16px no-repeat;
		cursor: pointer;
	}

	/* A tag tab (app.css) with its icon before the words, on their line. */
	.friends-filter {
		display: inline-flex;
		align-items: flex-end;
		gap: 6px;
	}

	.friends-filter :global(.icon) {
		flex-shrink: 0;
		margin-bottom: 7px;
	}

	/* A hairline between the audience filter and the tags, the height of the
	   words, on their line. */
	.filter-divider {
		flex-shrink: 0;
		align-self: flex-end;
		width: 1px;
		height: 16px;
		margin-bottom: 8px;
		background: var(--color-border-2);
	}

	@media (min-width: 1024px) {
		.search-filters form {
			max-width: 560px;
		}
	}
</style>
