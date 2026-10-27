<script lang="ts">
	import type { Step } from '#lib/recipes/types.js';

	let { steps }: { steps: Step[] } = $props();

	function zeroPad(n: number): string {
		return String(n).padStart(2, '0');
	}

	const annotationColor: Record<string, string> = {
		tip: 'text-text-3',
		warning: 'text-paprika',
		substitution: 'text-accent-mid'
	};
</script>

<section class="mb-3">
	<h4 class="eyebrow-label border-text mb-1 border-t-2 pt-3">Method</h4>
	<div class="m-0 flex flex-col p-0" role="list">
		{#each steps as step, i (i)}
			{@const n = i + 1}
			<!-- A native checkbox, visually hidden, carries the state and the keyboard
			     behaviour; the label is the row and takes the struck-through look. -->
			<label
				class="border-border grid cursor-pointer [grid-template-columns:48px_1fr] items-start gap-2 border-b py-4 select-none has-[:checked]:line-through has-[:checked]:opacity-40 [&:last-child]:border-b-0">
				<input type="checkbox" class="sr-only" />
				<span class="text-sienna pt-[2px] font-mono text-[1.5rem] leading-[1.6] font-medium">
					{zeroPad(n)}
				</span>
				<div class="flex flex-col gap-3">
					<p class="text-text m-0 font-sans text-base leading-[1.75] whitespace-pre-line">
						{step.text}
					</p>
					{#if step.annotation}
						<p
							class="m-0 font-sans text-[0.9rem] leading-[1.6] italic {annotationColor[
								step.annotation.type
							] ?? 'text-text-3'}">
							{step.annotation.text}
						</p>
					{/if}
				</div>
			</label>
		{/each}
	</div>
</section>
