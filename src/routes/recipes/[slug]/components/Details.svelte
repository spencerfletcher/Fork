<script lang="ts">
	import { tick } from 'svelte';
	import type { RecipeContent } from '#lib/recipes/types.js';
	import { formatServes, scaling, type Scaling } from '#lib/recipes/scale.js';
	import { timeSpans } from '#lib/recipes/times.js';
	import { setShallowParam } from './shallowParam';
	import ScalePanel, { TYPING_PAUSE_MS } from './ScalePanel.svelte';

	let {
		content,
		scale,
		onscale
	}: {
		/** The times are optional: the cooking header shows the yield alone. */
		content: Pick<RecipeContent, 'servings' | 'makes'> &
			Partial<Pick<RecipeContent, 'prepTimeMinutes' | 'cookTimeMinutes' | 'restTimeMinutes'>>;
		/** The page's scaling of `content`; scaled Serves and Makes read clay. Absent, as stored. */
		scale?: Scaling | null;
		/** The page's count setter: given, the yield is followed by Scale and its panel. */
		onscale?: (count: number) => void;
	} = $props();

	const shown = $derived(scale ?? scaling(content, null));
	const scaled = $derived(!!shown?.scaled);
	const makes = $derived(shown?.makes ?? null);
	const scaler = $derived(onscale && shown);

	// The URL carries the count so a scaled link shares, in the recipe's own
	// param (?serves=, ?makes= or ?scale=), dropped at the recipe's own.
	let heard = $state('');
	let pause: ReturnType<typeof setTimeout> | undefined;
	function change(next: number) {
		if (!onscale || !shown) return;
		onscale(next);
		setShallowParam(shown.by, next === shown.base ? null : formatServes(next));
		// The new yield said once typing pauses, not per keystroke.
		clearTimeout(pause);
		pause = setTimeout(() => (heard = yieldWords()), TYPING_PAUSE_MS);
	}
	$effect(() => () => clearTimeout(pause));
	function yieldWords() {
		if (!shown) return '';
		if (shown.by === 'serves') return `Serves ${shown.serves}`;
		if (shown.by === 'makes') return `Makes ${shown.makes?.text}`;
		return `Scaled ${formatServes(shown.factor)}x`;
	}

	let open = $state(false);
	let trigger: HTMLButtonElement | undefined = $state();
	async function close() {
		open = false;
		await tick();
		trigger?.focus();
	}
	// The line's Reset leaves with the scaling, so focus goes to Scale.
	async function reset() {
		if (shown) change(shown.base);
		await tick();
		trigger?.focus();
	}

	// The times value then label, the serves label then value, in two groups:
	// "15 min prep · 13 min cook · 2 h rest" and "Serves 36 · Makes 36 cookies".
	// Each time its own pair and never a total: they can overlap.
	const lines = $derived.by(() => {
		const all: [string, string | null][][] = [
			timeSpans(content).map(({ value, word }) => [word, value]),
			[
				['Serves', shown?.serves ?? null],
				['Makes', makes?.text ?? null]
			]
		];
		return all
			.map((line) => line.filter((pair): pair is [string, string] => pair[1] !== null))
			.filter((line) => line.length > 0);
	});
</script>

<!-- The measure, one sans line at the body size: a 600 value and a plain
     label. A pair never splits. The dots between pairs are drawn by CSS, never
     typed. A phone gives the times and the yield a line each. -->
{#if lines.length > 0}
	<p class="details dot-list text-text-2 font-sans text-base leading-[1.5]">
		{#each lines as line, l (l)}
			<!-- eslint-disable-next-line svelte/no-useless-mustaches -- a bare space between blocks is dropped -->
			{#if l > 0}{' '}{/if}
			<span class="line dot-list">
				{#each line as [label, value], i (label)}
					<!-- eslint-disable-next-line svelte/no-useless-mustaches -- a bare space between blocks is dropped -->
					{#if i > 0}{' '}{/if}
					<span class="pair whitespace-nowrap">
						{#if label === 'Serves'}
							{label}
							<span class={['font-semibold', scaled ? 'text-accent' : 'text-text']}>{value}</span>
						{:else if label === 'Makes'}
							<!-- Scaled reads clay, as the serves do; a size or temperature it left
							     alone says so in Ink 3, only while the recipe is scaled. -->
							{label}
							<span class={['font-semibold', makes?.scaled ? 'text-accent' : 'text-text']}>
								{value}
							</span>
							{#if makes?.flagged}<span class="not-scaled text-text-3">not scaled</span>{/if}
						{:else}
							<span class="text-text font-semibold">{value}</span>
							{label}
						{/if}
					</span>
				{/each}
				<!-- The yield is the last line: Scale follows it, and Reset while
				     scaled with the panel closed, so the line alone says it is scaled
				     and undoes it. -->
				{#if scaler && l === lines.length - 1}
					<!-- eslint-disable-next-line svelte/no-useless-mustaches -- a bare space between blocks is dropped -->
					{' '}
					<span>
						<button
							bind:this={trigger}
							type="button"
							class="text-btn hit-link"
							aria-expanded={open}
							aria-controls="scale-panel"
							onclick={() => (open = !open)}>
							Scale
						</button>
					</span>
					<!-- eslint-disable-next-line svelte/no-useless-mustaches -- a bare space between blocks is dropped -->
					{#if scaled && !open}{' '}
						<span>
							<button type="button" class="text-btn hit-link" onclick={reset}>Reset</button>
						</span>{/if}
				{/if}
			</span>
		{/each}
	</p>
	{#if scaler && shown}
		{#if open}<ScalePanel scale={shown} onchange={change} onclose={close} />{/if}
		<p class="sr-only" role="status" aria-live="polite">{heard}</p>
	{/if}
{/if}

<style>
	/* Ink 3: Rule 2 vanished into the paper (29 October 2026). The right side
	   stands in for the typed space that used to follow the dot. Empty alt
	   text, so a screen reader does not read it out. */
	.details {
		--dot-space: 0 12px 0 8px;
	}

	/* In the line, at its size: a text button's look on the line's height,
	   its hit reached by .hit-link rather than a 44px box. */
	.details .text-btn {
		min-height: 0;
	}

	/* The marker's dot is drawn too, never typed, like the pairs'. */
	.not-scaled::before {
		content: '·' / '';
		padding: 0 6px 0 4px;
	}

	@media (max-width: 699px) {
		.line {
			display: block;
		}

		.line + .line::before {
			content: none;
		}
	}
</style>
