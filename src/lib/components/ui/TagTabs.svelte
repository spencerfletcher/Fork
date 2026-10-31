<script lang="ts">
	import type { TagChip } from '#lib/recipes/types.js';

	// Two uses, one look. Browse pages link: `active` is the current tag's slug,
	// null means "All", and `allHref` moves the All tab for a signed-in user,
	// whose /recipes is their own list. Search and Favorites toggle: `selected`
	// holds every pressed slug, and the parent navigates on each press.
	type Props = { tags: TagChip[] } & (
		| { active: string | null; allHref?: string }
		| { selected: string[]; onToggle: (slug: string) => void; onClear: () => void }
	);

	let { tags, ...mode }: Props = $props();
</script>

{#if 'selected' in mode}
	<!-- Toggles, not navigation: a group, not a nav landmark. Clear all ends the
	     row, so a first pick inserts nothing before the tabs and none moves. -->
	{#if tags.length > 0}
		<div class="tag-tabs" role="group" aria-label="Filter by tag">
			{#each tags as tag (tag.id)}
				<button
					type="button"
					data-label={tag.name}
					aria-pressed={mode.selected.includes(tag.slug)}
					onclick={() => mode.onToggle(tag.slug)}>
					{tag.name}
				</button>
			{/each}
			{#if mode.selected.length > 0}
				<button type="button" class="tag-tabs__clear" onclick={mode.onClear}>Clear all</button>
			{/if}
		</div>
	{/if}
{:else}
	<nav class="tag-tabs" aria-label="Browse by tag">
		<a href={mode.allHref ?? '/recipes'} aria-current={mode.active === null ? 'page' : undefined}>
			All
		</a>
		{#each tags as tag (tag.id)}
			<a href="/tags/{tag.slug}" aria-current={mode.active === tag.slug ? 'page' : undefined}>
				{tag.name}
			</a>
		{/each}
	</nav>
{/if}
