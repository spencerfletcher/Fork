<script lang="ts">
	import type { Ingredient } from '#lib/recipes/types.js';
	import type { GramResult } from '#lib/server/ingredientDensities.js';

	let { ingredients, grams }: { ingredients: Ingredient[]; grams: (GramResult | null)[] } =
		$props();

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
			     behaviour; the label is the row and takes the struck-through look. -->
			<label
				class="border-border text-text has-[:focus-visible]:outline-accent block cursor-pointer border-b py-2.5 text-base leading-[1.5] select-none has-[:checked]:line-through has-[:checked]:opacity-60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
				<input type="checkbox" class="sr-only" />
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
			</label>
		{/each}
	</div>
	{#if anyApproximate}
		<p class="form-hint">Whole-item weights are estimates, not exact.</p>
	{/if}
</section>
