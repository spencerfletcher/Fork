<script lang="ts">
	import type { Snippet } from 'svelte';

	// An editor's last row: Save, Cancel beside it with the same padding (a
	// ghost, Spencer: "Save has internal padding, Cancel doesn't, looks bad"),
	// and an optional danger control pinned to the right edge. On a phone the
	// danger control drops to its own line, still right. An open confirm
	// takes the whole row.
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

	.danger {
		margin-left: auto;
		padding-left: var(--space-5);
	}

	.danger:has(:global(.confirm-step)) {
		flex-basis: 100%;
		padding-left: 0;
	}

	@media (max-width: 699px) {
		.danger {
			flex-basis: 100%;
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			padding-left: 0;
		}

		.danger:has(:global(.confirm-step)) {
			align-items: stretch;
		}
	}
</style>
