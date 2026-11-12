<script lang="ts" module>
	// Every line icon the app draws more than once, so none is copied. Line art
	// in one 1.5 stroke on a 16px box, legible at 14px (decided 9 November
	// 2026). Decoration only: the words beside them carry the meaning, so each
	// is aria-hidden. Styling one from another component needs :global, since
	// the svg belongs to this file's scope.
	export {
		audienceIcon,
		lockIcon,
		friendsIcon,
		likeIcon,
		moreIcon,
		forkIcon,
		saveIcon,
		journalIcon,
		chevronIcon,
		searchIcon,
		imageIcon,
		plusIcon,
		removeIcon,
		editIcon
	};
</script>

<script lang="ts">
	import type { Visibility } from '#lib/recipes/validation.js';
</script>

{#snippet lockIcon()}
	<svg
		class="icon"
		width="16"
		height="16"
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round">
		<rect x="3" y="7" width="10" height="7" rx="1.5" />
		<path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
	</svg>
{/snippet}

<!-- Two people, the tab bar's drawing, the one Friends everywhere. Drawn on
     24 and set at 16 unless asked bigger; the stroke scales to stay 1.5 on screen. -->
{#snippet friendsIcon(size: number = 16)}
	<svg
		class="icon"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width={(1.5 * 24) / size}
		stroke-linecap="round"
		stroke-linejoin="round">
		<circle cx="9" cy="8" r="3.5" />
		<path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
		<circle cx="17" cy="9" r="2.5" />
		<path d="M17.5 14.5A5 5 0 0 1 21.5 19" />
	</svg>
{/snippet}

<!-- Who can see it: a lock, the two people, or a globe for Public. A Journal
     entry's audience is a subset (Only me, Friends). -->
{#snippet audienceIcon(audience: Visibility)}
	{#if audience === 'private'}
		{@render lockIcon()}
	{:else if audience === 'friends'}
		{@render friendsIcon()}
	{:else}
		<svg
			class="icon"
			width="16"
			height="16"
			viewBox="0 0 16 16"
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round">
			<circle cx="8" cy="8" r="6" />
			<path
				d="M2 8h12M8 2c1.8 1.7 2.6 3.7 2.6 6S9.8 12.3 8 14C6.2 12.3 5.4 10.3 5.4 8S6.2 3.7 8 2z" />
		</svg>
	{/if}
{/snippet}

<!-- Like's heart: an outline, filled while pressed. -->
{#snippet likeIcon(filled: boolean)}
	<svg
		class="icon"
		width="16"
		height="16"
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill={filled ? 'currentColor' : 'none'}
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linejoin="round">
		<path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5z" />
	</svg>
{/snippet}

{#snippet moreIcon()}
	<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
		<circle cx="4.5" cy="10" r="1.6" />
		<circle cx="10" cy="10" r="1.6" />
		<circle cx="15.5" cy="10" r="1.6" />
	</svg>
{/snippet}

{#snippet forkIcon()}
	<svg
		class="size-4"
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round">
		<!-- Three tines: the outer two curve into one round shoulder, the middle
		     one runs on down as the handle (1A, a redesign candidate). -->
		<path d="M5 1.5V5a3 3 0 0 0 6 0V1.5M8 1.5v13" />
	</svg>
{/snippet}

<!-- Versions: a stack of pages, three offset strokes. Horizontal where the
     fork is vertical, so the two never read as one another. -->
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

<!-- Journal: a spiral notepad, three rings over a page of lines (2B). The
     tab bar's Journal and Add to Journal. Drawn on 24 like Friends; the rings
     sit 4 apart so they stay three at 16. -->
{#snippet journalIcon(size: number = 16)}
	<svg
		class="icon"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width={(1.5 * 24) / size}
		stroke-linecap="round"
		stroke-linejoin="round">
		<rect x="5" y="5" width="14" height="16.5" rx="1.5" />
		<path d="M8 3v4M12 3v4M16 3v4M8.5 11.5h7M8.5 15h7M8.5 18.5h4" />
	</svg>
{/snippet}

<!-- A disclosure's chevron, pointing down; `up` turns it while open. -->
{#snippet chevronIcon(up: boolean)}
	<svg
		class="chevron"
		class:up
		viewBox="0 0 12 12"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.6"
		stroke-linecap="round"
		stroke-linejoin="round">
		<path d="M2.5 4.5 6 8l3.5-3.5" />
	</svg>
{/snippet}

<!-- The magnifier, sized by the caller's classes. -->
{#snippet searchIcon(className: string)}
	<svg
		class={className}
		viewBox="0 0 24 24"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round">
		<circle cx="11" cy="11" r="7" />
		<path d="M20 20l-3.5-3.5" />
	</svg>
{/snippet}

<!-- The editor toolbar's Section heading: an H. -->

<!-- A picture: the photo field's empty tile. Drawn on 24, set at 24. -->
{#snippet imageIcon()}
	<svg
		class="icon"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round">
		<rect x="3.5" y="5" width="17" height="14" rx="2" />
		<path d="m3.5 16 5-4.5 4 3.5 2.5-2 5 3.5" />
		<circle cx="15.5" cy="9.5" r="1.5" />
	</svg>
{/snippet}

<!-- A plus, before the words it adds (Add photo). -->
{#snippet plusIcon()}
	<svg
		class="icon"
		width="16"
		height="16"
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round">
		<path d="M8 3.5v9M3.5 8h9" />
	</svg>
{/snippet}

<!-- A cross: a removable pill's ×, sized by the caller's class (.pill-x). -->
{#snippet removeIcon(className: string)}
	<svg
		class={className}
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round">
		<path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
	</svg>
{/snippet}

<!-- A pencil: Edit recipe, the action row's pill and the ⋯'s row. -->
{#snippet editIcon()}
	<svg
		class="size-4"
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round">
		<path d="M11.5 2.5l2 2L5 13H3v-2z" />
	</svg>
{/snippet}
