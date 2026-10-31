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
		class={serves === stored ? 'text-text' : 'text-accent'}
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
		<span class="factor">{formatServes(serves / stored)}x</span>
		<button type="button" class="reset" onclick={() => set(stored)}>Reset</button>
	{/if}
</span>

<style>
	/* Right of the Ingredients eyebrow, nothing boxed: the steps are Ink 2 text
	   that underlines like a link, the number an underlined blank. Parts are
	   24px tall. The negative margins leave the row the eyebrow's height, so
	   its rule lines up with the Method rule beside it. */
	.serves {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
		margin: -8px 0 -8px auto;
		font-size: 0.9375rem;
		line-height: 24px;
		color: var(--color-text-2);
		white-space: nowrap;
	}

	.step {
		height: 24px;
		padding: 0 2px;
		border: 0;
		background: none;
		font: inherit;
		font-weight: 600;
		color: var(--color-text-2);
		cursor: pointer;
	}

	.step:hover:not(:disabled),
	.step:focus-visible {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.step:disabled {
		color: var(--color-text-3);
		cursor: default;
	}

	input {
		box-sizing: border-box;
		width: 4ch;
		height: 24px;
		padding: 0;
		border: 0;
		border-bottom: 1px solid var(--color-text-3);
		border-radius: 0;
		background: transparent;
		font: inherit;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	input:focus {
		border-bottom-color: var(--color-text-2);
	}

	.factor {
		margin-left: 4px;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-2);
	}

	/* A clay text action like the header's links, ink on hover; 24px tall on
	   the control's line. */
	.reset {
		padding: 0;
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

	/* A thumb's 44px on a phone. The steps and Reset are real 44px boxes, which
	   read as space since nothing is drawn; the number's box grows upward so
	   its rule stays under the digits. A pseudo cannot grow an input, and one
	   on the steps would reach over the number. */
	@media (max-width: 699px) {
		.serves {
			margin-block: 0;
			gap: 0;
		}

		.step,
		.reset {
			min-width: 44px;
			height: 44px;
		}

		input {
			width: 4ch;
			height: 44px;
			padding-top: 18px;
			/* iOS zooms into a field under 16px. */
			font-size: 1rem;
		}

		.label {
			margin-left: 6px;
		}

		.factor {
			margin-left: 10px;
		}
	}
</style>
