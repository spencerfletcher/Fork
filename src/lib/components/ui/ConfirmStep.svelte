<script lang="ts">
	import { enhance as enhanceForm } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import { tick, type Snippet } from 'svelte';

	// A destructive action asked twice, in place: no browser confirm() and no
	// dialog. The trigger opens a step in its own spot on its own line: the
	// confirm, the keep button, then the sentence that says what goes. Only the
	// step's button posts. Focus moves to the step; Escape or the keep button
	// closes it and hands focus back to the trigger. Used by Delete recipe,
	// Delete entry, and the profile's Remove friend and Block.
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
		/** What goes, in one sentence, shown beside the buttons (beneath them on a phone). */
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
	let form: HTMLFormElement | undefined = $state();
	let step: HTMLElement | undefined = $state();
	let triggerWidth = 0;

	// The step's box widens from the trigger's width to its own, its contents
	// fading in; closing runs it backwards. Measured, because CSS cannot yet
	// transition to an auto width in WebKit. Reduced motion, or no Web
	// Animations (jsdom), swaps at once.
	function grow(direction: 'normal' | 'reverse') {
		if (!form?.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const width = form.offsetWidth;
		// Closing holds the trigger's width until the trigger is back.
		const fill = direction === 'reverse' ? 'forwards' : 'none';
		const options: KeyframeAnimationOptions = {
			duration: 180,
			easing: 'ease-out',
			direction,
			fill
		};
		// The contents keep their open width while the box clips them, so the
		// sentence does not reflow as it widens. Clipped only meanwhile, so a
		// focus ring is never cut.
		const box = form;
		box.style.overflow = 'hidden';
		step?.style.setProperty('width', `${width}px`);
		step?.animate({ opacity: [0, 1] }, options);
		const run = box.animate({ width: [`${triggerWidth}px`, `${width}px`] }, options);
		return run.finished.finally(() => {
			box.style.removeProperty('overflow');
			step?.style.removeProperty('width');
		});
	}

	async function show() {
		triggerWidth = triggerButton?.offsetWidth ?? 0;
		open = true;
		await tick();
		step?.focus();
		grow('normal');
	}

	async function close() {
		if (pending) return;
		await grow('reverse');
		open = false;
		await tick();
		triggerButton?.focus();
	}
</script>

{#if open}
	<form class="confirm-step" method="POST" {action} use:enhanceForm={enhance} bind:this={form}>
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
			<button type="submit" class="btn-ghost danger" disabled={pending}>
				{pending ? pendingLabel : confirmLabel}
			</button>
			<button type="button" class="btn-ghost" disabled={pending} onclick={close}>
				{keepLabel}
			</button>
			<p id="{id}-explanation" class="explanation">{explanation}</p>
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
	/* One line: the two buttons, then the sentence, which wraps beneath them
	   only when 24ch of it cannot sit beside them (and always on a phone). */
	.step {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
	}

	.step button {
		flex: none;
	}

	.explanation {
		flex: 1 1 24ch;
		max-width: 72ch;
		margin: 0;
		line-height: 1.4;
		color: var(--color-text-2);
	}

	@media (max-width: 699px) {
		.explanation {
			flex-basis: 100%;
		}
	}

	.form-error {
		margin-top: var(--space-4);
	}
</style>
