<script lang="ts">
	import type { Tag } from '$lib/server/db/schema';

	let {
		availableTags,
		selectedTagSlugs = $bindable([]),
		onTagToggle
	}: {
		availableTags: Tag[];
		selectedTagSlugs?: string[];
		onTagToggle: (tagSlug: string) => void;
	} = $props();

	function toggleTag(tagSlug: string) {
		onTagToggle(tagSlug);
	}

	function clearAllTags() {
		selectedTagSlugs.forEach((slug) => onTagToggle(slug));
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<span class="text-foreground text-sm font-medium">Filter by Tags</span>
		{#if selectedTagSlugs.length > 0}
			<button
				type="button"
				onclick={clearAllTags}
				class="text-primary text-xs transition-colors hover:text-[color:var(--primary)]"
			>
				Clear all
			</button>
		{/if}
	</div>

	{#if availableTags.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each availableTags as tag (tag.slug)}
				{@const isSelected = selectedTagSlugs.includes(tag.slug)}
				<button
					type="button"
					onclick={() => toggleTag(tag.slug)}
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors {isSelected
						? 'bg-primary text-white'
						: 'border-border bg-secondary text-foreground hover:bg-border border'}"
				>
					{tag.name}
				</button>
			{/each}
		</div>
	{:else}
		<p class="text-muted-foreground text-sm">No tags available</p>
	{/if}
</div>
