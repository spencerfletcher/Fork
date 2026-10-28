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

	// Update URL when Apply button is clicked
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

		goto(newURL);
	}

	// Tags apply on click; the search box applies on submit. Both read the
	// current query, so a tag click right after typing carries the new text.
	function handleTagToggle(tagSlug: string) {
		selectedTags = selectedTags.includes(tagSlug)
			? selectedTags.filter((slug) => slug !== tagSlug)
			: [...selectedTags, tagSlug];
		applyFilters();
	}

	function handleClear() {
		selectedTags = [];
		applyFilters();
	}
</script>

<div class="border-border space-y-4 rounded-lg border bg-white p-4">
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
			placeholder="Search recipes by title..."
			class="border-border text-text placeholder-text-3 focus:border-accent focus:ring-accent/20 w-full rounded-md border bg-white py-2 pr-3 pl-10 text-sm transition-colors focus:ring-2 focus:outline-none max-[699px]:text-base" />
	</form>

	<TagFilter
		{availableTags}
		selectedTagSlugs={selectedTags}
		onTagToggle={handleTagToggle}
		onClear={handleClear} />
</div>
