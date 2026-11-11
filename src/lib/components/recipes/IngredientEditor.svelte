<script lang="ts">
	import { parseIngredientGroups } from '#lib/recipes/ingredients.js';
	import { readBack } from '#lib/recipes/groups.js';
	import { limitError } from '#lib/recipes/limits.js';
	import { plural } from '#lib/helpers.js';
	import ReadBack from './ReadBack.svelte';
	import GroupedTextEditor from './GroupedTextEditor.svelte';
	import FieldError from '#lib/components/ui/FieldError.svelte';

	let {
		value = $bindable(),
		error = '',
		disabled = false
	}: { value: string; error?: string; disabled?: boolean } = $props();

	// The server rejects oversized text, so the parser is not run on it here
	// either; the text stays in the box for the user to trim.
	const tooLong = $derived(limitError(value, 'Ingredients'));

	// Reparsed on every keystroke; ingredient lists are short enough that this
	// is cheaper than a debounce would be to read.
	const sections = $derived(tooLong ? [] : parseIngredientGroups(value));
	const unparsed = $derived(
		sections
			.flatMap((section) => section.rows)
			.filter((i) => i.quantity === null)
			.map((i) => i.text)
	);
	// Only a box with a "# Name" line has a split to show.
	const groups = $derived(readBack(sections, 'ingredients'));

	// What a screen reader hears: the count, so it speaks when a line stops or
	// starts parsing, not on every keystroke inside one. The string only
	// changes when the count does, and the live region only speaks then.
	const announcement = $derived(
		tooLong
			? `${tooLong}. Shorten it before saving.`
			: unparsed.length > 0
				? `${plural(unparsed.length, 'line')} can't be scaled.`
				: ''
	);

	// The error first, then the split and the note, when each is shown, then the format.
	const describedBy = $derived(
		[
			error && 'ingredients-error',
			groups && 'ingredients-readback',
			(tooLong || unparsed.length > 0) && 'ingredients-note',
			'ingredients-hint'
		]
			.filter(Boolean)
			.join(' ')
	);

	// What is typed is what comes back: the fraction as the recipe stores it,
	// under a heading so a new cook sees how a section looks.
	const placeholder = '# Dough\n2¼ cups all-purpose flour\n2 large eggs';
</script>

<div class="field">
	<GroupedTextEditor
		id="ingredients"
		label="Ingredients"
		rows={11}
		bind:value
		{placeholder}
		invalid={!!error}
		{describedBy}
		{disabled} />
	<FieldError name="ingredients" {error} />
	{#if groups}
		<ReadBack id="ingredients-readback" value={groups} />
	{/if}
	{#if tooLong}
		<p class="form-hint" id="ingredients-note">{tooLong}. Shorten it before saving.</p>
	{:else if unparsed.length > 0}
		<p class="form-hint" id="ingredients-note">
			These lines will be saved as written but can't be scaled: {unparsed.join(', ')}
		</p>
	{/if}
	<!-- The format stays in view while typing, after the placeholder has gone. -->
	<p class="form-hint" id="ingredients-hint">
		One per line: quantity, unit, ingredient — 2¼ cups flour. A line like <b># Dough</b>
		starts a group.
	</p>
	<!-- Always in the DOM so screen readers announce the text when it appears. -->
	<p class="sr-only" role="status">
		{#if announcement}{announcement}{/if}
	</p>
</div>
