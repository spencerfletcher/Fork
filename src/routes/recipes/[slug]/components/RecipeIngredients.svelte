<script lang="ts">
	import type { Ingredient } from '#lib/recipes/types.js';
	import type { GramResult } from '#lib/server/ingredientDensities.js';
	import { loadTicks, saveTicks } from './ticks';

	let {
		ingredients,
		grams,
		storageKey
	}: { ingredients: Ingredient[]; grams: (GramResult | null)[]; storageKey: string } = $props();

	// Writable derived: the ticks reload whenever the page moves to another
	// version, and a click changes them. The server has no localStorage, so it
	// renders none; hydration restores them.
	let ticked = $derived(loadTicks(storageKey));

	function toggle(i: number, on: boolean) {
		ticked = on ? [...ticked, i] : ticked.filter((j) => j !== i);
		saveTicks(storageKey, ticked);
	}

	// The button leaves with the last tick, so focus moves to the list's first
	// checkbox rather than dropping to the page.
	function clear(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		e.currentTarget.closest('section')?.querySelector('input')?.focus();
		ticked = [];
		saveTicks(storageKey, ticked);
	}

	// Whole grams, except below ten where a tenth matters: 5.7g, not 6g.
	function round(g: number): number {
		return g < 10 ? Math.round(g * 10) / 10 : Math.round(g);
	}

	function formatGrams({ grams, grams2, approximate }: GramResult): string {
		const range = grams2 === null ? '' : `–${round(grams2)}`;
		return `(${approximate ? '≈' : ''}${round(grams)}${range}g)`;
	}

	// "1/2" and its kin as the glyphs a cookbook sets.
	const FRACTIONS: Record<string, string> = {
		'1/2': '½',
		'1/3': '⅓',
		'2/3': '⅔',
		'1/4': '¼',
		'3/4': '¾',
		'1/8': '⅛'
	};
	const vulgar = (s: string) => s.replace(/\b[123]\/[2348]\b/g, (f) => FRACTIONS[f] ?? f);

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
		if (/^\d/.test(text)) return { bold: vulgar(text), after: '' };
		return { bold: '', after: text };
	}

	const anyApproximate = $derived(grams.some((g) => g?.approximate));
</script>

<section id="ingredients" class="mb-3 scroll-mt-14">
	<h2 class="eyebrow-label border-border mb-1 border-b pb-2">Ingredients</h2>
	<div class="m-0 p-0">
		{#each ingredients as ingredient, i (i)}
			{@const result = grams[i]}
			{@const { bold, after } = parts(ingredient)}
			<!-- A native checkbox, visually hidden, carries the state and the keyboard
			     behaviour; the label is the row and takes the struck-through look. The
			     square at the row start is the checkbox's picture: an Ink 3 edge, then
			     full clay when checked (decided 29 October 2026). A ticked row's text
			     turns Ink 3, grams too, 4.9:1 on paper; the square keeps full clay. The hidden input spans the
			     row's height, so focusing it scrolls the whole row into view. -->
			<label
				class="group border-border text-text has-[:focus-visible]:outline-accent relative flex cursor-pointer items-baseline gap-2.5 border-b py-2.5 text-base leading-[1.5] select-none has-[:checked]:line-through has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
				<input
					type="checkbox"
					class="sr-only top-0 h-full"
					checked={ticked.includes(i)}
					onchange={(e) => toggle(i, e.currentTarget.checked)} />
				<span
					class="tick border-text-3 group-has-[:checked]:bg-accent group-has-[:checked]:border-accent size-3.5 shrink-0 translate-y-[2px] rounded-[3px] border"
					aria-hidden="true">
				</span>
				<span class="group-has-[:checked]:text-text-3 min-w-0">
					{#if bold}<span class="font-semibold">{bold}</span>{/if}
					{#if result}
						<!-- Same size as the line: WebKit strikes each inline box at its own
						     font metrics, so a smaller span would get a lower, separate line. -->
						<span
							class="text-text-3"
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
	{#if anyApproximate || ticked.length > 0}
		<div class="flex items-baseline gap-4">
			{#if anyApproximate}
				<p class="form-hint">Whole-item weights are estimates, not exact.</p>
			{/if}
			{#if ticked.length > 0}
				<button
					type="button"
					class="text-text-3 hover:text-text -my-0.5 ml-auto cursor-pointer py-0.5 text-sm max-[699px]:-my-3 max-[699px]:py-3 pointer-coarse:-my-3 pointer-coarse:py-3"
					onclick={clear}>
					Clear ticks
				</button>
			{/if}
		</div>
	{/if}
</section>

<style>
	/* Forced colours strip the clay fill, so a ticked square would look empty:
	   the square keeps its own paint, in system colours. */
	@media (forced-colors: active) {
		.tick {
			forced-color-adjust: none;
			border-color: CanvasText;
		}

		label:has(:checked) .tick {
			background-color: Highlight;
			border-color: Highlight;
		}
	}
</style>
