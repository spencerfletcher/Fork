<script lang="ts">
	import { onMount, tick, type Snippet } from 'svelte';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { clearDraft, draftAge, loadDraft, saveDraft, type DraftRecipe } from '#lib/drafts.js';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { beforeNavigate } from '$app/navigation';
	import {
		parseDraftContent,
		fieldOfMessage,
		VISIBILITIES,
		type RecipeDraft
	} from '#lib/recipes/validation.js';
	import { fieldErrors, focusField, typedMessage } from '#lib/recipes/fieldErrors.svelte.js';
	import { factsSummary } from '#lib/recipes/factsSummary.js';
	import { normaliseTagNames, tagKey } from '#lib/recipes/tags.js';
	import type { TagChip } from '#lib/recipes/types.js';
	import { generatedCommitMessage } from '#lib/recipes/content.js';
	import { draftChangedGroups } from '#lib/recipes/draftChanges.js';
	import TagInput from '#lib/components/ui/TagInput.svelte';
	import IngredientEditor from './IngredientEditor.svelte';
	import StepEditor from './StepEditor.svelte';
	import PhotoField from './PhotoField.svelte';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import MoreDetails from './MoreDetails.svelte';
	import ServesRow from './ServesRow.svelte';
	import TimesRow from './TimesRow.svelte';
	import SourceFields from './SourceFields.svelte';
	import SaveBar from './SaveBar.svelte';
	import ChoiceSelect from '#lib/components/ui/ChoiceSelect.svelte';
	import { audienceIcon, chevronIcon } from '#lib/components/Icons.svelte';
	import { AUDIENCE_LABEL, AUDIENCE_NOTE } from '#lib/audience.js';

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
		leaving = false,
		hasForks = false,
		danger,
		draftKey,
		draftRecipe
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
		 *  while a restored draft is showing its words and Discard draft for
		 *  the same line, and whether any field is showing an error. */
		header?: Snippet<[outcome: string, draftNote: Snippet | undefined, invalid: boolean]>;
		/** Another form on the page is leaving on purpose (a delete), so the guard stays quiet. */
		leaving?: boolean;
		/** The recipe has forks, which a narrower audience leaves where they are. */
		hasForks?: boolean;
		/** The edit page's Delete recipe, its own form, at the form's end. */
		danger?: Snippet;
		/** Where this editor's draft lives on the device (`draftKey` in
		 *  #lib/drafts); omitted, nothing is stored. */
		draftKey?: string;
		/** The recipe an edit changes, stored with its draft so the Cookbook can list it. */
		draftRecipe?: DraftRecipe;
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
	const settings = (d: RecipeDraft) => JSON.stringify([d.visibility, tagKeys(d.tags)]);
	const settingsChanged = $derived(settings(draft) !== settings(baseline));

	const outcome = $derived.by(() => {
		if (fields.blocked && fields.count > 0) {
			return fields.count === 1
				? '1 field needs attention'
				: `${fields.count} fields need attention`;
		}
		if (!dirty || save.pending || !nextVersion || groups === null) return '';
		// A typed message is never dropped: the save writes a version carrying it.
		if (groups.length > 0 || draft.commitMessage.trim()) return `saves as v${nextVersion}`;
		if (settingsChanged) return 'saves settings only';
		return '';
	});

	const generated = $derived(groups && groups.length > 0 ? generatedCommitMessage(groups) : null);

	// Inline errors in the server's own wording (#lib/recipes/fieldErrors).
	// svelte-ignore state_referenced_locally
	const fields = fieldErrors(form, baseline);
	const errors = fields.errors;
	const aria = fields.aria;

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
		// After the render a refusal causes: an Add field it names opens first.
		// The tags' box is their search.
		tick().then(() => focusField(document.getElementById(name === 'tags' ? 'tag-combobox' : name)));
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

	// Keeps a focused field clear of the pinned bar (SaveBar).
	let bar: SaveBar | undefined = $state();

	// Cmd+Enter (Ctrl+Enter off a Mac) saves from any field, through the same
	// path as pressing Save: the browser's checks, then the blocked-save focus.
	// Caught before a text box sees it, so it types no newline; plain Enter does.
	function saveKey(e: KeyboardEvent) {
		if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return;
		e.preventDefault();
		e.stopPropagation();
		if (!save.pending) (e.currentTarget as HTMLFormElement).requestSubmit(submitButton);
	}

	// The facts fold on a phone into a summary (native details); from 700 they
	// are always shown, so the fold is opened for good there.
	let foldOpen = $state(false);
	onMount(() => {
		const wide = window.matchMedia?.('(min-width: 700px)');
		if (!wide) return;
		const widen = () => {
			if (wide.matches) foldOpen = true;
		};
		widen();
		wide.addEventListener?.('change', widen);
		return () => wide.removeEventListener?.('change', widen);
	});
	const summary = $derived(factsSummary(draft, chosen || (!!imageUrl && !draft.removeImage)));

	// Leaving a dirty form keeps the work as a draft, so it asks nothing: the
	// draft is written first, so the last keystrokes are in it. It asks only
	// when something would really go: the draft could not be written, or a
	// chosen photo, which no draft holds. A tab close or hard reload cannot
	// show our wording, so cancelling there hands the question to the browser.
	// The save's own redirect happens while submitting, which never asks.
	beforeNavigate((navigation) => {
		if (!dirty || save.pending || leaving) return;
		const onDevice = persist();
		if (onDevice && !chosen) return;
		const question = onDevice
			? "Leave without saving? The photo you chose won't be kept; the rest is saved as a draft on this device."
			: 'Leave without saving? Your changes will be lost.';
		if (navigation.type === 'leave' || !confirm(question)) navigation.cancel();
	});

	// The draft is kept on this device as it is typed (#lib/drafts), so a
	// reload, a closed tab or a crash loses nothing. It never reaches the
	// server: only Save writes a version.
	let restored = $state<{ age: string; stale: boolean; photoLost: boolean } | null>(null);
	// Content and settings only: a draft from an older revision whose fields
	// match the server's has nothing left to offer.
	const sameAsServer = (d: RecipeDraft) =>
		serialise({ ...d, editRevision: baseline.editRevision }) === serialise(baseline);
	// What was last written or read, so a quiet page writes nothing.
	let written = '';
	let timer: ReturnType<typeof setTimeout> | undefined;
	// A successful save has redirected; nothing may store the draft again.
	let saved = false;
	// Whether the device holds what was last written: false until a write
	// lands, and after one the storage refused.
	let kept = false;

	/** Stores the draft now; true when the device holds the form's words. */
	function persist(): boolean {
		clearTimeout(timer);
		if (!draftKey || saved) return false;
		const now = JSON.stringify([serialise(draft), draft.editRevision, chosen]);
		if (now === written) return kept;
		written = now;
		if (sameAsServer(draft)) {
			clearDraft(draftKey);
			// Nothing differs from the server, so its revision is safe to save on.
			draft.editRevision = baseline.editRevision;
			restored = null;
			kept = true;
		} else {
			kept = saveDraft(draftKey, {
				draft: $state.snapshot(draft),
				savedAt: Date.now(),
				photoLost: chosen,
				recipe: draftRecipe
			});
		}
		return kept;
	}

	// A failed save's reply is newer than anything stored, so it wins.
	onMount(() => {
		const stored = draftKey && !form ? loadDraft(draftKey) : null;
		if (draftKey && stored) {
			const next: RecipeDraft = { ...baseline, ...stored.draft, hadPhoto: false };
			if (sameAsServer(next)) clearDraft(draftKey);
			else {
				draft = next;
				restored = {
					age: draftAge(stored.savedAt),
					// The stale check compares the draft's revision, kept as stored, so
					// saving over a newer version is still refused.
					stale: Number(baseline.editRevision) > Number(next.editRevision),
					photoLost: stored.photoLost
				};
				written = JSON.stringify([serialise(draft), draft.editRevision, false]);
				kept = true;
			}
		}
		return persist;
	});

	// Debounced: stored half a second after typing stops, or as the page hides.
	$effect(() => {
		void [serialise(draft), chosen];
		clearTimeout(timer);
		timer = setTimeout(persist, 500);
	});

	const draftWords = $derived(
		restored
			? [
					`Draft from ${restored.age} restored.`,
					restored.stale && 'The recipe has changed since, so saving this draft will be refused.',
					restored.photoLost && "The photo you chose wasn't kept."
				]
					.filter(Boolean)
					.join(' ')
			: ''
	);

	function discard() {
		if (draftKey) clearDraft(draftKey);
		draft = { ...baseline };
		restored = null;
	}

	const submit: SubmitFunction = async (input) => {
		const finish = await save.submit(input);
		return async (opts) => {
			if (opts.result.type === 'redirect' && draftKey) {
				saved = true;
				clearTimeout(timer);
				clearDraft(draftKey);
			}
			if (finish) await finish(opts);
		};
	};
