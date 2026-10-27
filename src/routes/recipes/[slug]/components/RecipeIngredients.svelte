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

	// The line as typed, split around where the weight goes. A measured line
	// gets the weight where the measure sits, before the name: "1 cup (125g)
	// flour". A counted line has no measure, so the estimate trails.
	function parts(ingredient: Ingredient): [string, string] {
		const { text, name, unit } = ingredient;
		if (!unit || !text.endsWith(name)) return [text, ''];
		return [text.slice(0, text.length - name.length).trimEnd(), name];
	}

	const anyApproximate = $derived(grams.some((g) => g?.approximate));
</script>

<section class="mb-3">
	<div class="border-text mb-1 border-t-2 pt-3">
		<h4 class="eyebrow-label">Ingredients</h4>
	</div>
	<div class="m-0 p-0" role="list">
		{#each ingredients as ingredient, i (i)}
			{@const result = grams[i]}
			<!-- A native checkbox, visually hidden, carries the state and the keyboard
			     behaviour; the label is the row and takes the struck-through look. -->
			<label
				class="border-border text-text block cursor-pointer border-b py-2 text-base select-none has-[:checked]:line-through has-[:checked]:opacity-40 [&:last-child]:border-b-0">
				<input type="checkbox" class="sr-only" />
				{#if result}
					{@const [before, after] = parts(ingredient)}
					{before}
					<span
						class="text-sienna font-medium"
						title={result.approximate
							? 'Typical weight for a whole item; actual items vary'
							: undefined}>
						{formatGrams(result)}
					</span>
					{after}
				{:else}
					{ingredient.text}
				{/if}
			</label>
		{/each}
	</div>
	{#if anyApproximate}
		<p class="form-hint">Whole-item weights are estimates, not exact.</p>
	{/if}
</section>
