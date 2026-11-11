<script lang="ts">
	import { formatServes } from '#lib/recipes/scale.js';

	let {
		title,
		stored,
		serves,
		onexit
	}: {
		title: string;
		/** The version's own servings; 0 when it has none, and then there is no serves line. */
		stored: number;
		/** The serves the list is scaled to. */
		serves: number;
		/** Leaves cooking with the ticks kept. */
		onexit: () => void;
	} = $props();

	const scaled = $derived(stored > 0 && serves !== stored);

	// Mounted only while cooking, so the screen stays awake for as long as the
	// header is there. The browser drops the lock when the tab hides, so coming
	// back asks again. Where the API is missing or refuses, cooking works
	// without it and never throws.
	let noWakeLock = $state(false);
	$effect(() => {
		if (!('wakeLock' in navigator)) {
			noWakeLock = true;
			return;
		}
		let lock: WakeLockSentinel | undefined;
		let done = false;
		const request = () =>
			navigator.wakeLock.request('screen').then(
				(next) => {
					if (done) next.release().catch(() => {});
					else lock = next;
				},
				() => {}
			);
		const release = () => lock?.release().catch(() => {});
		const onVisibility = () => {
			if (document.visibilityState === 'visible' && (!lock || lock.released)) request();
		};
		request();
		document.addEventListener('visibilitychange', onVisibility);
		// Unload; a page kept in the back-forward cache asks again when shown.
		window.addEventListener('pagehide', release);
		return () => {
			done = true;
			release();
			document.removeEventListener('visibilitychange', onVisibility);
			window.removeEventListener('pagehide', release);
		};
	});
</script>

<!-- Cooking's own header (Spencer, 11 November 2026): paper, compact, the
     title in Bitter under a small "Cooking" label, the serves being cooked,
     and a quiet Exit. Not pinned: the bottom switch is the one pinned bar. -->
<header class="cook-header page">
	<div class="page-inner cook-inner">
		<div class="min-w-0">
			<p class="eyebrow-label">Cooking</p>
			<h1 class="title">{title}</h1>
			{#if stored > 0}
				<!-- Scaled, the number and the multiplier are clay, the Dynamic Is Clay
				     Rule; the multiplier is written as the scaler writes it. -->
				<p class="serves dot-list">
					Serves <b class={[scaled && 'text-accent']}>{formatServes(serves)}</b>
					{#if scaled}
						<span class="text-accent">{formatServes(serves / stored)}x</span>
					{/if}
				</p>
			{/if}
		</div>
		<button type="button" class="text-btn text-btn--ink exit" onclick={onexit}>Exit</button>
	</div>
	{#if noWakeLock}
		<p class="page-inner form-hint">Your screen may still sleep.</p>
	{/if}
</header>

<style>
	/* Paper to the screen's top edge, so with the espresso bar gone the
	   status bar is paper too; padded under the clock on the home screen. */
	.cook-header {
		background: var(--color-bg);
		padding-top: calc(12px + env(safe-area-inset-top));
		padding-bottom: 4px;
	}

	.cook-inner {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		column-gap: 16px;
		align-items: center;
	}

	/* Two lines at most, then an ellipsis; the whole title stays in the page
	   for a screen reader. */
	.title {
		margin-top: 2px;
		font-family: var(--font-serif);
		font-size: 1.5rem;
		font-weight: 500;
		line-height: 1.25;
		color: var(--color-text);
		overflow-wrap: anywhere;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}

	/* The measure's voice: the label Ink 2, the value 600. */
	.serves {
		margin-top: 2px;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--color-text-2);
		/* The space before the dot is typed, so the pad sits after it. */
		--dot-space: 0 0.25em 0 0;
	}

	.serves b {
		font-weight: 600;
		color: var(--color-text);
	}

	.serves b.text-accent {
		color: var(--color-accent);
	}

	.exit {
		font-size: 1rem;
	}

	@media (max-width: 699px) {
		.title {
			font-size: 1.25rem;
		}
	}
</style>
