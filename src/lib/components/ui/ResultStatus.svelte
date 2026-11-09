<script lang="ts">
	import { plural } from '#lib/helpers.js';

	// How many recipes a filter left, said only while filtering and only to a
	// screen reader; the cards say it to everyone else. Always in the DOM so
	// the count is announced when it changes.
	let { count, filtered }: { count: number; filtered: boolean } = $props();

	const words = $derived(
		filtered ? `${plural(count, 'recipe')} ${count === 1 ? 'matches' : 'match'}` : ''
	);
</script>

<p class="sr-only" role="status" aria-live="polite">
	{#if words}{words}{/if}
</p>
