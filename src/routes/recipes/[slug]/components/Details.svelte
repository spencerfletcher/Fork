<script lang="ts">
	import type { Recipe } from '$lib/server/db/schema';
	import { formatTime } from '$lib/helpers';

	let { recipe }: { recipe: Pick<Recipe, 'prepTimeMinutes' | 'cookTimeMinutes' | 'servings'> } =
		$props();
</script>

{#if recipe.prepTimeMinutes || recipe.cookTimeMinutes || recipe.servings}
	<div class="rounded-lg border border-border-2 bg-surface p-5">
		<h4 class="eyebrow-label mb-4">Details</h4>
		<dl class="m-0 flex flex-col gap-3 p-0">
			{#if recipe.prepTimeMinutes}
				<div class="flex items-baseline justify-between gap-3">
					<dt class="font-sans text-[0.75rem] font-medium text-text-3">Prep</dt>
					<dd class="m-0 font-mono text-[0.85rem] font-medium text-text">
						{formatTime(recipe.prepTimeMinutes)}
					</dd>
				</div>
			{/if}
			{#if recipe.cookTimeMinutes}
				<div class="flex items-baseline justify-between gap-3">
					<dt class="font-sans text-[0.75rem] font-medium text-text-3">Cook</dt>
					<dd class="m-0 font-mono text-[0.85rem] font-medium text-text">
						{formatTime(recipe.cookTimeMinutes)}
					</dd>
				</div>
			{/if}
			{#if recipe.servings}
				<div class="flex items-baseline justify-between gap-3">
					<dt class="font-sans text-[0.75rem] font-medium text-text-3">Serves</dt>
					<dd class="m-0 font-mono text-[0.85rem] font-medium text-text">{recipe.servings}</dd>
				</div>
			{/if}
		</dl>
	</div>
{/if}
