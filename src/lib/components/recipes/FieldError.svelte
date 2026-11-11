<script lang="ts">
	// A recipe editor field's inline error, announced, and named by the box's
	// aria-describedby as `{name}-error`.
	let { name, error }: { name: string; error: string | undefined } = $props();
</script>

{#if error}
	<p class="field-error" id="{name}-error" role="alert">{error}</p>
{/if}
