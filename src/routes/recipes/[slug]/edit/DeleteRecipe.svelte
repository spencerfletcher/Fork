<script lang="ts">
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import type { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { TRASH_DAYS } from '#lib/trash.js';

	// Moving to the Trash, owner only (the page 403s anyone else), asked twice
	// in place; deleting for good is the Trash's own step. The page owns the enhancer, so the editor's leave guard can
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
	label="Move {title} to Trash?"
	explanation="Moves {title} to your Trash. You can restore it for {TRASH_DAYS} days."
	confirmLabel="Move to Trash"
	pendingLabel="Moving…"
	keepLabel="Keep recipe"
	action="?/deleteRecipe"
	enhance={deletion.submit}
	pending={deletion.pending}
	{error} />
