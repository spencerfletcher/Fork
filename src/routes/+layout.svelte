<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { page } from '$app/stores';
	import { DEFAULT_META, SITE_NAME, pageTitle, type PageMeta } from '$lib/seo';

	// This is the key change:
	// We destructure BOTH `data` and `children` from the top-level props.
	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	// Make the user available to all child components through Svelte's context API.
	setContext('user', data.user);

	// The single source of head tags. Pages contribute by returning `meta` from
	// their loader; anything they omit falls back to the site defaults.
	const meta: PageMeta = $derived({ ...DEFAULT_META, ...($page.data.meta ?? {}) });
	const canonical = $derived($page.url.origin + $page.url.pathname);
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

<div class="flex min-h-screen flex-col">
	<Navbar user={data.user} profile={data.profile} />

	<main class="flex-grow">
		{@render children()}
	</main>
</div>
