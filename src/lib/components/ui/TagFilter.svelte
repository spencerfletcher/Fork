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

{#if availableTags.length > 0}
	<nav class="tag-tabs" aria-label="Filter by tag">
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
	</nav>
{/if}
