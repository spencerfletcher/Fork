<script lang="ts">
	import type { RecipeContent } from '#lib/recipes/types.js';
	import { formatTime } from '#lib/helpers.js';

	let {
		content
	}: { content: Pick<RecipeContent, 'prepTimeMinutes' | 'cookTimeMinutes' | 'servings'> } =
		$props();

	const rows = $derived.by(() => {
		const all: [string, string | null][] = [
			['Prep', content.prepTimeMinutes ? formatTime(content.prepTimeMinutes) : null],
			['Cook', content.cookTimeMinutes ? formatTime(content.cookTimeMinutes) : null],
			['Serves', content.servings ? String(content.servings) : null]
		];
		return all.filter((row): row is [string, string] => row[1] !== null);
	});
</script>

{#if rows.length > 0}
	<div class="border-border-2 bg-surface rounded-lg border p-5">
		<h4 class="eyebrow-label mb-4">Details</h4>
		<dl class="m-0 flex flex-col gap-3 p-0">
			{#each rows as [label, value] (label)}
				<div class="flex items-baseline justify-between gap-3">
					<dt class="text-text-3 font-sans text-[0.75rem] font-medium">{label}</dt>
					<dd class="text-text m-0 font-mono text-[0.85rem] font-medium">{value}</dd>
				</div>
			{/each}
		</dl>
	</div>
{/if}