</script>

<svelte:window onpagehide={persist} />
<svelte:document
	onvisibilitychange={() => {
		if (document.visibilityState === 'hidden') persist();
	}} />

{#snippet draftNote()}
	{#if restored}
		{draftWords}
		<button type="button" class="text-btn" disabled={save.pending} onclick={discard}>
			Discard draft
		</button>
	{/if}
{/snippet}

{@render header?.(outcome, restored ? draftNote : undefined, fields.count > 0)}

{#snippet fieldError(name: string)}
	<FieldError {name} error={errors[name]} />
{/snippet}

<form
	method="POST"
	{action}
	enctype="multipart/form-data"
	use:enhance={submit}
	class="form"
	onfocusout={fields.onfocusout}
	oninvalidcapture={fields.onInvalid}
	onfocusin={(e) => bar?.clearBar(e.target)}
	onkeydowncapture={saveKey}
	oninput={fields.oninput}>
	<fieldset disabled={save.pending} class="contents">
		{#if draft.editRevision}
			<input type="hidden" name="editRevision" value={draft.editRevision} />
		{/if}

		<!-- The facts on the left in label-left rows, the photo and audience on
		     the right; one column below 900. On a phone the facts fold into a
		     summary between the description and Ingredients. -->
		<div class="editor-top">
			<div class="facts">
				<div class="field">
					<label for="title">
						Title <span class="field-required" aria-hidden="true">Required</span>
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
						{@attach (el) =>
							el.setCustomValidity(typedMessage('title', draft.title, baseline.title))}
						{...aria('title')}>
					</textarea>
					{@render fieldError('title')}
				</div>

				<div class="field">
					<label for="description">Description</label>
					<textarea
						id="description"
						name="description"
						rows="3"
						bind:value={draft.description}
						{@attach (el) =>
							el.setCustomValidity(
								typedMessage('description', draft.description, baseline.description)
							)}
						{...aria('description')}>
					</textarea>
					{@render fieldError('description')}
				</div>

				<details class="fold" bind:open={foldOpen}>
					<summary class="fold-summary">
						<span class="fold-facts dot-list dot-clip">
							{#each summary.facts as fact, i (i)}<span>{fact}</span>{/each}
						</span>
						<span class="text-btn">{summary.action}{@render chevronIcon(foldOpen)}</span>
					</summary>
					<div class="fold-rows">
						<ServesRow bind:draft {errors} />
						<TimesRow bind:draft {errors} />
						<SourceFields bind:draft {errors} />
						<fieldset class="field field-tags">
							<legend class="field-legend">Tags</legend>
							<TagInput
								{allTags}
								bind:selected={draft.tags}
								before={baseline.tags}
								bind:error={errors.tags} />
						</fieldset>
					</div>
				</details>
			</div>

			<div class="side">
				<PhotoField
					{imageUrl}
					bind:removeImage={draft.removeImage}
					bind:chosen
					hadPhoto={form?.draft?.hadPhoto === true} />
				<ChoiceSelect
					name="visibility"
					label="Who can see this recipe"
					disabled={save.pending}
					error={errors.visibility}
					options={VISIBILITIES.map((value) => ({
						value,
						label: AUDIENCE_LABEL[value],
						note: AUDIENCE_NOTE[value]
					}))}
					bind:value={draft.visibility}
					icon={audienceIcon}
					hint={hasForks ? "Making this more private doesn't hide existing forks." : null} />
			</div>
		</div>

		<!-- Method takes the wider column: a step is sentences, an ingredient a
		     quantity and a name. -->
		<div class="form-grid">
			<div class="form-col">
				<IngredientEditor
					bind:value={draft.ingredients}
					error={errors.ingredients}
					disabled={save.pending} />
			</div>
			<div class="form-col">
				<StepEditor bind:value={draft.steps} error={errors.steps} disabled={save.pending} />
				<MoreDetails bind:draft {errors} />
			</div>
		</div>

		{#if globalError}
			<p class="form-error" role="alert">{globalError}</p>
		{/if}

		<SaveBar
			bind:this={bar}
			message={!!nextVersion}
			bind:commitMessage={draft.commitMessage}
			error={errors.commitMessage}
			{generated}
			{submitLabel}
			pending={save.pending}
			{cancelHref}
			bind:submitButton />
	</fieldset>
</form>

{#if danger}
	<div class="form-end">{@render danger()}</div>
{/if}

<style>
	/* One line tall where field-sizing is unsupported, as the input it replaced
	   was; it grows only by wrapping, never by dragging. */
	textarea[name='title'] {
		min-height: calc(1lh + 20px);
		resize: none;
	}

	/* field-sizing: content ignores rows; this keeps an empty box typeable. */
	textarea[name='description'] {
		min-height: calc(3lh + 18px);
	}

	.facts,
	.side,
	.fold-rows {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.fold-summary {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-block: 8px;
		border-block: 1px solid var(--color-border);
		cursor: pointer;
		list-style: none;
	}

	.fold-summary::-webkit-details-marker {
		display: none;
	}

	/* At most two lines: a fact that does not fit moves whole to the next
	   line, and a third line is cut off whole, so no word is ever halved. The
	   yield and the audience lead, so they are always on show. */
	.fold-facts {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-wrap: wrap;
		--dot-gap: 14px;
		max-height: 3em;
		overflow: hidden;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--color-text-2);
	}

	.fold-summary .text-btn {
		flex-shrink: 0;
	}

	.fold-summary :global(.chevron) {
		width: 12px;
		height: 12px;
	}

	.fold-summary :global(.chevron.up) {
		transform: rotate(180deg);
	}

	.fold[open] .fold-rows {
		padding-top: var(--space-4);
	}

	/* Delete recipe, its own form, at the end, right; an open step widens
	   leftwards from it, as in FormActions' danger slot. */
	.form-end {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		margin-top: var(--space-5);
	}

	.form-end :global(.step) {
		justify-content: flex-end;
	}

	@media (min-width: 700px) {
		/* The fold is a phone's. Where ::details-content exists, the facts show
		   before the page's script opens the fold for good. */
		@supports selector(::details-content) {
			.fold-summary {
				display: none;
			}

			.fold::details-content {
				content-visibility: visible;
			}
		}
	}

	.editor-top {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-bottom: var(--space-5);
	}

	@media (min-width: 900px) {
		.editor-top {
			display: grid;
			grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
			gap: 40px;
			align-items: start;
		}

		/* The rows' rules space them (app.css, the editor's facts). */
		.facts,
		.fold-rows,
		.fold[open] .fold-rows {
			gap: 0;
			padding-top: 0;
		}
	}

	@media (max-width: 699px) {
		/* The photo and audience are in the fold too: hidden while it is closed. */
		.editor-top:has(.fold:not([open])) .side {
			display: none;
		}

		/* The form's own gap is the one between sections; this margin on top of
		   it left 48px under the folded summary. */
		.editor-top {
			margin-bottom: 0;
		}
	}
</style>
