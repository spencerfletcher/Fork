<script lang="ts">
	import { enhance } from '$app/forms';
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';

	// A moderator's Hide from others and Restore (isModerator), on the recipe
	// page and the moderation list. Each posts to the recipe page's own action
	// by its full path, so it works from either page; the result reloads the
	// page it is on.
	let { slug, title, hidden }: { slug: string; title: string; hidden: boolean } = $props();

	const hide = pendingEnhance({ keepFailure: true, keepOnError: true });
	const restore = pendingEnhance({ keepFailure: true, keepOnError: true });
</script>

{#if hidden}
	<form method="POST" action="/recipes/{slug}?/unhide" use:enhance={restore.submit}>
		<button
			type="submit"
			class="text-btn"
			aria-label="Restore {title} for other cooks"
			disabled={restore.pending}>
			Restore
		</button>
		{#if restore.error}
			<p class="form-error" role="alert">{restore.error}</p>
		{/if}
	</form>
{:else}
	<ConfirmStep
		trigger="Hide from others"
		triggerClass="text-btn"
		label="Hide {title} from other cooks?"
		explanation="Only its author and moderators see it. Savers lose it until it is restored."
		confirmLabel="Hide"
		pendingLabel="Hiding…"
		keepLabel="Keep shown"
		action="/recipes/{slug}?/hide"
		enhance={hide.submit}
		pending={hide.pending}
		error={hide.error} />
{/if}
