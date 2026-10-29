<script lang="ts">
	import { goto } from '$app/navigation';
	import TagFilter from './TagFilter.svelte';
	import type { Tag } from '#lib/server/db/schema.js';

	let {
		initialQuery = '',
		initialTags = [],
		availableTags
	}: {
		initialQuery?: string;
		initialTags?: string[];
		availableTags: Pick<Tag, 'id' | 'name' | 'slug'>[];
	} = $props();

	// Seeded from the props once so the server render is filled in; the effect
	// below follows later prop changes.
	// svelte-ignore state_referenced_locally
	let searchQuery = $state(initialQuery);
	// svelte-ignore state_referenced_locally
	let selectedTags = $state<string[]>([...initialTags]);

	// The URL is the source of truth: a navigation (back button, a shared link)
	// changes the props, and the fields follow rather than keeping stale input.
	$effect(() => {
		searchQuery = initialQuery;
		selectedTags = [...initialTags];
	});

	// Navigates to the filtered URL. `reset: false` (SvelteKit 3's keepFocus and
	// noScroll): a pressed filter keeps keyboard focus rather than dropping it to
	// the body, and the page stays where it was (decided 29 October 2026).
	function applyFilters() {
		// A throwaway local used only to build the URL string, so it never needs to be reactive.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams();

		if (searchQuery) {
			params.set('q', searchQuery);
		}

		if (selectedTags.length > 0) {
			params.set('tags', selectedTags.join(','));
		}

		const queryString = params.toString();
		const newURL = queryString ? `?${queryString}` : window.location.pathname;

		return goto(newURL, { reset: false });
	}

	// Tags apply on click; the search box applies on submit. Both read the
	// current query, so a tag click right after typing carries the new text.
	function handleTagToggle(tagSlug: string) {
		selectedTags = selectedTags.includes(tagSlug)
			? selectedTags.filter((slug) => slug !== tagSlug)
			: [...selectedTags, tagSlug];
		applyFilters();
	}

	let filters: HTMLDivElement;

	// Clear all leaves the row with the press, so focus moves to the first tag.
	async function handleClear() {
		selectedTags = [];
		await applyFilters();
		filters.querySelector<HTMLButtonElement>('.tag-tabs button')?.focus();
	}
</script>

<div class="search-filters" bind:this={filters}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			applyFilters();
		}}
		class="relative">
		<svg
			class="text-text-3 pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true">
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.35-4.35" />
		</svg>
		<input
			type="search"
			bind:value={searchQuery}
			aria-label="Search recipes by title"
			placeholder="Search recipes by title…"
			class="pl-10" />
	</form>

	<TagFilter
		{availableTags}
		selectedTagSlugs={selectedTags}
		onTagToggle={handleTagToggle}
		onClear={handleClear} />
</div>

<style>
	.search-filters {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	@media (min-width: 1024px) {
		.search-filters form {
			max-width: 560px;
		}
	}
</style>
