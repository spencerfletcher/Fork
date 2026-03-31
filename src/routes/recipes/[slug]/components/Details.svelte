<script lang="ts">
	import type { Recipe } from '$lib/server/db/schema';
	import { formatTime } from '$lib/helpers';

	let { recipe }: { recipe: Pick<Recipe, 'prepTimeMinutes' | 'cookTimeMinutes' | 'servings'> } =
		$props();
</script>

{#if recipe.prepTimeMinutes || recipe.cookTimeMinutes || recipe.servings}
	<div class="sidebar-card">
		<h4 class="eyebrow-label card-label">Details</h4>
		<dl class="details-list">
			{#if recipe.prepTimeMinutes}
				<div class="detail-row">
					<dt class="detail-label">Prep</dt>
					<dd class="detail-value">{formatTime(recipe.prepTimeMinutes)}</dd>
				</div>
			{/if}
			{#if recipe.cookTimeMinutes}
				<div class="detail-row">
					<dt class="detail-label">Cook</dt>
					<dd class="detail-value">{formatTime(recipe.cookTimeMinutes)}</dd>
				</div>
			{/if}
			{#if recipe.servings}
				<div class="detail-row">
					<dt class="detail-label">Serves</dt>
					<dd class="detail-value">{recipe.servings}</dd>
				</div>
			{/if}
		</dl>
	</div>
{/if}

<style>
	/* ── Sidebar cards ── */
	.sidebar-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border-2);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
	}

	.card-label {
		margin-bottom: var(--space-4);
	}

	/* ── Details list ── */
	.details-list {
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.detail-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.detail-label {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-3);
	}

	.detail-value {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text);
		margin: 0;
	}
</style>
