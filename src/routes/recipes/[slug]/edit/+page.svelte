<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { RecipeDraft } from '#lib/recipes/validation.js';
	import { ingredientsToText } from '#lib/recipes/ingredients.js';
	import { stepsToText } from '#lib/recipes/steps.js';
	import IngredientEditor from '#lib/components/recipes/IngredientEditor.svelte';
	import StepEditor from '#lib/components/recipes/StepEditor.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const { recipe, allTags } = $derived(data);

	// What was loaded, as the form's strings. Dirty-checking compares against
	// this; a failed save never replaces it. Only the loaded value is wanted.
	// svelte-ignore state_referenced_locally
	const baseline: RecipeDraft = {
		title: data.latestVersion?.title ?? data.recipe.title,
		description: data.latestVersion?.description ?? '',
		servings: data.latestVersion?.servings?.toString() ?? '',
		prepTimeMinutes: data.latestVersion?.prepTimeMinutes?.toString() ?? '',
		cookTimeMinutes: data.latestVersion?.cookTimeMinutes?.toString() ?? '',
		ingredients: ingredientsToText(data.latestVersion?.ingredients ?? []),
		steps: stepsToText(data.latestVersion?.steps ?? []),
		commitMessage: '',
		editRevision: String(data.recipe.editRevision),
		isPublic: data.recipe.isPublic,
		tags: data.recipe.recipesToTags?.map((r) => r.tag.name) ?? [],
		hadPhoto: false,
		removeImage: false
	};

	// The whole form as one object. A failed save hands back what was
	// submitted, invalid values included, and the fields refill from it. It is
	// the initial state, not an effect, so a server-rendered reply (a submit
	// before hydration, or without JavaScript) already shows it; the effect
	// covers later failures while the page stays mounted.
	// svelte-ignore state_referenced_locally
	let draft = $state<RecipeDraft>({ ...(form?.draft ?? baseline) });
	$effect(() => {
		if (form?.draft) draft = { ...form.draft };
	});

	// Trimmed strings and sorted tags, so retyping the original reads as clean.
	// The commit message describes a save; typing one is not itself a change.
	const serialise = (d: RecipeDraft) =>
		JSON.stringify({
			...d,
			commitMessage: '',
			hadPhoto: false,
			title: d.title.trim(),
			description: d.description.trim(),
			tags: [...d.tags].sort()
		});
	const dirty = $derived(serialise(draft) !== serialise(baseline));

	// Photo: a newly chosen file previews from the browser; otherwise the
	// stored photo shows until it is marked for removal.
	let chosenPreview = $state<string | null>(null);
	let imageInput: HTMLInputElement | undefined = $state();
	const preview = $derived(chosenPreview ?? (draft.removeImage ? null : recipe.imageUrl));

	function onImageChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) {
			chosenPreview = null;
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			chosenPreview = reader.result as string;
		};
		reader.readAsDataURL(file);
		draft.removeImage = false;
	}

	function removePhoto() {
		chosenPreview = null;
		if (imageInput) imageInput.value = '';
		if (recipe.imageUrl) draft.removeImage = true;
	}

	// The server cannot echo a file back. After a failure the enhanced form is
	// still mounted and usually keeps the selection; only ask when it is gone.
	const photoLost = $derived(form?.draft?.hadPhoto === true && !imageInput?.files?.length);

	// Fields are disabled while saving, so nothing typed mid-request is lost by
	// the redirect. FormData is built before this runs, so the submission is whole.
	let submitting = $state(false);

	const track: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	};
</script>

