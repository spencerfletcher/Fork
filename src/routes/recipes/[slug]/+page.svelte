<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import RecipeHeader from './components/RecipeHeader.svelte';
	import CookHeader from './components/CookHeader.svelte';
	import VersionBar from './components/VersionBar.svelte';
	import RecipeIngredients from './components/RecipeIngredients.svelte';
	import RecipeMethod from './components/RecipeMethod.svelte';
	import RecipeActions from './components/RecipeActions.svelte';
	import ServesControl from './components/ServesControl.svelte';
	import PrintHeader from './components/PrintHeader.svelte';
	import { ticksKey } from './components/ticks';
	import { setShallowParam } from './components/shallowParam';
	import { parseServes } from '#lib/recipes/scale.js';
	import { changedGroups } from '#lib/recipes/content.js';
	import { wholeNumber } from '#lib/helpers.js';
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
	// An older version reading the same as the latest has nothing to restore.
	const canRestore = $derived(
		isOwner && isViewingHistory && changedGroups(allVersions[0], currentVersion).length > 0
	);
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

	// Signed in: the Journal entry for the version and the serves being read,
	// for Add to Journal and Finish cooking; a scale that is not a whole
	// number is left for the cook to type.
	const servesParam = $derived(url.searchParams.get('serves'));
	const journalHref = $derived(
		data.journal && servesParam && wholeNumber(servesParam) !== null
			? `${data.journal.addHref}&serves=${servesParam}`
			: data.journal?.addHref
	);

	// Cooking mode: ?cook=1 on load, written by Cook and dropped by Exit and
	// Finish cooking with the scaler's shallow replace. The article's
	// data-cooking is what the lists' CSS keys off.
	let cooking = $derived(url.searchParams.get('cook') === '1');

	// The address a printout gives: this version at these serves, not cooking.
	const printHref = $derived.by(() => {
		const printed = new URL(url.href);
		printed.searchParams.delete('cook');
		return printed.href;
	});

	// Below 1024px the Ingredients | Method bar shows one section at a time in
	// place of the other, so the reader never scrolls past one to reach the
	// other. Reading, it opens on Ingredients, and switching brings the
	// section's top back under the bar if the page was scrolled into the old
	// one; cooking, it opens on Method and is pinned at the bottom. Writable
	// derived: a parent or fork link keeps this page mounted, so another
	// recipe opens afresh; keyed on the slug string, so a data reload of this
	// one keeps the tab.
	type Tab = 'ingredients' | 'method';
	const slug = $derived(recipe.slug);
	let tab = $derived.by((): Tab => {
		void slug;
		return cooking ? 'method' : 'ingredients';
	});
	let content: HTMLElement | undefined = $state();

	// Cooking, each view keeps its own scroll position, so a cook halfway
	// through step 5 can check the ginger and come back to the same line
	// (Spencer, 11 November 2026). A first visit starts at the view's top.
	// Plain, not state: only the switch reads it. No history entry per switch.
	let positions: Partial<Record<Tab, number>> = {};
	const jump = (top: number) => window.scrollTo({ top, behavior: 'instant' });

	async function show(next: Tab) {
		if (!cooking) {
			tab = next;
			if (content && content.getBoundingClientRect().top < 0) content.scrollIntoView();
			return;
		}
		if (next === tab || !content) return;
		const viewTop = Math.min(window.scrollY, content.getBoundingClientRect().top + window.scrollY);
		positions[tab] = window.scrollY;
		tab = next;
		await tick();
		jump(positions[next] ?? viewTop);
	}

	// Entering Cook lands on Method: at the first open step when some are
	// ticked (a resume), else at the top.
	async function cook() {
		positions = {};
		cooking = true;
		await tick();
		const steps = [...(content?.querySelectorAll('#method li') ?? [])];
		const done = (li: Element) => li.querySelector('input:checked') !== null;
		const open = steps.find((li) => !done(li));
		if (open && steps.some(done)) open.scrollIntoView({ block: 'start', behavior: 'instant' });
		else jump(0);
	}

	// Exit: back to reading at the same version and scale, the ticks kept.
	function exit() {
		cooking = false;
		setShallowParam('cook', null);
		jump(0);
	}

	// Finish cooking, signed in, goes on to the optional Journal entry for
	// these serves; cooking's history entry is replaced first, so Back from
	// the Journal returns to reading. Signed out it is Exit.
	async function finish() {
		if (!journalHref) return exit();
		await setShallowParam('cook', null);
		await goto(journalHref);
	}
