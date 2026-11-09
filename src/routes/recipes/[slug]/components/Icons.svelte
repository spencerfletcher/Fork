<script lang="ts" module>
	// Icons the action row and the stats row share, so neither copies the SVG.
	// Decoration only: the words beside them carry the meaning.
	export { forkIcon, saveIcon };
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

<!-- Save's bookmark: an outline, filled marigold while saved. -->
{#snippet saveIcon(filled: boolean)}
	<svg
		class="size-4 transition-[fill] duration-150"
		class:fill-marigold={filled}
		class:fill-none={!filled}
		viewBox="0 0 16 16"
		aria-hidden="true"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linejoin="round">
		<path d="M4 2.5h8v11l-4-3-4 3z" />
	</svg>
{/snippet}
