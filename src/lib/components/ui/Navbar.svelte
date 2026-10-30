<script lang="ts">
	import { page } from '$app/state';
	import { enhance, applyAction } from '$app/forms';
	import type { User } from '@supabase/supabase-js';
	import type { Profile } from '#lib/server/db/schema.js';
	import Username from './Username.svelte';

	let { user, profile = null }: { user: User | null; profile?: Profile | null } = $props();

	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	let nav: HTMLElement | undefined = $state();
	let menuToggle: HTMLButtonElement | undefined = $state();

	// Escape closes the phone menu only while focus is inside the nav, like the
	// version bar; elsewhere the key belongs to whatever holds focus.
	function onWindowKeydown(event: KeyboardEvent) {
		if (!isMenuOpen || event.key !== 'Escape' || !nav?.contains(document.activeElement)) return;
		closeMenu();
		menuToggle?.focus();
	}

	// Tabbing past the menu's last row left focus in the page under the open
	// panel, where Escape no longer reaches it; leaving the nav closes it, as the
	// overlay click does. A null target (a click on the panel's padding) stays.
	function onNavFocusout(event: FocusEvent) {
		const next = event.relatedTarget;
		if (isMenuOpen && next instanceof Node && !nav?.contains(next)) closeMenu();
	}

	// One list for both menus. Signed in, browse with tabs is the home page, so
	// Recipes goes there and is current on it and on tag pages (Recipes
	// filtered by one tag); My Recipes is /recipes. Signed out, /recipes is
	// browse, current anywhere under it but the new-recipe page.
	const onOwnProfile = $derived(!!profile && page.url.pathname === `/users/${profile.username}`);

	const path = $derived(page.url.pathname);

	const links = $derived([
		{ href: '/search', label: 'Search', active: path === '/search' },
		...(user
			? [
					{
						href: '/',
						label: 'Recipes',
						active: path === '/' || path.startsWith('/tags/')
					},
					{ href: '/recipes', label: 'My Recipes', active: path === '/recipes' },
					{ href: '/favorites', label: 'Favorites', active: path === '/favorites' }
				]
			: [
					{
						href: '/recipes',
						label: 'Recipes',
						active:
							(path.startsWith('/recipes') && path !== '/recipes/new') || path.startsWith('/tags/')
					}
				])
	]);

	const current = (active: boolean) => (active ? ('page' as const) : undefined);
</script>

<svelte:window onkeydown={onWindowKeydown} />

