<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { lockIcon } from '#lib/components/Icons.svelte';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { NOTE_MAX } from '#lib/saves.js';

	let { note }: { note: string | null } = $props();

	let editing = $state(false);
	let box: HTMLTextAreaElement | undefined = $state();
	let opener: HTMLButtonElement | undefined = $state();
	// Saved, the page's data reloads with the note and the box closes; a
	// refusal keeps the box and what was typed.
	const save = pendingEnhance({ reset: false, keepFailure: true, done: () => close() });

	async function open() {
		editing = true;
		await tick();
		box?.focus();
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') close();
	}

	async function close() {
		editing = false;
		await tick();
		opener?.focus();
	}
</script>

<!-- The saver's private note on a saved recipe: the lifted paper the
     Journal's "Note for next time" uses, edited in place. Only its writer
     ever sees it. -->
<div class="saver-note">
	{#if editing}
		<form method="POST" action="?/note" class="lock-note" use:enhance={save.submit}>
			<label for="saver-note" class="lock-note__label">
				{@render lockIcon()}Your note · only you
			</label>
			<textarea
				id="saver-note"
				name="note"
				rows="3"
				maxlength={NOTE_MAX}
				aria-invalid={save.error ? true : undefined}
				aria-describedby={save.error ? 'saver-note-error' : undefined}
				bind:this={box}
				onkeydown={onKeydown}>{note ?? ''}</textarea>
			<div class="note-actions">
				<button type="submit" class="btn-primary btn-sm" disabled={save.pending}>
					{save.pending ? 'Saving…' : 'Save'}
				</button>
				<button type="button" class="btn-ghost btn-sm" onclick={close}>Cancel</button>
			</div>
			<FieldError name="saver-note" error={save.error} />
		</form>
	{:else if note}
		<div class="lock-note">
			<p class="lock-note__label">{@render lockIcon()}Your note · only you</p>
			<p class="note-text">{note}</p>
			<button type="button" class="text-btn" bind:this={opener} onclick={open}>Edit note</button>
		</div>
	{:else}
		<button type="button" class="text-btn" bind:this={opener} onclick={open}>Add a note</button>
	{/if}
</div>

<style>
	.saver-note {
		margin-top: 12px;
		max-width: 60ch;
	}

	.note-text {
		white-space: pre-line;
		overflow-wrap: anywhere;
		font-size: 1rem;
		line-height: 1.5;
	}

	.lock-note .text-btn {
		margin-top: 4px;
	}

	textarea {
		display: block;
		width: 100%;
		min-height: 5.5rem;
		resize: vertical;
	}

	.note-actions {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}
</style>
