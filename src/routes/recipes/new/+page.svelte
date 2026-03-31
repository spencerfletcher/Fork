<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { Ingredient, Step } from '$lib/server/db/schema';
	import TagInput from '$lib/components/TagInput.svelte';
	import IngredientEditor from '$lib/components/IngredientEditor.svelte';
	import StepEditor from '$lib/components/StepEditor.svelte';

	let { data }: { data: PageData } = $props();

	const { allTags } = $derived(data);

	let imagePreview = $state<string | null>(null);
	let ingredients = $state<Ingredient[]>([{ amount: '', unit: '', name: '' }]);
	let steps = $state<Step[]>([{ step: 1, text: '' }]);

	let ingredientsInput: HTMLInputElement;
	let stepsInput: HTMLInputElement;

	function onImageChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				imagePreview = reader.result as string;
			};
			reader.readAsDataURL(file);
		} else {
			imagePreview = null;
		}
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

		<form
			method="POST"
			use:enhance
			onsubmit={serializeContent}
			class="form"
			enctype="multipart/form-data"
		>
			<input type="hidden" name="ingredients" bind:this={ingredientsInput} />
			<input type="hidden" name="steps" bind:this={stepsInput} />

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
							onclick={() => {
								imagePreview = null;
								(document.getElementById('image') as HTMLInputElement).value = '';
							}}
							aria-label="Remove image">×</button
						>
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
					<input type="checkbox" name="isPublic" checked />
					Make this recipe public
				</label>
			</div>

			<hr class="divider" />

			<IngredientEditor bind:ingredients />
			<StepEditor bind:steps />

			<button type="submit" class="btn-primary">Create recipe</button>
		</form>
	</div>
</div>

<style>
	.page-inner {
		max-width: var(--content-width);
		margin: 0 auto;
	}

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
		background: rgba(0, 0, 0, 0.55);
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
</style>
