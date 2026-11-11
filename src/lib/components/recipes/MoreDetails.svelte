<script lang="ts">
	import { TEXT_LIMITS } from '#lib/recipes/limits.js';
	import type { RecipeDraft } from '#lib/recipes/validation.js';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import AddFields from '#lib/components/ui/AddFields.svelte';

	let {
		draft = $bindable(),
		errors
	}: {
		/** The editor's draft; only the notes and the four short notes are read and written. */
		draft: RecipeDraft;
		/** Inline errors by field name. */
		errors: Record<string, string>;
	} = $props();

	// The optional notes under Method, in the order the page shows them. Their
	// Add buttons fit one line together, so each waits as a button until wanted.
	const FIELDS = [
		{ name: 'notes', label: 'Notes' },
		{ name: 'makeAhead', label: TEXT_LIMITS.makeAhead.label },
		{ name: 'equipment', label: TEXT_LIMITS.equipment.label },
		{ name: 'storage', label: TEXT_LIMITS.storage.label },
		{ name: 'reheating', label: TEXT_LIMITS.reheating.label }
	] as const;
	type Name = (typeof FIELDS)[number]['name'];

	const PLACEHOLDER: Record<Exclude<Name, 'notes'>, string> = {
		makeAhead: 'Dough keeps 3 days chilled',
		equipment: 'A 23 cm springform tin',
		storage: 'Airtight, up to 5 days',
		reheating: 'Covered, 15 min at 160°C'
	};
</script>

<div class="more-details">
	<AddFields fields={FIELDS} value={(name) => draft[name as Name]} {errors}>
		{#snippet field(key)}
			{@const name = key as Name}
			{#if name === 'notes'}
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
					<FieldError name="notes" error={errors.notes} />
					<p class="form-hint" id="notes-hint">
						For the whole recipe: what to watch for, swaps, serving ideas.
					</p>
				</div>
			{:else}
				<div class="field">
					<label for={name}>{TEXT_LIMITS[name].label}</label>
					<input
						id={name}
						{name}
						type="text"
						maxlength={TEXT_LIMITS[name].max}
						placeholder={PLACEHOLDER[name]}
						bind:value={draft[name]}
						aria-invalid={errors[name] ? 'true' : undefined}
						aria-describedby={errors[name] ? `${name}-error` : undefined} />
					<FieldError {name} error={errors[name]} />
				</div>
			{/if}
		{/snippet}
	</AddFields>
</div>

<style>
	.more-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	/* field-sizing: content ignores rows; this keeps an empty box typeable. */
	textarea[name='notes'] {
		min-height: calc(4lh + 18px);
	}
</style>
