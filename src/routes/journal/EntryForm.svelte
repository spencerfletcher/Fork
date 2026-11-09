<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import PhotoField from '#lib/components/recipes/PhotoField.svelte';
	import { audienceIcon, lockIcon } from '#lib/components/journal/Icons.svelte';
	import {
		AUDIENCE_LABEL,
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
		useLocalToday = false
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
	} = $props();

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
	let pending = $state(false);

	onMount(() => {
		if (useLocalToday) cookedOn = localToday();
	});

	const selected = $derived(choices.find((c) => c.slug === recipe));
	const showPrivateHint = $derived(selected?.visibility === 'private' && audience === 'friends');
</script>

<form
	class="form entry-form"
	method="POST"
	{action}
	enctype="multipart/form-data"
	use:enhance={() => {
		pending = true;
		return async ({ update }) => {
			await update({ reset: false });
			pending = false;
		};
	}}>
	{#if error}
		<p class="form-error" role="alert">{error}</p>
	{/if}

	<div class="field">
		<label for="dish">
			Dish <span class="required" aria-hidden="true">*</span>
		</label>
		<input id="dish" name="dish" type="text" required maxlength="200" value={values.dish} />
	</div>

	<div class="two-up">
		<div class="field">
			<label for="cookedOn">
				Date <span class="required" aria-hidden="true">*</span>
			</label>
			<input id="cookedOn" name="cookedOn" type="date" required bind:value={cookedOn} />
		</div>
		<div class="field">
			<label for="servings">
				Servings <span class="optional">optional</span>
			</label>
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
		<label for="recipe">
			From a recipe <span class="optional">optional</span>
		</label>
		<!-- Changing the recipe drops the version, so the latest is linked. -->
		<select id="recipe" name="recipe" bind:value={recipe} onchange={() => (version = '')}>
			<option value="">Improvised (no recipe)</option>
			{#if keepLabel}
				<option value={KEEP_SOURCE}>{keepLabel}</option>
			{/if}
			{#each choices as choice (choice.slug)}
				<option value={choice.slug}>{choice.title}</option>
			{/each}
		</select>
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
			<label for="link">
				Link <span class="optional">optional</span>
			</label>
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
		<label for="caption">
			Caption <span class="optional">optional</span>
		</label>
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
			<span class="optional">optional</span>
		</label>
		<textarea
			id="note"
			name="note"
			rows="2"
			maxlength="2000"
			aria-describedby="note-hint">{values.note}</textarea>
		<p class="form-hint" id="note-hint">Only you ever see this.</p>
	</div>

	<fieldset class="audience">
		<legend class="field-legend">Who sees this entry</legend>
		<div class="choices">
			{#each AUDIENCES as value (value)}
				<label class="choice">
					<input
						type="radio"
						name="audience"
						{value}
						bind:group={audience}
						aria-labelledby="audience-{value}"
						aria-describedby="audience-{value}-note" />
					<b id="audience-{value}">{@render audienceIcon(value)}{AUDIENCE_LABEL[value]}</b>
					<span id="audience-{value}-note">{AUDIENCE_SENTENCE[value]}</span>
				</label>
			{/each}
		</div>
		{#if showPrivateHint}
			<p class="form-hint" role="status">{PRIVATE_RECIPE_HINT}</p>
		{/if}
	</fieldset>

	<div class="form-actions">
		<button class="btn-primary" type="submit" disabled={pending}>
			{pending ? 'Saving…' : submitLabel}
		</button>
		<a class="cancel" href="/journal">Cancel</a>
	</div>
</form>

<style>
	.entry-form {
		max-width: 680px;
	}

	.two-up {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	select {
		min-height: 41px;
		padding: 8px 10px;
		font: inherit;
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-input-border);
		border-radius: var(--radius-md);
	}

	/* The note's own lifted paper: the one thing on the form only you see. */
	.lock-note {
		padding: 12px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.lock-note label {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.lock-note textarea {
		background: var(--color-bg);
	}

	.audience {
		border: 0;
		padding: 0;
		margin: 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.audience .field-legend {
		padding: 0;
		margin-bottom: 0;
	}

	.choices {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	/* The recipe editor's choice rows: icon, word and one sentence. */
	.choice {
		display: grid;
		grid-template-columns: 20px 1fr;
		gap: 2px 10px;
		align-items: start;
		min-height: 44px;
		padding: 10px 12px;
		border: 1px solid var(--color-input-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		cursor: pointer;
	}

	.choice input {
		margin: 4px 0 0;
		accent-color: var(--color-accent);
	}

	.choice b {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 600;
	}

	.choice span {
		grid-column: 2;
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--color-text-2);
	}

	.choice:has(:checked) {
		border-color: var(--color-text);
		box-shadow: inset 0 0 0 1px var(--color-text);
	}

	.cancel {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font-weight: 600;
	}

	@media (max-width: 699px) {
		.two-up,
		.choices {
			grid-template-columns: minmax(0, 1fr);
		}

		select {
			min-height: 44px;
			font-size: 16px;
		}
	}
</style>
