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
	import { loginHref as buildLoginHref } from '#lib/auth/loginHref.js';

	let { data }: { data: PageData } = $props();

	const { recipe, currentVersion, allVersions } = $derived(data);
	// allVersions is newest first.
	const isViewingHistory = $derived(currentVersion.versionNumber !== allVersions[0].versionNumber);

	const tags = $derived(recipe.recipesToTags?.map((r) => r.tag) ?? []);
	const user = $derived(data.user);
	const isOwner = $derived(user?.id === recipe.authorId);
	const canFork = $derived(!!user && !isOwner && !isViewingHistory);
	// The owner's row is Cook and Edit only (decided 9 Nov 2026).
	const canFavorite = $derived(!!user && !isOwner && !isViewingHistory);
	const canEdit = $derived(isOwner && !isViewingHistory);
	// The scaler and Cook write the URL with a shallow replace, which leaves
	// page.url behind. A data reload (Favorite) or Back re-reads it, so the
	// newest URL is page.shallow's when there is one.
	const url = $derived(page.shallow?.url ?? page.url);
	const loginHref = $derived(
		user || isViewingHistory ? undefined : buildLoginHref(url.pathname + url.search)
	);

	// Serving scaling: a multiplier on the list, never saved. ?serves= sets it
	// on load (server render included); the control writes it back with a
	// shallow replace.
	const stored = $derived(currentVersion.servings ?? 0);
	let serves = $derived(parseServes(url.searchParams.get('serves'), stored));
	const factor = $derived(stored > 0 ? serves / stored : 1);
	// The cook's Settings units, on the latest version only: a past version is
	// a record and reads as written. Signed out or unset, null.
	const measurement = $derived(isViewingHistory ? null : (data.profile?.measurement ?? null));

	// Cooking mode: ?cook=1 on load, written back by the Cook toggle with the
	// same shallow replace. The article's data-cooking is what the method's
	// CSS keys off; the bar and the other actions are not rendered.
	let cooking = $derived(url.searchParams.get('cook') === '1');

	// Below 1024px the Ingredients | Method bar shows one section at a time in
	// place of the other, so the reader never scrolls past one to reach the
	// other. Switching brings the section's top back under the bar if the page
	// was scrolled into the old one. Writable derived: a parent or fork link
	// keeps this page mounted, so another recipe opens on Ingredients again;
	// keyed on the slug string, so a data reload of this one keeps the tab.
	const slug = $derived(recipe.slug);
	let tab = $derived.by((): 'ingredients' | 'method' => {
		void slug;
		return 'ingredients';
	});
	let content: HTMLElement | undefined = $state();

	function show(next: typeof tab) {
		tab = next;
		if (content && content.getBoundingClientRect().top < 0) content.scrollIntoView();
	}
</script>

<!-- While cooking, data-version names the version being read, for the
     Journal's prefill; the serves are in the URL. -->
