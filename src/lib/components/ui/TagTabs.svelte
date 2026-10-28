<script lang="ts">
	import type { TagChip } from '#lib/server/tagFilter.js';

	// `active` is the current tag's slug; null means "All". `allHref` moves the
	// All tab for a signed-in user, whose /recipes is their own list.
	let {
		tags,
		active,
		allHref = '/recipes'
	}: { tags: TagChip[]; active: string | null; allHref?: string } = $props();
</script>

<nav class="tag-tabs" aria-label="Browse by tag">
	<a href={allHref} aria-current={active === null ? 'page' : undefined}>All</a>
	{#each tags as tag (tag.id)}
		<a href="/tags/{tag.slug}" aria-current={active === tag.slug ? 'page' : undefined}>
			{tag.name}
		</a>
	{/each}
</nav>
