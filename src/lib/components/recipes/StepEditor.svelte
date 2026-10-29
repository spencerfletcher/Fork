<script lang="ts">
	let { value = $bindable(), error = '' }: { value: string; error?: string } = $props();

	const placeholder =
		'Cream the butter and sugar.\n\nFold in the flour.\ntip: Stop when no dry streaks remain.';
</script>

<div class="field">
	<label for="steps">Steps</label>
	<textarea
		id="steps"
		name="steps"
		rows="14"
		class="field-mono"
		required
		bind:value
		{placeholder}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? 'steps-error' : undefined}>
	</textarea>
	<!-- The syntax is taught while there is nothing in the box, like the placeholder. -->
	{#if error}
		<p class="field-error" id="steps-error">{error}</p>
	{:else if value.trim() === ''}
		<p class="form-hint">
			Separate steps with a blank line. Add a note under a step with tip:, warning: or substitution:
			on its own line.
		</p>
	{/if}
</div>

<style>
	/* field-sizing: content ignores rows; this keeps an empty box typeable. */
	textarea {
		min-height: calc(14lh + 20px);
	}
</style>
