<script lang="ts">
	import { tick } from 'svelte';
	import { PHOTO_TYPES, photoError } from '#lib/recipes/validation.js';

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

	// A photo the save would refuse. The host buffers a request before the
	// action runs, so a big file never reaches the server's check; it is
	// refused here and cleared, so nothing oversized is sent.
	let error = $state('');

	function onImageChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		error = file ? (photoError(file) ?? '') : '';
		if (error) {
			input.value = '';
			chosen = false;
			chosenPreview = null;
			return;
		}
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

	// Each button takes the other's place, so focus follows to it. With no
	// stored photo there is nothing to keep, so focus goes to the input.
	let keepButton: HTMLButtonElement | undefined = $state();
	let removeButton: HTMLButtonElement | undefined = $state();

	async function removePhoto() {
		chosen = false;
		chosenPreview = null;
		if (imageInput) imageInput.value = '';
		if (imageUrl) removeImage = true;
		await tick();
		(keepButton ?? imageInput)?.focus();
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
		<img class="photo" src={preview} alt="Preview" />
	{:else}
		<!-- The empty slot: a press on it opens the file dialog too. The action below names the input. -->
		<label class="photo-empty" for="image" aria-hidden="true"></label>
	{/if}
	<!-- Text buttons under the photo, never over it. The native input, visually
	     hidden, keeps the keyboard and the file dialog; the action's words are
	     its label and its picture, and alone name it. -->
	<div class="photo-actions">
		<label class="text-btn photo-choose">
			<input
				id="image"
				name="image"
				type="file"
				accept={PHOTO_TYPES.join(',')}
				class="sr-only"
				aria-labelledby="image-action"
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={error ? 'image-error' : undefined}
				bind:this={imageInput}
				onchange={onImageChange} />
			<span id="image-action">
				{#if preview || chosen}Replace <span class="sr-only">photo</span>{:else}Choose a photo{/if}
			</span>
		</label>
		{#if preview}
			<button type="button" class="text-btn" bind:this={removeButton} onclick={removePhoto}>
				Remove <span class="sr-only">photo</span>
			</button>
		{/if}
		{#if removeImage}
			<button type="button" class="text-btn photo-keep" bind:this={keepButton} onclick={keepPhoto}>
				Keep photo
			</button>
		{/if}
	</div>
	{#if removeImage}
		<input type="hidden" name="removeImage" value="on" />
	{/if}
	{#if error}
		<p class="field-error" id="image-error" role="alert">{error}</p>
	{/if}
	{#if photoLost}
		<p class="form-hint">Please choose the photo again.</p>
	{/if}
</div>

<style>
	/* The column's full width at the recipe photo's 4:3, with no border. */
	.photo,
	.photo-empty {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 3;
		border-radius: var(--radius-md);
	}

	.photo {
		object-fit: cover;
	}

	/* Clay tint, as a card with no photo; the transparent border keeps its box in forced colours. */
	.photo-empty {
		box-sizing: border-box;
		background: var(--color-tint);
		border: 1px solid transparent;
		cursor: pointer;
	}

	.photo-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 20px;
	}

	/* Clay words in the body face. The choose action is a label, so it takes
	   back its voice from the field labels' eyebrow. */
	.text-btn {
		font-family: var(--font-sans);
		font-size: 0.9375rem;
	}

	.photo-choose:has(:focus-visible) {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	/* A thumb's 44px, on a phone or any touch screen. */
	@media (max-width: 699px), (pointer: coarse) {
		.photo-choose,
		.photo-keep {
			min-height: 44px;
		}
	}
</style>