<article
	class="min-h-dvh"
	data-cooking={cooking || undefined}
	data-version={cooking ? currentVersion.versionNumber : undefined}>
	<!-- The title band: the recipe's words on deeper cream, its photo inset at
	     the right. Title, byline and deck first, so a stranger reads what this
	     version is before anything else; the photo is last, so a stacked band
	     reads words, buttons, then the photo. -->
	<div class="hero page">
		<div class="hero-inner page-inner">
			<div class="hero-text">
				<!-- The measure says the serves the list is scaled to, so it stays true. -->
				<RecipeHeader
					{recipe}
					currentVersion={{ ...currentVersion, servings: stored > 0 ? serves : null }}
					storedServings={stored}
					forkCount={data.forkCount}
					versionCount={allVersions.length}
					{tags}
					{cooking}
					journal={data.journal}>
					{#snippet actions()}
						<RecipeActions
							{recipe}
							{canFork}
							{canFavorite}
							{canEdit}
							initialFavorited={data.isFavorited}
							favoriteCount={data.favoriteCount}
							{loginHref}
							{cooking}
							journalHref={data.journal?.addHref}
							oncook={(next) => (cooking = next)} />
					{/snippet}
				</RecipeHeader>
			</div>
			{#if currentVersion.imageUrl}
				<figure class="recipe-photo">
					<!-- The one image above the fold: fetched first, decoded off the main
				     thread. Decorative: the h1 beside it already names the recipe. -->
					<img src={currentVersion.imageUrl} alt="" fetchpriority="high" decoding="async" />
				</figure>
			{/if}
		</div>
	</div>

	<!-- The version bar: the hinge between the dish and the recipe. Its bottom
	     edge is the divider; there is no rule. -->
	<div class="body page">
		<div class="page-inner">
			{#if !cooking}
				<div class="bar-row">
					<VersionBar {recipe} {currentVersion} versions={allVersions} {isViewingHistory} />
				</div>
			{/if}

			<!-- Toggle buttons, not links: pressed marks the section showing. -->
			<nav class="section-tabs" aria-label="Recipe sections" data-pinned>
				<button
					type="button"
					class="eyebrow-label"
					aria-pressed={tab === 'ingredients'}
					onclick={() => show('ingredients')}>
					Ingredients
				</button>
				<button
					type="button"
					class="eyebrow-label"
					aria-pressed={tab === 'method'}
					onclick={() => show('method')}>
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
							{measurement}
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

	/* The list pages' box, .page's gutters around .page-inner, so the edges
	   match Cookbook's: the band full-bleed outside it, the body below. Each
	   sets its own spacing above and below. */
	.body {
		padding-block: 0;
	}

	/* The skip link lands here; focus then moves on to the first ingredient. */
	.content-layout {
		outline: none;
	}

	/* The title band, full width in deeper cream (decided 31 October 2026,
	   "B2 inset"): 24px of band above and below the photo, the text column
	   centred beside it. */
	.hero {
		background: var(--color-band);
		padding-block: 24px;
	}

	.hero-inner {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 504px;
		column-gap: 48px;
		align-items: center;
	}

	/* No photo: words only, one 760px reading column, and on a desktop a
	   roomier 40px of band. */
	@media (min-width: 1024px) {
		.hero:not(:has(.recipe-photo)) {
			padding-block: 40px;
		}
	}

	.hero-inner:not(:has(.recipe-photo)) {
		grid-template-columns: minmax(0, 760px);
	}

	.hero-text {
		min-width: 0;
	}

	/* 4:3, inset: its right edge on the wrap's, 6px corners. */
	.recipe-photo img {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		border-radius: var(--radius-md);
	}

	.bar-row {
		margin-top: 24px;
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
		align-self: stretch;
	}

	/* A long list scrolls inside the aside rather than past the screen, on a
	   desktop: capped to the viewport less 24px above and below, with a thin
	   Rule 2 bar. overflow clips at the padding edge, so 4px of padding (the
	   focus ring's 2px plus its 2px offset) keeps a row's ring whole; the
	   matching negative margin, top and height leave the list exactly where it
	   was. */
	.sidebar-sticky {
		top: 20px;
		padding: 4px;
		margin: -4px;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border-2) transparent;
		/* A row focused by Tab scrolls clear of the 24px fade: the fade, the 4px
		   ring, the row's 1px rule and a pixel to spare. */
		scroll-padding-bottom: 30px;
	}

	@media (min-width: 1024px) {
		.sidebar-sticky {
			position: sticky;
			max-height: calc(100dvh - 40px);
			overflow-y: auto;
			/* The last row hidden below the fold is signalled by a 24px fade. The
			   animation runs on the box's own scroll, so a list that fits has no
			   timeline and no fade, and the fade lifts at the end of the scroll.
			   Where scroll timelines are unsupported there is no fade at all. */
			animation: aside-fade linear both;
			animation-timeline: scroll(self);
		}
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

	/* iPad and phone: one column, the band stacked (words, buttons, then the
	   photo inset on the gutters), the tab bar pinned. */
	@media (max-width: 1023px) {
		.hero-inner {
			grid-template-columns: minmax(0, 1fr);
		}

		.recipe-photo {
			margin-top: 24px;
		}

		/* An iPad's full-width 4:3 would be 540px tall and push the section
		   tabs off the first screen; a phone's is under the cap. */
		.recipe-photo img {
			max-height: 300px;
		}

		.section-tabs {
			position: sticky;
			top: 0;
			z-index: 2;
			display: grid;
			grid-template-columns: 1fr 1fr;
			margin: 16px 0 0;
			background: var(--color-bg);
			border-bottom: 1px solid var(--color-border-2);
		}

		/* The eyebrow, a size up. */
		.section-tabs button {
			min-height: 44px;
			padding: 14px 0 12px;
			margin-bottom: -1px;
			border-bottom: 2px solid transparent;
			font-size: 0.8125rem;
		}

		.section-tabs button[aria-pressed='true'] {
			color: var(--color-text);
			border-bottom-color: var(--color-accent);
		}

		/* Forced colours paint the transparent underline both tabs carry, so both
		   would read as current; Canvas hides it, leaving the pressed tab's line,
		   as TagTabs does in app.css. */
		@media (forced-colors: active) {
			.section-tabs button:not([aria-pressed='true']) {
				border-bottom-color: Canvas;
			}
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
	}

	@media (max-width: 699px) {
		/* The band below the photo matches the 18px gutters beside it. */
		.hero:has(.recipe-photo) {
			padding-bottom: 18px;
		}

		.bar-row {
			margin-top: 18px;
		}

		/* Edge to edge on a phone, out over the gutters. */
		.section-tabs {
			margin: 16px -18px 0;
		}

		.content-layout {
			padding-top: 18px;
			padding-bottom: 32px;
		}
	}
</style>