</script>

<!-- While cooking, data-version names the version being read, for the
     Journal's prefill; the serves are in the URL. -->
<article
	class="min-h-dvh"
	data-cooking={cooking || undefined}
	data-version={cooking ? currentVersion.versionNumber : undefined}>
	<!-- On paper only: the band's and the version bar's facts as plain lines,
	     from reading and cooking alike. -->
	<PrintHeader
		{recipe}
		content={currentVersion}
		versionNumber={currentVersion.versionNumber}
		{stored}
		{serves}
		href={printHref} />
	<!-- Cooking, the band, its actions, the stats and the tags give way to the
	     cooking header: the title and the serves being cooked, and Exit. -->
	{#if cooking}
		<CookHeader title={currentVersion.title} {stored} {serves} onexit={exit} />
	{:else}
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
								{journalHref}
								collections={data.collections}
								oncook={cook} />
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
	{/if}

	<!-- The version bar: the hinge between the dish and the recipe. Its bottom
	     edge is the divider; there is no rule. -->
	<div class="body page">
		<div class="page-inner">
			{#if !cooking}
				<div class="bar-row">
					<VersionBar
						{recipe}
						{currentVersion}
						versions={allVersions}
						{isViewingHistory}
						{canRestore} />
				</div>
			{/if}

			<!-- Toggle buttons, not links: pressed marks the section showing. While
			     cooking it is the bottom switch, still first in the Tab order, as
			     tabs come before what they show. -->
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
					<!-- After the last step, where it leads on to the optional Journal
					     entry; Exit in the header leaves earlier (Spencer, 11 November 2026). -->
					{#if cooking}
						<div class="finish">
							<button type="button" class="btn-primary" onclick={finish}>Finish cooking</button>
							{#if journalHref}
								<p class="form-hint">Then add it to your Journal, if you like.</p>
							{/if}
						</div>
					{/if}
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

	/* Cooking (Spencer, 11 November 2026): the espresso bar and the site's tab
	   bar step aside, so the paper header meets the screen's top edge (and the
	   status bar, which Safari colours from a pinned box there, stays paper). */
	:global(body:has(article[data-cooking]) :is(.nav-shell, .tab-bar)) {
		display: none;
	}

	/* One done language on the cooking screen: a ticked row in either list
	   keeps its check and its Ink 3 text, and is never struck through, so a
	   finished step can be reread. Reading keeps the strike rows. */
	article[data-cooking] :global(label:has(:checked)) {
		text-decoration-line: none;
	}

	/* After the last step: the one marigold while cooking. */
	.finish {
		margin-top: 32px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
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

		/* Cooking, the tabs are the one pinned bar, at the thumb: the phone tab
		   bar's look (paper, a Rule 2 line above, the current segment ink with
		   a 2px clay top edge drawn over it), 56px targets, padded clear of the
		   home indicator. Nothing is pinned at the top. */
		[data-cooking] .section-tabs {
			position: fixed;
			top: auto;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: 40;
			margin: 0;
			padding-bottom: env(safe-area-inset-bottom);
			border-bottom: 0;
			border-top: 1px solid var(--color-border-2);
		}

		[data-cooking] .section-tabs button {
			min-height: 56px;
			margin: -1px 0 0;
			padding: 0;
			border-bottom: 0;
			border-top: 2px solid transparent;
		}

		[data-cooking] .section-tabs button[aria-pressed='true'] {
			border-top-color: var(--color-accent);
		}

		/* The ring inside the bar, as the tab bar's, so the screen's edge never clips it. */
		[data-cooking] .section-tabs button:focus-visible {
			outline-offset: -4px;
		}

		/* The page ends clear of the bar (57px: the targets and the rule), and a
		   row focused by Tab scrolls clear of it with 6px to spare; there is no
		   bar at the top to clear. */
		:global(body:has(article[data-cooking]) main) {
			padding-bottom: calc(57px + env(safe-area-inset-bottom));
		}

		:global(html:has(#recipe):has(article[data-cooking])) {
			scroll-padding-top: 6px;
			scroll-padding-bottom: calc(63px + env(safe-area-inset-bottom));
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

	/* Forced colours paint the transparent top edge both segments carry; Canvas
	   hides it, so only the current one keeps its line. */
	@media (forced-colors: active) and (max-width: 1023px) {
		[data-cooking] .section-tabs button:not([aria-pressed='true']) {
			border-top-color: Canvas;
		}
	}
</style>
