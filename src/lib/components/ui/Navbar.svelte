<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import type { User } from '@supabase/supabase-js';
	import type { Profile } from '#lib/server/db/schema.js';
	import { DESTINATIONS, isCurrent } from './destinations.js';
	import { searchIcon } from '#lib/components/Icons.svelte';
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import Dropdown from './Dropdown.svelte';

	let { user, profile = null }: { user: User | null; profile?: Profile | null } = $props();

	// The four destinations sit here from 768; a phone has the tab bar instead.
	const path = $derived(page.url.pathname);
	const onOwnProfile = $derived(!!profile && path === `/users/${profile.username}`);

	const current = (active: boolean) => (active ? ('page' as const) : undefined);
</script>

<nav class="bg-navbar-bg relative z-50 px-5" aria-label="Site">
	<div class="mx-auto flex h-[52px] max-w-(--max-width) items-center justify-between gap-5 md:h-14">
		<!-- Logo + destinations. They never shrink. -->
		<div class="flex shrink-0 items-center gap-6">
			<!-- One line, so the name is "Fork." with no space before the stop. -->
			<!-- prettier-ignore -->
			<a href="/" class="nav-brand">Fork<span class="text-marigold">.</span></a>
			<ul class="navbar-links m-0 hidden list-none gap-6 p-0 md:flex">
				{#each DESTINATIONS as destination (destination.href)}
					<li>
						<a
							href={destination.href}
							class="navbar-link"
							aria-current={current(isCurrent(destination, path))}>
							{destination.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<div class="navbar-account flex min-w-0 shrink items-center gap-4 text-[0.875rem]">
			<!-- Signed-in only, and from 768: the Cookbook header carries it on a
			     phone. /recipes/new is behind the login wall. -->
			{#if user}
				<a
					href="/recipes/new"
					class="nav-cta hidden md:inline-block"
					aria-current={current(path === '/recipes/new')}>
					+ New recipe
				</a>
			{/if}
			<a
				href="/search"
				aria-label="Search"
				class="nav-icon"
				aria-current={current(path === '/search')}>
				{@render searchIcon('size-5')}
			</a>
			{#if user}
				<!-- The avatar alone at every width, opening Profile and Log out
				     (decided 9 November 2026). -->
				<Dropdown>
					{#snippet trigger(props)}
						<button
							type="button"
							class="nav-avatar-button"
							class:current={onOwnProfile}
							aria-haspopup="menu"
							aria-label={profile ? `Your account, @${profile.username}` : 'Your account'}
							title={profile ? `@${profile.username}` : undefined}
							{...props}>
							<!-- A signed-in account with no profile row yet still gets an initial. -->
							<Avatar username={profile?.username ?? user.email ?? '?'} size={32} tone="ink" />
						</button>
					{/snippet}
					{#snippet panel()}
						<div class="menu-panel account-menu" role="menu">
							{#if profile}
								<a
									href="/users/{profile.username}"
									class="menu-row"
									role="menuitem"
									aria-current={current(onOwnProfile)}>
									Profile
								</a>
							{/if}
							<form action="/logout" method="POST" role="none" use:enhance>
								<button type="submit" class="menu-row" role="menuitem">Log out</button>
							</form>
						</div>
					{/snippet}
				</Dropdown>
			{:else}
				<a href="/login" class="navbar-link" aria-current={current(path === '/login')}>Log in</a>
				<a
					href="/signup"
					class="navbar-link hidden md:inline"
					aria-current={current(path === '/signup')}>
					Sign up
				</a>
			{/if}
		</div>
	</div>
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
		transition: background 0.15s ease;
	}

	.nav-cta:hover {
		background: var(--color-marigold-hover);
		color: var(--color-text);
	}

	/* Clay vanishes on espresso, so the ring inside the bar is marigold.
	   Global, so it reaches every link in the bar. */
	nav :global(:focus-visible) {
		outline-color: var(--color-marigold);
	}

	.nav-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: var(--radius-sm);
		color: var(--color-text-tan);
		transition: color 0.15s ease;
	}

	.nav-icon:hover,
	.nav-icon[aria-current='page'] {
		color: var(--color-text-cream);
	}

	/* The bar's text links: the destinations, Log in and Sign up. */
	.navbar-link {
		font-family: var(--font-sans);
		/* Small caps at 600 with tracking (Spencer, 29 October 2026). The shipped
		   Source Sans subset has no small-cap glyphs, so the browser synthesises
		   them from the capitals; the weight and tracking keep them from going
		   faint on espresso. */
		font-variant-caps: all-small-caps;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--color-text-tan);
		/* A 24px hit on a 20px line without moving the text. */
		padding: 4px 0;
		margin: -4px 0;
		/* At 768 a squeezed bar must not wrap a destination. */
		white-space: nowrap;
		transition: color 0.15s ease;
	}

	.navbar-link:hover,
	.navbar-link[aria-current='page'] {
		color: var(--color-text-cream);
	}

	/* A phone has no menu: Log in and the brand are thumb targets,
	   44px tall inside the 52px bar, text where it was. */
	@media (max-width: 767px) {
		/* :not(.hidden): Sign up stays a desktop link. */
		.nav-brand,
		.navbar-link:not(.hidden) {
			display: inline-flex;
			align-items: center;
			min-height: 44px;
			padding-block: 0;
			margin-block: 0;
		}
	}

	/* The avatar: a 32px initial (tint disc, Bitter initial in ink: no clay
	   inside the espresso bar) centred in a 44px button. */
	.nav-avatar-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		/* The disc, not the 44px box, sits at the bar's edge. */
		margin-right: -6px;
		border-radius: 50%;
	}

	/* :global, because the disc is Avatar's. */
	.nav-avatar-button:hover :global(.avatar),
	.nav-avatar-button[aria-expanded='true'] :global(.avatar) {
		background: var(--color-text-cream);
	}

	/* Dropdown draws the overlay; it opens 6px under the avatar. */
	.account-menu {
		--menu-top: calc(100% + 6px);
	}

	/* On paper the ring is the site's clay again, not the bar's marigold:
	   revert-layer hands it back to the global ring in app.css's base layer. */
	.account-menu :global(:focus-visible) {
		outline-color: revert-layer;
	}

	/* Current is cream against tan, which forced colours flatten to one colour;
	   an underline (an outline on the icon and the avatar) keeps "you are here".
	   The outlines give way to the focus ring while focused. */
	@media (forced-colors: active) {
		.navbar-link[aria-current='page'] {
			text-decoration: underline;
			text-underline-offset: 4px;
		}

		.nav-icon[aria-current='page']:not(:focus-visible) {
			outline: 2px solid CanvasText;
			outline-offset: -2px;
		}

		.nav-avatar-button.current:not(:focus-visible) :global(.avatar) {
			outline: 2px solid CanvasText;
			outline-offset: 2px;
		}
	}
</style>
