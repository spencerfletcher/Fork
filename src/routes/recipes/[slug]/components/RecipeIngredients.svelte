<script lang="ts">
	import type { RecipeVersion } from '#lib/server/db/schema.js';
	import type { Ingredient } from '#lib/recipes/types.js';

	let { currentVersion }: { currentVersion: RecipeVersion } = $props();

	let crossedIngredients = $state(new Set<string>());
	let showGrams = $state(false);
	type GramResult = { grams: number; approximate: boolean };
	let gramCache = $state<(GramResult | null)[] | null>(null);
	let gramsLoading = $state(false);

	$effect(() => {
		// Reset gram state when version changes. void suppresses no-unused-expressions.
		void currentVersion;
		gramCache = null;
		showGrams = false;
	});

	function toggleIngredient(name: string) {
		crossedIngredients = new Set(
			crossedIngredients.has(name)
				? [...crossedIngredients].filter((k) => k !== name)
				: [...crossedIngredients, name]
		);
	}

	// The line as typed with its weight worked in. A measured line gets the
	// weight where the measure sits, before the name: "1 cup (125g) flour". A
	// counted line has no measure, so the estimate trails: "2 eggs (≈100g)".
	function withGrams(ingredient: Ingredient, result: GramResult): string {
		const grams = `(${result.approximate ? '≈' : ''}${Math.round(result.grams)}g)`;
		const { text, name } = ingredient;
		if (result.approximate || !text.endsWith(name)) return `${text} ${grams}`;
		return `${text.slice(0, text.length - name.length).trimEnd()} ${grams} ${name}`;
	}

	async function toggleGrams() {
		showGrams = !showGrams;
		if (showGrams && gramCache === null) {
			gramsLoading = true;
			const res = await fetch('/api/convert-to-grams', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ingredients: currentVersion.ingredients })
			});
			gramsLoading = false;
			if (!res.ok) {
				// Rate limited or rejected — fall back to the original units
				// rather than rendering an empty column.
				showGrams = false;
				return;
			}
			const { results } = await res.json();
			gramCache = results;
		}
	}
</script>

<section class="mb-3">
	<div class="border-text mb-1 flex items-center justify-between border-t-2 pt-3">
		<h4 class="eyebrow-label">Ingredients</h4>
		<button
			class="rounded-pill border-border-2 text-text-3 hover:border-accent hover:text-accent border bg-transparent px-3 py-1 font-mono text-[0.8rem] font-semibold transition-[color,border-color] duration-150 disabled:opacity-50"
			onclick={toggleGrams}
			disabled={gramsLoading}>
			{gramsLoading ? '…' : showGrams ? 'original' : 'g'}
		</button>
	</div>
	<div class="m-0 p-0" role="list">
		{#each currentVersion.ingredients as ingredient, i (i)}
			<div
				class="border-border text-text cursor-pointer border-b py-2 text-base select-none [&:last-child]:border-b-0"
				class:opacity-40={crossedIngredients.has(ingredient.name)}
				class:line-through={crossedIngredients.has(ingredient.name)}
				onclick={() => toggleIngredient(ingredient.name)}
				role="checkbox"
				aria-checked={crossedIngredients.has(ingredient.name)}
				tabindex="0"
				onkeydown={(e) => e.key === ' ' && toggleIngredient(ingredient.name)}>
				{#if showGrams && gramCache?.[i]}
					<span title={gramCache[i].approximate ? 'Estimated weight for a whole item' : undefined}>
						{withGrams(ingredient, gramCache[i])}
					</span>
				{:else}
					{ingredient.text}
				{/if}
			</div>
		{/each}
	</div>
	{#if showGrams && gramCache?.some((g) => g?.approximate)}
		<p class="form-hint">Whole-item weights are estimates, not exact.</p>
	{/if}
</section>
