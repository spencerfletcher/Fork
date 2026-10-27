<script lang="ts">
	import { goto } from '$app/navigation';
	import SearchBar from './SearchBar.svelte';
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

	let searchQuery = $state(initialQuery);
	let selectedTags = $state<string[]>([...initialTags]);

	// Sync search query and tags when URL parameters change
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

		goto(newURL, {
			replace: false,
			reset: false
		});
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
	<SearchBar
		bind:value={searchQuery}
		placeholder="Search recipes by title..."
		onSubmit={applyFilters} />

	<TagFilter
		{availableTags}
		selectedTagSlugs={selectedTags}
		onTagToggle={handleTagToggle}
		onClear={handleClear} />
</div>
