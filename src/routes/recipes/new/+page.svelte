<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { Ingredient, Step } from '$lib/server/db/schema';
	import TagInput from '$lib/components/TagInput.svelte';

	let { data }: { data: PageData } = $props();

	const { allTags } = $derived(data);

	let imagePreview = $state<string | null>(null);

	function onImageChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => { imagePreview = reader.result as string; };
			reader.readAsDataURL(file);
		} else {
			imagePreview = null;
		}
	}

	let ingredients = $state<Ingredient[]>([{ amount: '', unit: '', name: '' }]);
	let steps = $state<Step[]>([{ step: 1, text: '' }]);

	let dragIngredientIndex = $state<number | null>(null);
	let dragStepIndex = $state<number | null>(null);

	let ingredientsInput: HTMLInputElement;
	let stepsInput: HTMLInputElement;

	function addIngredient() {
		ingredients = [...ingredients, { amount: '', unit: '', name: '' }];
	}

	function removeIngredient(i: number) {
		ingredients = ingredients.filter((_, idx) => idx !== i);
	}

	function addStep() {
		steps = [...steps, { step: steps.length + 1, text: '' }];
	}

	function removeStep(i: number) {
		steps = steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step: idx + 1 }));
	}

	function onIngredientDragStart(i: number) {
		dragIngredientIndex = i;
	}

	function onIngredientDrop(i: number) {
		if (dragIngredientIndex === null || dragIngredientIndex === i) return;
		const updated = [...ingredients];
		const [moved] = updated.splice(dragIngredientIndex, 1);
		updated.splice(i, 0, moved);
		ingredients = updated;
		dragIngredientIndex = null;
	}

	function onStepDragStart(i: number) {
		dragStepIndex = i;
	}

	function onStepDrop(i: number) {
		if (dragStepIndex === null || dragStepIndex === i) return;
		const updated = [...steps];
		const [moved] = updated.splice(dragStepIndex, 1);
		updated.splice(i, 0, moved);
		steps = updated.map((s, idx) => ({ ...s, step: idx + 1 }));
		dragStepIndex = null;
	}

	function serializeContent() {
		ingredientsInput.value = JSON.stringify(ingredients);
		stepsInput.value = JSON.stringify(steps);
	}
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-header">
			<h1>New Recipe</h1>
		</div>

		<form method="POST" use:enhance onsubmit={serializeContent} class="form" enctype="multipart/form-data">
			<!-- Hidden JSON inputs -->
			<input type="hidden" name="ingredients" bind:this={ingredientsInput} />
			<input type="hidden" name="steps" bind:this={stepsInput} />

			<!-- Meta fields -->
			<div class="field">
				<label for="title">Title <span class="required">*</span></label>
				<input id="title" name="title" type="text" required />
			</div>

			<div class="field">
				<label for="description">Description</label>
				<textarea id="description" name="description" rows="3"></textarea>
			</div>

			<div class="field">
				<label for="image">Photo</label>
				{#if imagePreview}
					<div class="image-preview">
						<img src={imagePreview} alt="Preview" />
						<button
							type="button"
							class="remove-image"
							onclick={() => { imagePreview = null; (document.getElementById('image') as HTMLInputElement).value = ''; }}
							aria-label="Remove image"
						>×</button>
					</div>
				{/if}
				<input
					id="image"
					name="image"
					type="file"
					accept="image/jpeg,image/png,image/webp,image/gif"
					class="file-input"
					onchange={onImageChange}
				/>
			</div>

			<div class="field-row">
				<div class="field">
					<label for="servings">Servings</label>
					<input id="servings" name="servings" type="number" min="1" />
				</div>
				<div class="field">
					<label for="prepTimeMinutes">Prep time (min)</label>
					<input id="prepTimeMinutes" name="prepTimeMinutes" type="number" min="0" />
				</div>
				<div class="field">
					<label for="cookTimeMinutes">Cook time (min)</label>
					<input id="cookTimeMinutes" name="cookTimeMinutes" type="number" min="0" />
				</div>
			</div>

			<fieldset class="field field-tags">
				<legend class="field-legend">Tags</legend>
				<TagInput {allTags} />
			</fieldset>

			<div class="field">
				<label class="inline-checkbox">
					<input type="checkbox" name="isPublic" checked style="width: auto;" />
					Make this recipe public
				</label>
			</div>

			<hr class="divider" />

			<!-- Ingredients editor -->
			<div class="field">
				<h4 style="margin-bottom: var(--space-3);">Ingredients</h4>
				<div class="editor-list" role="list">
					{#each ingredients as ingredient, i}
						<div
							class="editor-row"
							role="listitem"
							draggable="true"
							ondragstart={() => onIngredientDragStart(i)}
							ondragover={(e) => { e.preventDefault(); }}
							ondrop={() => onIngredientDrop(i)}
						>
							<span class="drag-handle" title="Drag to reorder">⠿</span>
							<input
								type="text"
								placeholder="Amount"
								bind:value={ingredient.amount}
								class="input-amount"
							/>
							<input
								type="text"
								placeholder="Unit"
								bind:value={ingredient.unit}
								class="input-unit"
							/>
							<input
								type="text"
								placeholder="Ingredient name"
								bind:value={ingredient.name}
								class="input-name"
							/>
							<button
								type="button"
								onclick={() => removeIngredient(i)}
								class="remove-btn"
								aria-label="Remove ingredient"
							>×</button>
						</div>
					{/each}
				</div>
				<button type="button" onclick={addIngredient} class="btn-ghost" style="margin-top: var(--space-3);">
					+ Add ingredient
				</button>
			</div>

			<!-- Steps editor -->
			<div class="field">
				<h4 style="margin-bottom: var(--space-3);">Steps</h4>
				<div class="editor-list" role="list">
					{#each steps as step, i}
						<div
							class="step-editor-row"
							role="listitem"
							draggable="true"
							ondragstart={() => onStepDragStart(i)}
							ondragover={(e) => { e.preventDefault(); }}
							ondrop={() => onStepDrop(i)}
						>
							<span class="step-num-badge">{i + 1}</span>
							<span class="drag-handle" title="Drag to reorder">⠿</span>
							<textarea
								placeholder="Describe this step..."
								bind:value={step.text}
								rows="2"
								class="step-textarea"
							></textarea>
							<button
								type="button"
								onclick={() => removeStep(i)}
								class="remove-btn"
								aria-label="Remove step"
							>×</button>
						</div>
					{/each}
				</div>
				<button type="button" onclick={addStep} class="btn-ghost" style="margin-top: var(--space-3);">
					+ Add step
				</button>
			</div>

			<button type="submit" class="btn-primary">Create recipe</button>
		</form>
	</div>
</div>

<style>
	.page {
		padding: var(--space-7) var(--space-5);
	}

	.page-inner {
		max-width: var(--content-width);
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: var(--space-6);
	}

	h1 {
		margin: 0;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.field label, .field-legend {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-2);
	}

	.field-tags {
		border: none;
		padding: 0;
		margin: 0;
	}

	.field-legend {
		margin-bottom: var(--space-2);
	}

	/* Image upload */
	.file-input {
		font-size: 0.875rem;
		padding: var(--space-2);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		background: var(--color-surface-2);
	}

	.file-input:hover {
		border-color: var(--color-accent);
	}

	.image-preview {
		position: relative;
		width: 100%;
		max-height: 220px;
		border-radius: var(--radius-md);
		overflow: hidden;
		border: 1px solid var(--color-border);
	}

	.image-preview img {
		width: 100%;
		height: 220px;
		object-fit: cover;
		display: block;
	}

	.remove-image {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		background: rgba(0,0,0,0.55);
		color: white;
		border: none;
		border-radius: 50%;
		width: 28px;
		height: 28px;
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.field-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
	}

	.inline-checkbox {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.divider {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: var(--space-2) 0;
	}

	.editor-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.editor-row {
		display: grid;
		grid-template-columns: auto 80px 80px 1fr auto;
		gap: var(--space-2);
		align-items: center;
	}

	.drag-handle {
		color: var(--color-text-3);
		cursor: grab;
		font-size: 1rem;
		user-select: none;
		padding: 0 var(--space-1);
	}

	.input-amount { max-width: 80px; }
	.input-unit   { max-width: 80px; }
	.input-name   { flex: 1; }

	.remove-btn {
		background: none;
		border: none;
		color: var(--color-text-3);
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0 var(--space-2);
		line-height: 1;
		width: auto;
	}

	.remove-btn:hover {
		color: var(--color-remove);
	}

	.step-editor-row {
		display: grid;
		grid-template-columns: auto auto 1fr auto;
		gap: var(--space-2);
		align-items: flex-start;
	}

	.step-num-badge {
		width: 28px;
		height: 28px;
		background: var(--color-accent);
		color: #FDFAF4;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: 600;
		flex-shrink: 0;
		margin-top: 6px;
	}

	.step-textarea {
		resize: vertical;
		min-height: 60px;
	}

	.required {
		color: var(--color-remove);
	}
</style>
