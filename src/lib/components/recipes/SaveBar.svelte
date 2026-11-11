<script lang="ts">
	import { onMount } from 'svelte';
	import FormActions from '#lib/components/ui/FormActions.svelte';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import { typedMessage } from '#lib/recipes/fieldErrors.svelte.js';

	// The editor's save bar, pinned to the screen's bottom (c1). Editing, What
	// changed? sits beside Save from 700; on a phone it stays in the page and
	// the bar holds Save and Cancel only. Delete recipe is not here: it is at
	// the form's end.
	let {
		message = false,
		commitMessage = $bindable(''),
		error,
		generated,
		submitLabel,
		pending,
		cancelHref,
		submitButton = $bindable()
	}: {
		/** Editing: the What changed? field is offered. */
		message?: boolean;
		commitMessage?: string;
		/** What changed?'s inline error (fieldErrors). */
		error?: string;
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

	// The form saves on Cmd+Enter, Ctrl+Enter off a Mac (RecipeForm); the
	// hint names the one this device has, so it waits for the browser.
	let shortcut = $state('');
	onMount(() => {
		shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ Enter' : 'Ctrl Enter';
	});

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
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={[error && 'commitMessage-error', savesGenerated && 'commitMessage-hint']
					.filter(Boolean)
					.join(' ') || undefined}
				bind:value={commitMessage}
				{@attach (el) => el.setCustomValidity(typedMessage('commitMessage', commitMessage))} />
			<FieldError name="commitMessage" {error} />
			{#if savesGenerated}
				<p class="form-hint" id="commitMessage-hint">Left blank, saves as: {generated}</p>
			{/if}
		</div>
	{/if}
	<div class="actions-bar" bind:this={actions}>
		<FormActions {submitLabel} {pending} {cancelHref} bind:submitButton />
	</div>
	{#if shortcut}<span class="shortcut">{shortcut}</span>{/if}
</div>

<style>
	/* Edge to edge across the gutters, above the home indicator. Past the
	   site's column the fill and its rule run on to the window's edges, drawn
	   as the border image's outset, which paints but never scrolls; the bar's
	   own box, and so its contents, stay on the column. */
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
		border-image: linear-gradient(var(--color-border) 0 1px, var(--color-surface) 0) 0 fill / 0 / 0
			100vw;
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

	/* Quiet, after Cancel: Ink 3 at the hint size. */
	.shortcut {
		font-size: 0.875rem;
		color: var(--color-text-3);
		white-space: nowrap;
	}

	@media (min-width: 700px) {
		/* What changed?'s message sits above the bar, not in it, so the bar keeps
		   the height the page's scroll padding allows for: a tab on the bar's
		   fill, level with the label, covering the rule beneath it. */
		.field-message :global(.field-error) {
			position: absolute;
			bottom: calc(100% - 1px);
			left: 24px;
			padding: 6px 12px;
			background: var(--color-surface);
			border: 1px solid var(--color-border);
			border-bottom: 0;
			border-radius: 6px 6px 0 0;
		}
	}

	@media (max-width: 699px) {
		/* A phone has no hardware keyboard to say it to. */
		.shortcut {
			display: none;
		}

		/* What changed? stays in the page, a plain 1px Rule above it; only
		   Save and Cancel ride the screen's bottom edge, across the 18px gutters. */
		.save-bar {
			display: contents;
		}

		.field-message {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-2);
			padding-top: 18px;
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
