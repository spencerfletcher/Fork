<script lang="ts">
	import type { Snippet } from 'svelte';

	// An editor's last row: Save, Cancel beside it with the same padding (a
	// ghost, Spencer: "Save has internal padding, Cancel doesn't, looks bad"),
	// and an optional danger control pinned to the right edge. On a phone the
	// danger control drops to its own line, still right. An open confirm step
	// stays in its spot and widens leftwards; the row does not wrap for it.
	let {
		submitLabel,
		pending = false,
		cancelHref,
		form,
		submitButton = $bindable(),
		danger
	}: {
		submitLabel: string;
		/** While saving: Save is disabled and reads "Saving…". */
		pending?: boolean;
		cancelHref: string;
		/** The form's id, when the row sits outside it so a danger form can share the row. */
		form?: string;
		submitButton?: HTMLButtonElement;
		/** Its own form, such as Delete recipe's confirm step. */
		danger?: Snippet;
	} = $props();
</script>

<div class="form-actions">
	<button class="btn-primary" type="submit" {form} disabled={pending} bind:this={submitButton}>
		{pending ? 'Saving…' : submitLabel}
	</button>
	<a class="btn-ghost" href={cancelHref}>Cancel</a>
	{#if danger}
		<div class="danger">{@render danger()}</div>
	{/if}
</div>

<style>
	.form-actions {
		flex-wrap: wrap;
	}

	/* Save and Cancel keep their words on one line; only the danger slot gives. */
	.form-actions > :not(.danger) {
		flex-shrink: 0;
	}

	/* The right group: the row's free space, its contents (the trigger, or the
	   open step as a whole) packed flush to the row's right edge. The row's own
	   gap is all that separates it from Cancel. */
	.danger {
		flex: 1 1 auto;
		min-width: 0;
		margin-left: auto;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.danger :global(.step) {
		justify-content: flex-end;
	}

	/* One row from 700: the danger control shrinks rather than wrapping, so
	   an open step's sentence wraps inside it. The sentence takes its own
	   width, not the row's spare space, so nothing stretches inside the step. */
	@media (min-width: 700px) {
		.form-actions {
			flex-wrap: nowrap;
		}

		.danger :global(.step .explanation) {
			flex: 0 1 auto;
		}
	}

	@media (max-width: 699px) {
		.danger {
			flex-basis: 100%;
		}
	}
</style>
