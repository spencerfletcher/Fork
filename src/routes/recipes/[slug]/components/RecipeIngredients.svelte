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

<section class="recipe-section">
	<div class="section-label-row">
		<h4 class="eyebrow-label">Ingredients</h4>
		<button class="unit-toggle" onclick={toggleGrams} disabled={gramsLoading}>
			{gramsLoading ? '…' : showGrams ? 'original' : 'g'}
		</button>
	</div>
	<div class="ingredient-list" role="list">
		{#each currentVersion.ingredients as ingredient, i (ingredient.name)}
			<div
				class="ingredient-row"
				class:crossed={crossedIngredients.has(ingredient.name)}
				onclick={() => toggleIngredient(ingredient.name)}
				role="checkbox"
				aria-checked={crossedIngredients.has(ingredient.name)}
				tabindex="0"
				onkeydown={(e) => e.key === ' ' && toggleIngredient(ingredient.name)}
			>
				<span class="ingredient-qty">
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

<style>
	.recipe-section {
		margin-bottom: var(--space-3);
	}

	.section-label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: 2px solid var(--color-text);
		padding-top: var(--space-3);
		margin-bottom: var(--space-1);
	}

	.unit-toggle {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--color-text-3);
		background: none;
		border: 1px solid var(--color-border-2);
		border-radius: var(--radius-pill);
		padding: 3px 10px;
		transition:
			color 0.15s,
			border-color 0.15s;
	}

	.unit-toggle:hover:not(:disabled) {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.unit-toggle:disabled {
		opacity: 0.5;
	}

	.ingredient-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.ingredient-row {
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--color-border);
		font-size: 1rem;
		color: var(--color-text);
		cursor: pointer;
		user-select: none;
	}

	.ingredient-row:last-child {
		border-bottom: none;
	}

	.ingredient-row.crossed {
		opacity: 0.4;
		text-decoration: line-through;
	}

	.ingredient-qty {
		font-weight: 500;
		color: var(--color-sienna);
		margin-right: var(--space-1);
	}
</style>
