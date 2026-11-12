<script lang="ts">
	import { enhance as enhanceForm } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import FieldError from './FieldError.svelte';
	import { COLLECTION_NAME_MAX } from '#lib/collections.js';

	// A collection's name typed in place, inside a menu or panel, under a rule:
	// the label, the capped box and a small primary submit, then the refusal.
	// Escape goes back (the host's `onback`) and goes no further, so a second
	// Escape is the host's to close its menu. The host focuses the box.
	let {
		id,
		label,
		labelHidden = false,
		action,
		enhance,
		value = '',
		fields = {},
		error,
		pending,
		submitLabel,
		onback
	}: {
		/** The box's id; its refusal is `{id}-error`. */
		id: string;
		label: string;
		/** The label for screen readers alone, where the row above names it (Rename). */
		labelHidden?: boolean;
		action: string;
		enhance: SubmitFunction;
		value?: string;
		/** Hidden fields the form sends with the name. */
		fields?: Record<string, string>;
		error: string | null | undefined;
		pending: boolean;
		submitLabel: string;
		onback: () => void;
	} = $props();
</script>

<form method="POST" {action} class="name-step" use:enhanceForm={enhance}>
	{#each Object.entries(fields) as [field, fieldValue] (field)}
		<input type="hidden" name={field} value={fieldValue} />
	{/each}
	<label for={id} class:sr-only={labelHidden}>{label}</label>
	<input
		{id}
		name="name"
		type="text"
		maxlength={COLLECTION_NAME_MAX}
		required
		autocomplete="off"
		{value}
		aria-invalid={error ? true : undefined}
		aria-describedby={error ? `${id}-error` : undefined}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				onback();
			}
		}} />
	<button type="submit" class="btn-primary btn-sm" disabled={pending}>{submitLabel}</button>
	<FieldError name={id} {error} />
</form>

<style>
	/* The box and the button share a line while both fit; the box takes the
	   room (100 to 1), and a button wrapped under it in a narrow menu fills
	   its own line. Contained, so the step takes its host's width and never
	   widens a menu sized by its rows. */
	.name-step {
		contain: inline-size;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 8px 6px 6px;
		border-top: 1px solid var(--color-border);
	}

	label {
		flex-basis: 100%;
		font-size: 0.875rem;
		font-weight: 600;
	}

	input[type='text'] {
		flex: 100 1 10rem;
		min-width: 0;
	}

	/* A form's button, not one of a host row's pills, whose corner it would inherit. */
	.name-step .btn-primary {
		flex: 1 0 auto;
		border-radius: var(--radius-md);
	}

	.name-step :global(.field-error) {
		flex-basis: 100%;
	}
</style>
