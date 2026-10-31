<script lang="ts" module>
	// Icons the action row and the stats row share, so neither copies the SVG.
	// Decoration only: the words beside them carry the meaning.
	export { forkIcon, starIcon };
</script>

{#snippet forkIcon()}
	<svg
		class="size-4"
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round">
		<path d="M4 3.5v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2M8 7.5v5" />
		<circle cx="4" cy="2.5" r="1.3" fill="currentColor" />
		<circle cx="12" cy="2.5" r="1.3" fill="currentColor" />
		<circle cx="8" cy="13.5" r="1.3" fill="currentColor" />
	</svg>
{/snippet}

{#snippet starIcon(filled: boolean)}
	<svg
		class="size-4 transition-[fill] duration-150"
		class:fill-marigold={filled}
		class:fill-none={!filled}
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		aria-hidden="true"
		stroke-width="1.8"
		stroke="currentColor">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1L3.2 9.7l6.1-.9z" />
	</svg>
{/snippet}
