<script lang="ts" generics="T extends string">
	import type { Snippet } from 'svelte';

	// A fieldset of radio rows, each a bordered surface label: an icon and
	// the word at 600, its one sentence in Ink 2 under it. The chosen row
	// gains a 1px ink inset; the radio is clay, centred on the word's line.
	// The recipe editor's and the Journal form's audience choices.
	let {
		name,
		legend,
		options,
		value = $bindable(),
		icon,
		columns = 1,
		hint = null
	}: {
		name: string;
		legend: string;
		options: { value: T; label: string; note: string }[];
		value: T;
		icon?: Snippet<[T]>;
		/** Two side by side from 700px; one column on a phone. */
		columns?: 1 | 2;
		/** A line under the rows that every radio's description includes. */
		hint?: string | null;
	} = $props();
</script>

<fieldset class="choice-group">
	<legend class="field-legend">{legend}</legend>
	<div class="choices" class:two={columns === 2}>
		{#each options as option (option.value)}
			<label class="choice">
				<input
					type="radio"
					{name}
					value={option.value}
					bind:group={value}
					aria-labelledby="{name}-{option.value}"
					aria-describedby="{name}-{option.value}-note{hint ? ` ${name}-hint` : ''}" />
				<b id="{name}-{option.value}">{@render icon?.(option.value)}{option.label}</b>
				<span id="{name}-{option.value}-note">{option.note}</span>
			</label>
		{/each}
	</div>
	{#if hint}
		<p class="form-hint" id="{name}-hint" role="status">{hint}</p>
	{/if}
</fieldset>

<style>
	.choice-group {
		border: 0;
		padding: 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.field-legend {
		margin-bottom: 0;
		padding: 0;
	}

	.choices {
		display: grid;
		gap: var(--space-2);
	}

	.choices.two {
		grid-template-columns: 1fr 1fr;
		column-gap: var(--space-3);
	}

	.choice {
		display: grid;
		/* The radio's own width and a 6px gap, so the word sits by it. */
		grid-template-columns: auto 1fr;
		gap: 2px 6px;
		align-items: start;
		min-height: 44px;
		padding: 10px 12px;
		border: 1px solid var(--color-input-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		cursor: pointer;
	}

	/* Clay, not the browser's blue; centred on the word's line, not the row. */
	.choice input {
		align-self: center;
		accent-color: var(--color-accent);
	}

	.choice b {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 600;
	}

	.choice span {
		grid-column: 2;
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--color-text-2);
	}

	.choice:has(:checked) {
		border-color: var(--color-text);
		box-shadow: inset 0 0 0 1px var(--color-text);
	}

	/* :global, because the icon is the caller's snippet. */
	.choice :global(svg) {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	@media (max-width: 699px) {
		.choices.two {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
