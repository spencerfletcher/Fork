<script lang="ts">
	import { setShallowParam } from './shallowParam';
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
	// the stored value.
	function set(next: number) {
		const rounded = Number(formatServes(next));
		onchange(rounded);
		setShallowParam('serves', rounded === stored ? null : formatServes(rounded));
	}

	// Applied on change (blur, Enter, which blurs, or a step of the spinner or
	// an arrow key). An entry that does not read as servings is put back to the
	// current value.
	function apply(input: HTMLInputElement) {
		const next = parseServes(input.value, serves);
		input.value = formatServes(next);
		if (next !== serves) set(next);
	}

	// Reset leaves with the scaling, so focus moves to the box rather than
	// dropping to the page. A mouse click (detail > 0) keeps the page still.
	let box: HTMLInputElement | undefined = $state();
	function reset(e: MouseEvent) {
		box?.focus({ preventScroll: e.detail > 0 });
		set(stored);
	}
</script>

<!-- The native spinner: the arrows and the up and down keys step by 1, and
     step="any" keeps a typed 1.5 valid (Spencer, 31 October 2026: "add an up
     down selector ... regular HTML one is fine"). The multiplier and Reset come
     last: the control is left-aligned, so what appears or changes width grows
     rightward and the box stays under the cursor (Spencer, 31 October 2026). -->
<span class="serves">
	<input
		bind:this={box}
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
	{#if serves !== stored}
		<span class="factor">{formatServes(serves / stored)}x</span>
		<button type="button" class="text-btn reset" onclick={reset}>Reset</button>
	{/if}
</span>

<style>
	/* After the Ingredients eyebrow, at the row's start (Spencer, 11 November
	   2026: left, not right), nothing boxed: the number is an underlined blank.
	   Parts are 24px tall. The negative margins leave the row the eyebrow's
	   height, so its rule lines up with the Method rule beside it. */
	.serves {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
		margin: -8px 0;
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
		border-radius: 0;
		/* The underline is drawn, not a border, so on a phone it can sit under
		   the number with the box's hit room below it. */
		--underline: var(--color-text-3);
		background: linear-gradient(var(--underline), var(--underline)) left bottom / 100% 1px no-repeat;
		font: inherit;
		font-weight: 600;
		/* Ink while scaled too: the reader edits it, it is not an output. */
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	input:focus {
		--underline: var(--color-text-2);
	}

	/* Forced colours drop the drawn line; a border keeps the blank visible. */
	@media (forced-colors: active) {
		input {
			border-bottom: 1px solid CanvasText;
		}
	}

	.factor {
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-2);
	}

	/* The note belongs to the count, not the box: a step more room before it. */
	.factor {
		margin-left: 4px;
	}

	/* An iPad: the section tabs stand in for the eyebrow, so the control is
	   the row. Up through the content's 26px top padding, 10px under the tabs'
	   rule, as far from the list's rule below. */
	@media (min-width: 700px) and (max-width: 1023px) {
		.serves {
			margin: -16px 0 0;
		}
	}

	/* A thumb's 44px on a phone. Reset is a real 44px box, which reads as
	   space since nothing is drawn; the number's box reaches 10px above and
	   below its line, the underline under the number. A pseudo cannot grow an
	   input. The box spans the tabs' rule to the list's: up through the
	   content's 18px top padding, down through the row's 8px, so the line
	   sits 10px from each rule. */
	@media (max-width: 699px) {
		.serves {
			margin: -18px 0 -8px;
			gap: 0;
		}

		.reset {
			min-width: 44px;
			height: 44px;
		}

		input {
			height: 44px;
			padding: 10px 0;
			background-position: left bottom 10px;
			/* iOS zooms into a field under 16px. */
			font-size: 1rem;
		}

		.label,
		.factor {
			margin-left: 6px;
		}

		.factor {
			margin-right: 4px;
		}
	}
</style>
