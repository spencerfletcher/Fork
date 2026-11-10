<script lang="ts">
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';

	// Deleting an entry, asked twice in place, as Delete recipe is.
	let { dish }: { dish: string } = $props();

	const deletion = pendingEnhance({ keepOnError: true });
</script>

<ConfirmStep
	trigger="Delete entry"
	label="Delete {dish}?"
	explanation="This cannot be undone."
	confirmLabel="Delete permanently"
	pendingLabel="Deleting…"
	keepLabel="Keep"
	action="?/deleteEntry"
	enhance={deletion.submit}
	pending={deletion.pending}
	error={deletion.error} />
