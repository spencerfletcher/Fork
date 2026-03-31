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

<nav class="navbar">
	<div class="navbar-inner">
		<!-- Logo + nav links -->
		<div class="navbar-left">
			<a href="/" class="navbar-logo" onclick={closeMenu}>
				{m.app_title()}<span class="logo-dot">.</span>
			</a>
			<ul class="navbar-links">
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
		<div class="navbar-right">
			<div class="auth-desktop">
				{#if user}
					{#if profile}
						<a href="/users/{profile.username}" class="auth-username">@{profile.username}</a>
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
					class="navbar-cta"
					class:active={$page.url.pathname === '/recipes/new'}
				>
					+ {m.navbar_new()}
				</a>
			</div>

			<button
				type="button"
				onclick={toggleMenu}
				class="hamburger"
				aria-controls="mobile-menu"
				aria-expanded={isMenuOpen}
			>
				<span class="sr-only">Open main menu</span>
				{#if isMenuOpen}
					<svg
						class="icon"
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
						class="icon"
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
		<div class="mobile-backdrop" onclick={closeMenu} aria-hidden="true"></div>
		<div class="mobile-menu" id="mobile-menu">
			<ul class="mobile-links">
				<li><a href="/search" onclick={closeMenu} class="mobile-link">Search</a></li>
				<li><a href="/recipes/new" onclick={closeMenu} class="mobile-link">{m.navbar_new()}</a></li>
				<li><a href="/recipes" onclick={closeMenu} class="mobile-link">{m.navbar_recipes()}</a></li>
				{#if user}
					<li><a href="/favorites" onclick={closeMenu} class="mobile-link">Favorites</a></li>
				{/if}
			</ul>
			<div class="mobile-auth">
				{#if user}
					<p class="auth-email mobile-email">{user.email}</p>
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
							class="mobile-link"
							style="width: 100%; text-align: left; background: none; border: none; cursor: pointer;"
							>Logout</button
						>
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
	.navbar {
		position: relative;
		background: var(--color-navbar-bg);
		border-bottom: none;
		z-index: 50;
		padding: 0 var(--space-5);
	}

	.navbar-inner {
		max-width: var(--max-width);
		margin: 0 auto;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.navbar-left {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}

	.navbar-logo {
		font-family: var(--font-serif);
		font-size: 1.65rem;
		font-weight: 700;
		color: var(--color-text-cream);
		text-decoration: none;
		letter-spacing: -0.01em;
	}

	.navbar-logo:hover {
		color: var(--color-text-cream);
		opacity: 0.9;
	}

	.logo-dot {
		color: var(--color-accent); /* saffron gold */
	}

	.navbar-links {
		display: none;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: var(--space-6);
	}

	@media (min-width: 768px) {
		.navbar-links {
			display: flex;
		}
	}

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

	.navbar-cta {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 600;
		background: var(--color-accent);
		color: var(--color-hero-bg);
		border-radius: var(--radius-pill);
		padding: 7px 16px;
		text-decoration: none;
		transition: opacity 0.15s ease;
		white-space: nowrap;
	}

	.navbar-cta:hover {
		opacity: 0.88;
		color: var(--color-hero-bg);
	}

	.navbar-right {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.auth-desktop {
		display: none;
		align-items: center;
		gap: var(--space-4);
	}

	@media (min-width: 768px) {
		.auth-desktop {
			display: flex;
		}
	}

	.auth-email {
		font-size: 0.8rem;
		color: var(--color-text-bronze);
	}

	.auth-username {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--color-text-tan);
		text-decoration: none;
		transition: color 0.15s;
	}

	.auth-username:hover {
		color: var(--color-accent);
	}

	.hamburger {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-2);
		color: var(--color-text-tan);
		border-radius: var(--radius-sm);
	}

	.hamburger:hover {
		color: var(--color-text-cream);
	}

	@media (min-width: 768px) {
		.hamburger {
			display: none;
		}
	}

	.icon {
		width: 24px;
		height: 24px;
	}

	.mobile-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
	}

	.mobile-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--color-navbar-bg);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		z-index: 100;
	}

	.mobile-links {
		list-style: none;
		margin: 0;
		padding: var(--space-2);
	}

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

	.mobile-auth {
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		padding: var(--space-4) var(--space-2);
	}

	.mobile-email {
		padding: var(--space-3) var(--space-4);
		font-size: 0.8rem;
		color: var(--color-text-bronze);
		margin: 0;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}
</style>
