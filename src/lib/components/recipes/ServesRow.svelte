<script lang="ts">
	import { NUMBER_FIELDS, type RecipeDraft } from '#lib/recipes/validation.js';
	import { MAX_MAKES } from '#lib/recipes/limits.js';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import AddFields from '#lib/components/ui/AddFields.svelte';

	let {
		draft = $bindable(),
		errors
	}: {
		/** The editor's draft; only servings and the yield are read and written. */
		draft: RecipeDraft;
		/** Inline errors by field name. */
		errors: Record<string, string>;
	} = $props();
</script>

<!-- Serves stays a string so the dirty check compares like with like;
     bind:value on a number input would hand back numbers and null. The
     yield sits beside the portions rather than in place of them: it never
     sets servings, and scaling stays by servings. Makes is an Add button
     beside Serves until wanted: it saves a row of its own. -->
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
			aria-invalid={errors.servings ? 'true' : undefined}
			aria-describedby={errors.servings ? 'servings-error' : undefined} />
	</div>
	<AddFields fields={[{ name: 'makes', label: 'Makes' }]} value={() => draft.makes} {errors}>
		{#snippet field()}
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
				<FieldError name="makes" error={errors.makes} />
				<p class="form-hint" id="makes-hint">What one batch produces, when that isn't portions.</p>
			</div>
		{/snippet}
	</AddFields>
	<FieldError name="servings" error={errors.servings} />
</div>
