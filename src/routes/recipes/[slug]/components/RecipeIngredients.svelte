<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Ingredient } from '#lib/recipes/types.js';
	import type { GramResult } from '#lib/server/ingredientDensities.js';
	import { FRACTIONS, scaleIngredient } from '#lib/recipes/scale.js';
	import { groupStartingAt } from '#lib/recipes/groups.js';
	import { tickList } from './ticks.svelte.js';

	let {
		ingredients,
		grams,
		storageKey,
		factor = 1,
		control
	}: {
		ingredients: Ingredient[];
		grams: (GramResult | null)[];
		storageKey: string;
		/** The serving multiplier; lines that cannot be scaled print as typed. */
		factor?: number;
		/** The scale control, right of the eyebrow, above the same rule. */
		control?: Snippet;
	} = $props();

	const ticks = tickList(() => storageKey);

	// Whole grams, except below ten where a tenth matters: 5.7g, not 6g.
	function round(g: number): number {
		return g < 10 ? Math.round(g * 10) / 10 : Math.round(g);
	}

	function formatGrams({ grams, grams2, approximate }: GramResult): string {
		const range = grams2 === null ? '' : `–${round(grams2)}`;
		return `(${approximate ? '≈' : ''}${round(grams)}${range}g)`;
	}

	// "1/2" and its kin as the glyphs a cookbook sets.
	const vulgar = (s: string) => s.replace(/\b[1-7]\/[2348]\b/g, (f) => FRACTIONS[f] ?? f);

	// The line as typed, split into what is set bold and what is not, with the
	// weight between. A measured line bolds its measure and the weight sits
	// before the name: "1 cup (125g) flour". A counted line is all measure, so
	// it is bold whole and the estimate trails: "2 large eggs (≈100g)". A line
	// with no number ("salt to taste") has nothing to bold.
	function parts(ingredient: Ingredient): { bold: string; after: string } {
		const { text, name, unit } = ingredient;
		if (unit && text.endsWith(name)) {
			const measure = text.slice(0, text.length - name.length).trimEnd();
			return { bold: vulgar(measure), after: name };
		}
		if (/^[\d¼-¾⅐-⅞]/.test(text)) return { bold: vulgar(text), after: '' };
		return { bold: '', after: text };
	}

	const anyApproximate = $derived(grams.some((g) => g?.approximate));
	const anyScaled = $derived(
		ingredients.some((typed, i) => scaleIngredient(typed, grams[i], factor).ingredient !== typed)
	);
	// One note for whatever on the list is an estimate.
	const note = $derived.by(() => {
		if (anyScaled && anyApproximate)
			return 'Scaled quantities and whole-item weights are estimates.';
		if (anyScaled) return 'Scaled quantities are estimates.';
		if (anyApproximate) return 'Whole-item weights are estimates, not exact.';
		return null;
	});
</script>

<section id="ingredients" class="mb-3 scroll-mt-14">
	<!-- The eyebrow and the control it scales share one baseline and one rule.
	     It wraps under the eyebrow when the column is narrow, still at the end. -->
	<div class="border-border mb-1 flex flex-wrap items-baseline gap-x-4 border-b pb-2">
		<h2 class="eyebrow-label">Ingredients</h2>
		{@render control?.()}
	</div>
	<div>
		{#each ingredients as typed, i (i)}
			{@const { ingredient, grams: result } = scaleIngredient(typed, grams[i], factor)}
			{@const { bold, after } = parts(ingredient)}
			<!-- A row scaling changed reads clay, measure and weight, as an estimate
			     (Spencer, 31 October 2026); ticked, it recedes to Ink 3 like the rest. -->
			{@const scaled = ingredient !== typed}
			{@const group = groupStartingAt(ingredients, i)}
			<!-- A group's name over its rows: the serif at title size, ink, 20px of air
			     above (14 at the top of the list). Ungrouped rows draw nothing. -->
			{#if group !== undefined}
				<h3
					class="text-text mt-5 mb-0.5 font-serif text-[1.0625rem] leading-[1.25] font-medium first:mt-3.5">
					{group}
				</h3>
			{/if}
			<!-- A native checkbox, visually hidden, carries the state and the keyboard
			     behaviour; the label is the row and takes the struck-through look. The
			     circle at the row start is the checkbox's picture, drawn by .tick in
			     app.css. A ticked row's text turns Ink 3, grams too, 4.9:1 on paper;
			     the circle keeps its marigold. The hidden input spans the row's
			     height, so focusing it scrolls the whole row into view. -->
			<label
				class="group border-border text-text has-[:focus-visible]:outline-accent relative flex cursor-pointer items-baseline gap-2.5 border-b py-2.5 text-base leading-[1.5] select-none has-[:checked]:line-through has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
				<input
					type="checkbox"
					class="sr-only top-0 h-full"
					checked={ticks.ticked.includes(i)}
					onchange={(e) => ticks.toggle(i, e.currentTarget.checked)} />
				<span class="tick translate-y-[2px]" aria-hidden="true"></span>
				<span class="group-has-[:checked]:text-text-3 min-w-0 [overflow-wrap:anywhere]">
					{#if bold}<span
							class={['font-semibold', scaled && 'text-accent group-has-[:checked]:text-text-3']}>
							{bold}
						</span>{/if}
					{#if result}
						<!-- Same size as the line: WebKit strikes each inline box at its own
						     font metrics, so a smaller span would get a lower, separate line. -->
						<span
							class={scaled ? 'text-accent group-has-[:checked]:text-text-3' : 'text-text-3'}
							title={result.approximate
								? 'Typical weight for a whole item; actual items vary'
								: undefined}>
							{formatGrams(result)}
						</span>
					{/if}
					{after}
				</span>
			</label>
		{/each}
	</div>
	<!-- The list's foot: the weights note at the start, Clear ticks at the end,
	     only while a line is ticked. Clear ticks is Ink 3 at the note's size, a
	     24px hit, 44px on a phone or under a coarse pointer. -->
	{#if note || ticks.ticked.length > 0}
		<div class="flex items-baseline gap-4">
			{#if note}
				<p class="form-hint">{note}</p>
			{/if}
			{#if ticks.ticked.length > 0}
				<button type="button" class="clear-ticks" onclick={ticks.clear}>Clear ticks</button>
			{/if}
		</div>
	{/if}
</section>
