<script lang="ts">
	import { page } from '$app/state';
	import { DESTINATIONS, isCurrent } from './destinations.js';
	import { friendsIcon, journalIcon } from '#lib/components/Icons.svelte';

	// Cook and the editor pin their own bars (Done cooking; Save and Cancel),
	// so the tab bar leaves the screen to them.
	const EDITOR_ROUTES = ['/recipes/new', '/recipes/[slug]/edit'];
	const hidden = $derived(
		EDITOR_ROUTES.includes(page.route.id ?? '') || page.url.searchParams.get('cook') === '1'
	);
	const path = $derived(page.url.pathname);
</script>

{#if !hidden}
	<nav class="tab-bar" aria-label="Main">
		{#each DESTINATIONS as destination (destination.href)}
			<a href={destination.href} aria-current={isCurrent(destination, path) ? 'page' : undefined}>
				<!-- Friends and Journal are drawn on their own 24 box, so 24 keeps
				     their stroke the others' 1.5. -->
				{#if destination.href === '/friends'}
					{@render friendsIcon(24)}
				{:else if destination.href === '/journal'}
					{@render journalIcon(24)}
				{:else}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true">
						{#if destination.href === '/cookbook'}
							<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v14H5.5A1.5 1.5 0 0 0 4 19.5z" />
							<path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19v-3" />
							<path d="M9 8h6" />
						{:else}
							<circle cx="12" cy="12" r="9" />
							<path d="m15.5 8.5-2 5-5 2 2-5z" />
						{/if}
					</svg>
				{/if}
				{destination.label}
			</a>
		{/each}
	</nav>
{/if}

<style>
	/* Phone navigation: lifted paper (white is the version bar's), a Rule 2
	   line above, four equal 56px targets. Current: ink and a 2px clay top
	   edge, drawn over the rule. */
	.tab-bar {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 40;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		padding-bottom: env(safe-area-inset-bottom);
		border-top: 1px solid var(--color-border-2);
		background: var(--color-bg);
	}

	@media (min-width: 768px) {
		.tab-bar {
			display: none;
		}
	}

	.tab-bar a {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: 56px;
		margin-top: -1px;
		padding: 8px 0 6px;
		border-top: 2px solid transparent;
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--color-text-2);
	}

	.tab-bar a:hover {
		color: var(--color-text);
		background: var(--color-band);
	}

	.tab-bar a[aria-current='page'] {
		border-top-color: var(--color-accent);
		color: var(--color-text);
	}

	.tab-bar a:focus-visible {
		outline-offset: -4px;
	}

	/* :global, because Friends and Journal come from Icons.svelte. */
	.tab-bar :global(svg) {
		width: 22px;
		height: 22px;
	}

	/* Forced colours paint every transparent edge; Canvas hides all but the current one. */
	@media (forced-colors: active) {
		.tab-bar a:not([aria-current='page']) {
			border-top-color: Canvas;
		}
	}
</style>
