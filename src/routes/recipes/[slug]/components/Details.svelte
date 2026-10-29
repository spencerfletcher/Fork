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
     label. A pair never splits. The dots between pairs are drawn by CSS, never
     typed, and a phone drops them for a gap, so no line strands one. -->
{#if pairs.length > 0}
	<p class="details text-text-2 m-0 font-sans text-base leading-[1.5]">
		{#each pairs as [label, value], i (label)}
			<!-- eslint-disable-next-line svelte/no-useless-mustaches -- a bare space between blocks is dropped -->
			{#if i > 0}{' '}{/if}
			<span class="pair whitespace-nowrap">
				<span class="text-text font-semibold">{value}</span>
				{label}
			</span>
		{/each}
	</p>
{/if}

<style>
	/* Ink 3: Rule 2 vanished into the paper (29 October 2026). The right side
	   stands in for the typed space that used to follow the dot. Empty alt
	   text, so a screen reader does not read it out. */
	.pair + .pair::before {
		content: '·' / '';
		padding: 0 12px 0 8px;
		color: var(--color-text-3);
	}

	@media (max-width: 699px) {
		.details {
			display: flex;
			flex-wrap: wrap;
			column-gap: 10px;
		}

		.pair + .pair::before {
			content: none;
		}
	}
</style>
