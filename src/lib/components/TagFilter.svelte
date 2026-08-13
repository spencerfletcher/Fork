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
		<span class="text-text-3 text-[0.8rem] font-semibold tracking-[0.08em] uppercase"
			>Filter by tag</span
		>
		{#if selectedTagSlugs.length > 0}
			<button
				type="button"
				onclick={clearAllTags}
				class="text-text-3 hover:text-accent cursor-pointer border-none bg-transparent p-0 font-sans text-[0.8rem] transition-colors duration-150"
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
						? 'rounded-pill bg-accent text-hero-bg hover:bg-accent-mid cursor-pointer border-none px-3 py-1 font-sans text-[0.75rem] font-medium transition-[background,color] duration-150'
						: 'rounded-pill bg-tag-pale text-tag hover:bg-accent hover:text-hero-bg cursor-pointer border-none px-3 py-1 font-sans text-[0.75rem] font-medium transition-[background,color] duration-150'}
				>
					{tag.name}
				</button>
			{/each}
		</div>
	{:else}
		<p class="text-text-3 m-0 text-sm">No tags available</p>
	{/if}
</div>
