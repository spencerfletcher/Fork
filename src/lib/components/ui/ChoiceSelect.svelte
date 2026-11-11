<script lang="ts" generics="T extends string">
	import { onMount, type Snippet } from 'svelte';
	import { chevronIcon } from '#lib/components/Icons.svelte';
	import FieldError from './FieldError.svelte';

	// ChoiceGroup's rows as a dropdown (Spencer, 12 November 2026: "basically
	// the three rows but as a dropdown"): closed, the chosen word with its
	// sentence under it in the smaller size; open, every choice the same way.
	// The WAI-ARIA select-only combobox: focus stays on the box, the list is
	// walked by aria-activedescendant. Before hydration, or without
	// JavaScript, a native select submits the same field and values.
	let {
		name,
		label,
		options,
		value = $bindable(),
		icon,
		hint = null,
		error,
		disabled = false
	}: {
		name: string;
		label: string;
		options: { value: T; label: string; note: string }[];
		value: T;
		icon?: Snippet<[T]>;
		/** A line under the box that describes it. */
		hint?: string | null;
		error?: string;
		disabled?: boolean;
	} = $props();

	const id = $props.id();
	let mounted = $state(false);
	onMount(() => (mounted = true));

	let open = $state(false);
	let active = $state(0);
	let root: HTMLDivElement | undefined = $state();
	const current = $derived(
		Math.max(
			0,
			options.findIndex((o) => o.value === value)
		)
	);
	const chosen = $derived(options[current]);
	const describedBy = $derived(
		[hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(' ') || undefined
	);

	function show(at = current) {
		active = at;
		open = true;
	}

	function choose(i: number) {
		value = options[i].value;
		open = false;
	}

	// The next choice after the active one whose word starts with the letter.
	function typeahead(letter: string) {
		const start = open ? active : current;
		for (let step = 1; step <= options.length; step++) {
			const i = (start + step) % options.length;
			if (options[i].label.toLowerCase().startsWith(letter)) return i;
		}
		return -1;
	}

	function onkeydown(e: KeyboardEvent) {
		if (disabled || e.metaKey || e.ctrlKey || e.altKey) return;
		const last = options.length - 1;
		const moves: Record<string, number> = {
			ArrowDown: open ? Math.min(active + 1, last) : current,
			ArrowUp: open ? Math.max(active - 1, 0) : current,
			Home: 0,
			End: last
		};
		if (e.key in moves) {
			e.preventDefault();
			show(moves[e.key]);
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			if (open) choose(active);
			else show();
		} else if (e.key === 'Escape' && open) {
			e.preventDefault();
			open = false;
		} else if (e.key === 'Tab' && open) {
			choose(active);
		} else if (e.key.length === 1) {
			const i = typeahead(e.key.toLowerCase());
			if (i >= 0) show(i);
		}
	}

	// A press outside closes the list; one inside is the box's or a choice's.
	function onpointerdown(e: PointerEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window {onpointerdown} />

<div class="choice-select" bind:this={root}>
	<span class="field-legend" id="{id}-label">{label}</span>
	{#if mounted}
		<input type="hidden" {name} {value} />
		<div
			id={name}
			class="box"
			role="combobox"
			tabindex={disabled ? -1 : 0}
			aria-haspopup="listbox"
			aria-expanded={open}
			aria-controls="{id}-list"
			aria-labelledby="{id}-label"
			aria-activedescendant={open ? `${id}-${active}` : undefined}
			aria-describedby={describedBy}
			aria-invalid={error ? 'true' : undefined}
			aria-disabled={disabled ? 'true' : undefined}
			onclick={() => {
				if (disabled) return;
				if (open) open = false;
				else show();
			}}
			{onkeydown}
			onfocusout={() => (open = false)}>
			<span class="word">{@render icon?.(chosen.value)}{chosen.label}</span>
			{@render chevronIcon(open)}
			<span class="note">{chosen.note}</span>
		</div>
		{#if open}
			<ul class="list" role="listbox" id="{id}-list" aria-labelledby="{id}-label" tabindex="-1">
				{#each options as option, i (option.value)}
					<!-- The keyboard is on the box, as a select-only combobox has it. -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<li
						id="{id}-{i}"
						role="option"
						class="option"
						class:active={i === active}
						class:current={i === current}
						aria-selected={i === active}
						onmousedown={(e) => e.preventDefault()}
						onclick={() => choose(i)}>
						<span class="word">{@render icon?.(option.value)}{option.label}</span>
						<span class="note">{option.note}</span>
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		<select {name} aria-labelledby="{id}-label" aria-describedby={describedBy}>
			{#each options as option (option.value)}
				<option value={option.value} selected={option.value === value}>{option.label}</option>
			{/each}
		</select>
		<span class="note">{chosen.note}</span>
	{/if}
	{#if hint}
		<p class="form-hint" id="{name}-hint" role="status">{hint}</p>
	{/if}
	<FieldError {name} {error} />
</div>

<style>
	.choice-select {
		position: relative;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	/* An input's box: lifted paper, the input edge, the word at 600 with its
	   icon, the chevron right, the sentence under them in the smaller size. */
	.box {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		column-gap: 12px;
		min-height: 44px;
		padding: 9px 12px;
		background: var(--color-surface);
		border: 1px solid var(--color-input-border);
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.box[aria-invalid='true'] {
		border-color: var(--color-remove);
	}

	.box[aria-disabled='true'] {
		cursor: default;
		opacity: 0.6;
	}

	.word {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
		font-size: 0.9375rem;
	}

	.note {
		grid-column: 1 / -1;
		font-size: 0.875rem;
		color: var(--color-text-2);
	}

	.box :global(.chevron) {
		width: 12px;
		height: 12px;
	}

	.box :global(.chevron.up) {
		transform: rotate(180deg);
	}

	/* The overlay look of Dropdown's panel: paper inside a 1px Ink 2 edge, no
	   shadow. Each choice is a 44px row; the band marks the active one, an ink
	   inset the chosen one, as ChoiceGroup's chosen row. */
	.list {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 6;
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-top: 4px;
		padding: 6px;
		background: var(--color-bg);
		border: 1px solid var(--color-text-2);
		border-radius: var(--radius-md);
	}

	.option {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2px;
		min-height: 44px;
		padding: 6px 12px;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.option.active {
		background: var(--color-band);
	}

	.option.current {
		box-shadow: inset 0 0 0 1px var(--color-text);
	}
</style>
