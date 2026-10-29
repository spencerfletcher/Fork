<script lang="ts">
	import type { RecipeContent } from '#lib/recipes/types.js';
	import { formatTime } from '#lib/helpers.js';

	let {
		content
	}: { content: Pick<RecipeContent, 'prepTimeMinutes' | 'cookTimeMinutes' | 'servings'> } =
		$props();

	// Value then label, for all three: "15 min prep · 13 min cook · 36 servings".
	const pairs = $derived.by(() => {
		const all: [string, string | null][] = [
			['prep', content.prepTimeMinutes ? formatTime(content.prepTimeMinutes) : null],
			['cook', content.cookTimeMinutes ? formatTime(content.cookTimeMinutes) : null],
			[
				content.servings === 1 ? 'serving' : 'servings',
				content.servings ? String(content.servings) : null
			]
		];
		return all.filter((pair): pair is [string, string] => pair[1] !== null);
	});
</script>

<!-- The measure, one sans line at the body size: a 600 value and a plain
     label. A pair never splits; the line wraps only at the dots. -->
{#if pairs.length > 0}
	<p class="details text-text-2 m-0 font-sans text-base leading-[1.5]">
		{#each pairs as [label, value], i (label)}
			{#if i > 0}{' '}
				<span class="dot" aria-hidden="true">·</span>
				{' '}{/if}
			<span class="pair whitespace-nowrap">
				<span class="text-text font-semibold">{value}</span>
				{label}
			</span>
		{/each}
	</p>
{/if}

<style>
	.dot {
		padding: 0 8px;
		color: var(--color-border-2);
	}
</style>