<div class="page">
	<div class="mx-auto max-w-[720px]">
		<div class="page-header">
			<a href="/recipes/{recipe.slug}" class="back-link">← Back to recipe</a>
			<h1>Edit Recipe</h1>
		</div>

		<form
			method="POST"
			action="?/save"
			enctype="multipart/form-data"
			use:enhance={track}
			class="form">
			<fieldset disabled={submitting} class="contents">
				<input type="hidden" name="editRevision" value={draft.editRevision} />

				<section class="mb-6">
					<h3>Recipe</h3>
					<p class="text-text-3 mt-1 mb-5 text-sm">
						Changes here are saved as a new version. The previous version stays in the history.
					</p>

					<div class="field">
						<label for="title">Title</label>
						<input id="title" name="title" type="text" required bind:value={draft.title} />
					</div>

					<div class="field">
						<label for="description">Description</label>
						<textarea id="description" name="description" rows="3" bind:value={draft.description}>
						</textarea>
					</div>

					<div class="field-row">
						<div class="field">
							<label for="servings">Servings</label>
							<input
								id="servings"
								name="servings"
								type="number"
								min="1"
								value={draft.servings}
								oninput={(e) => (draft.servings = e.currentTarget.value)} />
						</div>
						<div class="field">
							<label for="prepTimeMinutes">Prep time (min)</label>
							<input
								id="prepTimeMinutes"
								name="prepTimeMinutes"
								type="number"
								min="0"
								value={draft.prepTimeMinutes}
								oninput={(e) => (draft.prepTimeMinutes = e.currentTarget.value)} />
						</div>
						<div class="field">
							<label for="cookTimeMinutes">Cook time (min)</label>
							<input
								id="cookTimeMinutes"
								name="cookTimeMinutes"
								type="number"
								min="0"
								value={draft.cookTimeMinutes}
								oninput={(e) => (draft.cookTimeMinutes = e.currentTarget.value)} />
						</div>
					</div>

					<IngredientEditor bind:value={draft.ingredients} />
					<StepEditor bind:value={draft.steps} />
				</section>

				<hr class="divider my-7" />

				<section class="mb-6">
					<h3>Settings</h3>
					<p class="text-text-3 mt-1 mb-5 text-sm">
						Photo, tags and visibility apply to the recipe as a whole, not to a version.
					</p>

					<div class="field">
						<label for="image">Photo</label>
						{#if preview}
							<div class="border-border relative w-full overflow-hidden rounded-md border">
								<img src={preview} alt="Preview" class="block h-[220px] w-full object-cover" />
								<button
									type="button"
									class="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full border-none bg-black/55 text-[1.1rem] leading-none text-white"
									onclick={removePhoto}
									aria-label="Remove photo">
									×
								</button>
							</div>
						{/if}
						<input
							id="image"
							name="image"
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							class="border-border bg-surface-2 hover:border-accent cursor-pointer rounded-md border border-dashed p-2 text-sm"
							bind:this={imageInput}
							onchange={onImageChange} />
						{#if draft.removeImage}
							<input type="hidden" name="removeImage" value="on" />
						{/if}
						{#if photoLost}
							<p class="form-hint">Please choose the photo again.</p>
						{/if}
					</div>

					<fieldset class="field field-tags">
						<legend class="field-legend">Tags</legend>
						<div class="flex flex-wrap gap-3">
							{#each allTags as tag (tag.id)}
								<label class="flex cursor-pointer items-center gap-2 text-sm">
									<input type="checkbox" name="tags" value={tag.name} bind:group={draft.tags} />
									{tag.name}
								</label>
							{/each}
						</div>
					</fieldset>

					<div class="field">
						<label class="inline-checkbox">
							<input type="checkbox" name="isPublic" bind:checked={draft.isPublic} />
							Make this recipe public
						</label>
					</div>
				</section>

				<div class="field">
					<label for="commitMessage">
						What changed? <span class="text-text-3">(optional)</span>
					</label>
					<input
						id="commitMessage"
						name="commitMessage"
						type="text"
						placeholder="e.g. Reduced sugar by 20g, added vanilla"
						bind:value={draft.commitMessage} />
				</div>

				{#if form?.error}
					<p class="form-error" role="alert">{form.error}</p>
				{/if}

				<div class="form-actions">
					<button type="submit" class="btn-primary" disabled={submitting}>
						{submitting ? 'Saving…' : 'Save changes'}
					</button>
					{#if dirty && !submitting}
						<span class="form-hint">Unsaved changes</span>
					{/if}
				</div>
			</fieldset>
		</form>
	</div>
</div>
