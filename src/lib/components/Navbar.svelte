<script lang="ts">
	import { page } from '$app/stores';
	import { enhance, applyAction } from '$app/forms';
	import type { User } from '@supabase/supabase-js';
	import type { Profile } from '$lib/server/db/schema';

	let { user, profile = null }: { user: User | null; profile?: Profile | null } = $props();

	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}
</script>

<nav class="bg-navbar-bg relative z-50 px-5">
	<div class="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between">
		<!-- Logo + nav links -->
		<div class="flex items-center gap-6">
			<a href="/" class="nav-brand" onclick={closeMenu}>
				Fork<span class="text-accent">.</span>
			</a>
			<ul class="navbar-links m-0 hidden list-none gap-6 p-0 md:flex">
				<li>
					<a href="/search" class="navbar-link" class:active={$page.url.pathname === '/search'}>
						Search
					</a>
				</li>
				<li>
					<a
						href="/recipes"
						class="navbar-link"
						class:active={$page.url.pathname.startsWith('/recipes') &&
							$page.url.pathname !== '/recipes/new'}
					>
						Recipes
					</a>
				</li>
				{#if user}
					<li>
						<a
							href="/favorites"
							class="navbar-link"
							class:active={$page.url.pathname === '/favorites'}
						>
							Favorites
						</a>
					</li>
				{/if}
			</ul>
		</div>

		<!-- Auth + CTA + hamburger -->
		<div class="flex items-center gap-4">
			<div class="hidden items-center gap-4 md:flex">
				{#if user}
					{#if profile}
						<a
							href="/users/{profile.username}"
							class="text-text-tan hover:text-accent font-mono text-[0.8rem] no-underline transition-colors"
						>
							@{profile.username}
						</a>
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
						class:opacity-75={$page.url.pathname === '/recipes/new'}
					>
						+ New Recipe
					</a>
				{/if}
			</div>

			<button
				type="button"
				onclick={toggleMenu}
				class="nav-menu-toggle"
				aria-controls="mobile-menu"
				aria-expanded={isMenuOpen}
			>
				<span class="sr-only">Open main menu</span>
				{#if isMenuOpen}
					<svg
						class="size-6"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg
						class="size-6"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	{#if isMenuOpen}
		<div class="fixed inset-0 bg-black/50" onclick={closeMenu} aria-hidden="true"></div>
		<div
			class="bg-navbar-bg absolute top-full right-0 left-0 z-[100] border-b border-white/[0.08]"
			id="mobile-menu"
		>
			<ul class="m-0 list-none p-2">
				<li><a href="/search" onclick={closeMenu} class="mobile-link">Search</a></li>
				{#if user}
					<li>
						<a href="/recipes/new" onclick={closeMenu} class="mobile-link">New Recipe</a>
					</li>
				{/if}
				<li>
					<a href="/recipes" onclick={closeMenu} class="mobile-link">Recipes</a>
				</li>
				{#if user}
					<li><a href="/favorites" onclick={closeMenu} class="mobile-link">Favorites</a></li>
				{/if}
			</ul>
			<div class="border-t border-white/[0.08] px-2 py-4">
				{#if user}
					<p class="text-text-bronze m-0 px-4 py-3 text-[0.8rem]">{user.email}</p>
					<form
						action="/logout"
						method="POST"
						use:enhance={() => {
							return async ({ result }) => {
								await applyAction(result);
								closeMenu();
							};
						}}
					>
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
		font-size: 1.65rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		text-decoration: none;
		color: var(--color-text-cream);
	}

	.nav-brand:hover {
		color: var(--color-text-cream);
	}

	/* The one solid amber control on the page. Amber means action or version
	   identity, so nothing else in the navbar may be filled with it. */
	.nav-cta {
		padding: 7px 16px;
		border-radius: var(--radius-pill);
		background: var(--color-accent);
		color: var(--color-hero-bg);
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 600;
		white-space: nowrap;
		text-decoration: none;
		transition: background 0.15s ease;
	}

	.nav-cta:hover {
		background: var(--color-accent-mid);
		color: var(--color-hero-bg);
	}

	.nav-menu-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-tan);
		transition: color 0.15s ease;
	}

	.nav-menu-toggle:hover {
		color: var(--color-text-cream);
	}

	@media (min-width: 768px) {
		.nav-menu-toggle {
			display: none;
		}
	}

	/* Shared link style used for both desktop nav links and logout button */
	.navbar-link {
		font-family: var(--font-sans);
		font-size: 0.9rem;
		font-weight: 400;
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
		font-size: 0.9rem;
	}

	/* Mobile link style */
	.mobile-link {
		display: block;
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-sans);
		font-size: 0.95rem;
		font-weight: 400;
		color: var(--color-text-tan);
		text-decoration: none;
		border-radius: var(--radius-sm);
	}

	.mobile-link:hover {
		background: rgba(255, 255, 255, 0.06);
		color: var(--color-text-cream);
	}
</style>
