<script lang="ts">
	import { goto } from '$app/navigation';
	import SearchBar from './SearchBar.svelte';
	import TagFilter from './TagFilter.svelte';
	import type { Tag } from '$lib/server/db/schema';

	let {
		initialQuery = '',
		initialTags = [],
		availableTags
	}: {
		initialQuery?: string;
		initialTags?: string[];
		availableTags: Tag[];
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
			replaceState: false,
			keepFocus: true,
			noScroll: true
		});
	}

	function handleSearch(query: string) {
		searchQuery = query;
	}

	function handleTagToggle(tagSlug: string) {
		if (selectedTags.includes(tagSlug)) {
			selectedTags = selectedTags.filter((slug) => slug !== tagSlug);
		} else {
			selectedTags = [...selectedTags, tagSlug];
		}
		// Apply filters immediately when a tag is toggled
		applyFilters();
	}
</script>

<div class="border-border space-y-4 rounded-lg border bg-white p-4">
	<SearchBar
		value={searchQuery}
		placeholder="Search recipes by title..."
		onSearch={handleSearch}
		onSubmit={applyFilters}
	/>

	<TagFilter {availableTags} selectedTagSlugs={selectedTags} onTagToggle={handleTagToggle} />
</div>
