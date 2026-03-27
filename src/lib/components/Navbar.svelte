<script lang="ts">
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages.js';
	import { enhance, applyAction } from '$app/forms';
	import type { User } from '@supabase/supabase-js';

	let { user }: { user: User | null } = $props();

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
				{m.app_title()}
			</a>
			<ul class="navbar-links">
				<li>
					<a
						href="/recipes/new"
						class="navbar-link"
						class:active={$page.url.pathname === '/recipes/new'}
					>
						{m.navbar_new()}
					</a>
				</li>
				<li>
					<a
						href="/recipes"
						class="navbar-link"
						class:active={$page.url.pathname.startsWith('/recipes') && $page.url.pathname !== '/recipes/new'}
					>
						{m.navbar_recipes()}
					</a>
				</li>
			</ul>
		</div>

		<!-- Auth + hamburger -->
		<div class="navbar-right">
			<div class="auth-desktop">
				{#if user}
					<span class="auth-email">{user.email}</span>
					<form action="/logout" method="POST" use:enhance>
						<button type="submit" class="navbar-link">Logout</button>
					</form>
				{:else}
					<a href="/login" class="navbar-link">Login</a>
					<a href="/signup" class="btn-primary" style="padding: 8px 16px; font-size: 0.85rem;">Sign Up</a>
				{/if}
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
					<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	{#if isMenuOpen}
		<div class="mobile-backdrop" onclick={closeMenu} aria-hidden="true"></div>
		<div class="mobile-menu" id="mobile-menu">
			<ul class="mobile-links">
				<li>
					<a href="/recipes/new" onclick={closeMenu} class="mobile-link">{m.navbar_new()}</a>
				</li>
				<li>
					<a href="/recipes" onclick={closeMenu} class="mobile-link">{m.navbar_recipes()}</a>
				</li>
			</ul>
			<div class="mobile-auth">
				{#if user}
					<p class="auth-email">{user.email}</p>
					<form action="/logout" method="POST" use:enhance={() => {
						return async ({ result }) => {
							await applyAction(result);
							closeMenu();
						};
					}}>
						<button type="submit" class="mobile-link" style="width: 100%; text-align: left; background: none; border: none; cursor: pointer;">Logout</button>
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
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		z-index: 50;
	}

	.navbar-inner {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 0 var(--space-5);
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.navbar-left {
		display: flex;
		align-items: center;
		gap: var(--space-7);
	}

	.navbar-logo {
		font-family: var(--font-serif);
		font-size: 1.4rem;
		font-weight: 600;
		color: var(--color-accent);
		text-decoration: none;
	}

	.navbar-logo:hover {
		color: var(--color-accent-mid);
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
		font-weight: 500;
		color: var(--color-text-2);
		text-decoration: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s ease;
	}

	.navbar-link:hover,
	.navbar-link.active {
		color: var(--color-accent);
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
		font-size: 0.85rem;
		color: var(--color-text-3);
	}

	.hamburger {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-2);
		color: var(--color-text-2);
		border-radius: var(--radius-sm);
	}

	.hamburger:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
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
		background: rgba(0, 0, 0, 0.3);
	}

	.mobile-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
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
		font-weight: 500;
		color: var(--color-text-2);
		text-decoration: none;
		border-radius: var(--radius-sm);
	}

	.mobile-link:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	.mobile-auth {
		border-top: 1px solid var(--color-border);
		padding: var(--space-4) var(--space-2);
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
