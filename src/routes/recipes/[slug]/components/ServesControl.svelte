<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { MIN_SERVES, formatServes, parseServes } from '#lib/recipes/scale.js';

	let {
		stored,
		serves,
		onchange
	}: {
		/** The version's own servings: the multiplier's 1. */
		stored: number;
		serves: number;
		onchange: (serves: number) => void;
	} = $props();

	// The URL carries the serves so a scaled link shares, and drops them at
	// the stored value. A shallow replace: no navigation, no history entry per
	// press (goto's form of replaceState, which SvelteKit 3 deprecates).
	function set(next: number) {
		const rounded = Number(formatServes(next));
		onchange(rounded);
		const url = new URL(page.url.href);
		if (rounded === stored) url.searchParams.delete('serves');
		else url.searchParams.set('serves', formatServes(rounded));
		goto(url, { shallow: true, replace: true, state: page.state });
	}

	// Applied on change (blur, or Enter, which blurs). An entry that does not
	// read as servings is put back to the current value.
	function apply(input: HTMLInputElement) {
		const next = parseServes(input.value, serves);
		input.value = formatServes(next);
		if (next !== serves) set(next);
	}
</script>

<!-- Text, not type="number": no native ±1 spinner or arrow-key step, since
     the steps are ×2 and ÷2 (Spencer, 31 October 2026). -->
<span class="serves">
	<button
		type="button"
		class="step"
		aria-label="Halve servings"
		disabled={serves / 2 < MIN_SERVES}
		onclick={() => set(serves / 2)}>
		÷2
	</button>
	<input
		type="text"
		inputmode="decimal"
		aria-label="Servings"
		value={formatServes(serves)}
		onchange={(e) => apply(e.currentTarget)}
		onkeydown={(e) => {
			if (e.key === 'Enter') e.currentTarget.blur();
		}} />
	<button type="button" class="step" aria-label="Double servings" onclick={() => set(serves * 2)}>
		×2
	</button>
	<span class="label">{serves === 1 ? 'serving' : 'servings'}</span>
	{#if serves !== stored}
		<span class="factor">×{formatServes(serves / stored)}</span>
		<button type="button" class="reset" onclick={() => set(stored)}>Reset</button>
	{/if}
</span>

<style>
	/* One line in the measure: the value's ink 600 in the box, the label and
	   steps Ink 2. Desktop parts are 24px tall, inside the line's own height. */
	.serves {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		white-space: nowrap;
	}

	.step,
	input {
		box-sizing: border-box;
		height: 24px;
		border: 1px solid var(--color-border-2);
		border-radius: var(--radius-sm);
		font: inherit;
	}

	.step {
		min-width: 28px;
		padding: 0 4px;
		background: none;
		color: var(--color-text-2);
		font-weight: 600;
		cursor: pointer;
	}

	.step:hover:not(:disabled) {
		background: var(--color-tint);
		color: var(--color-text);
	}

	.step:disabled {
		color: var(--color-text-3);
		cursor: default;
	}

	input {
		width: 5ch;
		padding: 0 2px;
		background: var(--color-surface);
		color: var(--color-text);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	.label {
		margin-left: 2px;
	}

	.factor {
		margin-left: 6px;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-2);
	}

	/* A clay text action like the header's links, ink on hover; 24px hit by
	   padding pulled back by margin, so the text does not move. */
	.reset {
		padding: 4px 0;
		margin: -4px 0 -4px 4px;
		border: 0;
		background: none;
		font: inherit;
		font-weight: 600;
		color: var(--color-accent);
		cursor: pointer;
	}

	.reset:hover {
		color: var(--color-text);
	}

	/* A thumb's 44px on a phone. The parts are real 44px boxes, so the control
	   takes a taller row of its own when the measure wraps. */
	@media (max-width: 699px) {
		.step,
		input {
			height: 44px;
		}

		.step {
			min-width: 44px;
		}

		input {
			width: 6ch;
			/* iOS zooms into a field under 16px. */
			font-size: 1rem;
		}

		.reset {
			padding: 11px 0;
			margin-block: -11px;
		}
	}
</style>
