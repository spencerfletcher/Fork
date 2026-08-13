<script lang="ts">
	import type { RecipeVersion } from '$lib/server/db/schema';

	let { currentVersion }: { currentVersion: RecipeVersion } = $props();

	let crossedIngredients = $state(new Set<string>());
	let showGrams = $state(false);
	let gramCache = $state<(number | null)[] | null>(null);
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
			disabled={gramsLoading}
		>
			{gramsLoading ? '…' : showGrams ? 'original' : 'g'}
		</button>
	</div>
	<div class="m-0 p-0" role="list">
		{#each currentVersion.ingredients as ingredient, i (ingredient.name)}
			<div
				class="border-border text-text cursor-pointer border-b py-2 text-base select-none [&:last-child]:border-b-0"
				class:opacity-40={crossedIngredients.has(ingredient.name)}
				class:line-through={crossedIngredients.has(ingredient.name)}
				onclick={() => toggleIngredient(ingredient.name)}
				role="checkbox"
				aria-checked={crossedIngredients.has(ingredient.name)}
				tabindex="0"
				onkeydown={(e) => e.key === ' ' && toggleIngredient(ingredient.name)}
			>
				<span class="text-sienna font-medium">
					{#if showGrams && gramCache}
						{gramCache[i] !== null
							? `${Math.round(gramCache[i]!)}g`
							: `${ingredient.amount}${ingredient.unit ? ' ' + ingredient.unit : ''}`}
					{:else}
						{ingredient.amount}{ingredient.unit ? ' ' + ingredient.unit : ''}
					{/if}
				</span>
				{ingredient.name}
			</div>
		{/each}
	</div>
</section>
