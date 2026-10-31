<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import RecipeHeader from './components/RecipeHeader.svelte';
	import VersionBar from './components/VersionBar.svelte';
	import RecipeIngredients from './components/RecipeIngredients.svelte';
	import RecipeMethod from './components/RecipeMethod.svelte';
	import RecipeActions from './components/RecipeActions.svelte';
	import ServesControl from './components/ServesControl.svelte';
	import { ticksKey } from './components/ticks';
	import { parseServes } from '#lib/recipes/scale.js';

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

	// Serving scaling: a multiplier on the list, never saved. ?serves= sets it
	// on load (server render included); the control writes it back with a
	// shallow replace, which leaves page.url alone, so this stays the one
	// owner until a real navigation re-reads the URL.
	const stored = $derived(currentVersion.servings ?? 0);
	let serves = $derived(parseServes(page.url.searchParams.get('serves'), stored));
	const factor = $derived(stored > 0 ? serves / stored : 1);

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
			<!-- The measure says the serves the list is scaled to, so it stays true. -->
			<RecipeHeader
				{recipe}
				currentVersion={{ ...currentVersion, servings: stored > 0 ? serves : null }}
				forkCount={data.forkCount}
				{tags}>
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
				<!-- The one image above the fold: fetched first, decoded off the main
				     thread. Decorative: the h1 beside it already names the recipe. -->
				<img src={currentVersion.imageUrl} alt="" fetchpriority="high" decoding="async" />
			</figure>
		{/if}
	</div>

	<!-- The version bar: the hinge between the dish and the recipe. Its bottom
	     edge is the divider; there is no rule. -->
	<div class="bar-row">
		<VersionBar {recipe} {currentVersion} versions={allVersions} {isViewingHistory} />
	</div>

	<!-- Toggle buttons, not links: pressed marks the section showing. -->
	<nav class="section-tabs" aria-label="Recipe sections" data-pinned>
		<button type="button" aria-pressed={tab === 'ingredients'} onclick={() => show('ingredients')}>
			Ingredients
		</button>
		<button type="button" aria-pressed={tab === 'method'} onclick={() => show('method')}>
			Method
		</button>
	</nav>

	<!-- Ingredients stay in view beside the method on a desktop; below 1024px
	     data-tab hides whichever section the bar has not chosen. -->
	<div id="recipe" class="content-layout" tabindex="-1" data-tab={tab} bind:this={content}>
		<aside class="min-w-0">
			<div class="sidebar-sticky">
				<RecipeIngredients
					ingredients={currentVersion.ingredients}
					grams={data.grams}
					{factor}
					control={stored > 0 ? scaler : undefined}
					storageKey={ticksKey(recipe.slug, currentVersion.versionNumber, 'ingredients')} />
				{#snippet scaler()}
					<ServesControl {stored} {serves} onchange={(next) => (serves = next)} />
				{/snippet}
			</div>
		</aside>

		<div class="main min-w-0">
			<RecipeMethod
				steps={currentVersion.steps}
				storageKey={ticksKey(recipe.slug, currentVersion.versionNumber, 'steps')} />
		</div>
	</div>
</article>

<style>
	/* A row focused by Tab scrolls clear of the screen's edge: the 4px ring,
	   the row's 1px rule and a pixel to spare. On html, which scrolls; keyed
	   to #recipe so the rule leaves with the page. */
	:global(html:has(#recipe)) {
		scroll-padding-block: 6px;
	}

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

	/* A long list scrolls inside the aside rather than past the screen: capped
	   to the viewport less 24px above and below, with a thin Rule 2 bar.
	   overflow clips at the padding edge, so 4px of padding (the focus ring's
	   2px plus its 2px offset) keeps a row's ring whole; the matching negative
	   margin, top and height leave the list exactly where it was. */
	.sidebar-sticky {
		position: sticky;
		top: 20px;
		max-height: calc(100dvh - 40px);
		padding: 4px;
		margin: -4px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border-2) transparent;
		/* A row focused by Tab scrolls clear of the 24px fade: the fade, the 4px
		   ring, the row's 1px rule and a pixel to spare. */
		scroll-padding-bottom: 30px;
		/* The last row hidden below the fold is signalled by a 24px fade. The
		   animation runs on the box's own scroll, so a list that fits has no
		   timeline and no fade, and the fade lifts at the end of the scroll.
		   Where scroll timelines are unsupported there is no fade at all. */
		animation: aside-fade linear both;
		animation-timeline: scroll(self);
	}

	@keyframes aside-fade {
		0%,
		99% {
			mask-image: linear-gradient(to bottom, #000 calc(100% - 24px), transparent);
		}
		100% {
			mask-image: none;
		}
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
			margin: 16px var(--space-5) 0;
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

		.section-tabs button[aria-pressed='true'] {
			color: var(--color-text);
			border-bottom-color: var(--color-accent);
		}

		/* Under the pinned 46px tab bar as well: a row focused upward, and the
		   section brought back by a tab switch, land below it. */
		:global(html:has(#recipe)) {
			scroll-padding-top: 52px;
		}

		.content-layout {
			grid-template-columns: minmax(0, 1fr);
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
			max-height: none;
			overflow-y: visible;
			animation: none;
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

		.section-tabs {
			margin: 16px 0 0;
		}

		.content-layout {
			padding-top: 18px;
			padding-bottom: 32px;
		}
	}
</style>
