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

<!-- The measure, one row where it fits and wrapping where it does not: a bold
     label and a plain value, both the body face at the body size. -->
{#if rows.length > 0}
	<dl class="details m-0 flex flex-wrap gap-x-7 gap-y-1 p-0 font-sans text-base leading-[1.5]">
		{#each rows as [label, value] (label)}
			<div class="flex gap-2">
				<dt class="text-text font-semibold">{label}</dt>
				<dd class="text-text m-0">{value}</dd>
			</div>
		{/each}
	</dl>
{/if}
