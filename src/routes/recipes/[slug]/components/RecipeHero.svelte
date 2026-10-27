<script lang="ts">
	import type { Recipe, RecipeVersion } from '#lib/server/db/schema.js';
	import type { RecipeContent } from '#lib/recipes/types.js';
	import { formatTime } from '#lib/helpers.js';

	// Only what the hero renders: the viewed version for the dish, the recipe
	// row for where it lives.
	type HeroContent = Pick<
		RecipeContent,
		'title' | 'servings' | 'prepTimeMinutes' | 'cookTimeMinutes'
	>;

	interface HeroRecipe extends Pick<Recipe, 'slug' | 'parentId'> {
		author?: { id: string; username: string } | null;
		parent?: { slug: string; title: string; author?: { username: string } | null } | null;
	}

	let {
		recipe,
		currentVersion,
		isViewingHistory,
		tags
	}: {
		recipe: HeroRecipe;
		currentVersion: Pick<RecipeVersion, 'versionNumber' | 'commitMessage'> & HeroContent;
		isViewingHistory: boolean;
		tags: { id: number; name: string; slug: string }[];
	} = $props();

	const content = $derived(currentVersion);
	const totalMinutes = $derived((content.prepTimeMinutes ?? 0) + (content.cookTimeMinutes ?? 0));
</script>

<header class="bg-hero-bg box-border w-full">
	<div class="mx-auto flex max-w-[1200px] min-w-0 flex-col gap-4 px-5 py-6">
		{#if isViewingHistory}
			<div
				class="text-text-tan flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[0.12] bg-white/[0.08] px-4 py-3 font-mono text-[0.8rem]">
				Viewing v{currentVersion.versionNumber}: "{currentVersion.commitMessage}"
				<a href="/recipes/{recipe.slug}" class="text-accent">Current version →</a>
			</div>
		{/if}

		<!-- Breadcrumb -->
		<nav
			class="text-text-bronze flex items-center gap-2 font-mono text-[0.78rem]"
			aria-label="Recipe location">
			{#if recipe.author}
				<a
					href="/users/{recipe.author.username}"
					class="text-text-bronze hover:text-text-tan no-underline transition-colors duration-150">
					@{recipe.author.username}
				</a>
				<span class="opacity-50">/</span>
			{/if}
			<span class="text-text-tan">{content.title}</span>
		</nav>

		<!-- Title + version -->
		<div class="flex flex-wrap items-baseline gap-4">
			<!-- clamp() for fluid typography must stay inline -->
			<h1
				class="text-text-cream m-0 font-serif leading-[1.05] font-bold tracking-[-0.02em]"
				style="font-size: clamp(1.9rem, 4vw, 3.2rem)">
				{content.title}
			</h1>
			<span class="text-accent shrink-0 font-mono text-[1.8rem] font-medium">
				v{currentVersion.versionNumber}
			</span>
		</div>

		<!-- Fork attribution -->
		{#if recipe.parent}
			<p class="text-text-bronze m-0 -mt-4 font-serif text-[0.9rem] italic">
				Forked from
				<a href="/recipes/{recipe.parent.slug}" class="text-accent">{recipe.parent.title}</a>
				{#if recipe.parent.author}by @{recipe.parent.author.username}{/if}
			</p>
		{:else if recipe.parentId}
			<p class="text-text-bronze m-0 -mt-4 font-serif text-[0.9rem] italic">
				Forked from a private recipe
			</p>
		{/if}

		<!-- Badges row -->
		<div class="flex flex-wrap items-center gap-2">
			{#each tags as tag (tag.id)}
				<a href="/tags/{tag.slug}" class="tag tag--on-dark no-underline">
					{tag.name}
				</a>
			{/each}
			{#if totalMinutes > 0}
				<span class="text-text-bronze font-mono text-[0.85rem]">{formatTime(totalMinutes)}</span>
			{/if}
			{#if content.servings}
				<span class="text-text-bronze text-[0.9rem]">Serves {content.servings}</span>
			{/if}
		</div>
	</div>
</header>
