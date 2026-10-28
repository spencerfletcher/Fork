<script lang="ts">
	import type { TagChip } from '#lib/server/tagFilter.js';

	// `active` is the current tag's slug; null means "All".
	let { tags, active }: { tags: TagChip[]; active: string | null } = $props();
</script>

<nav class="tag-tabs" aria-label="Browse by tag">
	<a href="/recipes" aria-current={active === null ? 'page' : undefined}>All</a>
	{#each tags as tag (tag.id)}
		<a href="/tags/{tag.slug}" aria-current={active === tag.slug ? 'page' : undefined}>
			{tag.name}
		</a>
	{/each}
</nav>

<style>
	/* The row scrolls on its own on a phone; the page never does. */
	.tag-tabs {
		display: flex;
		gap: 16px;
		overflow-x: auto;
		white-space: nowrap;
		scrollbar-width: none;
	}

	.tag-tabs::-webkit-scrollbar {
		display: none;
	}

	.tag-tabs a {
		flex-shrink: 0;
		padding-bottom: 4px;
		font-family: var(--font-sans);
		font-size: 0.875rem;
		color: var(--color-text-2);
		text-decoration: none;
		border-bottom: 2px solid transparent;
	}

	.tag-tabs a:hover {
		color: var(--color-text);
	}

	.tag-tabs a[aria-current='page'] {
		color: var(--color-text);
		font-weight: 600;
		border-bottom-color: var(--color-accent);
	}
</style>
