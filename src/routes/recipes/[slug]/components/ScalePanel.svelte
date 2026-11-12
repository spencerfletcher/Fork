<script module lang="ts">
	/** A pause in typing: how long an unreadable entry sits before the field
	 *  says why, and how long the facts line waits to announce a new yield, so
	 *  "1/" on the way to "1/2x" is never refused nor "1" on the way to "12" said. */
	export const TYPING_PAUSE_MS = 1000;
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import {
		MAX_SCALE,
		SCALE_HINT,
		SCALE_MESSAGES,
		formatServes,
		readScale,
		type Scaling
	} from '#lib/recipes/scale.js';

	let {
		scale,
		onchange,
		onclose
	}: {
		/** The page's scaling: what the field counts (servings, the Makes count or the multiplier) and its 1x. */
		scale: Scaling;
		/** A new count, already rounded to two decimals. */
		onchange: (count: number) => void;
		/** Escape: the facts line closes the panel and takes focus back. */
		onclose: () => void;
	} = $props();

	// The facts line above says Serves or Makes; the field names it for a
	// screen reader only, as the old control did.
	const NAMES = { serves: 'Servings', makes: 'Makes', scale: 'Scale' } as const;
	const counted = $derived(scale.by === 'serves' ? 'servings' : scale.unit);
	const stepNames = $derived(
		scale.by === 'scale' ? ['Scale down', 'Scale up'] : [`Fewer ${counted}`, `More ${counted}`]
	);

	// One serving; a Makes of a dozen or fewer one at a time; a bigger batch
	// (36 cookies) or a bare multiplier half a batch, so a step is a real change.
	const step = $derived(
		scale.by === 'serves' ? 1 : scale.by === 'makes' && scale.base <= 12 ? 1 : scale.base / 2
	);
	const rounded = (n: number) => Number(formatServes(n));
	const fits = (n: number) =>
		n > 0 && n / scale.base <= MAX_SCALE && n / scale.base >= 1 / MAX_SCALE;
	function go(next: number) {
		const count = rounded(next);
		if (fits(count) && count !== scale.count) onchange(count);
	}

	// The field's text, kept while typing ("2x" stays "2x"); a change from
	// anywhere else (a step, Reset) writes the new count into it.
	let typed = $state(untrack(() => formatServes(scale.count)));
	let error: string | null = $state(null);
	let mine = untrack(() => scale.count);
	$effect(() => {
		if (scale.count === mine) return;
		mine = scale.count;
		typed = formatServes(scale.count);
		error = null;
	});

	// Applied as typed: every entry that reads scales at once. One that does
	// not leaves the last good scale and says why on Enter, on leaving the
	// field, or after TYPING_PAUSE_MS without a keystroke, so "1/" on the way to
	// "1/2x" is never refused. An emptied field is mid-edit until Enter or blur.
	let pause: ReturnType<typeof setTimeout> | undefined;
	function refuse() {
		clearTimeout(pause);
		const read = readScale(typed, scale.base);
		error = read.ok ? null : SCALE_MESSAGES[read.reason];
	}
	function input(e: Event & { currentTarget: HTMLInputElement }) {
		typed = e.currentTarget.value;
		clearTimeout(pause);
		const read = readScale(typed, scale.base);
		if (read.ok) {
			error = null;
			mine = rounded(read.factor * scale.base);
			go(read.factor * scale.base);
		} else if (typed.trim() !== '') pause = setTimeout(refuse, TYPING_PAUSE_MS);
	}
	function commit() {
		refuse();
		if (!error) typed = formatServes(scale.count);
	}
	$effect(() => () => clearTimeout(pause));

	function keydown(e: KeyboardEvent) {
		if (e.key === 'Enter') commit();
		else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();
			go(scale.count + (e.key === 'ArrowUp' ? step : -step));
		}
	}

	// Reset leaves 1x with the button off, so a keyboard's focus goes to the
	// field rather than dropping to the page; a tap (detail > 0) leaves it.
	function reset(e: MouseEvent) {
		if (e.detail === 0) field?.focus();
		go(scale.base);
	}

	// Opening: a desktop types at once, the count selected so typing replaces
	// it; a touch screen focuses the first live button, so no keyboard comes
	// up until the field is tapped (the Cookbook picker's rule).
	let field: HTMLInputElement | undefined = $state();
	let row: HTMLElement | undefined = $state();
	onMount(() => {
		if (window.matchMedia?.('(max-width: 699px), (pointer: coarse)').matches) {
			row?.querySelector<HTMLButtonElement>('button:enabled')?.focus();
		} else {
			field?.focus();
			field?.select();
		}
	});
