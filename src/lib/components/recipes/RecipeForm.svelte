<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { beforeNavigate } from '$app/navigation';
	import {
		parseDraftContent,
		numberMessages,
		fieldOfMessage,
		NUMBER_FIELDS,
		REQUIRED_MESSAGES,
		type NumberField,
		type RecipeDraft
	} from '#lib/recipes/validation.js';
	import { normaliseTagNames, tagKey } from '#lib/recipes/tags.js';
	import type { TagChip } from '#lib/recipes/types.js';
	import { generatedCommitMessage } from '#lib/recipes/content.js';
	import { MAX_MAKES } from '#lib/recipes/limits.js';
	import { draftChangedGroups } from '#lib/recipes/draftChanges.js';
	import TagInput from '#lib/components/ui/TagInput.svelte';
	import IngredientEditor from './IngredientEditor.svelte';
	import StepEditor from './StepEditor.svelte';
	import PhotoField from './PhotoField.svelte';

	let {
		baseline,
		form,
		allTags,
		action,
		submitLabel,
		cancelHref,
		imageUrl = null,
		nextVersion,
		header,
		leaving = false
	}: {
		/** What was loaded, as the form's strings. Dirty-checking compares against it. */
		baseline: RecipeDraft;
		/** The failed action's result, if any; its draft refills the fields. */
		form: { error: string; draft: RecipeDraft } | null;
		allTags: TagChip[];
		/** Named action, e.g. `?/save`; omit for the route's default action. */
		action?: string;
		submitLabel: string;
		/** Where Cancel goes: the recipe when editing, the list when creating. */
		cancelHref: string;
		/** The latest version's photo, shown until replaced or removed. */
		imageUrl?: string | null;
		/** Editing: the number the next version would get. Enables the commit
		 *  message field and the outcome the header line states. */
		nextVersion?: number;
		/** The page's header, handed the outcome of a save ("saves as v4",
		 *  "saves settings only", or '' while the form is clean or invalid),
		 *  and whether any field is showing an error. */
		header?: Snippet<[outcome: string, invalid: boolean]>;
		/** Another form on the page is leaving on purpose (a delete), so the guard stays quiet. */
		leaving?: boolean;
	} = $props();

	// The whole form as one object. A failed save hands back what was
	// submitted, invalid values included, and the fields refill from it. It is
	// the initial state, not an effect, so a server-rendered reply (a submit
	// before hydration, or without JavaScript) already shows it; the effect
	// covers later failures while the page stays mounted.
	// svelte-ignore state_referenced_locally
	let draft = $state<RecipeDraft>({ ...(form?.draft ?? baseline) });
	$effect(() => {
		if (form?.draft) draft = { ...form.draft };
	});

	// Tag identity ignores case and order, as it does on the server.
	const tagKeys = (tags: string[]) => normaliseTagNames(tags).map(tagKey).sort();

	// Trimmed strings and sorted tags, so retyping the original reads as clean.
	// A typed message is a change: the save writes a version carrying it.
	const serialise = (d: RecipeDraft) =>
		JSON.stringify({
			...d,
			commitMessage: d.commitMessage.trim(),
			hadPhoto: false,
			title: d.title.trim(),
			description: d.description.trim(),
			tags: tagKeys(d.tags)
		});

	// A photo is picked: PhotoField sets it, the dirty check and the outcome read it.
	let chosen = $state(false);

	const dirty = $derived(chosen || serialise(draft) !== serialise(baseline));

	// What the save will write, in the server's own groups, so the outcome and
	// the placeholder agree with the message it would generate.
	const photoChanged = $derived(chosen || draft.removeImage);
	const baselineContent = $derived(parseDraftContent(baseline));
	// null: the draft is invalid, and nothing can be promised about the save.
	const groups = $derived(
		nextVersion ? draftChangedGroups(baselineContent, draft, photoChanged) : []
	);
	const settings = (d: RecipeDraft) => JSON.stringify([d.isPublic, tagKeys(d.tags)]);
	const settingsChanged = $derived(settings(draft) !== settings(baseline));

	const outcome = $derived.by(() => {
		if (blocked && errorCount > 0) {
			return errorCount === 1 ? '1 field needs attention' : `${errorCount} fields need attention`;
		}
		if (!dirty || save.pending || !nextVersion || groups === null) return '';
		// A typed message is never dropped: the save writes a version carrying it.
		if (groups.length > 0 || draft.commitMessage.trim()) return `saves as v${nextVersion}`;
		if (settingsChanged) return 'saves settings only';
		return '';
	});

	const generated = $derived(groups && groups.length > 0 ? generatedCommitMessage(groups) : null);
	const placeholder = $derived(generated ?? 'What changed in this version?');
	// A blank message saves the generated one, as the server trims; say so.
	const savesGenerated = $derived(generated !== null && !draft.commitMessage.trim());

	const numberFields = Object.keys(NUMBER_FIELDS) as NumberField[];

	// Inline errors, one per field name, in the server's own wording. A field is
	// checked when it is left after an edit, when it blocks a submit, and on
	// every keystroke once it carries an error, so the message and the browser's
	// :user-invalid state come from the same validity and clear together.
	// Passing through an untouched field says nothing, as the auth pages do.
	// A server-rendered reply shows a field's message too, as the draft is
	// shown: the initial state, since the effect below never runs there.
	// svelte-ignore state_referenced_locally
	const serverField = form ? fieldOfMessage(form.error) : undefined;
	// svelte-ignore state_referenced_locally
	let errors = $state<Record<string, string>>(
		form && serverField ? { [serverField]: form.error } : {}
	);
	// Read only by handlers, so not state.
	const edited: Record<string, boolean> = {};
	// A blocked submit makes the outcome line count what still needs fixing.
	let blocked = $state(false);
	const errorCount = $derived(Object.values(errors).filter(Boolean).length);

	function validate(target: EventTarget | null) {
		const el = target as HTMLInputElement | HTMLTextAreaElement;
		const name = el?.name;
		if (!name || !(name in REQUIRED_MESSAGES || name in NUMBER_FIELDS)) return;
		errors[name] = validityMessage(name, el.validity);
	}

	function validityMessage(name: string, v: ValidityState): string {
		if (v.valid) return '';
		if (v.valueMissing) return REQUIRED_MESSAGES[name as keyof typeof REQUIRED_MESSAGES];
		// Not whole before below the floor, in the server's order, so -1.5 says the same in both.
		const messages = numberMessages(name as NumberField);
		return v.rangeUnderflow && !v.stepMismatch ? messages.belowMin : messages.whole;
	}

	// Fields are disabled while saving, so nothing typed mid-request is lost by
	// the redirect. FormData is built before this runs, so the submission is whole.
	// An unreachable server leaves the draft in place rather than an error page.
	const save = pendingEnhance({ reset: false, keepOnError: true });

	// A server message that names a field is shown there and focuses it.
	// Anything else (a conflict, an upload or database failure) stays global.
	// Focus waits for the fieldset to be enabled again: the failed action's
	// result lands while the form is still marked submitting.
	$effect(() => {
		if (!form || save.pending) return;
		const name = fieldOfMessage(form.error);
		if (!name) return;
		errors[name] = form.error;
		document.getElementById(name)?.focus();
	});

	const globalError = $derived(
		save.error ?? (form && !fieldOfMessage(form.error) ? form.error : null)
	);

	// The alert is announced, but the fieldset was disabled while saving, so
	// focus fell to the page; Save sits beside the alert and is what retries.
	let submitButton: HTMLButtonElement | undefined = $state();
	$effect(() => {
		if (globalError && !save.pending) submitButton?.focus();
	});

	// A blocked submit fires invalid on each bad field in order. The inline
	// message says it, so the browser's bubble, which would say it again, is
	// cancelled; cancelling also stops the browser focusing the field, so the
	// first invalid one is focused here.
	function onInvalid(event: Event & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		blocked = true;
		validate(event.target);
		event.currentTarget.querySelector<HTMLElement>(':is(input, textarea):invalid')?.focus();
	}

	const aria = (name: string) =>
		errors[name] ? { 'aria-invalid': 'true' as const, 'aria-describedby': `${name}-error` } : {};

	// On a phone the bar covers the screen's bottom edge. A tall box tabbed into
	// with only its top showing counts as in view, so the browser neither
	// scrolls nor applies scroll-padding-bottom; this brings the whole field,
	// its error and hint lines too, above the bar. Elsewhere the bar sits below
	// every field and this never fires.
	let actions: HTMLDivElement | undefined = $state();

	function clearBar(e: FocusEvent) {
		const target = e.target as HTMLElement;
		if (!actions || actions.contains(target)) return;
		const el = target.closest('.field') ?? target;
		if (el.getBoundingClientRect().bottom <= actions.getBoundingClientRect().top) return;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'instant' : 'smooth' });
	}

	// Leaving a dirty form asks first. A tab close or hard reload cannot show
	// our wording, so cancelling there hands the question to the browser. The
	// save's own redirect happens while submitting, which never asks.
	beforeNavigate((navigation) => {
		if (!dirty || save.pending || leaving) return;
		if (
			navigation.type === 'leave' ||
			!confirm('Leave without saving? Your changes will be lost.')
		) {
			navigation.cancel();
		}
	});
