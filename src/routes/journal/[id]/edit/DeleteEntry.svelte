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

<ConfirmStep
	trigger="Delete entry"
	label="Delete {dish}?"
	explanation="This cannot be undone."
	confirmLabel="Delete permanently"
	pendingLabel="Deleting…"
	keepLabel="Keep"
	action="?/deleteEntry"
	enhance={submit}
	{pending}
	{error} />
