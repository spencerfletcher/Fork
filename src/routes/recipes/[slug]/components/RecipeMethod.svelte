<script lang="ts">
	import type { Step, StepAnnotationType } from '#lib/recipes/types.js';
	import { groupStartingAt } from '#lib/recipes/groups.js';
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
	<ol class="steps flex flex-col gap-[18px]">
		{#each steps as step, i (i)}
			<!-- A native checkbox, visually hidden, carries the state and the keyboard
			     behaviour; the label is the row and takes the struck-through look. No
			     circle is drawn: the step ticks like an ingredient, unseen until
			     struck. A ticked step's numeral and text turn Ink 3, 4.9:1 on paper.
			     The row sets the numeral's face so its 2ch column is two of the
			     numeral's tabular digits; the numeral ends it, 10px from the text, and
			     every step's text starts on one edge. The hidden input spans the row's
			     height, so focusing it scrolls the whole step into view. -->
			{@const group = groupStartingAt(steps, i)}
			<!-- A group's name heads its first step, inside the item so the list stays
			     a list of steps; the numbers run straight through the groups. -->
			<li>
				{#if group !== undefined}
					<h3
						class={[
							'text-text m-0 mb-3 font-serif text-[1.0625rem] leading-[1.25] font-medium',
							i > 0 && 'mt-2'
						]}>
						{group}
					</h3>
				{/if}
				<label
					class="step group has-[:focus-visible]:outline-accent relative grid cursor-pointer [grid-template-columns:2ch_minmax(0,1fr)] items-baseline gap-4 font-serif text-[1.125rem] select-none has-[:checked]:line-through has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
					<input
						type="checkbox"
						class="sr-only top-0 h-full"
						checked={ticks.ticked.includes(i)}
						onchange={(e) => ticks.toggle(i, e.currentTarget.checked)} />
					<!-- The numeral's column; while cooking a done step's check sits under
					     the numeral, so the text keeps its edge. -->
					<span class="flex flex-col items-end gap-1.5 justify-self-end">
						<span class="text-accent group-has-[:checked]:text-text-3 font-medium tabular-nums">
							{i + 1}
						</span>
						<span class="tick step-check" aria-hidden="true"></span>
					</span>

					<div class="flex flex-col gap-1.5">
						<p
							class="step-text text-text group-has-[:checked]:text-text-3 font-sans text-[1.0625rem] leading-[1.6] [overflow-wrap:anywhere] whitespace-pre-line">
							{step.text}
						</p>
						{#if step.annotation}
							<p
								class="group-has-[:checked]:text-text-3 font-sans text-[0.9375rem] leading-[1.5] italic {annotationColor[
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
	/* Cooking mode (the page root's data-cooking; Spencer, 11 November 2026):
	   type to read from across the counter, between 3B's 1.25rem and 3C's
	   1.375rem on a phone and a step up from 700px. The numeral, the row's
	   face, hangs in clay Bitter, 3C's reading order. */
	:global([data-cooking]) .steps {
		gap: 24px;
	}

	:global([data-cooking]) .step {
		font-size: 1.75rem;
	}

	:global([data-cooking]) .step-text {
		font-size: 1.375rem;
		line-height: 1.5;
	}

	/* Done, while cooking: the check under the numeral and Ink 3 text; the
	   page lifts the strike from both lists, so the step can be reread. */
	.step-check {
		display: none;
	}

	:global([data-cooking]) .step:has(:checked) .step-check {
		display: block;
	}

	@media (max-width: 699px) {
		:global([data-cooking]) .step {
			column-gap: 14px;
			font-size: 1.625rem;
		}

		:global([data-cooking]) .step-text {
			font-size: 1.3125rem;
			line-height: 1.45;
		}
	}
</style>
