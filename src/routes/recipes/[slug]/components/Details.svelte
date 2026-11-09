<script lang="ts">
	import type { RecipeContent } from '#lib/recipes/types.js';
	import { formatTime } from '#lib/helpers.js';
	import { scaleMakes } from '#lib/recipes/scale.js';

	let {
		content,
		storedServings
	}: {
		content: Pick<RecipeContent, 'prepTimeMinutes' | 'cookTimeMinutes' | 'servings' | 'makes'>;
		/** The version's own servings; when `content.servings` differs, they are scaled and read clay. */
		storedServings?: number | null;
	} = $props();

	const scaled = $derived(storedServings != null && content.servings !== storedServings);

	// The yield follows the servings multiplier; it never sets it.
	const factor = $derived(
		storedServings && content.servings ? content.servings / storedServings : 1
	);
	const makes = $derived(content.makes ? scaleMakes(content.makes, factor) : null);

	// The times value then label, the serves label then value, in two groups:
	// "15 min prep · 13 min cook" and "Serves 36 · Makes 36 cookies".
	const lines = $derived.by(() => {
		const all: [string, string | null][][] = [
			[
				['prep', content.prepTimeMinutes ? formatTime(content.prepTimeMinutes) : null],
				['cook', content.cookTimeMinutes ? formatTime(content.cookTimeMinutes) : null]
			],
			[
				['Serves', content.servings ? String(content.servings) : null],
				['Makes', makes?.text ?? null]
			]
		];
		return all
			.map((line) => line.filter((pair): pair is [string, string] => pair[1] !== null))
			.filter((line) => line.length > 0);
	});
</script>

<!-- The measure, one sans line at the body size: a 600 value and a plain
     label. A pair never splits. The dots between pairs are drawn by CSS, never
     typed. A phone gives the times and the yield a line each. -->
{#if lines.length > 0}
	<p class="details dot-list text-text-2 m-0 font-sans text-base leading-[1.5]">
		{#each lines as line, l (l)}
			<!-- eslint-disable-next-line svelte/no-useless-mustaches -- a bare space between blocks is dropped -->
			{#if l > 0}{' '}{/if}
			<span class="line dot-list">
				{#each line as [label, value], i (label)}
					<!-- eslint-disable-next-line svelte/no-useless-mustaches -- a bare space between blocks is dropped -->
					{#if i > 0}{' '}{/if}
					<span class="pair whitespace-nowrap">
						{#if label === 'Serves'}
							{label}
							<span class={['font-semibold', scaled ? 'text-accent' : 'text-text']}>{value}</span>
						{:else if label === 'Makes'}
							<!-- Scaled reads clay, as the serves do; a size or temperature it left
							     alone says so in Ink 3, only while the recipe is scaled. -->
							{label}
							<span class={['font-semibold', makes?.scaled ? 'text-accent' : 'text-text']}>
								{value}
							</span>
							{#if makes?.flagged}<span class="not-scaled text-text-3">not scaled</span>{/if}
						{:else}
							<span class="text-text font-semibold">{value}</span>
							{label}
						{/if}
					</span>
				{/each}
			</span>
		{/each}
	</p>
{/if}

<style>
	/* Ink 3: Rule 2 vanished into the paper (29 October 2026). The right side
	   stands in for the typed space that used to follow the dot. Empty alt
	   text, so a screen reader does not read it out. */
	.details {
		--dot-space: 0 12px 0 8px;
	}

	/* The marker's dot is drawn too, never typed, like the pairs'. */
	.not-scaled::before {
		content: '·' / '';
		padding: 0 6px 0 4px;
	}

	@media (max-width: 699px) {
		.line {
			display: block;
		}

		.line + .line::before {
			content: none;
		}
	}
</style>
