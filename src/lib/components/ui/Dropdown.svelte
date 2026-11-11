<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	// The behaviour behind every small overlay (the ⋯ menu, the navbar's avatar
	// menu): a button and the panel it shows. Opening focuses the panel's first
	// control, Escape closes and hands focus back to the button, a press outside
	// closes. Where the panel's items are menuitems, the arrow keys walk them.
	// A menu link closes the panel as it is pressed, so the old menu does not
	// sit over the page while the next one loads; any navigation closes it too.
	// The consumer draws the button; the panel and row look is here (below).
	let {
		trigger,
		panel,
		onopen
	}: {
		/** The consumer's button: spread the props onto it. */
		trigger: Snippet<[{ 'aria-expanded': boolean; onclick: (e: MouseEvent) => void }]>;
		/** Rendered only while open. */
		panel: Snippet;
		onopen?: () => void;
	} = $props();

	let open = $state(false);
	let root: HTMLElement | undefined = $state();
	let button: HTMLElement | undefined;

	const controls = () =>
		[...(root?.querySelectorAll<HTMLElement>('a[href], button, textarea') ?? [])].filter(
			(el) => el !== button
		);

	async function toggle(e: MouseEvent) {
		if (e.currentTarget instanceof HTMLElement) button = e.currentTarget;
		open = !open;
		if (open) {
			onopen?.();
			await tick();
			controls()[0]?.focus();
		}
	}

	function close() {
		if (!open) return;
		open = false;
		button?.focus();
	}

	afterNavigate(() => (open = false));

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
		items[(at + step + items.length) % items.length].focus();
	}
</script>

<svelte:window
	onclick={(e) => {
		// composedPath, not contains: a panel that swaps its content on press
		// (Report, Block) leaves the target detached from root by now.
		if (open && root && !e.composedPath().includes(root)) open = false;
	}} />

<!-- svelte-ignore a11y_no_static_element_interactions (keys bubble up from the controls inside) -->
<div class="dropdown" bind:this={root} {onkeydown} {onclick}>
	{@render trigger({ 'aria-expanded': open, onclick: toggle })}
	{#if open}
		{@render panel()}
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
		padding: 6px;
		background: var(--color-bg);
		border: 1px solid var(--color-text-2);
		border-radius: var(--radius-md);
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
