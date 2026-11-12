<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import '../app.css';
	import Navbar from '#lib/components/ui/Navbar.svelte';
	import TabBar from '#lib/components/ui/TabBar.svelte';
	import { page } from '$app/state';
	import { rememberTimeZone } from '#lib/timeZone.js';
	import {
		DEFAULT_IMAGE,
		DEFAULT_META,
		SITE_NAME,
		ldScript,
		pageTitle,
		type PageMeta
	} from '#lib/seo.js';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	// The root layout mounts last, so by now every handler on the page is
	// attached. The e2e suite waits on this before acting (e2e/helpers.ts
	// gotoHydrated); SvelteKit exposes no hydration signal of its own.
	onMount(() => {
		document.documentElement.dataset.hydrated = '';
		// The server reads the cook's calendar day from it (todayFor).
		rememberTimeZone();
	});

	// The single source of head tags. Pages contribute by returning `meta` from
	// their loader; anything they omit falls back to the site defaults.
	// A thrown load error carries no meta, so the error's own message titles the
	// tab; SvelteKit's title-case "Not Found" reads "Page not found", as the
	// error page heads it.
	// An error page is noindex and previews nothing: a recipe the viewer may not
	// see is the same 404 as one that does not exist.
	const meta: PageMeta = $derived(
		page.error
			? {
					title: page.error.message === 'Not Found' ? 'Page not found' : page.error.message,
					noindex: true
				}
			: { ...DEFAULT_META, ...(page.data.meta ?? {}) }
	);
	// The query is never canonical: ?serves=, ?cook=, filters, and ?version=,
	// whose pages all name the latest version as the one to index.
	const canonical = $derived(page.url.origin + page.url.pathname);
	// A page with no picture of its own (null) shows the site card, as a small card.
	const image = $derived(new URL(meta.image ?? DEFAULT_IMAGE, page.url.origin).href);
	const card = $derived(meta.image ? 'summary_large_image' : 'summary');

	// The skip link is the page's first tab stop. On a recipe it lands on the
	// recipe itself, past the header; elsewhere on the main content, as on a
	// recipe that failed to load, which has no #recipe.
	const skipTarget = $derived(
		page.route.id === '/recipes/[slug]' && !page.error ? 'recipe' : 'main'
	);
	const skipLabel = $derived(skipTarget === 'recipe' ? 'Skip to ingredients' : 'Skip to content');

	// Focusing a block taller than the screen only scrolls it "nearest"; put it
	// at the top ourselves, under any bar pinned there.
	function skip(event: MouseEvent) {
		const target = document.getElementById(skipTarget);
		if (!target) return;
		event.preventDefault();
		target.focus({ preventScroll: true });
		const pinned = [...document.querySelectorAll<HTMLElement>('[data-pinned]')].reduce(
			(h, el) => (getComputedStyle(el).position === 'sticky' ? h + el.offsetHeight : h),
			0
		);
		window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - pinned - 16 });
	}
</script>

<svelte:head>
	<title>{pageTitle(meta.title)}</title>
	{#if meta.noindex}
		<meta name="robots" content="noindex" />
	{:else}
		<meta name="description" content={meta.description} />
		<link rel="canonical" href={canonical} />

		<meta property="og:type" content={meta.type ?? 'website'} />
		<meta property="og:site_name" content={SITE_NAME} />
		<meta property="og:url" content={canonical} />
		<meta property="og:title" content={meta.title} />
		<meta property="og:description" content={meta.description} />
		<meta property="og:image" content={image} />

		<meta name="twitter:card" content={card} />
		<meta name="twitter:title" content={meta.title} />
		<meta name="twitter:description" content={meta.description} />
		<meta name="twitter:image" content={image} />

		<!-- The one {@html} on user text: ldScript escapes <, > and & in the JSON. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{#if meta.jsonLd}{@html ldScript(meta.jsonLd)}{/if}
	{/if}
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<a href="#{skipTarget}" class="skip-link" onclick={skip}>{skipLabel}</a>
	<Navbar user={data.user} profile={data.profile} unseen={data.unseen} />

	<main id="main" class="flex-grow outline-none" tabindex="-1">
		{@render children()}
		<!-- Inside main, so it ends clear of the phone tab bar and the select bar
		     as the page does (app.css). For anyone, signed in or not. -->
		{#if page.url.searchParams.get('cook') !== '1' && page.url.pathname !== '/report'}
			<!-- Quiet: one Ink 3 line at the page's end; Cook mode is the recipe alone,
			     and the report page is where the link goes. -->
			<footer class="site-footer">
				<a class="hit-link" href="/report">Report a problem</a>
			</footer>
		{/if}
	</main>
	<!-- Phone only; it hides itself in Cook and the editor. -->
	<TabBar unseen={data.unseen} />
</div>

<style>
	/* Out of the way until it has focus, then a pill over the navbar's left. */
	.skip-link {
		position: absolute;
		left: var(--space-5);
		/* Below the status bar, inside the navbar, which starts under it. */
		top: calc(8px + env(safe-area-inset-top));
		z-index: 60;
		min-height: 44px;
		padding: 8px 16px;
		border-radius: var(--radius-pill);
		background: var(--color-marigold);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		font-weight: 600;
		transform: translateY(-200%);
	}

	.skip-link:focus-visible {
		transform: none;
	}

	/* Its height is --footer-height (app.css), which a screen-tall auth page
	   leaves it so the page does not scroll for one line. */
	.site-footer {
		box-sizing: border-box;
		/* The column plus .page's gutters, so the link starts on the content edge. */
		max-width: calc(var(--max-width) + 2 * var(--space-5));
		height: var(--footer-height);
		margin: 0 auto;
		padding: 0 var(--space-5);
		display: flex;
		align-items: center;
		font-size: 0.875rem;
	}

	.site-footer a {
		color: var(--color-text-3);
	}

	@media (hover: hover) {
		.site-footer a:hover {
			text-decoration-line: underline;
		}
	}

	@media (max-width: 699px) {
		.site-footer {
			padding-inline: 18px;
		}
	}
</style>
