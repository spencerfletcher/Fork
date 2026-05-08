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
			const { results } = await res.json();
			gramCache = results;
			gramsLoading = false;
		}
	}
</script>

<section class="mb-3">
	<div class="mb-1 flex items-center justify-between border-t-2 border-text pt-3">
		<h4 class="eyebrow-label">Ingredients</h4>
		<button
			class="rounded-pill border border-border-2 bg-transparent px-3 py-1 font-mono text-[0.8rem] font-semibold text-text-3 transition-[color,border-color] duration-150 hover:border-accent hover:text-accent disabled:opacity-50"
			onclick={toggleGrams}
			disabled={gramsLoading}
		>
			{gramsLoading ? '…' : showGrams ? 'original' : 'g'}
		</button>
	</div>
	<div class="m-0 p-0" role="list">
		{#each currentVersion.ingredients as ingredient, i (ingredient.name)}
			<div
				class="cursor-pointer select-none border-b border-border py-2 text-base text-text [&:last-child]:border-b-0"
				class:opacity-40={crossedIngredients.has(ingredient.name)}
				class:line-through={crossedIngredients.has(ingredient.name)}
				onclick={() => toggleIngredient(ingredient.name)}
				role="checkbox"
				aria-checked={crossedIngredients.has(ingredient.name)}
				tabindex="0"
				onkeydown={(e) => e.key === ' ' && toggleIngredient(ingredient.name)}
			>
				<span class="font-medium text-sienna">
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
