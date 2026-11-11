<script lang="ts">
	import { enhance } from '$app/forms';
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';

	// One recipe in the Trash: what it is, when it went and the days left, then
	// Restore and Delete forever. Each row keeps its own pending state and refusal.
	let { recipe }: { recipe: { slug: string; title: string; deleted: string; left: string } } =
		$props();

	const restoring = pendingEnhance({ keepOnError: true, keepFailure: true });
	const deleting = pendingEnhance({ keepOnError: true, keepFailure: true });
</script>

<li class="list-row">
	<div class="list-row-what">
		<h2 class="list-row-title">{recipe.title}</h2>
		<p class="dot-list list-row-meta">
			<span>{recipe.deleted}</span>
			<span>{recipe.left}</span>
		</p>
	</div>
	<div class="list-row-actions">
		<form method="POST" action="?/restore" use:enhance={restoring.submit}>
			<input type="hidden" name="slug" value={recipe.slug} />
			<!-- Named with the title: a list of rows would otherwise read "Restore" each time. -->
			<button
				type="submit"
				class="text-btn"
				aria-label="Restore {recipe.title}"
				disabled={restoring.pending || deleting.pending}>
				Restore
			</button>
		</form>
		<ConfirmStep
			trigger="Delete forever"
			triggerClass="btn-ghost danger-hover"
			label="Delete {recipe.title} forever?"
			explanation="The recipe and its history cannot be restored."
			confirmLabel="Delete forever"
			pendingLabel="Deleting…"
			keepLabel="Keep"
			action="?/deleteForever"
			enhance={deleting.submit}
			pending={deleting.pending}
			error={deleting.error}>
			{#snippet fields()}<input type="hidden" name="slug" value={recipe.slug} />{/snippet}
		</ConfirmStep>
	</div>
	{#if restoring.error}
		<p class="form-error" role="alert">{restoring.error}</p>
	{/if}
</li>

<style>
	.form-error {
		flex-basis: 100%;
	}
</style>
