<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';

	// The recipe editor's two steps: the trigger opens a step in place that
	// says what goes, and only its button posts. No browser confirm().
	let { dish }: { dish: string } = $props();

	let confirming = $state(false);
	let pending = $state(false);
	let error = $state('');
	let trigger: HTMLButtonElement | undefined = $state();
	let step: HTMLElement | undefined = $state();

	async function open() {
		confirming = true;
		await tick();
		step?.focus();
	}

	async function close() {
		if (pending) return;
		confirming = false;
		await tick();
		trigger?.focus();
	}
</script>

<section class="delete-entry">
	{#if confirming}
		<form
			method="POST"
			action="?/deleteEntry"
			use:enhance={() => {
				pending = true;
				error = '';
				return async ({ result, update }) => {
					if (result.type === 'redirect') return update();
					pending = false;
					error = 'Could not delete the entry. Try again.';
				};
			}}>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions (Escape bubbles up from the buttons inside) -->
			<div
				class="step"
				role="group"
				tabindex="-1"
				aria-label="Delete {dish}?"
				aria-describedby="delete-explanation"
				bind:this={step}
				onkeydown={(e) => {
					if (e.key === 'Escape') close();
				}}>
				<p id="delete-explanation" class="explanation">
					Deletes this entry, its photo and its note. This cannot be undone.
				</p>
				<div class="buttons">
					<button type="submit" class="btn-ghost" disabled={pending}>
						{pending ? 'Deleting…' : 'Delete permanently'}
					</button>
					<button type="button" class="btn-ghost" disabled={pending} onclick={close}>
						Keep entry
					</button>
				</div>
			</div>
		</form>
	{:else}
		<button type="button" class="btn-ghost" bind:this={trigger} onclick={open}>Delete entry</button>
	{/if}
	{#if error}
		<p class="form-error" role="alert">{error}</p>
	{/if}
</section>

<style>
	/* On the actions row, pushed to its right edge; wrapped, on its own line,
	   still right. The open step takes the whole row. */
	.delete-entry {
		margin-left: auto;
	}

	.delete-entry:has(.step) {
		flex-basis: 100%;
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

	.btn-ghost {
		min-height: 44px;
	}

	.form-error {
		margin-top: var(--space-4);
	}
</style>