</script>

<!-- In flow under the facts line, pushing what follows down: no sheet, no
     popover, no Done (Spencer, 12 November 2026). -->
<!-- Escape from any control in it, as the key bubbles up. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	id="scale-panel"
	class="scale-panel"
	role="group"
	aria-label="Scale this recipe"
	onkeydown={(e) => {
		if (e.key === 'Escape') onclose();
	}}>
	<div class="scale-row" bind:this={row}>
		<span class="scale-group">
			<button
				type="button"
				class="step minus"
				aria-label={stepNames[0]}
				disabled={!fits(rounded(scale.count - step))}
				onclick={() => go(scale.count - step)}>
				−
			</button>
			<input
				bind:this={field}
				value={typed}
				type="text"
				inputmode="decimal"
				autocomplete="off"
				aria-label={NAMES[scale.by]}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? 'scale-error' : 'scale-hint'}
				oninput={input}
				onblur={commit}
				onkeydown={keydown} />
			<button
				type="button"
				class="step plus"
				aria-label={stepNames[1]}
				disabled={!fits(rounded(scale.count + step))}
				onclick={() => go(scale.count + step)}>
				+
			</button>
		</span>
		<button
			type="button"
			class="text-btn"
			aria-label="½× (halve)"
			disabled={!fits(rounded(scale.count / 2))}
			onclick={() => go(scale.count / 2)}>
			½×
		</button>
		<button
			type="button"
			class="text-btn"
			aria-label="2× (double)"
			disabled={!fits(rounded(scale.count * 2))}
			onclick={() => go(scale.count * 2)}>
			2×
		</button>
		<!-- Off as written rather than gone, so the row never changes width as
		     the count crosses 1x. -->
		<button type="button" class="text-btn" disabled={!scale.scaled} onclick={reset}>Reset</button>
	</div>
	{#if error}
		<FieldError name="scale" {error} />
	{:else}
		<p class="form-hint" id="scale-hint">{SCALE_HINT}</p>
	{/if}
</div>

<style>
	.scale-panel {
		margin-top: 8px;
	}

	.scale-row {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	/* − field + as one bordered Fork input: the field's surface, border and
	   corners on the group, the focus ring on it while the field is focused. */
	.scale-group {
		display: inline-flex;
		align-items: stretch;
		height: 36px;
		margin-right: 8px;
		background: var(--color-surface);
		border: 1px solid var(--color-input-border);
		border-radius: var(--radius-md);
	}

	.scale-group:has(input:focus-visible) {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.scale-group input {
		width: 4.5rem;
		height: 100%;
		padding: 0 4px;
		border: 0;
		border-radius: 0;
		background: transparent;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	/* The group carries the ring, so the field draws none of its own. */
	.scale-group input:focus-visible {
		outline: none;
	}

	.scale-group input[aria-invalid='true'] {
		color: var(--color-remove);
	}

	/* Drawn narrow: a glyph in a 32px cell. On a phone the hit reaches out
	   past the group's outer edge by the .hit-link pattern on the inline
	   axis (padding out, the same margin back), so each is 44 by 44 and the
	   layout does not move. */
	.step {
		--hit: 0px;
		box-sizing: content-box;
		width: 32px;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1;
		color: var(--color-text);
	}

	.minus {
		padding-left: var(--hit);
		margin-left: calc(-1 * var(--hit));
	}

	.plus {
		padding-right: var(--hit);
		margin-right: calc(-1 * var(--hit));
	}

	.step:disabled {
		opacity: 0.6;
		cursor: default;
	}

	@media (hover: hover) {
		.step:enabled:hover {
			color: var(--color-accent);
		}
	}

	.scale-panel :global(.field-error),
	.form-hint {
		margin-top: 6px;
	}

	/* A thumb's 44px: inside the group's 1px border, the field and the
	   steps' hit; each text button a 44px box (its label centred, nothing
	   drawn round it). */
	@media (max-width: 699px), (pointer: coarse) {
		.scale-group {
			height: 46px;
			margin-right: 12px;
		}

		.step {
			--hit: 12px;
		}

		.scale-row .text-btn {
			min-width: 44px;
			justify-content: center;
		}
	}
</style>
