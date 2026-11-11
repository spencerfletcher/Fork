<script lang="ts">
	import { TEXT_LIMITS } from '#lib/recipes/limits.js';
	import type { RecipeDraft } from '#lib/recipes/validation.js';
	import FieldError from './FieldError.svelte';

	let {
		draft = $bindable(),
		errors
	}: {
		/** The editor's draft; only the four short notes are read and written. */
		draft: RecipeDraft;
		/** Inline errors by field name. */
		errors: Record<string, string>;
	} = $props();

	// The labelled short notes in "More details", in the order the page shows them.
	const MORE_FIELDS = [
		{ name: 'makeAhead', placeholder: 'Dough keeps 3 days chilled' },
		{ name: 'equipment', placeholder: 'A 23 cm springform tin' },
		{ name: 'storage', placeholder: 'Airtight, up to 5 days' },
		{ name: 'reheating', placeholder: 'Covered, 15 min at 160°C' }
	] as const;
</script>

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
				<FieldError {name} error={errors[name]} />
			</div>
		{/each}
	</div>
</details>

<style>
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
</style>
