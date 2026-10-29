<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import RecipeHeader from './components/RecipeHeader.svelte';
	import VersionBar from './components/VersionBar.svelte';
	import RecipeIngredients from './components/RecipeIngredients.svelte';
	import RecipeMethod from './components/RecipeMethod.svelte';
	import RecipeActions from './components/RecipeActions.svelte';

	let { data }: { data: PageData } = $props();

	const { recipe, currentVersion, allVersions, isViewingHistory } = $derived(data);

	const tags = $derived(recipe.recipesToTags?.map((r) => r.tag) ?? []);
	const user = $derived(data.user);
	const isOwner = $derived(user?.id === recipe.authorId);
	const canFork = $derived(!!user && !isOwner && !isViewingHistory);
	const canFavorite = $derived(!!user && !isViewingHistory);
	const loginHref = $derived(
		user
			? undefined
			: `/login?redirectTo=${encodeURIComponent(page.url.pathname + page.url.search)}`
	);

	// Below 1024px the Ingredients | Method bar shows one section at a time in
	// place of the other, so the reader never scrolls past one to reach the
	// other. Switching brings the section's top back under the bar if the page
	// was scrolled into the old one.
	let tab: 'ingredients' | 'method' = $state('ingredients');
	let content: HTMLElement | undefined = $state();

	function show(next: typeof tab) {
		tab = next;
		if (content && content.getBoundingClientRect().top < 0) content.scrollIntoView();
	}
</script>

