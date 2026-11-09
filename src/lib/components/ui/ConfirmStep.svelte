<script lang="ts">
	import { enhance as enhanceForm } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import { tick, type Snippet } from 'svelte';

	// A destructive action asked twice, in place: no browser confirm() and no
	// dialog. The trigger opens a step that says what goes; only the step's
	// button posts. Focus moves to the step; Escape or the keep button closes
	// it and hands focus back to the trigger. Used by Delete recipe, Delete
	// entry, and the profile's Remove friend and Block.
	let {
		trigger,
		triggerClass = 'btn-ghost danger',
		label,
		explanation,
		confirmLabel,
		pendingLabel = confirmLabel,
		keepLabel,
		action,
		enhance,
		pending = false,
		error = null,
		open = $bindable(false),
		fields
	}: {
		/** The trigger's words, such as "Delete recipe". */
		trigger: string;
		triggerClass?: string;
		/** The step's spoken name, such as "Delete Pancakes?"; without it the step is named by the explanation. */
		label?: string;
		/** What goes, in one sentence, shown above the buttons. */
		explanation: string;
		confirmLabel: string;
		/** The confirm button's words while the post is in flight. */
		pendingLabel?: string;
		keepLabel: string;
		action: string;
		enhance?: SubmitFunction;
		/** While posting, both buttons are disabled and the step will not close. */
		pending?: boolean;
		/** A refusal, shown under the step in the form error style. */
		error?: string | null;
		open?: boolean;
		/** Hidden inputs the action reads. */
		fields?: Snippet;
	} = $props();

	const id = $props.id();
	let triggerButton: HTMLButtonElement | undefined = $state();
	let step: HTMLElement | undefined = $state();

	async function show() {
		open = true;
		await tick();
		step?.focus();
	}

	async function close() {
		if (pending) return;
		open = false;
		await tick();
		triggerButton?.focus();
	}
</script>

{#if open}
	<form class="confirm-step" method="POST" {action} use:enhanceForm={enhance}>
		{@render fields?.()}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions (Escape bubbles up from the buttons inside) -->
		<div
			class="step"
			role="group"
			tabindex="-1"
			aria-label={label}
			aria-labelledby={label ? undefined : `${id}-explanation`}
			aria-describedby={label ? `${id}-explanation` : undefined}
			bind:this={step}
			onkeydown={(e) => {
				if (e.key === 'Escape') close();
			}}>
			<p id="{id}-explanation" class="explanation">{explanation}</p>
			<div class="buttons">
				<button type="submit" class="btn-ghost danger" disabled={pending}>
					{pending ? pendingLabel : confirmLabel}
				</button>
				<button type="button" class="btn-ghost" disabled={pending} onclick={close}>
					{keepLabel}
				</button>
			</div>
		</div>
	</form>
{:else}
	<button type="button" class={triggerClass} bind:this={triggerButton} onclick={show}>
		{trigger}
	</button>
{/if}
{#if error}
	<p class="form-error" role="alert">{error}</p>
{/if}

<style>
	.explanation {
		margin: 0 0 var(--space-3);
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
