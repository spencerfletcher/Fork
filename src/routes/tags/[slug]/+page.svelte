<script lang="ts">
	import RecipeGrid from '#lib/components/recipes/RecipeGrid.svelte';
	import TagTabs from '#lib/components/ui/TagTabs.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<div class="browse-header">
			<h1>{data.tag.name}</h1>
			<TagTabs tags={data.tags} active={data.tag.slug} allHref={data.user ? '/' : '/recipes'} />
		</div>

		{#if data.recipes.length > 0}
			<!-- The same eyebrow-and-rule as a browse section, so the grid sits at
			     the same height whichever tab is active. -->
			<RecipeGrid recipes={data.recipes} />
		{:else}
			<p class="empty-state">
				No recipes with this tag yet. <a href={data.user ? '/' : '/recipes'}>Explore all →</a>
			</p>
		{/if}
	</div>
</div>
