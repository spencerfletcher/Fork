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
	// press (goto's form of replaceState, which SvelteKit 3 deprecates). That
	// replace leaves page.url behind, so it builds on page.shallow's URL when
	// there is one, keeping Cook's ?cook=1.
	function set(next: number) {
		const rounded = Number(formatServes(next));
		onchange(rounded);
		const url = new URL((page.shallow?.url ?? page.url).href);
		if (rounded === stored) url.searchParams.delete('serves');
		else url.searchParams.set('serves', formatServes(rounded));
		goto(url, { shallow: true, replace: true, state: page.state });
	}

	// Applied on change (blur, Enter, which blurs, or a step of the spinner or
	// an arrow key). An entry that does not read as servings is put back to the
	// current value.
	function apply(input: HTMLInputElement) {
		const next = parseServes(input.value, serves);
		input.value = formatServes(next);
		if (next !== serves) set(next);
	}
</script>

<!-- The native spinner: the arrows and the up and down keys step by 1, and
     step="any" keeps a typed 1.5 valid (Spencer, 31 October 2026: "add an up
     down selector ... regular HTML one is fine"). The multiplier and Reset come
     first: the control is right-aligned, so what appears or changes width grows
     leftward and the box stays under the cursor (Spencer, 31 October 2026). -->
<span class="serves">
	{#if serves !== stored}
		<span class="factor">{formatServes(serves / stored)}x</span>
		<button type="button" class="reset" onclick={() => set(stored)}>Reset</button>
	{/if}
	<input
		type="number"
		step="any"
		min={MIN_SERVES}
		inputmode="decimal"
		aria-label="Servings"
		value={formatServes(serves)}
		onchange={(e) => apply(e.currentTarget)}
		onkeydown={(e) => {
			if (e.key === 'Enter') e.currentTarget.blur();
		}} />
	<span class="label">{serves === 1 ? 'serving' : 'servings'}</span>
</span>

<style>
	/* Right of the Ingredients eyebrow, nothing boxed: the number is an
	   underlined blank. Parts are 24px tall. The negative margins leave the row the eyebrow's height, so
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

	input {
		box-sizing: border-box;
		/* Room for two digits and the spinner's arrows beside them. */
		width: 5ch;
		height: 24px;
		padding: 0;
		border: 0;
		border-bottom: 1px solid var(--color-text-3);
		border-radius: 0;
		background: transparent;
		font: inherit;
		font-weight: 600;
		/* Ink while scaled too: the reader edits it, it is not an output. */
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	input:focus {
		border-bottom-color: var(--color-text-2);
	}

	.factor {
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
		/* Reset belongs to the note, not the box: a step more room before it. */
		margin-right: 4px;
	}

	.reset:hover {
		color: var(--color-text);
	}

	/* A thumb's 44px on a phone. Reset is a real 44px box, which reads as
	   space since nothing is drawn; the number's box grows upward so its rule
	   stays under the digits. A pseudo cannot grow an input. */
	@media (max-width: 699px) {
		.serves {
			margin-block: 0;
			gap: 0;
		}

		.reset {
			min-width: 44px;
			height: 44px;
			margin-right: 0;
		}

		input {
			height: 44px;
			padding-top: 18px;
			/* iOS zooms into a field under 16px. */
			font-size: 1rem;
		}

		.label {
			margin-left: 6px;
		}
	}
</style>
