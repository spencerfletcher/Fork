<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import type { RecipeDraft } from '#lib/recipes/validation.js';
	import TagInput from '#lib/components/ui/TagInput.svelte';
	import IngredientEditor from './IngredientEditor.svelte';
	import StepEditor from './StepEditor.svelte';

	let {
		baseline,
		form,
		allTags,
		action,
		submitLabel,
		imageUrl = null,
		withCommitMessage = false
	}: {
		/** What was loaded, as the form's strings. Dirty-checking compares against it. */
		baseline: RecipeDraft;
		/** The failed action's result, if any; its draft refills the fields. */
		form: { error: string; draft: RecipeDraft } | null;
		allTags: Array<{ id: number; name: string; slug: string }>;
		/** Named action, e.g. `?/save`; omit for the route's default action. */
		action?: string;
		submitLabel: string;
		/** The stored photo, shown until replaced or removed. */
		imageUrl?: string | null;
		/** Edits carry an optional "what changed" message; creation does not. */
		withCommitMessage?: boolean;
	} = $props();

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

	// Photo: a newly chosen file previews from the browser; otherwise the
	// stored photo shows until it is marked for removal.
	let chosenPreview = $state<string | null>(null);
	let imageInput: HTMLInputElement | undefined = $state();
	const preview = $derived(chosenPreview ?? (draft.removeImage ? null : imageUrl));

	const dirty = $derived(chosenPreview !== null || serialise(draft) !== serialise(baseline));

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
		if (imageUrl) draft.removeImage = true;
	}

	// The server cannot echo a file back. After a failure the enhanced form is
	// still mounted and usually keeps the selection; only ask when it is gone,
	// and stop asking once a file is chosen again.
	const photoLost = $derived(
		form?.draft?.hadPhoto === true && chosenPreview === null && !imageInput?.files?.length
	);

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

	const numberField = (key: 'servings' | 'prepTimeMinutes' | 'cookTimeMinutes') => (e: Event) => {
		// Kept as strings so the dirty check compares like with like; bind:value
		// on a number input would hand back numbers and null.
		draft[key] = (e.currentTarget as HTMLInputElement).value;
	};
</script>

<form method="POST" {action} enctype="multipart/form-data" use:enhance={track} class="form">
	<fieldset disabled={submitting} class="contents">
		{#if draft.editRevision}
			<input type="hidden" name="editRevision" value={draft.editRevision} />
		{/if}

		<section class="mb-6">
			<h3>Recipe</h3>
			<p class="text-text-3 mt-1 mb-5 text-sm">
				{withCommitMessage
					? 'Changes here are saved as a new version. The previous version stays in the history.'
					: 'This becomes version 1. Later edits are saved as new versions.'}
			</p>

			<div class="field">
				<label for="title">
					Title <span class="required">*</span>
				</label>
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
						oninput={numberField('servings')} />
				</div>
				<div class="field">
					<label for="prepTimeMinutes">Prep time (min)</label>
					<input
						id="prepTimeMinutes"
						name="prepTimeMinutes"
						type="number"
						min="0"
						value={draft.prepTimeMinutes}
						oninput={numberField('prepTimeMinutes')} />
				</div>
				<div class="field">
					<label for="cookTimeMinutes">Cook time (min)</label>
					<input
						id="cookTimeMinutes"
						name="cookTimeMinutes"
						type="number"
						min="0"
						value={draft.cookTimeMinutes}
						oninput={numberField('cookTimeMinutes')} />
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
				<TagInput {allTags} bind:selected={draft.tags} />
			</fieldset>

			<div class="field">
				<label class="inline-checkbox">
					<input type="checkbox" name="isPublic" bind:checked={draft.isPublic} />
					Make this recipe public
				</label>
			</div>
		</section>

		{#if withCommitMessage}
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
		{/if}

		{#if form?.error}
			<p class="form-error" role="alert">{form.error}</p>
		{/if}

		<div class="form-actions">
			<button type="submit" class="btn-primary" disabled={submitting}>
				{submitting ? 'Saving…' : submitLabel}
			</button>
			{#if dirty && !submitting}
				<span class="form-hint">Unsaved changes</span>
			{/if}
		</div>
	</fieldset>
</form>
