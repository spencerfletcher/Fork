<script lang="ts">
	import type { Tag } from '#lib/server/db/schema.js';

	let {
		availableTags,
		selectedTagSlugs = [],
		onTagToggle,
		onClear
	}: {
		availableTags: Pick<Tag, 'id' | 'name' | 'slug'>[];
		selectedTagSlugs?: string[];
		onTagToggle: (tagSlug: string) => void;
		onClear: () => void;
	} = $props();
</script>

<!-- Toggles, not navigation: a group, not a nav landmark. Clear all leads the
     row so a phone reaches it without scrolling the row (decided 29 October
     2026). -->
{#if availableTags.length > 0}
	<div class="tag-tabs" role="group" aria-label="Filter by tag">
		{#if selectedTagSlugs.length > 0}
			<button type="button" class="tag-tabs__clear" onclick={onClear}>Clear all</button>
		{/if}
		{#each availableTags as tag (tag.slug)}
			<button
				type="button"
				aria-pressed={selectedTagSlugs.includes(tag.slug)}
				onclick={() => onTagToggle(tag.slug)}>
				{tag.name}
			</button>
		{/each}
	</div>
{/if}
