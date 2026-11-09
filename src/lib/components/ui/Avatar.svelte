<script lang="ts">
	// A cook's initial on a clay-tint disc, standing in for a photo: the
	// no-photo panel's treatment. Decoration: the handle beside it, or the
	// control around it, names the cook. A 1px transparent border inside the
	// size shows only under forced colours, where the tint goes and the
	// border keeps the circle.
	let {
		username,
		size,
		tone = 'clay',
		responsive = false
	}: {
		username: string;
		/** 28 on cards, 32 in the bar and a request, 36 in the feed, 72 on a profile. */
		size: 28 | 32 | 36 | 72;
		/** Clay initial on paper; ink in the bar, where clay is not drawn on espresso. */
		tone?: 'clay' | 'ink';
		/** The profile's 72 steps down to 56 on a phone. */
		responsive?: boolean;
	} = $props();

	const FONT: Record<typeof size, string> = {
		28: '0.875rem',
		32: '0.9375rem',
		36: '1rem',
		72: '1.75rem'
	};
</script>

<span
	class="avatar"
	class:ink={tone === 'ink'}
	class:responsive
	style:--avatar-size="{size}px"
	style:--avatar-font={FONT[size]}
	aria-hidden="true">
	{username.charAt(0).toUpperCase()}
</span>

<style>
	.avatar {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: var(--avatar-size);
		height: var(--avatar-size);
		border: 1px solid transparent;
		border-radius: 50%;
		background: var(--color-tint);
		color: var(--color-accent);
		font-family: var(--font-serif);
		font-size: var(--avatar-font);
		font-weight: 500;
		line-height: 1;
		transition: background 0.15s ease;
	}

	.ink {
		color: var(--color-text);
	}

	@media (max-width: 699px) {
		/* Not the custom properties: the inline ones would outrank them. */
		.responsive {
			width: 56px;
			height: 56px;
			font-size: 1.375rem;
		}
	}
</style>
