<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { profile, recipes, commitCount } = $derived(data);

	const memberSince = $derived(
		new Date(profile.createdAt ?? Date.now()).toLocaleDateString('en-US', {
			month: 'long',
			year: 'numeric'
		})
	);
</script>

<article class="min-h-screen">
	<!-- Hero -->
	<div class="bg-hero-bg px-5 py-8">
		<div class="mx-auto flex max-w-[1200px] items-center gap-6">
			<div
				class="bg-accent text-hero-bg flex size-[72px] shrink-0 items-center justify-center rounded-full font-serif text-[2rem] font-bold"
			>
				{profile.username[0].toUpperCase()}
			</div>
			<div class="flex flex-col gap-2">
				<h1
					class="text-text-cream m-0 font-serif text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.1] font-bold tracking-[-0.02em]"
				>
					@{profile.username}
				</h1>
				<p class="text-text-bronze m-0 text-[0.85rem]">Member since {memberSince}</p>
				<div class="mt-1 flex items-center gap-3">
					<span class="flex items-baseline gap-[5px]">
						<span class="text-accent font-mono text-base font-semibold">{recipes.length}</span>
						<span class="text-text-tan text-[0.82rem]"
							>{recipes.length === 1 ? 'recipe' : 'recipes'}</span
						>
					</span>
					<span class="text-text-bronze text-[0.85rem]">·</span>
					<span class="flex items-baseline gap-[5px]">
						<span class="text-accent font-mono text-base font-semibold">{commitCount}</span>
						<span class="text-text-tan text-[0.82rem]"
							>{commitCount === 1 ? 'commit' : 'commits'}</span
						>
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Recipe grid -->
	<div class="px-5 py-7">
		<div class="mx-auto max-w-[1200px]">
			{#if recipes.length > 0}
				<h2
					class="text-text-3 m-0 mb-5 font-sans text-[0.72rem] font-semibold tracking-[0.1em] uppercase"
				>
					Recipes
				</h2>
				<div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
					{#each recipes as recipe (recipe.id)}
						<RecipeCard {recipe} />
					{/each}
				</div>
			{:else}
				<p class="text-text-3 py-8 text-[0.95rem]">No public recipes yet.</p>
			{/if}
		</div>
	</div>
</article>
