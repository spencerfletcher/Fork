<script lang="ts">
	import type { Step, StepAnnotationType } from '#lib/recipes/types.js';

	let { steps }: { steps: Step[] } = $props();

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
			<!-- The numeral ends a 55px column, so it sits 10px from the text with
			     one digit or two, and every step's text starts on one edge. -->
			<li class="grid [grid-template-columns:55px_1fr] items-baseline gap-2.5">
				<span class="text-accent justify-self-end font-serif text-[1.125rem] font-medium">
					{i + 1}
				</span>

				<div class="flex flex-col gap-1.5">
					<p class="text-text m-0 font-sans text-[1.0625rem] leading-[1.6] whitespace-pre-line">
						{step.text}
					</p>
					{#if step.annotation}
						<p
							class="m-0 font-sans text-[0.9375rem] leading-[1.5] italic {annotationColor[
								step.annotation.type
							]}">
							{step.annotation.text}
						</p>
					{/if}
				</div>
			</li>
		{/each}
	</ol>
</section>
