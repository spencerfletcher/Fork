<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { clearDraft, draftAge, loadDraft, saveDraft, type DraftRecipe } from '#lib/drafts.js';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { beforeNavigate } from '$app/navigation';
	import {
		parseDraftContent,
		fieldOfMessage,
		NUMBER_FIELDS,
		TIME_FIELDS,
		VISIBILITIES,
		type RecipeDraft,
		type TimeField
	} from '#lib/recipes/validation.js';
	import { formatDuration, OVERNIGHT_MINUTES } from '#lib/recipes/times.js';
	import { fieldErrors, typedMessage } from '#lib/recipes/fieldErrors.svelte.js';
	import { normaliseTagNames, tagKey } from '#lib/recipes/tags.js';
	import type { TagChip } from '#lib/recipes/types.js';
	import { generatedCommitMessage } from '#lib/recipes/content.js';
	import { MAX_MAKES, MAX_SOURCE_URL, TEXT_LIMITS } from '#lib/recipes/limits.js';
	import { draftChangedGroups } from '#lib/recipes/draftChanges.js';
	import TagInput from '#lib/components/ui/TagInput.svelte';
	import IngredientEditor from './IngredientEditor.svelte';
	import StepEditor from './StepEditor.svelte';
	import PhotoField from './PhotoField.svelte';
	import FieldError from './FieldError.svelte';
	import FormActions from '#lib/components/ui/FormActions.svelte';
	import ChoiceGroup from '#lib/components/ui/ChoiceGroup.svelte';
	import { audienceIcon } from '#lib/components/Icons.svelte';
	import { AUDIENCE_LABEL, AUDIENCE_NOTE } from '#lib/audience.js';

	// The radio trio's sentences, offered in VISIBILITIES order (Only me first).

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
		/** The edit page's Delete recipe, its own form, pinned right on the actions row. */
		danger?: Snippet;
		/** Where this editor's draft lives on the device (`draftKey` in
		 *  #lib/drafts); omitted, nothing is stored. */
		draftKey?: string;
		/** The recipe an edit changes, stored with its draft so the Cookbook can list it. */
		draftRecipe?: DraftRecipe;
	} = $props();

	// The actions row sits outside the form, Save joined to it by form=, so
	// Delete recipe's own form shares the row without nesting.
	const formId = $props.id();

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
	const placeholder = $derived(generated ?? 'What changed in this version?');
	// A blank message saves the generated one, as the server trims; say so.
	const savesGenerated = $derived(generated !== null && !draft.commitMessage.trim());

	const timeFields = Object.keys(TIME_FIELDS) as TimeField[];
	const TIME_PLACEHOLDER: Record<TimeField, string> = {
		prepTimeMinutes: '15 min',
		cookTimeMinutes: '1 h',
		restTimeMinutes: 'Overnight'
	};

	// The labelled short notes in "More details", in the order the page shows them.
	const MORE_FIELDS = [
		{ name: 'makeAhead', placeholder: 'Dough keeps 3 days chilled' },
		{ name: 'equipment', placeholder: 'A 23 cm springform tin' },
		{ name: 'storage', placeholder: 'Airtight, up to 5 days' },
		{ name: 'reheating', placeholder: 'Covered, 15 min at 160°C' }
	] as const;

	// Inline errors in the server's own wording (#lib/recipes/fieldErrors).
	// svelte-ignore state_referenced_locally
	const fields = fieldErrors(form);
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
	id={formId}
	method="POST"
	{action}
	enctype="multipart/form-data"
	use:enhance={submit}
	class="form"
	onfocusout={fields.onfocusout}
	oninvalidcapture={fields.onInvalid}
	onfocusin={clearBar}
	oninput={fields.oninput}>
	<fieldset disabled={save.pending} class="contents">
		{#if draft.editRevision}
			<input type="hidden" name="editRevision" value={draft.editRevision} />
		{/if}

		<div class="form-grid">
			<div class="form-col">
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

				<!-- Serves stays a string so the dirty check compares like with like;
				     bind:value on a number input would hand back numbers and null. The
				     yield sits beside the portions rather than in place of them: it never
				     sets servings, and scaling stays by servings. -->
				<div class="field-row serves-row">
					<div class="field">
						<label for="servings">{NUMBER_FIELDS.servings.formLabel}</label>
						<input
							id="servings"
							name="servings"
							type="number"
							min={NUMBER_FIELDS.servings.min}
							value={draft.servings}
							oninput={(e) => (draft.servings = e.currentTarget.value)}
							{...aria('servings')} />
					</div>
					<div class="field">
						<label for="makes">Makes</label>
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
					{@render fieldError('servings')}
				</div>

				<!-- Times are typed as words and stored as minutes; each is its own
				     span on the page, never added up. No picker: a hint and the same
				     message the server gives are enough. -->
				<div class="field-row">
					{#each timeFields as name (name)}
						<div class="field">
							<label for={name}>{TIME_FIELDS[name].formLabel}</label>
							<input
								id={name}
								{name}
								type="text"
								autocomplete="off"
								placeholder={TIME_PLACEHOLDER[name]}
								bind:value={draft[name]}
								{@attach (el) => el.setCustomValidity(typedMessage(name, draft[name]))}
								aria-invalid={errors[name] ? 'true' : undefined}
								aria-describedby={errors[name] ? `${name}-error times-hint` : 'times-hint'} />
						</div>
					{/each}
					<!-- Under the whole row, in field order: a narrow column would wrap them. -->
					{#each timeFields as name (name)}
						{@render fieldError(name)}
					{/each}
					<p class="form-hint" id="times-hint">
						Like 45 min, 1 h 30 or 2 days; overnight is {formatDuration(OVERNIGHT_MINUTES)}. Rest is
						rising, chilling or marinating.
					</p>
				</div>

				<!-- Where it came from outside Fork, apart from who wrote it here. -->
				<div class="field">
					<label for="sourceName">Source</label>
					<input
						id="sourceName"
						name="sourceName"
						type="text"
						maxlength={TEXT_LIMITS.sourceName.max}
						placeholder="A cookbook, a person, a website"
						bind:value={draft.sourceName}
						aria-invalid={errors.sourceName ? 'true' : undefined}
						aria-describedby={errors.sourceName ? 'sourceName-error' : undefined} />
					{@render fieldError('sourceName')}
				</div>
				<div class="field">
					<label for="sourceUrl">Source link</label>
					<input
						id="sourceUrl"
						name="sourceUrl"
						type="text"
						inputmode="url"
						autocomplete="off"
						maxlength={MAX_SOURCE_URL}
						placeholder="https://"
						bind:value={draft.sourceUrl}
						{@attach (el) => el.setCustomValidity(typedMessage('sourceUrl', draft.sourceUrl))}
						{...aria('sourceUrl')} />
					{@render fieldError('sourceUrl')}
				</div>

				<fieldset class="field field-tags">
					<legend class="field-legend">Tags</legend>
					<TagInput {allTags} bind:selected={draft.tags} />
				</fieldset>

				<ChoiceGroup
					name="visibility"
					legend="Who can see this recipe"
					options={VISIBILITIES.map((value) => ({
						value,
						label: AUDIENCE_LABEL[value],
						note: AUDIENCE_NOTE[value]
					}))}
					bind:value={draft.visibility}
					icon={audienceIcon}
					hint={hasForks ? "Making this more private doesn't hide existing forks." : null} />
			</div>

			<div class="form-col">
				<IngredientEditor
					bind:value={draft.ingredients}
					error={errors.ingredients}
					disabled={save.pending} />
				<StepEditor bind:value={draft.steps} error={errors.steps} disabled={save.pending} />

				<div class="field">
					<label for="notes">Notes</label>
					<textarea
						id="notes"
						name="notes"
						rows="4"
						maxlength={TEXT_LIMITS.notes.max}
						bind:value={draft.notes}
						aria-invalid={errors.notes ? 'true' : undefined}
						aria-describedby={errors.notes ? 'notes-error notes-hint' : 'notes-hint'}>
					</textarea>
					{@render fieldError('notes')}
					<p class="form-hint" id="notes-hint">
						For the whole recipe: what to watch for, swaps, serving ideas.
					</p>
				</div>

				<!-- Optional short notes, out of the way until one is wanted: open
				     whenever one is filled or refused, so nothing typed is hidden. -->
				<details
					class="more-details"
					open={MORE_FIELDS.some(({ name }) => draft[name].trim() || errors[name])}>
					<summary>More details</summary>
					<div class="more-fields">
						{#each MORE_FIELDS as { name, placeholder } (name)}
							<div class="field">
								<label for={name}>{TEXT_LIMITS[name].label}</label>
								<input
									id={name}
									{name}
									type="text"
									maxlength={TEXT_LIMITS[name].max}
									{placeholder}
									bind:value={draft[name]}
									aria-invalid={errors[name] ? 'true' : undefined}
									aria-describedby={errors[name] ? `${name}-error` : undefined} />
								{@render fieldError(name)}
							</div>
						{/each}
					</div>
				</details>
			</div>
		</div>

		{#if nextVersion}
			<div class="field field-message">
				<label for="commitMessage">What changed?</label>
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
	</fieldset>
</form>

<div class="actions-bar" bind:this={actions}>
	<FormActions
		{submitLabel}
		pending={save.pending}
		{cancelHref}
		form={formId}
		bind:submitButton
		{danger} />
</div>

<style>
	/* Serves is a number of a few digits; the yield is a phrase. */
	.serves-row {
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
	}

	/* A label's voice, with a 44px row to press. */
	.more-details summary {
		display: list-item;
		padding-block: 11px;
		cursor: pointer;
		font-size: 0.9375rem;
		font-weight: 600;
		line-height: 22px;
	}

	.more-fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding-top: var(--space-2);
	}

	textarea[name='notes'] {
		min-height: calc(4lh + 18px);
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

	/* Outside the form, so the form's 16px gap is its own margin. */
	.actions-bar {
		margin-top: var(--space-4);
	}

	/* A plain 1px Rule, like every other rule in the editor. */
	.field-message {
		border-top: 1px solid var(--color-border);
	}

	@media (max-width: 699px) {
		/* Save and Cancel ride the screen's bottom edge, so a long form saves
		   without a scroll to its end. Edge to edge across the 18px gutters,
		   and above the home indicator. */
		.actions-bar {
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
		:global(html:has(.actions-bar)) {
			scroll-padding-bottom: calc(70px + env(safe-area-inset-bottom));
		}

		/* Delete recipe's own line makes the bar two rows tall. */
		:global(html:has(.actions-bar .danger)) {
			scroll-padding-bottom: calc(126px + env(safe-area-inset-bottom));
		}
	}
</style>
