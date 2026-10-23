<script lang="ts">
	import { parseIngredientText } from '#lib/recipes/ingredients.js';
	import { limitError } from '#lib/recipes/limits.js';

	let { value = $bindable() }: { value: string } = $props();

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

	const placeholder = '2 1/4 cups all-purpose flour\n2 large eggs';
</script>

<div class="field">
	<label for="ingredients">Ingredients</label>
	<textarea id="ingredients" name="ingredients" rows="10" bind:value {placeholder}></textarea>
	<!-- Always in the DOM so screen readers announce the text when it appears. -->
	<p class="form-hint" role="status" aria-live="polite">
		{#if tooLong}
			{tooLong}. Shorten it before saving.
		{:else if unparsed.length > 0}
			These lines will be saved as written but can't be scaled: {unparsed.join(', ')}
		{/if}
	</p>
</div>
