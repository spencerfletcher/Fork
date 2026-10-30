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

<!-- Toggles, not navigation: a group, not a nav landmark. Clear all ends the
     row, so a first pick inserts nothing before the pills and none moves. -->
{#if availableTags.length > 0}
	<div class="tag-tabs" role="group" aria-label="Filter by tag">
		{#each availableTags as tag (tag.slug)}
			<button
				type="button"
				aria-pressed={selectedTagSlugs.includes(tag.slug)}
				onclick={() => onTagToggle(tag.slug)}>
				{tag.name}
			</button>
		{/each}
		{#if selectedTagSlugs.length > 0}
			<button type="button" class="tag-tabs__clear" onclick={onClear}>Clear all</button>
		{/if}
	</div>
{/if}
