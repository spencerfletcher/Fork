<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import type { User } from '@supabase/supabase-js';
	import type { Profile } from '#lib/server/db/schema.js';
	import { DESTINATIONS, isCurrent } from './destinations.js';

	let { user, profile = null }: { user: User | null; profile?: Profile | null } = $props();

	// The four destinations sit here from 768; a phone has the tab bar instead.
	const path = $derived(page.url.pathname);
	const onOwnProfile = $derived(!!profile && path === `/users/${profile.username}`);

	const current = (active: boolean) => (active ? ('page' as const) : undefined);
</script>

<nav class="bg-navbar-bg relative z-50 px-5" aria-label="Site">
	<div
		class="mx-auto flex h-[52px] max-w-[1200px] items-center justify-between gap-5 md:h-14">
		<!-- Logo + destinations. They never shrink; when the bar is full the handle gives way. -->
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
			<a href="/search" aria-label="Search" class="nav-icon" aria-current={current(path === '/search')}>
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
			{#if user}
				{#if profile}
					<!-- One link: the avatar's initial, and the handle beside it from 768.
					     The bar caps the handle; the title carries it whole. -->
					<a
						href="/users/{profile.username}"
						class="nav-profile"
						aria-label="@{profile.username}, your profile"
						title="@{profile.username}"
						aria-current={current(onOwnProfile)}>
						<span class="nav-avatar" aria-hidden="true">
							{profile.username.charAt(0).toUpperCase()}
						</span>
						<span class="nav-handle hidden md:block">@{profile.username}</span>
					</a>
				{/if}
				<form action="/logout" method="POST" use:enhance>
					<button type="submit" class="navbar-link">Log out</button>
				</form>
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
		padding: 0;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-tan);
		transition: color 0.15s ease;
	}

	.nav-icon:hover,
	.nav-icon[aria-current='page'] {
		color: var(--color-text-cream);
	}

	/* Shared link style used for both desktop nav links and logout button */
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

	/* The profile link: a 32px initial avatar (tint disc, Bitter initial in ink:
	   no clay inside the espresso bar), with
	   the handle beside it from 768. Capped so a 30-character handle (the
	   sign-up max) ellipsises; 22ch shows a normal one whole. */
	.nav-profile {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 8px;
		/* 44px tall on a phone without moving the avatar. */
		padding: 6px 0;
		margin: -6px 0;
		text-decoration: none;
	}

	.nav-avatar {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: 1px solid transparent;
		border-radius: 50%;
		background: var(--color-tint);
		color: var(--color-text);
		font-family: var(--font-serif);
		font-size: 0.9375rem;
		font-weight: 500;
		line-height: 1;
	}

	.nav-handle {
		max-width: 22ch;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--color-text-tan);
		transition: color 0.15s ease;
	}

	.nav-profile:hover .nav-handle,
	.nav-profile[aria-current='page'] .nav-handle {
		color: var(--color-text-cream);
	}

	/* Current is cream against tan, which forced colours flatten to one colour;
	   an underline (an outline on the icon) keeps "you are here". Last, so it
	   beats the base rules' text-decoration: none on source order. The icon's
	   outline gives way to the focus ring while focused. */
	@media (forced-colors: active) {
		.navbar-link[aria-current='page'],
		.nav-profile[aria-current='page'] .nav-handle {
			text-decoration: underline;
			text-underline-offset: 4px;
		}

		.nav-icon[aria-current='page']:not(:focus-visible) {
			outline: 2px solid CanvasText;
			outline-offset: -2px;
		}
	}
</style>
