<script lang="ts">
	import { TIME_FIELDS, type RecipeDraft, type TimeField } from '#lib/recipes/validation.js';
	import { formatDuration, OVERNIGHT_MINUTES } from '#lib/recipes/times.js';
	import { typedMessage } from '#lib/recipes/fieldErrors.svelte.js';
	import FieldError from '#lib/components/ui/FieldError.svelte';

	let {
		draft = $bindable(),
		errors
	}: {
		/** The editor's draft; only the three times are read and written. */
		draft: RecipeDraft;
		/** Inline errors by field name. */
		errors: Record<string, string>;
	} = $props();

	const timeFields = Object.keys(TIME_FIELDS) as TimeField[];
	const TIME_PLACEHOLDER: Record<TimeField, string> = {
		prepTimeMinutes: '15 min',
		cookTimeMinutes: '1 h',
		restTimeMinutes: 'Overnight'
	};
</script>

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
		<FieldError {name} error={errors[name]} />
	{/each}
	<p class="form-hint" id="times-hint">
		Like 45 min, 1 h 30 or 2 days; overnight is {formatDuration(OVERNIGHT_MINUTES)}. Rest is rising,
		chilling or marinating.
	</p>
</div>
