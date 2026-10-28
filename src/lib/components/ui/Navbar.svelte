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

	// One list for both menus. Recipes is "active" anywhere under it except the
	// new-recipe page, which has its own control, and on tag pages, which are
	// Recipes filtered by one tag.
	const links = $derived([
		{ href: '/search', label: 'Search', active: page.url.pathname === '/search' },
		{
			href: '/recipes',
			label: 'Recipes',
			active:
				(page.url.pathname.startsWith('/recipes') && page.url.pathname !== '/recipes/new') ||
				page.url.pathname.startsWith('/tags/')
		},
		...(user
			? [{ href: '/favorites', label: 'Favorites', active: page.url.pathname === '/favorites' }]
			: [])
	]);
</script>

<nav class="bg-navbar-bg relative z-50 px-5">
	<!-- Above the overlay, so the bar stays bright and tappable while the menu is open. -->
	<div
		class="relative z-[100] mx-auto flex h-[52px] max-w-[1200px] items-center justify-between md:h-14">
		<!-- Logo + nav links -->
		<div class="flex items-center gap-6">
			<a href="/" class="nav-brand" onclick={closeMenu}>
				Fork
				<span class="text-marigold">.</span>
			</a>
			<ul class="navbar-links m-0 hidden list-none gap-6 p-0 md:flex">
				{#each links as link (link.href)}
					<li>
						<a href={link.href} class="navbar-link" class:active={link.active}>{link.label}</a>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Auth + CTA + hamburger -->
		<div class="flex items-center gap-4">
			<div class="hidden items-center gap-4 md:flex">
				{#if user}
					{#if profile}
						<Username username={profile.username} tone="dark" />
					{/if}
					<form action="/logout" method="POST" use:enhance>
						<button type="submit" class="navbar-link logout-btn">Logout</button>
					</form>
				{:else}
					<a href="/login" class="navbar-link">Login</a>
					<a href="/signup" class="navbar-link">Sign Up</a>
				{/if}
				<!-- Signed-in only. /recipes/new redirects to /login, so showing the
				     page's most prominent control to a logged-out visitor sends them
				     into an auth wall rather than to the thing it names. -->
				{#if user}
					<a
						href="/recipes/new"
						class="nav-cta"
						class:opacity-75={page.url.pathname === '/recipes/new'}>
						+ New Recipe
					</a>
				{/if}
			</div>

			<!-- Search is a top-level link on desktop; on a phone it lives here, beside
			     the menu, so it is one tap rather than two. -->
			<a href="/search" aria-label="Search" class="nav-icon" onclick={closeMenu}>
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
					<li><a href={link.href} onclick={closeMenu} class="mobile-link">{link.label}</a></li>
				{/each}
				{#if user}
					<li>
						<a href="/recipes/new" onclick={closeMenu} class="mobile-link">New Recipe</a>
					</li>
				{/if}
			</ul>
			<div class="border-t border-white/[0.08] px-2 py-4">
				{#if user}
					<!-- The same name and type as the desktop bar. -->
					{#if profile}
						<div class="px-4 py-3">
							<Username username={profile.username} tone="dark" onclick={closeMenu} />
						</div>
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
							Logout
						</button>
					</form>
				{:else}
					<a href="/login" onclick={closeMenu} class="mobile-link">Login</a>
					<a href="/signup" onclick={closeMenu} class="mobile-link">Sign Up</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<style>
	.nav-brand {
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
		padding: 7px 14px;
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

	/* Clay vanishes on espresso, so the ring inside the bar is marigold. */
	nav :focus-visible {
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
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-tan);
		text-decoration: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s ease;
	}

	.navbar-link:hover,
	.navbar-link.active {
		color: var(--color-text-cream);
	}

	.logout-btn {
		font-size: 0.875rem;
	}

	/* Mobile link style */
	.mobile-link {
		display: block;
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-sans);
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-text-tan);
		text-decoration: none;
		border-radius: var(--radius-sm);
	}

	.mobile-link:hover {
		background: rgba(255, 255, 255, 0.06);
		color: var(--color-text-cream);
	}
</style>
