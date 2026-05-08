<script lang="ts">
	import type { Step, StepAnnotationType } from '$lib/server/db/schema';

	let { steps = $bindable(), annotations = false }: { steps: Step[]; annotations?: boolean } =
		$props();

	let dragIndex = $state<number | null>(null);

	function add() {
		steps = [...steps, { step: steps.length + 1, text: '' }];
	}

	function remove(i: number) {
		steps = steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step: idx + 1 }));
	}

	function onDragStart(i: number) {
		dragIndex = i;
	}

	function onDrop(i: number) {
		if (dragIndex === null || dragIndex === i) return;
		const updated = [...steps];
		const [moved] = updated.splice(dragIndex, 1);
		updated.splice(i, 0, moved);
		steps = updated.map((s, idx) => ({ ...s, step: idx + 1 }));
		dragIndex = null;
	}

	function addAnnotation(i: number) {
		steps = steps.map((s, idx) =>
			idx === i ? { ...s, annotation: { type: 'tip' as StepAnnotationType, text: '' } } : s
		);
	}

	function removeAnnotation(i: number) {
		steps = steps.map((s, idx) => {
			if (idx !== i) return s;
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { annotation: _removed, ...rest } = s;
			return rest;
		});
	}
</script>

<div class="field">
	<h4 class="m-0 mb-2">Steps</h4>
	<div class="editor-list" role="list">
		{#each steps as step, i (i)}
			<div
				class="step-editor-row"
				role="listitem"
				draggable="true"
				ondragstart={() => onDragStart(i)}
				ondragover={(e) => e.preventDefault()}
				ondrop={() => onDrop(i)}
			>
				<span class="step-num-badge">{i + 1}</span>
				<span class="drag-handle" title="Drag to reorder">⠿</span>
				<div class="flex min-w-0 flex-1 flex-col gap-2">
					<textarea
						placeholder="Describe this step..."
						bind:value={step.text}
						rows="2"
						class="step-textarea"
					></textarea>
					{#if annotations}
						{#if step.annotation}
							<div class="flex flex-col gap-2 rounded-md bg-accent-pale p-3">
								<select
									bind:value={step.annotation.type}
									class="w-auto text-[0.8rem]"
									aria-label="Annotation type"
								>
									<option value="tip">💡 Tip</option>
									<option value="warning">⚠️ Warning</option>
									<option value="substitution">🔄 Substitution</option>
								</select>
								<textarea
									placeholder="Add a note for this step…"
									bind:value={step.annotation.text}
									rows="2"
									class="step-textarea italic"
								></textarea>
								<button
									type="button"
									onclick={() => removeAnnotation(i)}
									class="w-auto self-start border-none bg-transparent p-0 text-[0.75rem] text-remove underline"
								>
									Remove note
								</button>
							</div>
						{:else}
							<button
								type="button"
								onclick={() => addAnnotation(i)}
								class="w-auto cursor-pointer self-start rounded-sm border border-dashed border-border-2 bg-transparent px-[10px] py-[3px] text-[0.8rem] text-text-3 hover:border-accent hover:text-accent"
							>
								+ Add note
							</button>
						{/if}
					{/if}
				</div>
				<button
					type="button"
					onclick={() => remove(i)}
					class="remove-btn"
					aria-label="Remove step">×</button
				>
			</div>
		{/each}
	</div>
	<button type="button" onclick={add} class="btn-ghost mt-1">+ Add step</button>
</div>
