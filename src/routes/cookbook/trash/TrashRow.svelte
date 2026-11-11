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

<li class="trash-row">
	<div class="what">
		<h2>{recipe.title}</h2>
		<p class="dot-list meta">
			<span>{recipe.deleted}</span>
			<span>{recipe.left}</span>
		</p>
	</div>
	<div class="actions">
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
	/* Across the page column: what it is on the left, the two actions on the
	   right, one line from 700px; stacked on a phone. */
	.trash-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3) var(--space-5);
		padding: var(--space-4) 0;
		border-top: 1px solid var(--color-border);
	}

	.what {
		flex: 1 1 16rem;
		min-width: 0;
	}

	@media (max-width: 699px) {
		.trash-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.what {
			flex-basis: auto;
		}
	}

	h2 {
		font-size: 1.125rem;
		overflow-wrap: anywhere;
	}

	.meta {
		margin-top: 4px;
		font-size: 0.875rem;
		color: var(--color-text-3);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-5);
	}

	.form-error {
		flex-basis: 100%;
	}
</style>
