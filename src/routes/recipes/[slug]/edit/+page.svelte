<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { Ingredient, Step } from '$lib/server/db/schema';

	let { data }: { data: PageData } = $props();

	const { recipe, allTags } = $derived(data);

	const currentTagNames = $derived(recipe.recipesToTags?.map((r) => r.tag.name) ?? []);

	// Content editor state — initialized once from server data (edit page, not reactive to server changes)
	let ingredients = $state<Ingredient[]>(
		data.latestVersion?.ingredients ?? [{ amount: '', unit: '', name: '' }]
	);
	let steps = $state<Step[]>(data.latestVersion?.steps ?? [{ step: 1, text: '' }]);

	// Drag-to-reorder state
	let dragIngredientIndex = $state<number | null>(null);
	let dragStepIndex = $state<number | null>(null);

	// Hidden JSON input refs
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
			<a href="/recipes/{recipe.slug}" class="back-link">← Back to recipe</a>
			<h1>Edit Recipe</h1>
		</div>

		<!-- ─── Form 1: Recipe info (metadata) ──────────────────────────── -->
		<section class="edit-section">
			<h3>Recipe info</h3>
			<p class="section-desc">Updates the recipe directly. No version snapshot created.</p>

			<form method="POST" action="?/saveMeta" use:enhance class="form">
				<div class="field">
					<label for="title">Title</label>
					<input id="title" name="title" type="text" value={recipe.title} required />
				</div>

				<div class="field">
					<label for="description">Description</label>
					<textarea id="description" name="description" rows="3"
						>{recipe.description ?? ''}</textarea
					>
				</div>

				<div class="field">
					<label for="imageUrl">Image URL</label>
					<input id="imageUrl" name="imageUrl" type="url" value={recipe.imageUrl ?? ''} />
				</div>

				<div class="field-row">
					<div class="field">
						<label for="servings">Servings</label>
						<input
							id="servings"
							name="servings"
							type="number"
							min="1"
							value={recipe.servings ?? ''}
						/>
					</div>
					<div class="field">
						<label for="prepTimeMinutes">Prep time (min)</label>
						<input
							id="prepTimeMinutes"
							name="prepTimeMinutes"
							type="number"
							min="0"
							value={recipe.prepTimeMinutes ?? ''}
						/>
					</div>
					<div class="field">
						<label for="cookTimeMinutes">Cook time (min)</label>
						<input
							id="cookTimeMinutes"
							name="cookTimeMinutes"
							type="number"
							min="0"
							value={recipe.cookTimeMinutes ?? ''}
						/>
					</div>
				</div>

				<fieldset class="field field-tags">
					<legend class="field-legend">Tags</legend>
					<div class="tag-checkboxes">
						{#each allTags as tag (tag.id)}
							<label class="tag-checkbox">
								<input
									type="checkbox"
									name="tags"
									value={tag.name}
									checked={currentTagNames.includes(tag.name)}
									style="width: auto;"
								/>
								{tag.name}
							</label>
						{/each}
					</div>
				</fieldset>

				<div class="field">
					<label class="inline-checkbox">
						<input type="checkbox" name="isPublic" checked={recipe.isPublic} style="width: auto;" />
						Make this recipe public
					</label>
				</div>

				<button type="submit" class="btn-primary">Save info</button>
			</form>
		</section>

		<hr class="divider" />

		<!-- ─── Form 2: Recipe content (version bump) ────────────────────── -->
		<section class="edit-section">
			<h3>Recipe content</h3>
			<p class="section-desc">Creates a new version snapshot. Describe what changed.</p>

			<form
				method="POST"
				action="?/saveVersion"
				use:enhance
				onsubmit={serializeContent}
				class="form"
			>
				<!-- Hidden JSON inputs -->
				<input type="hidden" name="ingredients" bind:this={ingredientsInput} />
				<input type="hidden" name="steps" bind:this={stepsInput} />

				<!-- Ingredients editor -->
				<div class="field">
					<h4 style="margin-bottom: var(--space-3);">Ingredients</h4>
					<div class="editor-list" role="list">
						{#each ingredients as ingredient, i (i)}
							<div
								class="editor-row"
								role="listitem"
								draggable="true"
								ondragstart={() => onIngredientDragStart(i)}
								ondragover={(e) => {
									e.preventDefault();
								}}
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
									aria-label="Remove ingredient">×</button
								>
							</div>
						{/each}
					</div>
					<button
						type="button"
						onclick={addIngredient}
						class="btn-ghost"
						style="margin-top: var(--space-3);"
					>
						+ Add ingredient
					</button>
				</div>

				<!-- Steps editor -->
				<div class="field">
					<h4 style="margin-bottom: var(--space-3);">Steps</h4>
					<div class="editor-list" role="list">
						{#each steps as step, i (i)}
							<div
								class="step-editor-row"
								role="listitem"
								draggable="true"
								ondragstart={() => onStepDragStart(i)}
								ondragover={(e) => {
									e.preventDefault();
								}}
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
									aria-label="Remove step">×</button
								>
							</div>
						{/each}
					</div>
					<button
						type="button"
						onclick={addStep}
						class="btn-ghost"
						style="margin-top: var(--space-3);"
					>
						+ Add step
					</button>
				</div>

				<!-- Commit message -->
				<div class="field">
					<label for="commitMessage">What changed? <span class="required">*</span></label>
					<input
						id="commitMessage"
						name="commitMessage"
						type="text"
						placeholder="e.g. Reduced sugar by 20g, added vanilla"
						required
					/>
				</div>

				<button type="submit" class="btn-primary">Save new version</button>
			</form>
		</section>
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

	.back-link {
		font-size: 0.875rem;
		color: var(--color-text-3);
		display: block;
		margin-bottom: var(--space-3);
	}

	.back-link:hover {
		color: var(--color-accent);
	}

	h1 {
		margin: 0;
	}

	.edit-section {
		margin-bottom: var(--space-6);
	}

	.section-desc {
		font-size: 0.875rem;
		color: var(--color-text-3);
		margin: var(--space-1) 0 var(--space-5);
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

	.field label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-2);
	}

	/* fieldset reset for the Tags group */
	.field-tags {
		border: none;
		padding: 0;
		margin: 0;
	}

	.field-legend {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-2);
		margin-bottom: var(--space-2);
	}

	.field-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
	}

	.tag-checkboxes {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.tag-checkbox {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.875rem;
		cursor: pointer;
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
		margin: var(--space-7) 0;
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

	.input-amount {
		max-width: 80px;
	}
	.input-unit {
		max-width: 80px;
	}
	.input-name {
		flex: 1;
	}

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
		color: #fdfaf4;
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
