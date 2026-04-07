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

	function clearAllTags() {
		selectedTagSlugs.forEach((slug) => onTagToggle(slug));
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center justify-between">
		<span class="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-text-3"
			>Filter by tag</span
		>
		{#if selectedTagSlugs.length > 0}
			<button
				type="button"
				onclick={clearAllTags}
				class="cursor-pointer border-none bg-transparent p-0 font-sans text-[0.8rem] text-text-3 transition-colors duration-150 hover:text-accent"
			>
				Clear all
			</button>
		{/if}
	</div>

	{#if availableTags.length > 0}
		<div class="flex flex-wrap gap-1">
			{#each availableTags as tag (tag.slug)}
				{@const isSelected = selectedTagSlugs.includes(tag.slug)}
				<button
					type="button"
					onclick={() => onTagToggle(tag.slug)}
					class={isSelected
						? 'cursor-pointer rounded-pill border-none bg-accent px-3 py-1 font-sans text-[0.75rem] font-medium text-hero-bg transition-[background,color] duration-150 hover:bg-accent-mid'
						: 'cursor-pointer rounded-pill border-none bg-tag-pale px-3 py-1 font-sans text-[0.75rem] font-medium text-tag transition-[background,color] duration-150 hover:bg-accent hover:text-hero-bg'}
				>
					{tag.name}
				</button>
			{/each}
		</div>
	{:else}
		<p class="m-0 text-sm text-text-3">No tags available</p>
	{/if}
</div>
