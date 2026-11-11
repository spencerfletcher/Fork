<script lang="ts">
	import { tick } from 'svelte';
	import { PHOTO_HINT, PHOTO_TYPES, photoError } from '#lib/recipes/validation.js';
	import { imageIcon, plusIcon } from '#lib/components/Icons.svelte';

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
	const hasPhoto = $derived(chosen || (!!imageUrl && !removeImage));

	// A chosen file taken out by Remove, kept so Undo can put it back in the
	// input; the stored photo needs only the flag. Removed until a save, Undo
	// or a new pick: a restored draft carries the flag, so it still says so.
	let removedFile = $state<File | null>(null);
	const removed = $derived(!hasPhoto && (removeImage || removedFile !== null));
	// Said politely to a screen reader as the field changes under focus.
	let announcement = $state('');

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
		if (!file) {
			chosen = false;
			chosenPreview = null;
			return;
		}
		removedFile = null;
		show(file);
	}

	function show(file: File) {
		chosen = true;
		removeImage = false;
		const reader = new FileReader();
		reader.onload = () => {
			chosenPreview = reader.result as string;
		};
		reader.readAsDataURL(file);
	}

	// The photo's pills give way to the compact row, so focus goes to Undo.
	let undoButton: HTMLButtonElement | undefined = $state();

	async function removePhoto() {
		removedFile = chosen ? (imageInput?.files?.[0] ?? null) : null;
		chosen = false;
		chosenPreview = null;
		if (imageInput) imageInput.value = '';
		if (imageUrl) removeImage = true;
		announcement = 'Photo removed.';
		await tick();
		undoButton?.focus();
	}

	// Back to what Remove took: the chosen file into the input again, or the
	// stored photo. Cancel still discards every edit.
	async function undoRemove() {
		if (removedFile && imageInput) {
			const files = new DataTransfer();
			files.items.add(removedFile);
			imageInput.files = files.files;
			show(removedFile);
		}
		removedFile = null;
		removeImage = false;
		announcement = 'Photo restored.';
		await tick();
		imageInput?.focus();
	}

	// After a failure the enhanced form is still mounted and usually keeps the
	// selection; only ask when it is gone, and stop asking once a file is
	// chosen again.
	const photoLost = $derived(hadPhoto && !chosen && !imageInput?.files?.length);
</script>

<div class="field">
	<label for="image">Photo</label>
	<!-- With a photo: the photo, its pills over its bottom-left corner. Without:
	     a small tile and the Add photo pill beside it. The one native input,
	     visually hidden, keeps the keyboard and the file dialog; it never
	     leaves the DOM, so a chosen file survives the change of shape. -->
	<div class={['photo-field', hasPhoto ? 'with-photo' : 'compact']}>
		{#if hasPhoto}
			{#if preview}
				<img class="photo" src={preview} alt="Preview" />
			{:else}
				<div class="photo" aria-hidden="true"></div>
			{/if}
		{:else}
			<!-- A press on the tile opens the file dialog too; the pill names the input. -->
			<label class="photo-slot" for="image" aria-hidden="true">{@render imageIcon()}</label>
		{/if}
		<div class="photo-controls">
			<div class="photo-pills">
				<label class={['pill-btn', hasPhoto && 'pill-btn--paper']}>
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
					{#if !hasPhoto}{@render plusIcon()}{/if}
					<span id="image-action">
						{#if hasPhoto}Replace <span class="sr-only">photo</span>{:else}Add photo{/if}
					</span>
				</label>
				{#if hasPhoto}
					<button type="button" class="pill-btn pill-btn--paper" onclick={removePhoto}>
						Remove <span class="sr-only">photo</span>
					</button>
				{/if}
			</div>
			{#if removed}
				<p class="dot-list photo-removed">
					<span>Photo removed</span>
					<button type="button" class="text-btn" bind:this={undoButton} onclick={undoRemove}>
						Undo <span class="sr-only">photo removal</span>
					</button>
				</p>
			{:else if !hasPhoto}
				<p class="form-hint">{PHOTO_HINT}</p>
			{/if}
		</div>
	</div>
	<p class="sr-only" role="status">{announcement}</p>
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
	/* The column's full width at the recipe photo's 4:3, with no border,
	   capped so a one-column editor (a phone, a tablet) keeps room to write:
	   218px tall at 390, never over 380 (the desktop column's 362 stays).
	   Cover crops a portrait photo to the frame. */
	.with-photo {
		position: relative;
	}

	.photo {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 3;
		max-height: min(56vw, 380px);
		border-radius: var(--radius-md);
		object-fit: cover;
		background: var(--color-tint);
	}

	/* Grouped at the photo's bottom-left, Replace first, a visible gap. */
	.with-photo .photo-pills {
		position: absolute;
		left: 12px;
		bottom: 12px;
	}

	.photo-pills {
		display: flex;
		gap: 8px;
	}

	.compact {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	/* Clay tint, as a card with no photo; the transparent border keeps its box
	   in forced colours. */
	.photo-slot {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 96px;
		height: 72px;
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		background: var(--color-tint);
		color: var(--color-text-3);
		cursor: pointer;
	}

	.compact .photo-controls {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 6px;
		min-width: 0;
	}

	.photo-removed {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		font-size: 0.875rem;
		color: var(--color-text-2);
	}

	.photo-removed .text-btn {
		font-size: 0.875rem;
	}
</style>
