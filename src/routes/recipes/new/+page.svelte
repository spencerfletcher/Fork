<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { RecipeDraft } from '#lib/recipes/validation.js';
	import TagInput from '#lib/components/ui/TagInput.svelte';
	import IngredientEditor from '#lib/components/recipes/IngredientEditor.svelte';
	import StepEditor from '#lib/components/recipes/StepEditor.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const { allTags } = $derived(data);

	const EMPTY: RecipeDraft = {
		title: '',
		description: '',
		servings: '',
		prepTimeMinutes: '',
		cookTimeMinutes: '',
		ingredients: '',
		steps: '',
		commitMessage: '',
		editRevision: '',
		isPublic: true,
		tags: [],
		hadPhoto: false,
		removeImage: false
	};

	// The whole form as one object. A failed save hands back what was
	// submitted, invalid values included, and the fields refill from it.
	let draft = $state<RecipeDraft>({ ...EMPTY });
	$effect(() => {
		if (form?.draft) draft = { ...form.draft };
	});

	// Trimmed strings and sorted tags, so typing then deleting reads as clean.
	const serialise = (d: RecipeDraft) =>
		JSON.stringify({
			...d,
			title: d.title.trim(),
			description: d.description.trim(),
			tags: [...d.tags].sort()
		});
	const dirty = $derived(serialise(draft) !== serialise(EMPTY));

	let imagePreview = $state<string | null>(null);
	let imageInput: HTMLInputElement | undefined = $state();

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
			<h1>New Recipe</h1>
		</div>

		<form method="POST" use:enhance={track} class="form" enctype="multipart/form-data">
			<fieldset disabled={submitting} class="contents">
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

				<div class="field">
					<label for="image">Photo</label>
					{#if imagePreview}
						<div class="border-border relative w-full overflow-hidden rounded-md border">
							<img src={imagePreview} alt="Preview" class="block h-[220px] w-full object-cover" />
							<button
								type="button"
								class="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full border-none bg-black/55 text-[1.1rem] leading-none text-white"
								onclick={() => {
									imagePreview = null;
									if (imageInput) imageInput.value = '';
								}}
								aria-label="Remove image">
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
					{#if photoLost}
						<p class="form-hint">Please choose the photo again.</p>
					{/if}
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

				<hr class="divider" />

				<IngredientEditor bind:value={draft.ingredients} />
				<StepEditor bind:value={draft.steps} />

				{#if form?.error}
					<p class="form-error" role="alert">{form.error}</p>
				{/if}

				<div class="form-actions">
					<button type="submit" class="btn-primary" disabled={submitting}>
						{submitting ? 'Saving…' : 'Create recipe'}
					</button>
					{#if dirty && !submitting}
						<span class="form-hint">Unsaved changes</span>
					{/if}
				</div>
			</fieldset>
		</form>
	</div>
</div>
