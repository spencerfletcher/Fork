<script lang="ts">
	import BrowseSections from '#lib/components/recipes/BrowseSections.svelte';
	import RecipeGrid from '#lib/components/recipes/RecipeGrid.svelte';
	import TagTabs from '#lib/components/ui/TagTabs.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<div class="browse-header">
			<h1>{data.mine ? 'My Recipes' : 'Recipes'}</h1>
			{#if !data.mine}
				<TagTabs tags={data.tags} active={null} />
			{/if}
		</div>

		{#if data.recipes.length === 0}
			{#if data.mine}
				<div class="flex flex-col items-center gap-5 py-8 text-center">
					<p class="text-text-2 text-[1.0625rem]">You have no recipes yet.</p>
					<a href="/recipes/new" class="btn-primary">Create your first recipe</a>
				</div>
			{:else}
				<p class="empty-state">No public recipes yet.</p>
			{/if}
		{:else if data.mine}
			<RecipeGrid recipes={data.recipes} />
		{:else}
			<BrowseSections recipes={data.recipes} />
		{/if}
	</div>
</div>
