<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { Ingredient, Step } from '#lib/recipes/types.js';
	import IngredientEditor from '#lib/components/recipes/IngredientEditor.svelte';
	import StepEditor from '#lib/components/recipes/StepEditor.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const { recipe, allTags } = $derived(data);

	const currentTagNames = $derived(recipe.recipesToTags?.map((r) => r.tag.name) ?? []);

	// The editor works on a local copy of the loaded version, so only the initial value is wanted.
	// svelte-ignore state_referenced_locally
	let ingredients = $state<Ingredient[]>(
		data.latestVersion?.ingredients ?? [{ amount: '', unit: '', name: '' }]
	);
	// svelte-ignore state_referenced_locally
	let steps = $state<Step[]>(data.latestVersion?.steps ?? [{ step: 1, text: '' }]);

	let ingredientsInput: HTMLInputElement;
	let stepsInput: HTMLInputElement;

	function serializeContent() {
		ingredientsInput.value = JSON.stringify(ingredients);
		stepsInput.value = JSON.stringify(steps);
	}

	// Editor state: which form is mid-request, and which has unsaved edits.
	// A success redirects away, so neither needs resetting here.
	let submitting = $state<'meta' | 'content' | null>(null);
	let metaDirty = $state(false);
	// The initial value is the point: it is the saved baseline that dirty-checking compares against.
	// svelte-ignore state_referenced_locally
	const savedContent = JSON.stringify({ ingredients, steps });
	const contentDirty = $derived(JSON.stringify({ ingredients, steps }) !== savedContent);

	const track = (section: 'meta' | 'content'): SubmitFunction => {
		return () => {
			submitting = section;
			return async ({ update }) => {
				await update();
				submitting = null;
			};
		};
	};
</script>

<div class="page">
	<div class="mx-auto max-w-[720px]">
		<div class="page-header">
			<a href="/recipes/{recipe.slug}" class="back-link">← Back to recipe</a>
			<h1>Edit Recipe</h1>
		</div>

		<!-- ─── Form 1: Recipe info (metadata) ──────────────────────────── -->
		<section class="mb-6">
			<h3>Recipe info</h3>
			<p class="text-text-3 mt-1 mb-5 text-sm">
				Updates the recipe directly. No version snapshot created.
			</p>

			<form
				method="POST"
				action="?/saveMeta"
				use:enhance={track('meta')}
				oninput={() => (metaDirty = true)}
				class="form"
			>
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
					<div class="flex flex-wrap gap-3">
						{#each allTags as tag (tag.id)}
							<label class="flex cursor-pointer items-center gap-2 text-sm">
								<input
									type="checkbox"
									name="tags"
									value={tag.name}
									checked={currentTagNames.includes(tag.name)}
								/>
								{tag.name}
							</label>
						{/each}
					</div>
				</fieldset>

				<div class="field">
					<label class="inline-checkbox">
						<input type="checkbox" name="isPublic" checked={recipe.isPublic} />
						Make this recipe public
					</label>
				</div>

				{#if form?.section === 'meta'}
					<p class="form-error" role="alert">{form.error}</p>
				{/if}

				<div class="form-actions">
					<button type="submit" class="btn-primary" disabled={submitting === 'meta'}>
						{submitting === 'meta' ? 'Saving…' : 'Save info'}
					</button>
					{#if metaDirty && submitting !== 'meta'}
						<span class="form-hint">Unsaved changes</span>
					{/if}
				</div>
			</form>
		</section>

		<hr class="divider my-7" />

		<!-- ─── Form 2: Recipe content (version bump) ────────────────────── -->
		<section class="mb-6">
			<h3>Recipe content</h3>
			<p class="text-text-3 mt-1 mb-5 text-sm">
				Creates a new version snapshot. Describe what changed.
			</p>

			<form
				method="POST"
				action="?/saveVersion"
				use:enhance={track('content')}
				onsubmit={serializeContent}
				class="form"
			>
				<input type="hidden" name="ingredients" bind:this={ingredientsInput} />
				<input type="hidden" name="steps" bind:this={stepsInput} />

				<IngredientEditor bind:ingredients />
				<StepEditor bind:steps annotations />

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

				{#if form?.section === 'content'}
					<p class="form-error" role="alert">{form.error}</p>
				{/if}

				<div class="form-actions">
					<button type="submit" class="btn-primary" disabled={submitting === 'content'}>
						{submitting === 'content' ? 'Saving…' : 'Save new version'}
					</button>
					{#if contentDirty && submitting !== 'content'}
						<span class="form-hint">Unsaved changes</span>
					{/if}
				</div>
			</form>
		</section>
	</div>
</div>
