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
	<h4 class="editor-section-heading">Steps</h4>
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
				<div class="step-editor-content">
					<textarea
						placeholder="Describe this step..."
						bind:value={step.text}
						rows="2"
						class="step-textarea"
					></textarea>
					{#if annotations}
						{#if step.annotation}
							<div class="annotation-editor">
								<select
									bind:value={step.annotation.type}
									class="annotation-type-select"
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
									class="step-textarea annotation-textarea"
								></textarea>
								<button
									type="button"
									onclick={() => removeAnnotation(i)}
									class="annotation-remove-btn">Remove note</button
								>
							</div>
						{:else}
							<button type="button" onclick={() => addAnnotation(i)} class="add-annotation-btn"
								>+ Add note</button
							>
						{/if}
					{/if}
				</div>
				<button type="button" onclick={() => remove(i)} class="remove-btn" aria-label="Remove step"
					>×</button
				>
			</div>
		{/each}
	</div>
	<button type="button" onclick={add} class="btn-ghost add-btn">+ Add step</button>
</div>

<style>
	.editor-section-heading {
		margin: 0 0 var(--space-2);
	}

	.add-btn {
		margin-top: var(--space-1);
	}

	.step-editor-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		flex: 1;
		min-width: 0;
	}

	.annotation-editor {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		background: var(--color-accent-pale);
		border-radius: var(--radius-md);
		padding: var(--space-3);
	}

	.annotation-type-select {
		width: auto;
		font-size: 0.8rem;
		padding: 4px 8px;
	}

	.annotation-textarea {
		font-style: italic;
	}

	.add-annotation-btn {
		align-self: flex-start;
		font-size: 0.8rem;
		color: var(--color-text-3);
		background: none;
		border: 1px dashed var(--color-border-2);
		border-radius: var(--radius-sm);
		padding: 3px 10px;
		cursor: pointer;
		width: auto;
	}

	.add-annotation-btn:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.annotation-remove-btn {
		align-self: flex-start;
		font-size: 0.75rem;
		color: var(--color-remove);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		width: auto;
		text-decoration: underline;
	}
</style>
