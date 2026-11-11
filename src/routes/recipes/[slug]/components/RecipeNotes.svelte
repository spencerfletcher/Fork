<script lang="ts">
	import type { RecipeContent } from '#lib/recipes/types.js';
	import { TEXT_LIMITS } from '#lib/recipes/limits.js';

	let {
		content
	}: {
		content: Pick<RecipeContent, 'notes' | 'makeAhead' | 'equipment' | 'storage' | 'reheating'>;
	} = $props();

	// The short notes in the order a cook meets them: before, during, after.
	const LABELLED = ['makeAhead', 'equipment', 'storage', 'reheating'] as const;
	const labelled = $derived(
		LABELLED.flatMap((field) =>
			content[field] ? [{ field, label: TEXT_LIMITS[field].label, text: content[field] }] : []
		)
	);
</script>

<!-- The author's notes for the whole recipe, under the method in reading,
     cooking and print alike: the free text, then the labelled short notes. -->
{#if content.notes || labelled.length > 0}
	<section id="notes" class="notes" aria-labelledby="notes-heading">
		<h2 id="notes-heading" class="eyebrow-label border-border mb-3.5 border-b pb-2">Notes</h2>
		{#if content.notes}
			<p
				class="notes-text text-text font-sans text-base leading-[1.65] [overflow-wrap:anywhere] whitespace-pre-line">
				{content.notes}
			</p>
		{/if}
		{#if labelled.length > 0}
			<dl class="font-sans text-base leading-[1.5] [overflow-wrap:anywhere]">
				{#each labelled as { field, label, text } (field)}
					<div class="item">
						<dt class="text-text font-semibold">{label}</dt>
						<dd class="text-text-2">{text}</dd>
					</div>
				{/each}
			</dl>
		{/if}
	</section>
{/if}

<style>
	.notes {
		margin-top: 32px;
	}

	.notes-text {
		max-width: 72ch;
	}

	.notes-text + dl {
		margin-top: 16px;
	}

	dl {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 72ch;
	}

	@media print {
		.notes {
			margin-top: 14pt;
		}

		h2 {
			break-after: avoid;
		}

		.item {
			break-inside: avoid;
		}
	}
</style>
