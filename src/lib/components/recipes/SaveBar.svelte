<script lang="ts">
	import FormActions from '#lib/components/ui/FormActions.svelte';

	// The editor's save bar, pinned to the screen's bottom (c1). Editing, What
	// changed? sits beside Save from 700; on a phone it stays in the page and
	// the bar holds Save and Cancel only. Delete recipe is not here: it is at
	// the form's end.
	let {
		message = false,
		commitMessage = $bindable(''),
		generated,
		submitLabel,
		pending,
		cancelHref,
		submitButton = $bindable()
	}: {
		/** Editing: the What changed? field is offered. */
		message?: boolean;
		commitMessage?: string;
		/** The message a blank field saves, or null while nothing would be generated. */
		generated: string | null;
		submitLabel: string;
		pending: boolean;
		cancelHref: string;
		submitButton?: HTMLButtonElement;
	} = $props();

	const placeholder = $derived(generated ?? 'What changed in this version?');
	// A blank message saves the generated one, as the server trims; say so.
	const savesGenerated = $derived(generated !== null && !commitMessage.trim());

	let bar: HTMLDivElement | undefined = $state();
	let actions: HTMLDivElement | undefined = $state();

	/**
	 * A tall box tabbed into with only its top showing counts as in view, so
	 * the browser neither scrolls nor applies scroll-padding-bottom; this
	 * brings the whole field, its error and hint lines too, above the bar, or
	 * above the keyboard where one covers the bar. A field taller than the
	 * room left is the browser's to scroll: it keeps the caret in view, which
	 * this would undo. The form calls it on focusin.
	 */
	export function clearBar(target: EventTarget | null) {
		if (!(target instanceof HTMLElement) || !bar || !actions) return;
		// A phone's bar box is only Save and Cancel: What changed? is in the page.
		const pinned = bar.offsetHeight ? bar : actions;
		if (pinned.contains(target)) return;
		const el = target.closest('.field') ?? target;
		const vv = window.visualViewport;
		const limit = Math.min(
			pinned.getBoundingClientRect().top,
			vv ? vv.offsetTop + vv.height : Infinity
		);
		const rect = el.getBoundingClientRect();
		if (rect.bottom <= limit || rect.height > limit - (vv?.offsetTop ?? 0)) return;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'instant' : 'smooth' });
	}

	// A software keyboard opening shrinks the visual viewport, not the page.
	$effect(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		const keep = () => clearBar(document.activeElement);
		vv.addEventListener('resize', keep);
		return () => vv.removeEventListener('resize', keep);
	});
</script>

<div class="save-bar" bind:this={bar}>
	{#if message}
		<div class="field field-message">
			<label for="commitMessage">What changed?</label>
			<input
				id="commitMessage"
				name="commitMessage"
				type="text"
				{placeholder}
				aria-describedby={savesGenerated ? 'commitMessage-hint' : undefined}
				bind:value={commitMessage} />
			{#if savesGenerated}
				<p class="form-hint" id="commitMessage-hint">Left blank, saves as: {generated}</p>
			{/if}
		</div>
	{/if}
	<div class="actions-bar" bind:this={actions}>
		<FormActions {submitLabel} {pending} {cancelHref} bind:submitButton />
	</div>
</div>

<style>
	/* Edge to edge across the gutters, above the home indicator. */
	.save-bar {
		position: sticky;
		bottom: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 16px;
		margin-inline: -24px;
		padding: 8px 24px calc(8px + env(safe-area-inset-bottom));
		background: var(--color-surface);
		border-top: 1px solid var(--color-border);
	}

	/* A field focused by Tab stops above the bar: its height, the 4px ring and
	   a pixel to spare. On html, which scrolls; keyed to the bar so the rule
	   leaves with the editor. */
	:global(html:has(.save-bar)) {
		scroll-padding-bottom: calc(70px + env(safe-area-inset-bottom));
	}

	/* In the bar: the label left of the box, the box taking the row's room.
	   The hint says what the placeholder shows, so here it is heard, not drawn. */
	.field-message {
		flex: 1;
		flex-direction: row;
		align-items: center;
		gap: 16px;
	}

	.field-message input {
		flex: 1;
		min-width: 0;
	}

	.field-message label {
		white-space: nowrap;
	}

	.form-hint {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	@media (max-width: 699px) {
		/* What changed? stays in the page, a plain 1px Rule above it; only
		   Save and Cancel ride the screen's bottom edge, across the 18px gutters. */
		.save-bar {
			display: contents;
		}

		.field-message {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-2);
			border-top: 1px solid var(--color-border);
		}

		.form-hint {
			position: static;
			width: auto;
			height: auto;
			overflow: visible;
			clip-path: none;
			white-space: normal;
		}

		.actions-bar {
			position: sticky;
			bottom: 0;
			z-index: 1;
			margin-inline: -18px;
			padding: 8px 18px calc(8px + env(safe-area-inset-bottom));
			background: var(--color-surface);
			border-top: 1px solid var(--color-border);
		}
	}
</style>
