<script lang="ts">
	import type { Step, StepAnnotationType } from '#lib/recipes/types.js';

	let { steps }: { steps: Step[] } = $props();

	const annotationColor: Record<StepAnnotationType, string> = {
		tip: 'text-text-3',
		warning: 'text-remove',
		substitution: 'text-text-2'
	};
</script>

<section class="mb-3">
	<h4 class="eyebrow-label border-border mb-3.5 border-b pb-2">Method</h4>
	<div class="m-0 flex flex-col gap-[18px] p-0" role="list">
		{#each steps as step, i (i)}
			{@const n = i + 1}
			<!-- A native checkbox, visually hidden, carries the state and the keyboard
			     behaviour; the label is the row and takes the struck-through look. -->
			<label
				class="has-[:focus-visible]:outline-accent grid cursor-pointer [grid-template-columns:30px_1fr] items-start gap-[18px] select-none has-[:checked]:line-through has-[:checked]:opacity-40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
				<input type="checkbox" class="sr-only" />
				<span class="text-accent font-serif text-[1.375rem] leading-[1.15] font-medium">
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
