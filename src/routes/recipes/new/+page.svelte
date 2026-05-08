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
	<div class="mx-auto max-w-[720px]">
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
					<div class="relative w-full overflow-hidden rounded-md border border-border">
						<img src={imagePreview} alt="Preview" class="block h-[220px] w-full object-cover" />
						<button
							type="button"
							class="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full border-none bg-black/55 text-[1.1rem] leading-none text-white"
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
					class="cursor-pointer rounded-md border border-dashed border-border bg-surface-2 p-2 text-sm hover:border-accent"
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
