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

<header class="bg-hero-bg box-border w-full">
	<div class="mx-auto flex max-w-[1200px] min-w-0 flex-col gap-4 px-5 py-6">
		{#if isViewingHistory && currentVersion}
			<div
				class="text-text-tan flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[0.12] bg-white/[0.08] px-4 py-3 font-mono text-[0.8rem]"
			>
				Viewing v{currentVersion.versionNumber}: "{currentVersion.commitMessage}"
				<a href="/recipes/{recipe.slug}" class="text-accent">Current version →</a>
			</div>
		{/if}

		<!-- Breadcrumb -->
		<nav
			class="text-text-bronze flex items-center gap-2 font-mono text-[0.78rem]"
			aria-label="Recipe location"
		>
			{#if recipe.author}
				<a
					href="/users/{recipe.author.username}"
					class="text-text-bronze hover:text-text-tan no-underline transition-colors duration-150"
				>
					@{recipe.author.username}
				</a>
				<span class="opacity-50">/</span>
			{/if}
			<span class="text-accent">{recipe.title}</span>
		</nav>

		<!-- Title + version -->
		<div class="flex flex-wrap items-baseline gap-4">
			<!-- clamp() for fluid typography must stay inline -->
			<h1
				class="text-text-cream m-0 font-serif leading-[1.05] font-bold tracking-[-0.02em]"
				style="font-size: clamp(1.9rem, 4vw, 3.2rem)"
			>
				{recipe.title}
			</h1>
			{#if currentVersion}
				<span class="text-accent shrink-0 font-mono text-[1.8rem] font-medium">
					v{currentVersion.versionNumber}
				</span>
			{/if}
		</div>

		<!-- Fork attribution -->
		{#if recipe.parent}
			<p class="text-text-bronze m-0 -mt-4 font-serif text-[0.9rem] italic">
				Forked from
				<a href="/recipes/{recipe.parent.slug}" class="text-accent">{recipe.parent.title}</a>
				{#if recipe.parent.author}by @{recipe.parent.author.username}{/if}
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
				<span
					class="rounded-pill bg-paprika text-text-cream px-3 py-1 font-sans text-[0.78rem] font-semibold"
				>
					{formatTime(totalMinutes)}
				</span>
			{/if}
			{#if recipe.servings}
				<span class="text-text-bronze text-[0.9rem]">Serves {recipe.servings}</span>
			{/if}
		</div>
	</div>
</header>
