<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { Ingredient, Step } from '$lib/server/db/schema';
	import IngredientEditor from '$lib/components/IngredientEditor.svelte';
	import StepEditor from '$lib/components/StepEditor.svelte';

	let { data }: { data: PageData } = $props();

	const { recipe, allTags } = $derived(data);

	const currentTagNames = $derived(recipe.recipesToTags?.map((r) => r.tag.name) ?? []);

	let ingredients = $state<Ingredient[]>(
		data.latestVersion?.ingredients ?? [{ amount: '', unit: '', name: '' }]
	);
	let steps = $state<Step[]>(data.latestVersion?.steps ?? [{ step: 1, text: '' }]);

	let ingredientsInput: HTMLInputElement;
	let stepsInput: HTMLInputElement;

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

				<button type="submit" class="btn-primary">Save new version</button>
			</form>
		</section>
	</div>
</div>

<style>
	.page-inner {
		max-width: var(--content-width);
		margin: 0 auto;
	}

	.edit-section {
		margin-bottom: var(--space-6);
	}

	.section-desc {
		font-size: 0.875rem;
		color: var(--color-text-3);
		margin: var(--space-1) 0 var(--space-5);
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

	.divider {
		margin: var(--space-7) 0;
	}
</style>
