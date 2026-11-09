<script lang="ts">
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import type { pendingEnhance } from '#lib/pendingEnhance.svelte.js';

	// Permanent deletion, owner only (the page 403s anyone else), asked twice
	// in place. The page owns the enhancer, so the editor's leave guard can
	// stand aside for the delete's redirect.
	let {
		title,
		deletion,
		error
	}: {
		title: string;
		deletion: ReturnType<typeof pendingEnhance>;
		/** The server's refusal, or the enhancer's own, for the alert. */
		error: string | null;
	} = $props();
</script>

<ConfirmStep
	trigger="Delete recipe"
	label="Delete {title}?"
	explanation="Deletes every version of {title} and its photos. This cannot be undone."
	confirmLabel="Delete permanently"
	pendingLabel="Deleting…"
	keepLabel="Keep recipe"
	action="?/deleteRecipe"
	enhance={deletion.submit}
	pending={deletion.pending}
	{error} />
