<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import type { RecipeDraft } from '#lib/recipes/validation.js';
	import { normaliseTagNames, tagKey } from '#lib/recipes/tags.js';
	import { generatedCommitMessage } from '#lib/recipes/content.js';
	import { draftChangedGroups, describeGroups } from '#lib/recipes/draftChanges.js';
	import TagInput from '#lib/components/ui/TagInput.svelte';
	import IngredientEditor from './IngredientEditor.svelte';
	import StepEditor from './StepEditor.svelte';

	let {
		baseline,
		form,
		allTags,
		action,
		submitLabel,
		cancelHref,
		imageUrl = null,
		nextVersion
	}: {
		/** What was loaded, as the form's strings. Dirty-checking compares against it. */
		baseline: RecipeDraft;
		/** The failed action's result, if any; its draft refills the fields. */
		form: { error: string; draft: RecipeDraft } | null;
		allTags: Array<{ id: number; name: string; slug: string }>;
		/** Named action, e.g. `?/save`; omit for the route's default action. */
		action?: string;
		submitLabel: string;
		/** Where Cancel goes: the recipe when editing, the list when creating. */
		cancelHref: string;
		/** The latest version's photo, shown until replaced or removed. */
		imageUrl?: string | null;
		/** Editing: the number the next version would get. Enables the commit
		 *  message field and the helper that states what a save will write. */
		nextVersion?: number;
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
			tags: normaliseTagNames(d.tags).map(tagKey).sort()
		});

	// Photo: a newly chosen file previews from the browser; otherwise the
	// stored photo shows until it is marked for removal.
	let chosenPreview = $state<string | null>(null);
	let imageInput: HTMLInputElement | undefined = $state();
	const preview = $derived(chosenPreview ?? (draft.removeImage ? null : imageUrl));

	const dirty = $derived(chosenPreview !== null || serialise(draft) !== serialise(baseline));

	// What the save will write, in the server's own groups, so the helper and
	// the placeholder agree with the message it would generate.
	const photoChanged = $derived(chosenPreview !== null || draft.removeImage);
	// null: the draft is invalid, and nothing can be promised about the save.
	const groups = $derived(nextVersion ? draftChangedGroups(baseline, draft, photoChanged) : []);
	const settings = (d: RecipeDraft) =>
		JSON.stringify([d.isPublic, normaliseTagNames(d.tags).map(tagKey).sort()]);
	const settingsChanged = $derived(settings(draft) !== settings(baseline));

	const helper = $derived.by(() => {
		if (!dirty || submitting) return '';
		if (!nextVersion) return 'Unsaved changes';
		if (groups === null) return '';
		if (groups.length > 0) return `Saves as v${nextVersion} · ${describeGroups(groups)} changed`;
		if (settingsChanged) return 'Saves settings · no new version';
		return '';
	});

	const placeholder = $derived(
		groups && groups.length > 0 ? generatedCommitMessage(groups) : 'What changed in this version?'
	);

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

	// Leaving a dirty form asks first. A tab close or hard reload cannot show
	// our wording, so cancelling there hands the question to the browser. The
	// save's own redirect happens while submitting, which never asks.
	beforeNavigate((navigation) => {
		if (!dirty || submitting) return;
		if (
			navigation.type === 'leave' ||
			!confirm('Leave without saving? Your changes will be lost.')
		) {
			navigation.cancel();
		}
	});
</script>

<form method="POST" {action} enctype="multipart/form-data" use:enhance={track} class="form">
	<fieldset disabled={submitting} class="contents">
		{#if draft.editRevision}
			<input type="hidden" name="editRevision" value={draft.editRevision} />
		{/if}

		<div class="form-grid">
			<div class="form-col">
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
					{#if preview}
						<div class="photo-preview">
							<img src={preview} alt="Preview" />
							<button
								type="button"
								class="photo-remove"
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
						class="file-input"
						bind:this={imageInput}
						onchange={onImageChange} />
					{#if draft.removeImage}
						<input type="hidden" name="removeImage" value="on" />
					{/if}
					{#if photoLost}
						<p class="form-hint">Please choose the photo again.</p>
					{/if}
				</div>

				<!-- Number fields stay strings so the dirty check compares like with like;
				     bind:value on a number input would hand back numbers and null. -->
				<div class="field-row">
					<div class="field">
						<label for="servings">Serves</label>
						<input
							id="servings"
							name="servings"
							type="number"
							min="1"
							value={draft.servings}
							oninput={(e) => (draft.servings = e.currentTarget.value)} />
					</div>
					<div class="field">
						<label for="prepTimeMinutes">Prep (min)</label>
						<input
							id="prepTimeMinutes"
							name="prepTimeMinutes"
							type="number"
							min="0"
							value={draft.prepTimeMinutes}
							oninput={(e) => (draft.prepTimeMinutes = e.currentTarget.value)} />
					</div>
					<div class="field">
						<label for="cookTimeMinutes">Cook (min)</label>
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

				<label class="inline-checkbox">
					<input type="checkbox" name="isPublic" bind:checked={draft.isPublic} />
					Make this recipe public
					<span class="inline-checkbox__note">· applies to every version</span>
				</label>
			</div>

			<div class="form-col">
				<IngredientEditor bind:value={draft.ingredients} />
				<StepEditor bind:value={draft.steps} />
			</div>
		</div>

		{#if nextVersion}
			<div class="field field-message">
				<label for="commitMessage">
					What changed? <span class="optional">optional</span>
				</label>
				<input
					id="commitMessage"
					name="commitMessage"
					type="text"
					class="field-mono"
					{placeholder}
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
			<a href={cancelHref} class="btn-ghost">Cancel</a>
			<!-- Always in the DOM, so the outcome is announced when it changes. -->
			<span class="form-hint" role="status" aria-live="polite">{helper}</span>
		</div>
	</fieldset>
</form>

<style>
	.photo-preview {
		position: relative;
		width: 100%;
		height: 150px;
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.photo-preview img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.photo-remove {
		position: absolute;
		top: 8px;
		right: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: 0;
		border-radius: 50%;
		background: rgb(26 23 20 / 0.7);
		color: var(--color-text-cream);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
	}

	.file-input {
		border-style: dashed;
		cursor: pointer;
	}

	/* field-sizing: content ignores rows; this keeps an empty box typeable. */
	textarea[name='description'] {
		min-height: calc(3lh + 18px);
	}

	.file-input:hover {
		border-color: var(--color-accent);
	}

	@media (max-width: 699px) {
		.photo-preview {
			height: 160px;
		}

		.photo-remove {
			width: 32px;
			height: 32px;
		}
	}
</style>
