<script lang="ts">
	import type { Snippet } from 'svelte';
	import { plural } from '#lib/helpers.js';

	// A Cookbook `Dropdown`'s panel (the picker's, View's): on a desktop the
	// overlay as Dropdown draws it, the consumer placing it; below 768 a sheet
	// at the screen's foot over a dimmed backdrop, ending in "Show N recipes".
	// Both of those close it, as Escape does (Dropdown's), and hand focus back.
	let {
		id,
		class: extra = '',
		total,
		close,
		children
	}: {
		id: string;
		class?: string;
		/** The current list's count, for Show N recipes. */
		total: number;
		close: () => void;
		children: Snippet;
	} = $props();
</script>

<!-- The page, the top bar and the tab bar under the sheet read as inactive,
     and a press on them closes it. Inside the dropdown, so the press is its own. -->
<div class="sheet-scrim" aria-hidden="true" onclick={close}></div>
<div class="menu-panel sheet {extra}" {id}>
	{@render children()}
	<!-- A phone's way back to the recipes, the count as it stands now. -->
	<div class="sheet-foot">
		<button type="button" class="btn-primary sheet-show" onclick={close}>
			Show {plural(total, 'recipe')}
		</button>
	</div>
</div>

<style>
	/* Show N recipes and the backdrop are a phone's; a desktop panel closes on
	   a press outside. */
	.sheet-scrim,
	.sheet-foot {
		display: none;
	}

	/* A phone: the panel is a sheet over the foot of the screen, over the tab
	   bar (z-index 40), so neither the bar nor anything else covers Show N
	   recipes. Dropdown leaves a fixed panel where it is. Under .dropdown, so
	   it outweighs Dropdown's own panel rule. */
	@media (max-width: 767px) {
		:global(.dropdown) .menu-panel.sheet {
			position: fixed;
			top: auto;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: 51;
			width: auto;
			max-width: none;
			max-height: 80dvh;
			padding-bottom: calc(6px + env(safe-area-inset-bottom));
			border-width: 1px 0 0;
			border-radius: var(--radius-md) var(--radius-md) 0 0;
		}

		/* Over the tab bar (40) and the top bar (50, earlier in the page, so
		   the same layer covers it), under the sheet; the page's ink, faint. */
		.sheet-scrim {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 50;
			background: color-mix(in srgb, var(--color-text) 32%, transparent);
		}

		.sheet-foot {
			display: block;
			padding: 8px 6px 2px;
			border-top: 1px solid var(--color-border);
		}

		.sheet-show {
			width: 100%;
		}
	}
</style>
