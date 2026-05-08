<script lang="ts">
	import type { Recipe, RecipeVersion, Tag } from '$lib/server/db/schema';
	import { formatTime } from '$lib/helpers';

	interface RecipeWithRelations extends Recipe {
		author?: { id: string; username: string } | null;
		parent?: { slug: string; title: string; author?: { username: string } | null } | null;
	}

	let {
		recipe,
		currentVersion,
		isViewingHistory,
		tags,
		totalMinutes
	}: {
		recipe: RecipeWithRelations;
		currentVersion: RecipeVersion | null;
		isViewingHistory: boolean;
		tags: Tag[];
		totalMinutes: number;
	} = $props();
</script>

<header class="w-full bg-hero-bg box-border">
	<div class="mx-auto flex min-w-0 max-w-[1200px] flex-col gap-4 px-5 py-6">
		{#if isViewingHistory && currentVersion}
			<div
				class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[0.12] bg-white/[0.08] px-4 py-3 font-mono text-[0.8rem] text-text-tan"
			>
				Viewing v{currentVersion.versionNumber}: "{currentVersion.commitMessage}"
				<a href="/recipes/{recipe.slug}" class="text-accent">Current version →</a>
			</div>
		{/if}

		<!-- Breadcrumb -->
		<nav class="flex items-center gap-2 font-mono text-[0.78rem] text-text-bronze" aria-label="Recipe location">
			{#if recipe.author}
				<a
					href="/users/{recipe.author.username}"
					class="text-text-bronze no-underline transition-colors duration-150 hover:text-text-tan"
				>
					@{recipe.author.username}
				</a>
				<span class="opacity-50">/</span>
			{/if}
			<span class="text-accent">{recipe.slug.split('-').slice(0, -1).join('-')}</span>
		</nav>

		<!-- Title + version -->
		<div class="flex flex-wrap items-baseline gap-4">
			<!-- clamp() for fluid typography must stay inline -->
			<h1
				class="m-0 font-serif font-bold leading-[1.05] tracking-[-0.02em] text-text-cream"
				style="font-size: clamp(1.9rem, 4vw, 3.2rem)"
			>
				{recipe.title}
			</h1>
			{#if currentVersion}
				<span class="shrink-0 font-mono text-[1.8rem] font-medium text-accent">
					v{currentVersion.versionNumber}
				</span>
			{/if}
		</div>

		<!-- Fork attribution -->
		{#if recipe.parent}
			<p class="-mt-4 m-0 font-serif italic text-[0.9rem] text-text-bronze">
				Forked from
				<a href="/recipes/{recipe.parent.slug}" class="text-accent">{recipe.parent.title}</a>
				{#if recipe.parent.author}by @{recipe.parent.author.username}{/if}
			</p>
		{/if}

		<!-- Badges row -->
		<div class="flex flex-wrap items-center gap-2">
			{#each tags as tag (tag.id)}
				<a
					href="/tags/{tag.slug}"
					class="rounded-pill bg-accent px-3 py-1 font-sans text-[0.78rem] font-semibold text-hero-bg no-underline transition-opacity duration-150 hover:opacity-85"
				>
					{tag.name}
				</a>
			{/each}
			{#if totalMinutes > 0}
				<span class="rounded-pill bg-paprika px-3 py-1 font-sans text-[0.78rem] font-semibold text-text-cream">
					{formatTime(totalMinutes)}
				</span>
			{/if}
			{#if recipe.servings}
				<span class="text-[0.9rem] text-text-bronze">Serves {recipe.servings}</span>
			{/if}
			{#if recipe.author}
				<span class="text-text-bronze opacity-40">·</span>
				<a
					href="/users/{recipe.author.username}"
					class="font-mono text-[0.85rem] text-text-bronze no-underline transition-colors duration-150 hover:text-accent"
				>
					@{recipe.author.username}
				</a>
			{/if}
		</div>
	</div>
</header>
