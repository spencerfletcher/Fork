<script lang="ts">
	import { parseIngredientText } from '#lib/recipes/ingredients.js';
	import { limitError } from '#lib/recipes/limits.js';

	let { value = $bindable(), error = '' }: { value: string; error?: string } = $props();

	// The server rejects oversized text, so the parser is not run on it here
	// either; the text stays in the box for the user to trim.
	const tooLong = $derived(limitError(value, 'Ingredients', true));

	// Reparsed on every keystroke; ingredient lists are short enough that this
	// is cheaper than a debounce would be to read.
	const unparsed = $derived(
		tooLong
			? []
			: parseIngredientText(value)
					.filter((i) => i.quantity === null)
					.map((i) => i.text)
	);

	// What a screen reader hears: the count, so it speaks when a line stops or
	// starts parsing, not on every keystroke inside one. The string only
	// changes when the count does, and the live region only speaks then.
	const announcement = $derived(
		tooLong
			? `${tooLong}. Shorten it before saving.`
			: unparsed.length > 0
				? `${unparsed.length} ${unparsed.length === 1 ? 'line' : 'lines'} can't be scaled.`
				: ''
	);

	// The error first, then the note, when each is shown.
	const describedBy = $derived(
		[error && 'ingredients-error', (tooLong || unparsed.length > 0) && 'ingredients-hint']
			.filter(Boolean)
			.join(' ') || undefined
	);

	// What is typed is what comes back: the fraction as the recipe stores it.
	const placeholder = '2¼ cups all-purpose flour\n2 large eggs';
</script>

<div class="field">
	<label for="ingredients">Ingredients</label>
	<textarea
		id="ingredients"
		name="ingredients"
		rows="11"
		required
		bind:value
		{placeholder}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}>
	</textarea>
	{#if error}
		<p class="field-error" id="ingredients-error" role="alert">{error}</p>
	{/if}
	{#if tooLong}
		<p class="form-hint" id="ingredients-hint">{tooLong}. Shorten it before saving.</p>
	{:else if unparsed.length > 0}
		<p class="form-hint" id="ingredients-hint">
			These lines will be saved as written but can't be scaled: {unparsed.join(', ')}
		</p>
	{/if}
	<!-- Always in the DOM so screen readers announce the text when it appears. -->
	<p class="sr-only" role="status">
		{#if announcement}{announcement}{/if}
	</p>
</div>

<style>
	/* field-sizing: content ignores rows; this keeps an empty box typeable. */
	textarea {
		min-height: calc(11lh + 20px);
	}
</style>
