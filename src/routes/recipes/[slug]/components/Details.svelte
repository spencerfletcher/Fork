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

<!-- One line of measurement under the recipe's text, set in mono like the
     byline: a label and its value, a dot between pairs. -->
{#if rows.length > 0}
	<dl class="details m-0 flex flex-wrap items-baseline gap-x-5 gap-y-1 p-0">
		{#each rows as [label, value] (label)}
			<div class="flex items-baseline gap-2">
				<dt class="text-text-3 font-mono text-[0.875rem] uppercase">{label}</dt>
				<dd class="text-text m-0 font-sans text-[0.9375rem] font-semibold">{value}</dd>
			</div>
		{/each}
	</dl>
{/if}