<nav class="bg-navbar-bg relative z-50 px-5" bind:this={nav} onfocusout={onNavFocusout}>
	<!-- Above the overlay, so the bar stays bright and tappable while the menu is open. -->
	<div
		class="relative z-[100] mx-auto flex h-[52px] max-w-[1200px] items-center justify-between gap-4 md:h-14">
		<!-- Logo + nav links -->
		<div class="flex items-center gap-6">
			<!-- One line, so the name is "Fork." with no space before the stop. -->
			<!-- prettier-ignore -->
			<a href="/" class="nav-brand" onclick={closeMenu}>Fork<span class="text-marigold">.</span></a>
			<ul class="navbar-links m-0 hidden list-none gap-6 p-0 md:flex">
				{#each links as link (link.href)}
					<li>
						<a href={link.href} class="navbar-link" aria-current={current(link.active)}>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Auth + CTA + hamburger -->
		<div class="flex items-center gap-4">
			<div class="navbar-account hidden items-center gap-4 text-[0.875rem] md:flex">
				{#if user}
					{#if profile}
						<!-- The bar caps the handle; the title carries it whole. -->
						<span title="@{profile.username}">
							<Username username={profile.username} tone="dark" current={onOwnProfile} />
						</span>
					{/if}
					<form action="/logout" method="POST" use:enhance>
						<button type="submit" class="navbar-link">Log out</button>
					</form>
				{:else}
					<a href="/login" class="navbar-link" aria-current={current(path === '/login')}>Log in</a>
					<a href="/signup" class="navbar-link" aria-current={current(path === '/signup')}>
						Sign up
					</a>
				{/if}
				<!-- Signed-in only. /recipes/new redirects to /login, so showing the
				     page's most prominent control to a logged-out visitor sends them
				     into an auth wall rather than to the thing it names. -->
				{#if user}
					<a
						href="/recipes/new"
						class="nav-cta"
						class:opacity-75={page.url.pathname === '/recipes/new'}>
						+ New recipe
					</a>
				{/if}
			</div>

			<!-- Search is a top-level link on desktop; on a phone it lives here, beside
			     the menu, so it is one tap rather than two. -->
			<a
				href="/search"
				aria-label="Search"
				class="nav-icon"
				aria-current={current(path === '/search')}
				onclick={closeMenu}>
				<svg
					class="size-5"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.8"
					stroke="currentColor"
					aria-hidden="true">
					<circle cx="11" cy="11" r="7" />
					<path stroke-linecap="round" d="M20 20l-3.5-3.5" />
				</svg>
			</a>
			<button
				type="button"
				bind:this={menuToggle}
				onclick={toggleMenu}
				class="nav-menu-toggle"
				aria-controls="mobile-menu"
				aria-expanded={isMenuOpen}>
				<span class="sr-only">Open main menu</span>
				{#if isMenuOpen}
					<svg
						class="size-6"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg
						class="size-6"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	{#if isMenuOpen}
		<div class="fixed inset-0 bg-black/50" onclick={closeMenu} aria-hidden="true"></div>
		<div
			class="bg-navbar-bg absolute top-full right-0 left-0 z-[100] border-b border-white/[0.08]"
			id="mobile-menu">
			<ul class="m-0 list-none p-2">
				<!-- Search is the icon beside the menu button; listing it here too
				     would be the same destination twice. -->
				{#each links.filter((l) => l.href !== '/search') as link (link.href)}
					<li>
						<a
							href={link.href}
							onclick={closeMenu}
							class="mobile-link"
							aria-current={current(link.active)}>
							{link.label}
						</a>
					</li>
				{/each}
				{#if user}
					<li>
						<a href="/recipes/new" onclick={closeMenu} class="mobile-link">New recipe</a>
					</li>
				{/if}
			</ul>
			<div class="mobile-account border-t border-white/[0.08] px-2 py-4">
				{#if user}
					<!-- The same name and type as the desktop bar. -->
					{#if profile}
						<Username
							username={profile.username}
							tone="dark"
							current={onOwnProfile}
							onclick={closeMenu} />
					{:else}
						<p class="text-text-tan m-0 px-4 py-3 font-mono text-[0.75rem]">{user.email}</p>
					{/if}
					<form
						action="/logout"
						method="POST"
						use:enhance={() => {
							return async ({ result }) => {
								await applyAction(result);
								closeMenu();
							};
						}}>
						<button type="submit" class="mobile-link w-full border-none bg-transparent text-left">
							Log out
						</button>
					</form>
				{:else}
					<a
						href="/login"
						onclick={closeMenu}
						class="mobile-link"
						aria-current={current(path === '/login')}>
						Log in
					</a>
					<a
						href="/signup"
						onclick={closeMenu}
						class="mobile-link"
						aria-current={current(path === '/signup')}>
						Sign up
					</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<style>
	.nav-brand {
		display: inline-block;
		/* 44px tall on a phone, where it is the only way home. */
		padding: 4px 0;
		margin: -4px 0;
		font-family: var(--font-serif);
		font-size: 1.375rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		text-decoration: none;
		color: var(--color-text-cream);
	}

	.nav-brand:hover {
		color: var(--color-text-cream);
	}

	/* The one marigold fill in the navbar. Marigold means a primary action or
	   the current version, so nothing else here may be filled with it. */
	.nav-cta {
		padding: 6px 13px;
		/* Transparent, so it shows only under forced colours, where the fill goes
		   and the border is all that keeps the action a box. */
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		background: var(--color-marigold);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
		text-decoration: none;
		transition: background 0.15s ease;
	}

	.nav-cta:hover {
		background: var(--color-marigold-hover);
		color: var(--color-text);
	}

	/* Clay vanishes on espresso, so the ring inside the bar is marigold.
	   Global, so it reaches the Username component's link as well. */
	nav :global(:focus-visible) {
		outline-color: var(--color-marigold);
	}

	.nav-icon,
	.nav-menu-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-tan);
		transition: color 0.15s ease;
	}

	.nav-icon:hover,
	.nav-icon[aria-current='page'],
	.nav-menu-toggle:hover {
		color: var(--color-text-cream);
	}

	@media (min-width: 768px) {
		.nav-icon,
		.nav-menu-toggle {
			display: none;
		}
	}

	/* Shared link style used for both desktop nav links and logout button */
	.navbar-link {
		font-family: var(--font-sans);
		/* Small caps at 600 with tracking (Spencer, 29 October 2026). The shipped
		   Source Sans subset has no small-cap glyphs, so the browser synthesises
		   them from the capitals; the weight and tracking keep them from going
		   faint on espresso. */
		font-variant-caps: all-small-caps;
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		color: var(--color-text-tan);
		text-decoration: none;
		background: none;
		border: none;
		cursor: pointer;
		/* A 24px hit on a 20px line without moving the text. */
		padding: 4px 0;
		margin: -4px 0;
		/* At 768 a squeezed bar wrapped "My Recipes" and "Log out". */
		white-space: nowrap;
		transition: color 0.15s ease;
	}

	.navbar-link:hover,
	.navbar-link[aria-current='page'] {
		color: var(--color-text-cream);
	}

	/* The handle's 24px hit, like the links beside it, without moving it.
	   Capped so a 30-character handle (the sign-up max) fits the bar at 768. */
	.navbar-account :global(.username) {
		display: block;
		max-width: 14ch;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 4px 0;
		margin: -4px 0;
	}

	/* The handle in the phone menu: the padding on the link itself, like a
	   .mobile-link row, so the whole row is its hit. Mono lowercase at the
	   usual 15px out-shouts the small-caps rows, so it steps down a notch and
	   the links stay the loudest rows. */
	.mobile-account :global(.username) {
		display: block;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
	}

	/* Mobile link style */
	.mobile-link {
		display: block;
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-sans);
		font-variant-caps: all-small-caps;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		color: var(--color-text-tan);
		text-decoration: none;
		border-radius: var(--radius-sm);
	}

	.mobile-link:hover {
		background: rgba(255, 255, 255, 0.06);
		color: var(--color-text-cream);
	}

	.mobile-link[aria-current='page'] {
		color: var(--color-text-cream);
	}
</style>
