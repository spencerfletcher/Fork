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
</script>

<section class="recipe-section">
	<h4 class="eyebrow-label section-label-standalone">Method</h4>
	<div class="step-list" role="list">
		{#each steps as step (step.step)}
			<div
				class="step-item"
				class:crossed={crossedSteps.has(step.step)}
				onclick={() => toggleStep(step.step)}
				role="checkbox"
				aria-checked={crossedSteps.has(step.step)}
				tabindex="0"
				onkeydown={(e) => e.key === ' ' && toggleStep(step.step)}
			>
				<span class="step-number">{zeroPad(step.step)}</span>
				<div class="step-content">
					<p class="step-text">{step.text}</p>
					{#if step.annotation}
						<p class="step-annotation annotation-{step.annotation.type}">
							{step.annotation.text}
						</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</section>

<style>
	.recipe-section {
		margin-bottom: var(--space-3);
	}

	/* Standalone section label (not in a row with a toggle button) */
	.section-label-standalone {
		border-top: 2px solid var(--color-text);
		padding-top: var(--space-3);
		margin-bottom: var(--space-1);
	}

	.step-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
	}

	.step-item {
		display: grid;
		grid-template-columns: 48px 1fr;
		gap: var(--space-2);
		align-items: flex-start;
		padding: var(--space-4) 0;
		border-bottom: 1px solid var(--color-border);
		cursor: pointer;
		user-select: none;
	}

	.step-item:last-child {
		border-bottom: none;
	}

	.step-item.crossed {
		opacity: 0.4;
		text-decoration: line-through;
	}

	.step-number {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--color-sienna);
		line-height: 1.6;
		padding-top: 2px;
	}

	.step-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.step-text {
		font-family: var(--font-sans);
		font-size: 1rem;
		line-height: 1.75;
		color: var(--color-text);
		margin: 0;
	}

	.step-annotation {
		font-family: var(--font-sans);
		font-style: italic;
		font-size: 0.9rem;
		line-height: 1.6;
		margin: 0;
	}

	.annotation-tip {
		color: var(--color-text-3);
	}

	.annotation-warning {
		color: var(--color-paprika);
	}

	.annotation-substitution {
		color: var(--color-accent-mid);
	}
</style>
