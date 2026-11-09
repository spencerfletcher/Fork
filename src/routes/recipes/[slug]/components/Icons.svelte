<script lang="ts" module>
	// Icons the action row and the stats row share, so neither copies the SVG.
	// Decoration only: the words beside them carry the meaning. Line art in one
	// 1.5 stroke on a 16px box, legible at 14px (decided 9 November 2026).
	export { forkIcon, saveIcon, versionsIcon };
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
		<!-- Four prongs rising from a short crossbar, a handle below: each one stroke. -->
		<path d="M4.25 1.5V7M6.75 1.5V7M9.25 1.5V7M11.75 1.5V7M4.25 7h7.5M8 7v7.5" />
	</svg>
{/snippet}

<!-- Versions: a stack of pages, three offset strokes. Horizontal where the
     fork is vertical, so the two never read as one another. -->
{#snippet versionsIcon()}
	<svg
		class="size-4"
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round">
		<path d="M2 4h8M4 8h8M6 12h8" />
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