</script>

{@render header?.(outcome, errorCount > 0)}

{#snippet fieldError(name: string)}
	{#if errors[name]}
		<p class="field-error" id="{name}-error" role="alert">{errors[name]}</p>
	{/if}
{/snippet}

<form
	method="POST"
	{action}
	enctype="multipart/form-data"
	use:enhance={save.submit}
	class="form"
	onfocusout={(e) => {
		if (edited[(e.target as HTMLInputElement).name]) validate(e.target);
	}}
	oninvalidcapture={onInvalid}
	onfocusin={clearBar}
	oninput={(e) => {
		const name = (e.target as HTMLInputElement).name;
		edited[name] = true;
		if (errors[name]) validate(e.target);
	}}>
	<fieldset disabled={save.pending} class="contents">
		{#if draft.editRevision}
			<input type="hidden" name="editRevision" value={draft.editRevision} />
		{/if}

		<div class="form-grid">
			<div class="form-col">
				<div class="field">
					<label for="title">
						Title <span class="required" aria-hidden="true">*</span>
					</label>
					<!-- A textarea so a long title wraps on a phone; still one line of text:
					     Enter types nothing and a pasted newline becomes a space. -->
					<textarea
						id="title"
						name="title"
						rows="1"
						required
						bind:value={() => draft.title, (v) => (draft.title = v.replace(/[\r\n]+/g, ' '))}
						onkeydown={(e) => {
							if (e.key === 'Enter') e.preventDefault();
						}}
						{...aria('title')}>
					</textarea>
					{@render fieldError('title')}
				</div>

				<div class="field">
					<label for="description">Description</label>
					<textarea id="description" name="description" rows="3" bind:value={draft.description}>
					</textarea>
				</div>

				<PhotoField
					{imageUrl}
					bind:removeImage={draft.removeImage}
					bind:chosen
					hadPhoto={form?.draft?.hadPhoto === true} />

				<!-- Number fields stay strings so the dirty check compares like with like;
				     bind:value on a number input would hand back numbers and null. -->
				<div class="field-row">
					{#each numberFields as name (name)}
						<div class="field">
							<label for={name}>{NUMBER_FIELDS[name].formLabel}</label>
							<input
								id={name}
								{name}
								type="number"
								min={NUMBER_FIELDS[name].min}
								value={draft[name]}
								oninput={(e) => (draft[name] = e.currentTarget.value)}
								{...aria(name)} />
						</div>
					{/each}
					<!-- Under the whole row, in field order: a 150px column would wrap them. -->
					{#each numberFields as name (name)}
						{@render fieldError(name)}
					{/each}
				</div>

				<!-- Yield, beside the portions rather than in place of them: it never sets
				     servings, and scaling stays by servings. -->
				<div class="field">
					<label for="makes">
						Makes <span class="optional">optional</span>
					</label>
					<input
						id="makes"
						name="makes"
						type="text"
						maxlength={MAX_MAKES}
						placeholder="12 buns, 1 L stock"
						bind:value={draft.makes}
						aria-invalid={errors.makes ? 'true' : undefined}
						aria-describedby={errors.makes ? 'makes-error makes-hint' : 'makes-hint'} />
					{@render fieldError('makes')}
					<p class="form-hint" id="makes-hint">
						What one batch produces, when that isn't portions.
					</p>
				</div>

				<fieldset class="field field-tags">
					<legend class="field-legend">Tags</legend>
					<TagInput {allTags} bind:selected={draft.tags} />
				</fieldset>

				<label class="inline-checkbox">
					<input type="checkbox" name="isPublic" bind:checked={draft.isPublic} />
					Make this recipe public
					<!-- The dot is for the eye; the name reads "…public applies to every version". -->
					<span class="inline-checkbox__note">
						<span aria-hidden="true">·</span>
						applies to every version
					</span>
				</label>
			</div>

			<div class="form-col">
				<IngredientEditor bind:value={draft.ingredients} error={errors.ingredients} />
				<StepEditor bind:value={draft.steps} error={errors.steps} />
			</div>
		</div>

		{#if nextVersion}
			<div class="field field-message">
				<label for="commitMessage">
					What changed? <span class="optional">optional</span>
				</label>
				<input
					id="commitMessage"
					name="commitMessage"
					type="text"
					{placeholder}
					aria-describedby={savesGenerated ? 'commitMessage-hint' : undefined}
					bind:value={draft.commitMessage} />
				{#if savesGenerated}
					<p class="form-hint" id="commitMessage-hint">Left blank, saves as: {generated}</p>
				{/if}
			</div>
		{/if}

		{#if globalError}
			<p class="form-error" role="alert">{globalError}</p>
		{/if}

		<div class="form-actions" bind:this={actions}>
			<button type="submit" class="btn-primary" disabled={save.pending} bind:this={submitButton}>
				{save.pending ? 'Saving…' : submitLabel}
			</button>
			<a href={cancelHref} class="btn-ghost">Cancel</a>
		</div>
	</fieldset>
</form>

<style>
	/* The row's errors run its full width, a field's 8px under the boxes. */
	.field-row {
		row-gap: var(--space-2);
	}

	.field-row > .field-error {
		grid-column: 1 / -1;
	}

	/* field-sizing: content ignores rows; this keeps an empty box typeable. */
	textarea[name='description'] {
		min-height: calc(3lh + 18px);
	}

	/* One line tall where field-sizing is unsupported, as the input it replaced
	   was; it grows only by wrapping, never by dragging. */
	textarea[name='title'] {
		min-height: calc(1lh + 20px);
		resize: none;
	}

	/* A mark, not an alarm: Ink 3 at rest. The input's required attribute is
	   what a screen reader hears. Global within the form, so the ingredient and
	   step editors' marks match the title's. */
	.form :global(.required) {
		color: var(--color-text-3);
	}

	/* A 24px target from a 23px line of text. */
	.inline-checkbox {
		min-height: 24px;
	}

	/* Clay, as the strike rows' ticked squares are, not the browser's blue. */
	.inline-checkbox input {
		accent-color: var(--color-accent);
	}

	/* A plain 1px Rule, like every other rule in the editor. */
	.field-message {
		border-top: 1px solid var(--color-border);
	}

	@media (max-width: 699px) {
		/* Save and Cancel ride the screen's bottom edge, so a long form saves
		   without a scroll to its end. Edge to edge across the 18px gutters,
		   and above the home indicator. */
		.form-actions {
			position: sticky;
			bottom: 0;
			z-index: 1;
			margin-inline: -18px;
			padding: 8px 18px calc(8px + env(safe-area-inset-bottom));
			background: var(--color-surface);
			border-top: 1px solid var(--color-border);
		}

		/* A field focused by Tab stops above the bar: its height, the 4px ring
		   and a pixel to spare. On html, which scrolls; keyed to the bar so the
		   rule leaves with the editor. */
		:global(html:has(.form-actions)) {
			scroll-padding-bottom: calc(70px + env(safe-area-inset-bottom));
		}
	}

	/* A thumb's 44px, on a phone or any touch screen. */
	@media (max-width: 699px), (pointer: coarse) {
		/* The 24px row grown to 44px outward, so the text stays put. */
		.inline-checkbox {
			min-height: 44px;
			margin-block: -10px;
		}
	}
</style>
