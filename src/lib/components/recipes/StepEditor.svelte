<script lang="ts">
	import { parseStepGroups } from '#lib/recipes/steps.js';
	import { readBack } from '#lib/recipes/groups.js';
	import { limitError } from '#lib/recipes/limits.js';
	import ReadBack from './ReadBack.svelte';
	import GroupedTextEditor from './GroupedTextEditor.svelte';

	let {
		value = $bindable(),
		error = '',
		disabled = false
	}: { value: string; error?: string; disabled?: boolean } = $props();

	// Oversized text is the server's to refuse; it is not parsed here.
	const groups = $derived(
		limitError(value, 'Steps') ? null : readBack(parseStepGroups(value), 'steps')
	);
	const describedBy = $derived(
		[error && 'steps-error', groups && 'steps-readback', 'steps-hint'].filter(Boolean).join(' ')
	);

	const placeholder =
		'# Dough\nCream the butter and sugar.\n\nFold in the flour.\ntip: Stop when no dry streaks remain.';
</script>

<div class="field">
	<GroupedTextEditor
		id="steps"
		label="Method"
		rows={14}
		bind:value
		{placeholder}
		invalid={!!error}
		{describedBy}
		{disabled} />
	{#if error}
		<p class="field-error" id="steps-error" role="alert">{error}</p>
	{/if}
	{#if groups}
		<ReadBack id="steps-readback" value={groups} />
	{/if}
	<!-- The syntax stays in view while typing, after the placeholder has gone. -->
	<!-- A line break before the comma would render as "tip: ,". -->
	<!-- prettier-ignore -->
	<p class="form-hint" id="steps-hint">
		Separate steps with a blank line. Add a note under a step with <b>tip:</b>, <b>warning:</b> or
		<b>substitution:</b> on its own line. A line like <b># Bake</b> starts a group.
	</p>
</div>
