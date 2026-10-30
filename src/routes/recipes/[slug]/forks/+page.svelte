<script lang="ts">
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page">
	<div class="page-inner">
		<a href="/recipes/{data.recipe.slug}" class="back-link">← {data.recipe.title}</a>
		<div class="browse-header">
			<h1>Forks of {data.recipe.title}</h1>
		</div>

		{#if data.forks.length > 0}
			<section>
				<h2 class="eyebrow-label section-heading">
					{data.forks.length}
					{data.forks.length === 1 ? 'fork' : 'forks'}
				</h2>
				<div class="recipe-grid">
					{#each data.forks as recipe, i (recipe.id)}
						<!-- Under the byline, the fork's first commit note: it names whose
						     version it came from. Ink 3 at the meta row's size, three lines at most.
						     The author stays on a phone: who forked is the point of this list. -->
						<div class="flex flex-col gap-1">
							<RecipeCard {recipe} index={i} alwaysShowAuthor />
							{#if recipe.forkNote}
								<p class="text-text-3 m-0 line-clamp-3 font-sans text-[0.8125rem] leading-[1.5]">
									{recipe.forkNote}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{:else}
			<p class="empty-state">No forks yet.</p>
		{/if}
	</div>
</div>
