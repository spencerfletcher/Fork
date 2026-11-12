<script lang="ts">
	import type { RecipeContent } from '#lib/recipes/types.js';
	import { scaling, type Scaling } from '#lib/recipes/scale.js';
	import { timeSpans } from '#lib/recipes/times.js';

	let {
		content,
		scale
	}: {
		content: Pick<
			RecipeContent,
			'prepTimeMinutes' | 'cookTimeMinutes' | 'restTimeMinutes' | 'servings' | 'makes'
		>;
		/** The page's scaling of `content`; scaled Serves and Makes read clay. Absent, as stored. */
		scale?: Scaling | null;
	} = $props();

	const shown = $derived(scale ?? scaling(content, null));
	const scaled = $derived(!!shown?.scaled);
	const makes = $derived(shown?.makes ?? null);

	// The times value then label, the serves label then value, in two groups:
	// "15 min prep · 13 min cook · 2 h rest" and "Serves 36 · Makes 36 cookies".
	// Each time its own pair and never a total: they can overlap.
	const lines = $derived.by(() => {
		const all: [string, string | null][][] = [
			timeSpans(content).map(({ value, word }) => [word, value]),
			[
				['Serves', shown?.serves ?? null],
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
	<p class="details dot-list text-text-2 font-sans text-base leading-[1.5]">
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
