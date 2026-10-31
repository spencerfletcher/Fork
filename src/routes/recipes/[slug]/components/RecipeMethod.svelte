<script lang="ts">
	import type { Step, StepAnnotationType } from '#lib/recipes/types.js';
	import { tickList } from './ticks.svelte.js';

	let { steps, storageKey }: { steps: Step[]; storageKey: string } = $props();

	const ticks = tickList(() => storageKey);

	const annotationColor: Record<StepAnnotationType, string> = {
		tip: 'text-text-3',
		warning: 'text-remove',
		substitution: 'text-text-2'
	};
</script>

<section id="method" class="mb-3 scroll-mt-14">
	<h2 class="eyebrow-label border-border mb-3.5 border-b pb-2">Method</h2>
	<ol class="m-0 flex list-none flex-col gap-[18px] p-0">
		{#each steps as step, i (i)}
			<!-- A native checkbox, visually hidden, carries the state and the keyboard
			     behaviour; the label is the row and takes the struck-through look. No
			     circle is drawn: the step ticks like an ingredient, unseen until
			     struck. A ticked step's numeral and text turn Ink 3, 4.9:1 on paper.
			     The row sets the numeral's face so its 2ch column is two of the
			     numeral's tabular digits; the numeral ends it, 10px from the text, and
			     every step's text starts on one edge. The hidden input spans the row's
			     height, so focusing it scrolls the whole step into view. -->
			<li>
				<label
					class="step group has-[:focus-visible]:outline-accent relative grid cursor-pointer [grid-template-columns:2ch_1fr] items-baseline gap-4 font-serif text-[1.125rem] select-none has-[:checked]:line-through has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
					<input
						type="checkbox"
						class="sr-only top-0 h-full"
						checked={ticks.ticked.includes(i)}
						onchange={(e) => ticks.toggle(i, e.currentTarget.checked)} />
					<span
						class="text-accent group-has-[:checked]:text-text-3 justify-self-end font-medium tabular-nums">
						{i + 1}
					</span>

					<div class="flex flex-col gap-1.5">
						<p
							class="step-text text-text group-has-[:checked]:text-text-3 m-0 font-sans text-[1.0625rem] leading-[1.6] whitespace-pre-line">
							{step.text}
						</p>
						{#if step.annotation}
							<p
								class="group-has-[:checked]:text-text-3 m-0 font-sans text-[0.9375rem] leading-[1.5] italic {annotationColor[
									step.annotation.type
								]}">
								{step.annotation.text}
							</p>
						{/if}
					</div>
				</label>
			</li>
		{/each}
	</ol>
	<!-- Clear ticks, only while a step is ticked: Ink 3 at the ingredients
	     note's size, a 24px hit, 44px on a phone or under a coarse pointer. -->
	{#if ticks.ticked.length > 0}
		<div class="mt-3 flex">
			<button type="button" class="clear-ticks" onclick={ticks.clear}>Clear ticks</button>
		</div>
	{/if}
</section>

<style>
	/* Cooking mode (the page root's data-cooking): the step text goes up one
	   size for a phone propped on the counter, and the numeral, the row's
	   face, keeps its proportion to it (18:17, so 21:20). */
	:global([data-cooking]) .step {
		font-size: 1.3125rem;
	}

	:global([data-cooking]) .step-text {
		font-size: 1.25rem;
		line-height: 1.55;
	}

	@media (max-width: 699px) {
		:global([data-cooking]) .step {
			font-size: 1.1875rem;
		}

		:global([data-cooking]) .step-text {
			font-size: 1.125rem;
		}
	}
</style>
