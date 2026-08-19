<script lang="ts">
	import type { IngredientDiffRow, StepDiffRow } from '$lib/utils/diff';

	let {
		ingredientDiff,
		stepDiff
	}: {
		ingredientDiff: IngredientDiffRow[];
		stepDiff: StepDiffRow[];
	} = $props();
</script>

<!-- Two columns where there is room for them. This is a container query, not a
     viewport one: the compare page constrains the diff to a 720px reading column
     and must stay stacked even on a wide screen, while the landing page gives it
     the full width and should split. -->
<div class="@container">
	<div class="grid gap-x-8 @3xl:grid-cols-2">
		<!-- Ingredients diff -->
		<section class="mb-7">
			<h3 class="eyebrow-label mb-3">Ingredients</h3>
			<div class="border-border overflow-hidden rounded-md border font-mono text-sm">
				{#each ingredientDiff as row, i (i)}
					{#if row.status === 'modified'}
						<div
							class="border-border diff-modified text-text-2 flex items-baseline gap-3 border-b px-4 py-2 [&:last-child]:border-b-0"
						>
							<span class="text-text-3 w-[1ch] shrink-0 font-bold select-none">~</span>
							<span class="diff-content flex-1 leading-[1.5]">
								{#each row.segments as seg, si (si)}
									{#if seg.type === 'added'}<span class="diff-added bg-add-bg text-add"
											>{seg.text}</span
										>
									{:else if seg.type === 'removed'}
										<span class="diff-removed bg-remove-bg text-remove line-through">
											{seg.text}
										</span>
									{:else}
										{seg.text}
									{/if}
									<span> </span>
								{/each}
							</span>
						</div>
					{:else}
						<div
							class="border-border flex items-baseline gap-3 border-b px-4 py-2 [&:last-child]:border-b-0"
							class:diff-added={row.status === 'added'}
							class:bg-add-bg={row.status === 'added'}
							class:text-add={row.status === 'added'}
							class:diff-removed={row.status === 'removed'}
							class:bg-remove-bg={row.status === 'removed'}
							class:text-remove={row.status === 'removed'}
							class:line-through={row.status === 'removed'}
							class:opacity-85={row.status === 'removed'}
							class:diff-unchanged={row.status === 'unchanged'}
							class:text-text-2={row.status === 'unchanged'}
						>
							<span class="w-[1ch] shrink-0 font-bold select-none">
								{#if row.status === 'added'}+{:else if row.status === 'removed'}−{:else}&nbsp;{/if}
							</span>
							<span class="diff-content flex-1 leading-[1.5]">
								{row.ingredient.amount}
								{row.ingredient.unit}
								{row.ingredient.name}
							</span>
						</div>
					{/if}
				{/each}
				{#if ingredientDiff.length === 0}
					<p class="text-text-3 m-0 p-4 text-center text-sm">No changes</p>
				{/if}
			</div>
		</section>

		<!-- Steps diff -->
		<section class="mb-7">
			<h3 class="eyebrow-label mb-3">Steps</h3>
			<div class="border-border overflow-hidden rounded-md border font-mono text-sm">
				{#each stepDiff as row, i (i)}
					{#if row.status === 'modified'}
						<div
							class="border-border diff-modified text-text-2 flex items-baseline gap-3 border-b px-4 py-2 [&:last-child]:border-b-0"
						>
							<span class="text-text-3 w-[1ch] shrink-0 font-bold select-none">~</span>
							<span class="step-num text-sienna shrink-0 font-mono text-[0.8rem] font-semibold">
								{row.stepNumber}
							</span>
							<span class="diff-content flex-1 leading-[1.5]">
								{#each row.segments as seg, si (si)}
									{#if seg.type === 'added'}
										<span class="diff-added bg-add-bg text-add">
											{seg.text}
										</span>
									{:else if seg.type === 'removed'}
										<span class="diff-removed bg-remove-bg text-remove line-through">
											{seg.text}
										</span>
									{:else}
										{seg.text}
									{/if}
								{/each}</span
							>
						</div>
					{:else}
						<div
							class="border-border flex items-baseline gap-3 border-b px-4 py-2 [&:last-child]:border-b-0"
							class:diff-added={row.status === 'added'}
							class:bg-add-bg={row.status === 'added'}
							class:text-add={row.status === 'added'}
							class:diff-removed={row.status === 'removed'}
							class:bg-remove-bg={row.status === 'removed'}
							class:text-remove={row.status === 'removed'}
							class:line-through={row.status === 'removed'}
							class:opacity-85={row.status === 'removed'}
							class:diff-unchanged={row.status === 'unchanged'}
							class:text-text-2={row.status === 'unchanged'}
						>
							<span class="w-[1ch] shrink-0 font-bold select-none">
								{#if row.status === 'added'}+{:else if row.status === 'removed'}−{:else}&nbsp;{/if}
							</span>
							{#if row.status !== 'removed'}
								<span class="step-num text-sienna shrink-0 font-mono text-[0.8rem] font-semibold">
									{row.step.step}
								</span>
							{/if}
							<span class="diff-content flex-1 leading-[1.5]">{row.step.text}</span>
						</div>
					{/if}
				{/each}
				{#if stepDiff.length === 0}
					<p class="text-text-3 m-0 p-4 text-center text-sm">No changes</p>
				{/if}
			</div>
		</section>
	</div>
</div>
