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
	<dl class="details m-0 flex flex-col p-0">
		{#each rows as [label, value] (label)}
			<div
				class="border-border flex items-baseline justify-between gap-3 border-t py-[7px] last:border-b">
				<dt class="text-text-3 text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
					{label}
				</dt>
				<dd class="text-text m-0 font-sans text-base font-semibold">{value}</dd>
			</div>
		{/each}
	</dl>
{/if}
