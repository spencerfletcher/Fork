<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import '../app.css';
	import Navbar from '#lib/components/ui/Navbar.svelte';
	import { page } from '$app/state';
	import { DEFAULT_META, SITE_NAME, pageTitle, type PageMeta } from '#lib/seo.js';

	// This is the key change:
	// We destructure BOTH `data` and `children` from the top-level props.
	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	// The single source of head tags. Pages contribute by returning `meta` from
	// their loader; anything they omit falls back to the site defaults.
	// A thrown load error carries no meta, so the error's own message titles the
	// tab; SvelteKit's title-case "Not Found" reads "Page not found", as the
	// error page heads it.
	const meta: PageMeta = $derived({
		...DEFAULT_META,
		...(page.data.meta ?? {}),
		...(page.error
			? { title: page.error.message === 'Not Found' ? 'Page not found' : page.error.message }
			: {})
	});
	const canonical = $derived(page.url.origin + page.url.pathname);

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
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:type" content={meta.type ?? 'website'} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:url" content={canonical} />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:image" content={meta.image} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={meta.image} />
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<a href="#{skipTarget}" class="skip-link" onclick={skip}>{skipLabel}</a>
	<Navbar user={data.user} profile={data.profile} />

	<main id="main" class="flex-grow outline-none" tabindex="-1">
		{@render children()}
	</main>
</div>

<style>
	/* Out of the way until it has focus, then a pill over the navbar's left. */
	.skip-link {
		position: absolute;
		left: var(--space-5);
		top: 8px;
		z-index: 60;
		min-height: 44px;
		padding: 8px 16px;
		border-radius: 999px;
		background: var(--color-marigold);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		font-weight: 600;
		text-decoration: none;
		transform: translateY(-200%);
	}

	.skip-link:focus-visible {
		transform: none;
	}
</style>
