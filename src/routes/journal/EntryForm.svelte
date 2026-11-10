<script lang="ts">
	import { enhance } from '$app/forms';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { onMount, type Snippet } from 'svelte';
	import PhotoField from '#lib/components/recipes/PhotoField.svelte';
	import FormActions from '#lib/components/ui/FormActions.svelte';
	import ChoiceGroup from '#lib/components/ui/ChoiceGroup.svelte';
	import { audienceIcon, lockIcon } from '#lib/components/Icons.svelte';
	import { AUDIENCE_LABEL } from '#lib/audience.js';
	import {
		AUDIENCE_SENTENCE,
		KEEP_SOURCE,
		MAX_LINK,
		PRIVATE_RECIPE_HINT,
		localToday
	} from '#lib/journal.js';
	import type { LogAudience } from '#lib/server/db/schema.js';
	import type { EntryValues, RecipeChoice } from './entryForm';

	let {
		values,
		choices,
		keepLabel = null,
		photoUrl = null,
		error = null,
		action,
		submitLabel,
		useLocalToday = false,
		actions
	}: {
		values: EntryValues;
		choices: RecipeChoice[];
		/** An edited entry's deleted or withheld recipe, kept as stored unless changed. */
		keepLabel?: string | null;
		photoUrl?: string | null;
		error?: string | null;
		/** The form's action, `?/save` on the edit page; the default action when absent. */
		action?: string;
		submitLabel: string;
		/** A new entry: the date defaults to the reader's own today, not the server's. */
		useLocalToday?: boolean;
		/** The edit page's Delete entry, its own form, pinned right on the actions row. */
		actions?: Snippet;
	} = $props();

	const FORM_ID = 'entry-form';

	const AUDIENCES: LogAudience[] = ['private', 'friends'];

	// Seeded once from the load (or the refused save's echo); the reader owns them after.
	// svelte-ignore state_referenced_locally
	let cookedOn = $state(values.cookedOn);
	// svelte-ignore state_referenced_locally
	let recipe = $state(values.recipe);
	// svelte-ignore state_referenced_locally
	let version = $state(values.version);
	// svelte-ignore state_referenced_locally
	let audience = $state(values.audience);
	let removeImage = $state(false);
	let chosen = $state(false);
	const saving = pendingEnhance({ reset: false });

	onMount(() => {
		if (useLocalToday) cookedOn = localToday();
	});

	const selected = $derived(choices.find((c) => c.slug === recipe));

	// "From a recipe" is a combobox, as the editor's tag box is: type to
	// filter, arrows move, Enter or a click takes one, Escape closes and puts
	// the chosen title back. The hidden input carries the slug the server reads.
	type Option = { value: string; label: string; version?: number | null };
	const options: Option[] = $derived([
		{ value: '', label: 'Improvised (no recipe)' },
		...(keepLabel ? [{ value: KEEP_SOURCE, label: keepLabel }] : []),
		...choices.map((c) => ({ value: c.slug, label: c.title, version: c.latestVersion }))
	]);
	const labelOf = (value: string) => options.find((o) => o.value === value)?.label ?? '';
	// svelte-ignore state_referenced_locally
	let query = $state(labelOf(values.recipe));
	let typed = $state(false);
	let open = $state(false);
	let active = $state(-1);
	const shown = $derived(
		typed && query.trim()
			? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
			: options
	);
	const expanded = $derived(open && shown.length > 0);

	function closeRecipes() {
		open = false;
		typed = false;
		active = -1;
		query = labelOf(recipe);
	}

	function pickRecipe(value: string) {
		// Changing the recipe drops the version, so the latest is linked.
		if (value !== recipe) version = '';
		recipe = value;
		closeRecipes();
	}

	function recipeKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			open = true;
			if (shown.length === 0) return;
			if (e.key === 'ArrowDown') active = (active + 1) % shown.length;
			else active = active <= 0 ? shown.length - 1 : active - 1;
		} else if (e.key === 'Enter' && open) {
			e.preventDefault();
			const option = shown[active] ?? (typed ? shown[0] : undefined);
			if (option) pickRecipe(option.value);
		} else if (e.key === 'Escape' && open) {
			closeRecipes();
		}
	}
	const showPrivateHint = $derived(selected?.visibility === 'private' && audience === 'friends');
</script>

<!-- The actions row sits outside the form, Save joined to it by form=, so
     the edit page's Delete entry form shares the row without nesting. -->
