<script lang="ts">
	import type { Step, StepAnnotationType } from '#lib/recipes/types.js';
	import { loadTicks, saveTicks } from './ticks';

	let { steps, storageKey }: { steps: Step[]; storageKey: string } = $props();

	// Writable derived: the ticks reload whenever the page moves to another
	// version, and a click changes them. The server has no sessionStorage, so it
	// renders none; hydration restores them.
	let ticked = $derived(loadTicks(storageKey));

	function toggle(i: number, on: boolean) {
		ticked = on ? [...ticked, i] : ticked.filter((j) => j !== i);
		saveTicks(storageKey, ticked);
	}

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
			     square before the numeral is the checkbox's picture: an Ink 3 edge, then
			     full clay when checked (decided 29 October 2026). The dim is on the
			     numeral and the text, so it never turns the clay salmon. -->
			<label
				class="group has-[:focus-visible]:outline-accent grid cursor-pointer [grid-template-columns:44px_1fr] items-baseline gap-[18px] select-none has-[:checked]:line-through has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
				<input
					type="checkbox"
					class="sr-only"
					checked={ticked.includes(i)}
					onchange={(e) => toggle(i, e.currentTarget.checked)} />
				<span class="inline-flex items-baseline gap-2.5">
					<span
						class="tick border-text-3 group-has-[:checked]:bg-accent group-has-[:checked]:border-accent size-3.5 shrink-0 rounded-[3px] border"
						aria-hidden="true">
					</span>
					<span
						class="text-accent font-serif text-[1.125rem] font-medium group-has-[:checked]:opacity-60">
						{n}
					</span>
				</span>

				<div class="flex flex-col gap-1.5 group-has-[:checked]:opacity-60">
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
