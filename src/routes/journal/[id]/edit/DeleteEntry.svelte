<script lang="ts">
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import type { SubmitFunction } from '$app/forms';

	// Deleting an entry, asked twice in place, as Delete recipe is.
	let { dish }: { dish: string } = $props();

	let pending = $state(false);
	let error = $state('');

	const submit: SubmitFunction = () => {
		pending = true;
		error = '';
		return async ({ result, update }) => {
			if (result.type === 'redirect') return update();
			pending = false;
			error = 'Could not delete the entry. Try again.';
		};
	};
</script>

<section class="delete-entry">
	<ConfirmStep
		trigger="Delete entry"
		label="Delete {dish}?"
		explanation="Deletes this entry, its photo and its note. This cannot be undone."
		confirmLabel="Delete permanently"
		pendingLabel="Deleting…"
		keepLabel="Keep entry"
		action="?/deleteEntry"
		enhance={submit}
		{pending}
		{error} />
</section>

<style>
	/* On the actions row, pushed to its right edge; wrapped, on its own line,
	   still right. The open step takes the whole row. */
	.delete-entry {
		margin-left: auto;
	}

	.delete-entry:has(:global(.confirm-step)) {
		flex-basis: 100%;
	}
</style>