<article class="min-h-dvh">
	<!-- The hero: the recipe's text beside its photo. Title, deck and byline
	     first, so a stranger reads what this version is before anything else. -->
	<div class="hero">
		<div class="hero-text">
			<RecipeHeader {recipe} {currentVersion} forkCount={data.forkCount} {tags}>
				{#snippet actions()}
					<RecipeActions
						{recipe}
						{canFork}
						{canFavorite}
						{isOwner}
						{isViewingHistory}
						initialFavorited={data.isFavorited}
						{loginHref} />
				{/snippet}
			</RecipeHeader>
		</div>
		{#if currentVersion.imageUrl}
			<figure class="recipe-photo m-0">
				<img src={currentVersion.imageUrl} alt={currentVersion.title} />
			</figure>
		{/if}
	</div>

	<!-- The version bar: the hinge between the dish and the recipe. -->
	<div class="bar-row">
		<VersionBar {recipe} {currentVersion} versions={allVersions} {isViewingHistory} />
	</div>

	<hr class="rule" />

	<nav class="section-tabs" aria-label="Recipe sections" data-pinned>
		<button
			type="button"
			aria-current={tab === 'ingredients' ? 'true' : undefined}
			onclick={() => show('ingredients')}>
			Ingredients
		</button>
		<button
			type="button"
			aria-current={tab === 'method' ? 'true' : undefined}
			onclick={() => show('method')}>
			Method
		</button>
	</nav>

	<!-- Ingredients stay in view beside the method on a desktop; below 1024px
	     data-tab hides whichever section the bar has not chosen. -->
	<div id="recipe" class="content-layout" tabindex="-1" data-tab={tab} bind:this={content}>
		<aside class="min-w-0">
			<div class="sidebar-sticky">
				<RecipeIngredients ingredients={currentVersion.ingredients} grams={data.grams} />
			</div>
		</aside>

		<div class="main min-w-0">
			<RecipeMethod steps={currentVersion.steps} />
		</div>
	</div>
</article>

<style>
	/* The list pages' box: gutters outside a 1200px content width. */
	.hero,
	.bar-row,
	.content-layout {
		max-width: calc(var(--max-width) + 2 * var(--space-5));
		margin: 0 auto;
		padding: 0 var(--space-5);
	}

	/* The skip link lands here; focus then moves on to the first ingredient. */
	.content-layout {
		outline: none;
	}

	.hero {
		padding-top: 34px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		column-gap: 48px;
		align-items: start;
	}

	/* No photo: one left-aligned reading column; nothing fills the other half. */
	.hero:not(:has(.recipe-photo)) {
		grid-template-columns: minmax(0, 760px);
	}

	.hero-text {
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding-top: 6px;
	}

	/* 3:2, capped so the header column is never far short of it. */
	.recipe-photo img {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 2;
		max-height: 340px;
		object-fit: cover;
		border-radius: var(--radius-md);
	}

	.bar-row {
		margin-top: 26px;
	}

	.bar-row:empty {
		display: none;
	}

	.rule {
		max-width: var(--max-width);
		margin: 26px var(--space-5) 0;
		border: 0;
		border-top: 1px solid var(--color-border);
	}

	@media (min-width: 1248px) {
		.rule {
			margin-left: auto;
			margin-right: auto;
		}
	}

	.section-tabs {
		display: none;
	}

	.content-layout {
		padding-top: 26px;
		padding-bottom: 40px;
		display: grid;
		grid-template-columns: 380px minmax(0, 1fr);
		column-gap: 48px;
		align-items: start;
	}

	/* The aside must span the row's full height, or the sticky child has no
	   room to move inside it and scrolls away with the page. */
	aside {
		grid-column: 1;
		grid-row: 1;
		align-self: stretch;
	}

	.sidebar-sticky {
		position: sticky;
		top: 24px;
	}

	.main {
		grid-column: 2;
		grid-row: 1;
	}

	/* iPad and phone: one column, the photo as a band, the tab bar pinned. */
	/* Stacked, the photo goes straight under the title: the two wrappers
	   dissolve so the header's lines and the photo share one column, ordered
	   title, photo, the rest. The header's own margins set the rhythm. */
	@media (max-width: 1023px) {
		.hero {
			grid-template-columns: minmax(0, 1fr);
			row-gap: 0;
		}

		.hero-text,
		.hero-text :global(.recipe-header) {
			display: contents;
		}

		.hero-text :global(.recipe-header > *) {
			order: 2;
		}

		.hero-text :global(.recipe-header > .title) {
			order: 0;
		}

		.recipe-photo {
			order: 1;
			margin: 22px 0 14px;
		}

		.recipe-photo img {
			aspect-ratio: 16 / 9;
			max-height: 300px;
		}

		.section-tabs {
			position: sticky;
			top: 0;
			z-index: 2;
			display: grid;
			grid-template-columns: 1fr 1fr;
			max-width: var(--max-width);
			margin: 0 var(--space-5);
			background: var(--color-bg);
			border-bottom: 1px solid var(--color-border-2);
		}

		.section-tabs button {
			display: block;
			min-height: 44px;
			padding: 14px 0 12px;
			margin-bottom: -1px;
			border: 0;
			border-bottom: 2px solid transparent;
			background: none;
			cursor: pointer;
			font-family: var(--font-sans);
			font-size: 0.75rem;
			font-weight: 600;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			text-align: center;
			color: var(--color-text-3);
			text-decoration: none;
		}

		.section-tabs button[aria-current='true'] {
			color: var(--color-text);
			border-bottom-color: var(--color-accent);
		}

		.content-layout {
			grid-template-columns: minmax(0, 1fr);
			scroll-margin-top: 46px;
		}

		.content-layout[data-tab='ingredients'] .main,
		.content-layout[data-tab='method'] aside {
			display: none;
		}

		/* The tabs are the section headings here; the h2s stay for readers of
		   the outline, out of sight. */
		.content-layout :global(h2) {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		.main,
		aside {
			grid-column: 1;
			grid-row: auto;
		}

		.sidebar-sticky {
			position: static;
		}
	}

	@media (max-width: 699px) {
		.hero,
		.bar-row,
		.content-layout {
			padding-left: 18px;
			padding-right: 18px;
		}

		.hero {
			padding-top: 20px;
		}

		/* Edge to edge, a short crop: the recipe is what the screen is for. */
		.recipe-photo {
			margin: 16px -18px 8px;
		}

		.recipe-photo img {
			aspect-ratio: 21 / 9;
			border-radius: 0;
		}

		.rule {
			display: none;
		}

		.section-tabs {
			margin: 16px 0 0;
		}

		.content-layout {
			padding-top: 18px;
			padding-bottom: 32px;
		}
	}
</style>
