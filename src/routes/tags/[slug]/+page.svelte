<script lang="ts">
	import RecipeGrid from '#lib/components/recipes/RecipeGrid.svelte';
	import TagTabs from '#lib/components/ui/TagTabs.svelte';
	import { pagedList } from '#lib/pagedList.svelte.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const list = pagedList(
		() => data,
		(d) => ({ items: d.recipes, next: d.next })
	);
</script>

<div class="page">
	<div class="page-inner">
		<div class="browse-header">
			<h1>{data.tag.name}</h1>
			<TagTabs tags={data.tags} active={data.tag.slug} />
		</div>

		{#if list.items.length > 0}
			<!-- The same eyebrow-and-rule as a browse section, so the grid sits at
			     the same height whichever tab is active. -->
			<RecipeGrid recipes={list.items} total={data.total} more={list} />
		{:else}
			<p class="empty-state">
				No recipes with this tag yet. <a class="inline-action" href="/discover">Explore all →</a>
			</p>
		{/if}
	</div>
</div>