<form
	id={FORM_ID}
	class="form entry-form"
	method="POST"
	{action}
	enctype="multipart/form-data"
	use:enhance={saving.submit}>
	{#if error}
		<p class="form-error" role="alert">{error}</p>
	{/if}

	<div class="field">
		<label for="dish">
			Dish <span class="field-required" aria-hidden="true">Required</span>
		</label>
		<input id="dish" name="dish" type="text" required maxlength="200" value={values.dish} />
	</div>

	<div class="two-up">
		<div class="field">
			<label for="cookedOn">
				Date <span class="field-required" aria-hidden="true">Required</span>
			</label>
			<input id="cookedOn" name="cookedOn" type="date" required bind:value={cookedOn} />
		</div>
		<div class="field">
			<label for="servings">Servings</label>
			<input
				id="servings"
				name="servings"
				type="text"
				inputmode="numeric"
				pattern="[0-9]*"
				value={values.servings} />
		</div>
	</div>

	<div class="field">
		<label for="recipe">From a recipe</label>
		<div class="recipe-combo">
			<input
				id="recipe"
				type="text"
				role="combobox"
				autocomplete="off"
				placeholder="Search your cookbook…"
				bind:value={query}
				onclick={() => (open = true)}
				oninput={() => {
					open = true;
					typed = true;
					active = -1;
				}}
				onblur={closeRecipes}
				onkeydown={recipeKeydown}
				aria-expanded={expanded}
				aria-haspopup="listbox"
				aria-autocomplete="list"
				aria-controls={expanded ? 'recipe-listbox' : undefined}
				aria-activedescendant={expanded && active >= 0 ? `recipe-option-${active}` : undefined} />
			<input type="hidden" name="recipe" value={recipe} />
			{#if expanded}
				<ul
					class="recipe-menu"
					id="recipe-listbox"
					role="listbox"
					tabindex="-1"
					aria-label="Recipes">
					{#each shown as option, i (option.value)}
						<!-- The keyboard stays on the input, as a combobox has it. -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<li
							id="recipe-option-{i}"
							role="option"
							class:active={active === i}
							aria-selected={option.value === recipe}
							onmousedown={(e) => e.preventDefault()}
							onclick={() => pickRecipe(option.value)}>
							{option.label}
							{#if option.version}<span class="mono-id">v{option.version}</span>{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		{#if version && selected}
			<p class="form-hint">
				Version <span class="mono-id">v{version}</span>
			</p>
		{/if}
		<input type="hidden" name="version" value={version} />
	</div>

	<!-- Only with no recipe: an attached recipe is the source, and the server drops a link. -->
	{#if !recipe}
		<div class="field">
			<label for="link">Link</label>
			<input
				id="link"
				name="link"
				type="url"
				inputmode="url"
				maxlength={MAX_LINK}
				placeholder="https://"
				aria-describedby="link-hint"
				value={values.link} />
			<p class="form-hint" id="link-hint">The page it came from, shown by its site's name.</p>
		</div>
	{/if}

	<PhotoField imageUrl={photoUrl} bind:removeImage bind:chosen hadPhoto={false} />

	<div class="field">
		<label for="caption">Caption</label>
		<textarea
			id="caption"
			name="caption"
			rows="2"
			maxlength="2000"
			aria-describedby="caption-hint">{values.caption}</textarea>
		<p class="form-hint" id="caption-hint">Whoever sees this entry sees the caption.</p>
	</div>

	<div class="field lock-note">
		<label for="note">
			{@render lockIcon()}Note for next time
		</label>
		<textarea
			id="note"
			name="note"
			rows="2"
			maxlength="2000"
			aria-describedby="note-hint">{values.note}</textarea>
		<p class="form-hint" id="note-hint">Only you ever see this.</p>
	</div>

	<ChoiceGroup
		name="audience"
		legend="Who sees this entry"
		options={AUDIENCES.map((value) => ({
			value,
			label: AUDIENCE_LABEL[value],
			note: AUDIENCE_SENTENCE[value]
		}))}
		bind:value={audience}
		icon={audienceIcon}
		columns={2}
		hint={showPrivateHint ? PRIVATE_RECIPE_HINT : null} />
</form>

<div class="entry-actions">
	<FormActions
		{submitLabel}
		pending={saving.pending}
		cancelHref="/journal"
		form={FORM_ID}
		danger={actions} />
</div>

<style>
	.entry-actions {
		margin-top: var(--space-5);
	}

	.two-up {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	.recipe-combo {
		position: relative;
	}

	/* The tag box's open list: flush under the box, lifted, scrolling past eight rows. */
	.recipe-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 10;
		max-height: 18rem;
		overflow-y: auto;
		margin: -1px 0 0;
		padding: 0;
		list-style: none;
		background: var(--color-surface);
		border: 1px solid var(--color-input-border);
		border-radius: 0 0 var(--radius-md) var(--radius-md);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.08);
	}

	.recipe-menu li {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		min-height: 44px;
		padding: 11px 12px;
		border-bottom: 1px solid var(--color-border);
		cursor: pointer;
	}

	.recipe-menu li:last-child {
		border-bottom: 0;
	}

	.recipe-menu li:hover,
	.recipe-menu li.active {
		background: var(--color-tint);
	}

	.recipe-menu .mono-id {
		color: var(--color-accent);
	}

	.lock-note label {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.lock-note textarea {
		background: var(--color-bg);
	}

	@media (max-width: 699px) {
		.two-up {
			grid-template-columns: minmax(0, 1fr);
		}

		#recipe {
			font-size: 16px;
		}
	}
</style>
