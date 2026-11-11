<script module lang="ts">
	export type Tab = 'ingredients' | 'method';
</script>

<script lang="ts">
	import { tick } from 'svelte';

	let {
		tab,
		cooking,
		content,
		onchange
	}: {
		/** The section showing. */
		tab: Tab;
		cooking: boolean;
		/** The two sections' box, whose top a switch brings back into view. */
		content: HTMLElement | undefined;
		onchange: (next: Tab) => void;
	} = $props();

	// Cooking, each view keeps its own scroll position, so a cook halfway
	// through step 5 can check the ginger and come back to the same line
	// (Spencer, 11 November 2026). A first visit starts at the view's top.
	// Plain, not state: only the switch reads it. No history entry per switch.
	let positions: Partial<Record<Tab, number>> = {};
	const jump = (top: number) => window.scrollTo({ top, behavior: 'instant' });

	/** Entering Cook starts each view afresh. */
	export function forget() {
		positions = {};
	}

	async function show(next: Tab) {
		if (!cooking) {
			onchange(next);
			if (content && content.getBoundingClientRect().top < 0) content.scrollIntoView();
			return;
		}
		if (next === tab || !content) return;
		const viewTop = Math.min(window.scrollY, content.getBoundingClientRect().top + window.scrollY);
		positions[tab] = window.scrollY;
		onchange(next);
		await tick();
		jump(positions[next] ?? viewTop);
	}
</script>

<!-- Toggle buttons, not links: pressed marks the section showing. While
     cooking it is the bottom switch, still first in the Tab order, as
     tabs come before what they show. -->
<nav class="section-tabs" aria-label="Recipe sections" data-pinned>
	<button
		type="button"
		class="eyebrow-label"
		aria-pressed={tab === 'ingredients'}
		onclick={() => show('ingredients')}>
		Ingredients
	</button>
	<button
		type="button"
		class="eyebrow-label"
		aria-pressed={tab === 'method'}
		onclick={() => show('method')}>
		Method
	</button>
</nav>

<style>
	.section-tabs {
		display: none;
	}

	@media (max-width: 1023px) {
		.section-tabs {
			position: sticky;
			top: 0;
			z-index: 2;
			display: grid;
			grid-template-columns: 1fr 1fr;
			margin: 16px 0 0;
			background: var(--color-bg);
			border-bottom: 1px solid var(--color-border-2);
		}

		/* The eyebrow, a size up. */
		.section-tabs button {
			min-height: 44px;
			padding: 14px 0 12px;
			margin-bottom: -1px;
			border-bottom: 2px solid transparent;
			font-size: 0.8125rem;
		}

		.section-tabs button[aria-pressed='true'] {
			color: var(--color-text);
			border-bottom-color: var(--color-accent);
		}

		/* Forced colours paint the transparent underline both tabs carry, so both
		   would read as current; Canvas hides it, leaving the pressed tab's line,
		   as TagTabs does in app.css. */
		@media (forced-colors: active) {
			.section-tabs button:not([aria-pressed='true']) {
				border-bottom-color: Canvas;
			}
		}

		/* Cooking, the tabs are the one pinned bar, at the thumb: the phone tab
		   bar's look (paper, a Rule 2 line above, the current segment ink with
		   a 2px clay top edge drawn over it), 56px targets, padded clear of the
		   home indicator. Nothing is pinned at the top. */
		:global([data-cooking]) .section-tabs {
			position: fixed;
			top: auto;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: 40;
			margin: 0;
			padding-bottom: env(safe-area-inset-bottom);
			border-bottom: 0;
			border-top: 1px solid var(--color-border-2);
		}

		:global([data-cooking]) .section-tabs button {
			min-height: 56px;
			margin: -1px 0 0;
			padding: 0;
			border-bottom: 0;
			border-top: 2px solid transparent;
		}

		:global([data-cooking]) .section-tabs button[aria-pressed='true'] {
			border-top-color: var(--color-accent);
		}

		/* The ring inside the bar, as the tab bar's, so the screen's edge never clips it. */
		:global([data-cooking]) .section-tabs button:focus-visible {
			outline-offset: -4px;
		}

		/* The page ends clear of the bar (57px: the targets and the rule); the
		   page's scroll padding clears it too. */
		:global(body:has(article[data-cooking]) main) {
			padding-bottom: calc(57px + env(safe-area-inset-bottom));
		}
	}

	@media (max-width: 699px) {
		/* Edge to edge on a phone, out over the gutters. */
		.section-tabs {
			margin: 16px -18px 0;
		}
	}

	/* Forced colours paint the transparent top edge both segments carry; Canvas
	   hides it, so only the current one keeps its line. */
	@media (forced-colors: active) and (max-width: 1023px) {
		:global([data-cooking]) .section-tabs button:not([aria-pressed='true']) {
			border-top-color: Canvas;
		}
	}
</style>
