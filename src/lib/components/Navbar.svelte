<script lang="ts">
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages.js';
	import { enhance, applyAction } from '$app/forms';
	import type { Session } from '@supabase/supabase-js';

	let { session }: { session: Session | null } = $props();

	// This variable will control the visibility of the mobile menu
	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}
</script>

<nav class="relative border-b border-amber-100 bg-white shadow-sm">
	<div class="relative z-50 container mx-auto flex h-16 items-center justify-between px-4">
		<!-- Left side: Title and Navigation Links -->
		<div class="flex items-center gap-12">
			<a href="/" class="font-serif text-2xl font-bold text-amber-900 hover:text-amber-700" onclick={closeMenu}>
				{m.app_title()}
			</a>
			<!-- Desktop Navigation Links -->
			<ul class="hidden items-center space-x-8 md:flex">
				<li>
					<a
						href="/recipes/new"
						class="text-sm font-medium text-gray-700 hover:text-amber-700 transition-colors"
						class:text-amber-700={$page.url.pathname === '/recipes/new'}
						class:font-semibold={$page.url.pathname === '/recipes/new'}
					>
						{m.navbar_new()}
					</a>
				</li>
				<li>
					<a
						href="/recipes"
						class="text-sm font-medium text-gray-700 hover:text-amber-700 transition-colors"
						class:text-amber-700={$page.url.pathname === '/recipes'}
						class:font-semibold={$page.url.pathname === '/recipes'}
					>
						{m.navbar_recipes()}
					</a>
				</li>
			</ul>
		</div>

		<!-- Right side: Auth Status and Mobile Menu Button -->
		<div class="flex items-center gap-4">
			<!-- Desktop Auth Status -->
			<div class="hidden items-center space-x-4 text-sm md:flex">
				{#if session}
					<span class="hidden text-gray-600 sm:inline">{session.user.email}</span>
					<form action="/logout" method="POST" use:enhance>
						<button type="submit" class="text-gray-700 hover:text-amber-700 transition-colors">Logout</button>
					</form>
				{:else}
					<a href="/login" class="text-gray-700 hover:text-amber-700 transition-colors">Login</a>
					<a
						href="/signup"
						class="rounded-md bg-amber-800 px-4 py-2 text-white hover:bg-amber-900 transition-colors font-medium">Sign Up</a
					>
				{/if}
			</div>

			<!-- Hamburger Menu Button -->
			<button
				type="button"
				onclick={toggleMenu}
				class="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-amber-50 hover:text-amber-700 focus:ring-2 focus:ring-amber-700 focus:outline-none focus:ring-inset md:hidden transition-colors"
				aria-controls="mobile-menu"
				aria-expanded={isMenuOpen}
			>
				<span class="sr-only">Open main menu</span>
				{#if isMenuOpen}
					<!-- Close Icon (X) -->
					<svg
						class="h-6 w-6"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg
					>
				{:else}
					<!-- Hamburger Icon -->
					<svg
						class="h-6 w-6"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
						/></svg
					>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Menu Dropdown & Backdrop -->
	{#if isMenuOpen}
		<div class="fixed inset-0 bg-black/20" onclick={closeMenu} aria-hidden="true"></div>

		<!-- Mobile Menu Dropdown -->
		<div class="absolute w-full bg-white border-t border-amber-100 md:hidden shadow-lg" id="mobile-menu">
			<ul class="space-y-1 px-2 pt-2 pb-3">
				<li>
					<a
						href="/recipes/new"
						onclick={closeMenu}
						class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
					>
						{m.navbar_new()}
					</a>
				</li>
				<li>
					<a
						href="/recipes"
						onclick={closeMenu}
						class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
					>
						{m.navbar_recipes()}
					</a>
				</li>
			</ul>
			<!-- Mobile Auth Links -->
			<div class="border-t border-amber-100 pt-4 pb-3">
				{#if session}
					<div class="flex items-center px-5">
						<div class="text-base font-medium text-gray-900">{session.user.email}</div>
					</div>
					<div class="mt-3 space-y-1 px-2">
						<form
							action="/logout"
							method="POST"
							use:enhance={() => {
								// This function runs before the submission.
								// We must return the `update` function.
								return async ({ result }) => {
									// This function runs after the server action completes.
									// `applyAction` tells SvelteKit to update the page state.
									await applyAction(result);
									// Now that the action is applied, we can safely close the menu.
									closeMenu();
								};
							}}
						>
							<button
								type="submit"
								class="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
							>
								Logout
							</button>
						</form>
					</div>
				{:else}
					<div class="space-y-1 px-2">
						<a
							href="/login"
							onclick={closeMenu}
							class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
							>Login</a
						>
						<a
							href="/signup"
							onclick={closeMenu}
							class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
							>Sign Up</a
						>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</nav>
