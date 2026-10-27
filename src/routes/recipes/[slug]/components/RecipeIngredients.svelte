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
	<h4 class="eyebrow-label mb-1">Ingredients</h4>
	<div class="m-0 p-0" role="list">
		{#each ingredients as ingredient, i (i)}
			{@const result = grams[i]}
			{@const [before, after] = parts(ingredient)}
			<!-- A native checkbox, visually hidden, carries the state and the keyboard
			     behaviour; the label is the row and takes the struck-through look. -->
			<label
				class="border-border text-text has-[:focus-visible]:outline-accent block cursor-pointer border-b py-2 text-base select-none has-[:checked]:line-through has-[:checked]:opacity-40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
				<input type="checkbox" class="sr-only" />
				{#if after}
					<span class="font-semibold">{before}</span>
				{:else}
					{before}
				{/if}
				{#if result}
					<span
						class="text-text-3 text-sm"
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
