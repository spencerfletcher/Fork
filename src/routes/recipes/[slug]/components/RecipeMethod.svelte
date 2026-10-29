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
	<div class="m-0 flex flex-col gap-[18px] p-0">
		{#each steps as step, i (i)}
			{@const n = i + 1}
			<!-- A native checkbox, visually hidden, carries the state and the keyboard
			     behaviour; the label is the row and takes the struck-through look. The
			     square before the numeral is the checkbox's picture: empty, then clay
			     when checked (decided 29 October 2026). -->
			<label
				class="group has-[:focus-visible]:outline-accent grid cursor-pointer [grid-template-columns:44px_1fr] items-baseline gap-[18px] select-none has-[:checked]:line-through has-[:checked]:opacity-60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
				<input type="checkbox" class="sr-only" />
				<span
					class="text-accent inline-flex items-baseline gap-2.5 font-serif text-[1.125rem] font-medium">
					<span
						class="tick border-border-2 group-has-[:checked]:bg-accent group-has-[:checked]:border-accent size-3.5 shrink-0 rounded-[3px] border"
						aria-hidden="true">
					</span>
					{n}
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
			</label>
		{/each}
	</div>
</section>
