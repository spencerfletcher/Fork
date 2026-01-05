<script lang="ts">
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages.js';
	import { enhance, applyAction } from '$app/forms';
	import type { User } from '@supabase/supabase-js';

	let { user }: { user: User | null } = $props();

	// This variable will control the visibility of the mobile menu
	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}
</script>

<nav class="sticky top-0 z-10 border-b border-border bg-white">
	<div
		class="relative z-50 mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10"
	>
		<!-- Left side: Title and Navigation Links -->
		<div class="flex items-center gap-8">
			<a
				href="/"
				class="text-foreground hover:text-muted-foreground cursor-pointer font-serif text-2xl tracking-tight transition-colors"
				onclick={closeMenu}
			>
				RecipeBook
			</a>
			<!-- Desktop Navigation Links -->
			<nav class="hidden gap-6 md:flex">
				<a
					href="/recipes"
					class="text-muted-foreground transition-colors hover:text-foreground"
					class:text-foreground={$page.url.pathname === '/recipes'}
					class:font-semibold={$page.url.pathname === '/recipes'}
				>
					My Recipes
				</a>
				{#if user}
					<a
						href="/favorites"
						class="text-muted-foreground transition-colors hover:text-foreground"
						class:text-foreground={$page.url.pathname === '/favorites'}
						class:font-semibold={$page.url.pathname === '/favorites'}
					>
						Favorites
					</a>
				{/if}
			</nav>
		</div>

		<!-- Right side: Auth Status and Mobile Menu Button -->
		<div class="flex items-center gap-4">
			<!-- Desktop Auth Status -->
			<div class="hidden items-center gap-3 md:flex">
				{#if user}
					<button
						class="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
					>
						<!-- User Icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-5 w-5"
						>
							<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
						<span class="hidden sm:inline">{user.email}</span>
					</button>
					<form action="/logout" method="POST" use:enhance>
						<button
							type="submit"
							class="w-auto rounded-none border-none bg-transparent px-0 py-0 text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground"
						>
							Logout
						</button>
					</form>
				{:else}
					<a href="/login" class="text-muted-foreground transition-colors hover:text-foreground">Log In</a>
					<a
						href="/signup"
						class="rounded-md bg-foreground px-4 py-2 text-white transition-colors hover:bg-[color:var(--foreground)]"
					>
						Sign Up
					</a>
				{/if}
			</div>

			<!-- Hamburger Menu Button -->
			<button
				type="button"
				onclick={toggleMenu}
				class="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-foreground focus:ring-2 focus:ring-foreground focus:ring-inset md:hidden"
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
		<div class="absolute w-full border-t border-border bg-white shadow-lg md:hidden" id="mobile-menu">
			<ul class="space-y-1 px-2 pt-2 pb-3">
				<li>
					<a
						href="/recipes"
						onclick={closeMenu}
						class="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
					>
						My Recipes
					</a>
				</li>
				{#if user}
					<li>
						<a
							href="/favorites"
							onclick={closeMenu}
							class="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
						>
							Favorites
						</a>
					</li>
				{/if}
			</ul>
			<!-- Mobile Auth Links -->
			<div class="border-t border-border pt-4 pb-3">
				{#if user}
					<div class="flex items-center px-5">
						<div class="text-base font-medium text-foreground">{user.email}</div>
					</div>
					<div class="mt-3 space-y-1 px-2">
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
								class="block w-auto cursor-pointer rounded-md border-none bg-transparent px-3 py-2 text-left text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
							class="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
							>Log In</a
						>
						<a
							href="/signup"
							onclick={closeMenu}
							class="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
							>Sign Up</a
						>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</nav>
