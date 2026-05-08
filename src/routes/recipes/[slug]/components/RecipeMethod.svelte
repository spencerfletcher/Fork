<script lang="ts">
	import type { Step } from '$lib/server/db/schema';

	let { steps }: { steps: Step[] } = $props();

	let crossedSteps = $state(new Set<number>());

	function toggleStep(step: number) {
		crossedSteps = new Set(
			crossedSteps.has(step) ? [...crossedSteps].filter((k) => k !== step) : [...crossedSteps, step]
		);
	}

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
	<h4 class="eyebrow-label mb-1 border-t-2 border-text pt-3">Method</h4>
	<div class="m-0 flex flex-col p-0" role="list">
		{#each steps as step (step.step)}
			<div
				class="grid cursor-pointer select-none items-start gap-2 border-b border-border py-4 [grid-template-columns:48px_1fr] [&:last-child]:border-b-0"
				class:opacity-40={crossedSteps.has(step.step)}
				class:line-through={crossedSteps.has(step.step)}
				onclick={() => toggleStep(step.step)}
				role="checkbox"
				aria-checked={crossedSteps.has(step.step)}
				tabindex="0"
				onkeydown={(e) => e.key === ' ' && toggleStep(step.step)}
			>
				<span class="pt-[2px] font-mono text-[1.5rem] font-medium leading-[1.6] text-sienna">
					{zeroPad(step.step)}
				</span>
				<div class="flex flex-col gap-3">
					<p class="m-0 font-sans text-base leading-[1.75] text-text">{step.text}</p>
					{#if step.annotation}
						<p class="m-0 font-sans italic text-[0.9rem] leading-[1.6] {annotationColor[step.annotation.type] ?? 'text-text-3'}">
							{step.annotation.text}
						</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</section>
