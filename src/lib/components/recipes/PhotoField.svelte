<script lang="ts">
	import { tick } from 'svelte';
	import { PHOTO_TYPES } from '#lib/recipes/validation.js';

	let {
		imageUrl,
		removeImage = $bindable(),
		chosen = $bindable(),
		hadPhoto
	}: {
		/** The latest version's photo, shown until replaced or removed. */
		imageUrl: string | null;
		/** Marked for removal: the save drops the stored photo. */
		removeImage: boolean;
		/** A file is picked; the save writes it. */
		chosen: boolean;
		/** The failed save carried a file, which the server cannot echo back. */
		hadPhoto: boolean;
	} = $props();

	// `chosen` flips the moment a file is picked, since the server will write
	// it whether or not the preview loads; the preview follows when the reader
	// finishes. Otherwise the stored photo shows until marked for removal.
	let chosenPreview = $state<string | null>(null);
	let imageInput: HTMLInputElement | undefined = $state();
	const preview = $derived(chosenPreview ?? (removeImage ? null : imageUrl));

	function onImageChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		chosen = !!file;
		if (!file) {
			chosenPreview = null;
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			chosenPreview = reader.result as string;
		};
		reader.readAsDataURL(file);
		removeImage = false;
	}

	// Each button takes the other's place, so focus follows to it.
	let keepButton: HTMLButtonElement | undefined = $state();
	let removeButton: HTMLButtonElement | undefined = $state();

	async function removePhoto() {
		chosen = false;
		chosenPreview = null;
		if (imageInput) imageInput.value = '';
		if (imageUrl) removeImage = true;
		await tick();
		keepButton?.focus();
	}

	// Undoes the removal alone; Cancel still discards every edit.
	async function keepPhoto() {
		removeImage = false;
		await tick();
		removeButton?.focus();
	}

	// After a failure the enhanced form is still mounted and usually keeps the
	// selection; only ask when it is gone, and stop asking once a file is
	// chosen again.
	const photoLost = $derived(hadPhoto && !chosen && !imageInput?.files?.length);
</script>

<div class="field">
	<label for="image">Photo</label>
	{#if preview}
		<div class="photo-preview">
			<img src={preview} alt="Preview" />
			<button
				type="button"
				class="photo-remove"
				bind:this={removeButton}
				onclick={removePhoto}
				aria-label="Remove photo">
				×
			</button>
		</div>
	{/if}
	<!-- The native input, visually hidden, keeps the keyboard and the file
	     dialog; the ghost button is its label and its picture. Its words
	     alone name the input, which both labels would otherwise name twice. -->
	<div class="photo-actions">
		<label class="btn-ghost photo-choose">
			<input
				id="image"
				name="image"
				type="file"
				accept={PHOTO_TYPES.join(',')}
				class="sr-only"
				aria-labelledby="image-action"
				bind:this={imageInput}
				onchange={onImageChange} />
			<span id="image-action">{preview || chosen ? 'Replace photo' : 'Choose photo'}</span>
		</label>
		{#if removeImage}
			<button type="button" class="btn-ghost photo-keep" bind:this={keepButton} onclick={keepPhoto}>
				Keep photo
			</button>
		{/if}
	</div>
	{#if removeImage}
		<input type="hidden" name="removeImage" value="on" />
	{/if}
	{#if photoLost}
		<p class="form-hint">Please choose the photo again.</p>
	{/if}
</div>

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

	.photo-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	/* One height with the single-line boxes beside it. It is a label, so it
	   takes back the button's voice from the field labels' eyebrow. */
	.photo-choose {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		min-height: 41px;
		padding-block: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: normal;
		text-transform: none;
		color: var(--color-text);
	}

	.photo-keep {
		min-height: 41px;
		padding-block: 0;
	}

	.photo-choose:has(:focus-visible) {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	@media (max-width: 699px) {
		.photo-preview {
			height: 160px;
		}
	}

	/* A thumb's 44px, on a phone or any touch screen. */
	@media (max-width: 699px), (pointer: coarse) {
		.photo-remove {
			width: 44px;
			height: 44px;
		}

		/* The photo buttons leave the boxes' 41px for a thumb's 44px. */
		.photo-choose,
		.photo-keep {
			min-height: 44px;
		}
	}
</style>
