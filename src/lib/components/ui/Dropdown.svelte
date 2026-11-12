<script lang="ts" module>
	/** The room a panel wants below its trigger before it would rather open upward: a recipe menu with a few collections, about eleven rows. */
	export const PANEL_ROOM = 480;
</script>

<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	// The behaviour behind every small overlay (the ⋯ menu, the navbar's avatar
	// menu): a button and the panel it shows. Opening focuses the panel's first
	// control, Escape closes and hands focus back to the button, a press outside
	// closes. Where the panel's items are menuitems, the arrow keys walk them.
	// A menu link closes the panel as it is pressed, so the old menu does not
	// sit over the page while the next one loads; a navigation closes it too.
	// The consumer draws the button; the panel and row look is here (below).
	let {
		trigger,
		panel,
		onopen,
		focusOnOpen
	}: {
		/**
		 * The consumer's button: spread the props onto it. `claim` makes a
		 * pressed button the one closing hands focus back to, the panel left as
		 * it is: a second trigger that turns an open panel (the Cookbook picker).
		 */
		trigger: Snippet<
			[
				{ 'aria-expanded': boolean; onclick: (e: MouseEvent) => void },
				claim: (e: MouseEvent) => void
			]
		>;
		/** Rendered only while open; `close` shuts it and hands focus back (Print). */
		panel: Snippet<[close: () => void]>;
		onopen?: () => void;
		/** What opening focuses, found in the dropdown's root; the panel's first control when unset or null. */
		focusOnOpen?: (root: HTMLElement) => HTMLElement | null | undefined;
	} = $props();

	let open = $state(false);
	let root: HTMLElement | undefined = $state();
	let button: HTMLElement | undefined;
	let up = $state(false);
	let room = $state<number | null>(null);

	// The 4px between trigger and panel, and 8px kept clear of the edge.
	const GAP = 4;
	const MARGIN = 8;

	// Decided once, on open, from the trigger's place alone (owner, 12 November
	// 2026: "yes flip upward when no room below"): never from the panel's size,
	// which grows as a menu's collections load. Below runs to the screen's foot
	// less what a fixed bar covers there (the tab bar, the select bar, which
	// give the page that as scroll-padding-bottom, app.css); above starts under
	// the top bar while it is on screen. The panel is then no taller than its
	// side's room and scrolls inside. A fixed panel (the picker's phone sheet)
	// has its own place.
	function place() {
		const panel = root?.querySelector<HTMLElement>('.menu-panel');
		if (!button || (panel && getComputedStyle(panel).position === 'fixed')) {
			up = false;
			room = null;
			return;
		}
		const covered = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom);
		const floor = window.innerHeight - (covered || 0);
		const ceiling = Math.max(
			0,
			document.querySelector('.nav-shell')?.getBoundingClientRect().bottom ?? 0
		);
		const trigger = button.getBoundingClientRect();
		const below = floor - trigger.bottom - GAP - MARGIN;
		const above = trigger.top - ceiling - GAP - MARGIN;
		up = below < PANEL_ROOM && above > below;
		room = Math.max(0, up ? above : below);
	}

	const controls = () =>
		[...(root?.querySelectorAll<HTMLElement>('a[href], button, textarea') ?? [])].filter(
			(el) => el !== button
		);

	function claim(e: MouseEvent) {
		if (e.currentTarget instanceof HTMLElement) button = e.currentTarget;
	}

	async function toggle(e: MouseEvent) {
		claim(e);
		open = !open;
		if (open) {
			onopen?.();
			await tick();
			place();
			await tick();
			((root && focusOnOpen?.(root)) ?? controls()[0])?.focus();
		}
	}

	function close() {
		if (!open) return;
		open = false;
		button?.focus();
	}

	// A host reloading its own page in place (the Cookbook after a card's
	// collection change) keeps the menu open; every other navigation closes it.
	afterNavigate(({ type, from, to }) => {
		if (type !== 'goto' || from?.url.pathname !== to?.url.pathname) open = false;
	});

	// Links only: a menu button may submit its form (Log out), and taking the
	// panel down under it would cancel the submission.
	function onclick(e: MouseEvent) {
		if (e.target instanceof Element && e.target.closest('a[role="menuitem"]')) open = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') return close();
		if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
		const items = [...(root?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
		if (items.length === 0) return;
		e.preventDefault();
		const at = items.indexOf(document.activeElement as HTMLElement);
		const step = e.key === 'ArrowDown' ? 1 : -1;
		// From outside the items (a find box above them), Up is the last.
		const next = at === -1 && step === -1 ? items.length - 1 : at + step;
		items[(next + items.length) % items.length].focus();
	}
</script>

<svelte:window
	onclick={(e) => {
		// composedPath, not contains: a panel that swaps its content on press
		// (Report, Block) leaves the target detached from root by now.
		if (open && root && !e.composedPath().includes(root)) open = false;
	}} />

<!-- svelte-ignore a11y_no_static_element_interactions (keys bubble up from the controls inside) -->
<div
	class="dropdown"
	class:up
	style:--menu-max-height={room === null ? undefined : `${room}px`}
	bind:this={root}
	{onkeydown}
	{onclick}>
	{@render trigger({ 'aria-expanded': open, onclick: toggle }, claim)}
	{#if open}
		{@render panel(close)}
	{/if}
</div>

<style>
	.dropdown {
		position: relative;
	}

	/* The panel and its rows are the one overlay look, so they live here: the
	   consumer puts .menu-panel on its panel and .menu-row on each row. Where
	   it opens depends on the consumer's trigger, so the consumer sets
	   --menu-top and --menu-right. The page's paper inside a 1px Ink 2 edge,
	   one step lighter than the text, and no shadow (4A softened, Spencer,
	   11 November 2026): the edge alone lifts it, over paper and the band. */
	.dropdown :global(.menu-panel) {
		position: absolute;
		top: var(--menu-top, 100%);
		right: var(--menu-right, 0);
		z-index: 6;
		display: flex;
		flex-direction: column;
		width: max-content;
		min-width: 180px;
		max-width: min(300px, calc(100vw - 36px));
		max-height: var(--menu-max-height, none);
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 6px;
		background: var(--color-bg);
		border: 1px solid var(--color-text-2);
		border-radius: var(--radius-md);
	}

	/* Opened upward (place), its foot 4px over the trigger. */
	.dropdown.up :global(.menu-panel) {
		top: auto;
		bottom: calc(100% + 4px);
	}

	.dropdown :global(.menu-row) {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 44px;
		padding: 0 12px;
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text);
		text-align: left;
	}

	/* The band, as a ghost button's hover. */
	.dropdown :global(.menu-row:hover) {
		background: var(--color-band);
		color: var(--color-text);
	}

	/* After :hover, so a red row stays red under the pointer. */
	.dropdown :global(.menu-row.danger) {
		color: var(--color-remove);
	}
</style>
