<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages.js';
	import { enhance, applyAction } from '$app/forms';
	import type { User } from '@supabase/supabase-js';

	let { user }: { user: User | null } = $props();

	// This variable will control the visibility of the mobile menu
	let isMenuOpen = $state(false);
	let navSearchQuery = $state('');

	// Clear search query when navigating to a different page
	$effect(() => {
		$page.url.pathname;
		navSearchQuery = '';
	});

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	function handleSearch(e: Event) {
		e.preventDefault();
		if (navSearchQuery.trim()) {
			goto(`/search?q=${encodeURIComponent(navSearchQuery.trim())}`);
		}
	}
</script>

<nav class="border-border sticky top-0 z-10 border-b bg-white">
	<div
		class="relative z-50 mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 sm:px-8 lg:px-10"
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
					class="text-muted-foreground hover:text-foreground transition-colors"
					class:text-foreground={$page.url.pathname === '/recipes'}
					class:font-semibold={$page.url.pathname === '/recipes'}
				>
					My Recipes
				</a>
				{#if user}
					<a
						href="/favorites"
						class="text-muted-foreground hover:text-foreground transition-colors"
						class:text-foreground={$page.url.pathname === '/favorites'}
						class:font-semibold={$page.url.pathname === '/favorites'}
					>
						Favorites
					</a>
				{/if}
			</nav>
		</div>

		<!-- Center: Search Bar (Desktop only) -->
		<div class="hidden max-w-md flex-1 lg:block">
			<form onsubmit={handleSearch}>
				<div class="relative">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-muted-foreground h-4 w-4"
						>
							<circle cx="11" cy="11" r="8" />
							<path d="m21 21-4.35-4.35" />
						</svg>
					</div>
					<input
						type="search"
						bind:value={navSearchQuery}
						placeholder="Search recipes..."
						class="border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 w-full rounded-md border bg-white py-2 pr-3 pl-10 text-sm transition-colors focus:ring-2 focus:outline-none"
					/>
				</div>
			</form>
		</div>

		<!-- Right side: Auth Status and Mobile Menu Button -->
		<div class="flex items-center gap-4">
			<!-- Desktop Auth Status -->
			<div class="hidden items-center gap-3 md:flex">
				{#if user}
					<button
						class="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
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
							class="text-muted-foreground hover:text-foreground w-auto rounded-none border-none bg-transparent px-0 py-0 transition-colors hover:bg-transparent"
						>
							Logout
						</button>
					</form>
				{:else}
					<a href="/login" class="text-muted-foreground hover:text-foreground transition-colors"
						>Log In</a
					>
					<a
						href="/signup"
						class="bg-foreground rounded-md px-4 py-2 text-white transition-colors hover:bg-[color:var(--foreground)]"
					>
						Sign Up
					</a>
				{/if}
			</div>

			<!-- Hamburger Menu Button -->
			<button
				type="button"
				onclick={toggleMenu}
				class="text-muted-foreground hover:bg-secondary hover:text-foreground focus:ring-foreground inline-flex items-center justify-center rounded-md p-2 transition-colors outline-none focus:ring-2 focus:ring-inset md:hidden"
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
		<div
			class="border-border absolute w-full border-t bg-white shadow-lg md:hidden"
			id="mobile-menu"
		>
			<ul class="space-y-1 px-2 pt-2 pb-3">
				<li>
					<a
						href="/recipes"
						onclick={closeMenu}
						class="text-muted-foreground hover:bg-secondary hover:text-foreground block rounded-md px-3 py-2 text-base font-medium transition-colors"
					>
						My Recipes
					</a>
				</li>
				{#if user}
					<li>
						<a
							href="/favorites"
							onclick={closeMenu}
							class="text-muted-foreground hover:bg-secondary hover:text-foreground block rounded-md px-3 py-2 text-base font-medium transition-colors"
						>
							Favorites
						</a>
					</li>
				{/if}
			</ul>
			<!-- Mobile Auth Links -->
			<div class="border-border border-t pt-4 pb-3">
				{#if user}
					<div class="flex items-center px-5">
						<div class="text-foreground text-base font-medium">{user.email}</div>
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
								class="text-muted-foreground hover:bg-secondary hover:text-foreground block w-auto cursor-pointer rounded-md border-none bg-transparent px-3 py-2 text-left text-base font-medium transition-colors"
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
							class="text-muted-foreground hover:bg-secondary hover:text-foreground block rounded-md px-3 py-2 text-base font-medium transition-colors"
							>Log In</a
						>
						<a
							href="/signup"
							onclick={closeMenu}
							class="text-muted-foreground hover:bg-secondary hover:text-foreground block rounded-md px-3 py-2 text-base font-medium transition-colors"
							>Sign Up</a
						>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</nav>
