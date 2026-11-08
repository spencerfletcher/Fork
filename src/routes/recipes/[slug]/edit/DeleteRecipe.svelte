<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import type { pendingEnhance } from '#lib/pendingEnhance.svelte.js';

	// Permanent deletion, owner only (the page 403s anyone else). Two steps on
	// the page, no browser confirm(): the trigger opens a step that names what
	// goes, and only its button posts. The page owns the enhancer, so the
	// editor's leave guard can stand aside for the delete's redirect.
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

	let confirming = $state(false);
	let trigger: HTMLButtonElement | undefined = $state();
	let step: HTMLElement | undefined = $state();

	async function open() {
		confirming = true;
		await tick();
		step?.focus();
	}

	async function close() {
		if (deletion.pending) return;
		confirming = false;
		await tick();
		trigger?.focus();
	}
</script>

<section class="delete-recipe">
	{#if confirming}
		<form method="POST" action="?/deleteRecipe" use:enhance={deletion.submit}>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions (Escape bubbles up from the buttons inside) -->
			<div
				class="step"
				role="group"
				tabindex="-1"
				aria-label="Delete {title}?"
				aria-describedby="delete-explanation"
				bind:this={step}
				onkeydown={(e) => {
					if (e.key === 'Escape') close();
				}}>
				<p id="delete-explanation" class="explanation">
					Deletes every version of {title} and its photos. This cannot be undone.
				</p>
				<div class="buttons">
					<button type="submit" class="btn-ghost" disabled={deletion.pending}>
						{deletion.pending ? 'Deleting…' : 'Delete permanently'}
					</button>
					<button type="button" class="btn-ghost" disabled={deletion.pending} onclick={close}>
						Keep recipe
					</button>
				</div>
			</div>
		</form>
	{:else}
		<button type="button" class="btn-ghost" bind:this={trigger} onclick={open}>
			Delete recipe
		</button>
	{/if}
	{#if error}
		<p class="form-error" role="alert">{error}</p>
	{/if}
</section>

<style>
	/* Set well apart from Save and Cancel, under a rule, so it never reads as
	   one of the form's own actions. */
	.delete-recipe {
		margin-top: var(--space-7);
		padding-top: var(--space-5);
		border-top: 1px solid var(--color-border);
	}

	.explanation {
		margin: 0 0 var(--space-4);
		max-width: 72ch;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.form-error {
		margin-top: var(--space-4);
	}
</style>
