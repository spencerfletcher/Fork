<script lang="ts">
	let { value = $bindable() }: { value: string } = $props();

	const placeholder =
		'Cream the butter and sugar.\n\nFold in the flour.\ntip: Stop when no dry streaks remain.';
</script>

<div class="field">
	<label for="steps">Steps</label>
	<textarea id="steps" name="steps" rows="12" bind:value {placeholder}></textarea>
	<p class="form-hint">
		Separate steps with a blank line. Add a note under a step with tip:, warning: or substitution:
		on its own line.
	</p>
</div>
