<script lang="ts" module>
	// Icons the Journal, the Add to Journal form and the Friends feed share.
	// Decoration only: the words beside them carry the meaning.
	export { audienceIcon, lockIcon, likeIcon, moreIcon };
</script>

<script lang="ts">
	import type { LogAudience } from '#lib/server/db/schema.js';
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

{#snippet audienceIcon(audience: LogAudience)}
	{#if audience === 'private'}
		{@render lockIcon()}
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
			<circle cx="6" cy="5.5" r="2.2" />
			<path d="M2 13c.4-2.3 2-3.5 4-3.5s3.6 1.2 4 3.5" />
			<circle cx="11.3" cy="6" r="1.8" />
			<path d="M11 9.6c1.6.1 2.7 1.2 3 3" />
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
