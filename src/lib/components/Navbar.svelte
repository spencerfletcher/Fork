<script lang="ts">
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages.js';
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

<nav class="relative z-50 bg-navbar-bg px-5">
	<div class="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between">
		<!-- Logo + nav links -->
		<div class="flex items-center gap-6">
			<a
				href="/"
				class="font-serif text-[1.65rem] font-bold tracking-[-0.01em] text-text-cream no-underline transition-opacity hover:text-text-cream hover:opacity-90"
				onclick={closeMenu}
			>
				{m.app_title()}<span class="text-accent">.</span>
			</a>
			<ul class="navbar-links m-0 hidden list-none gap-6 p-0 md:flex">
				<li>
					<a
						href="/search"
						class="navbar-link"
						class:active={$page.url.pathname === '/search'}
					>
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
						{m.navbar_recipes()}
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
							class="font-mono text-[0.8rem] text-text-tan no-underline transition-colors hover:text-accent"
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
				<a
					href="/recipes/new"
					class="whitespace-nowrap rounded-pill bg-accent px-4 py-[7px] font-sans text-[0.85rem] font-semibold text-hero-bg no-underline transition-opacity hover:text-hero-bg hover:opacity-88"
					class:opacity-75={$page.url.pathname === '/recipes/new'}
				>
					+ {m.navbar_new()}
				</a>
			</div>

			<button
				type="button"
				onclick={toggleMenu}
				class="flex items-center justify-center rounded-sm border-none bg-transparent p-2 text-text-tan transition-colors hover:text-text-cream md:hidden"
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
		<div
			class="fixed inset-0 bg-black/50"
			onclick={closeMenu}
			aria-hidden="true"
		></div>
		<div
			class="absolute left-0 right-0 top-full z-[100] border-b border-white/[0.08] bg-navbar-bg"
			id="mobile-menu"
		>
			<ul class="m-0 list-none p-2">
				<li><a href="/search" onclick={closeMenu} class="mobile-link">Search</a></li>
				<li>
					<a href="/recipes/new" onclick={closeMenu} class="mobile-link">{m.navbar_new()}</a>
				</li>
				<li>
					<a href="/recipes" onclick={closeMenu} class="mobile-link">{m.navbar_recipes()}</a>
				</li>
				{#if user}
					<li><a href="/favorites" onclick={closeMenu} class="mobile-link">Favorites</a></li>
				{/if}
			</ul>
			<div class="border-t border-white/[0.08] px-2 py-4">
				{#if user}
					<p class="m-0 px-4 py-3 text-[0.8rem] text-text-bronze">{user.email}</p>
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
						<button
							type="submit"
							class="mobile-link w-full border-none bg-transparent text-left"
						>
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
