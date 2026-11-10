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

	.danger {
		min-width: 0;
		margin-left: auto;
		padding-left: var(--space-5);
	}

	/* One row from 700: the danger control shrinks rather than wrapping, so
	   an open step's sentence wraps inside it. */
	@media (min-width: 700px) {
		.form-actions {
			flex-wrap: nowrap;
		}
	}

	@media (max-width: 699px) {
		.danger {
			flex-basis: 100%;
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			padding-left: 0;
		}

		/* The step's buttons stay on the trigger's line, at its right. */
		.danger :global(.step) {
			justify-content: flex-end;
		}
	}
</style>
