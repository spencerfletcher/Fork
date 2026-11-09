<script lang="ts">
	import { plural } from '#lib/helpers.js';

	// How many recipes a filter left, said only while filtering. Always in the
	// DOM so a screen reader announces the count when it changes. `visible`
	// shows it when nothing matches (over a grid the cards say it); `class`
	// styles that visible line, which keeps its space so the grid does not jump.
	let {
		count,
		filtered,
		visible = false,
		class: className = ''
	}: { count: number; filtered: boolean; visible?: boolean; class?: string } = $props();

	const words = $derived(
		filtered ? `${plural(count, 'recipe')} ${count === 1 ? 'matches' : 'match'}` : ''
	);
</script>

<p class={visible ? className : 'sr-only'} role="status" aria-live="polite">
	{#if visible}<span class:sr-only={count > 0}>{words}</span>{:else if words}{words}{/if}
</p>
