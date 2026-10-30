<script lang="ts">
	import { tick } from 'svelte';
	import { tagKey } from '#lib/recipes/tags.js';

	let {
		allTags,
		selected = $bindable([])
	}: {
		allTags: Array<{ id: number; name: string; slug: string }>;
		selected?: string[];
	} = $props();

	let query = $state('');
	let open = $state(false);
	// Index of the arrowed-to option: the suggestions in order, then Create.
	// -1 is none; typing, picking and closing all reset it.
	let active = $state(-1);
	let rootEl: HTMLDivElement;

	// Tag identity ignores case: "Vegan" and "vegan" are one tag here, as they
	// are on the server.
	const isSelected = (name: string) => selected.some((s) => tagKey(s) === tagKey(name));

	const suggestions = $derived(
		allTags.filter(
			(t) => !isSelected(t.name) && (query.trim() === '' || tagKey(t.name).includes(tagKey(query)))
		)
	);

	const canCreate = $derived(
		query.trim().length > 0 &&
			!allTags.some((t) => tagKey(t.name) === tagKey(query)) &&
			!isSelected(query)
	);

	const showDropdown = $derived(open && (suggestions.length > 0 || canCreate));
	const count = $derived(suggestions.length + (canCreate ? 1 : 0));

	function pick(name: string) {
		if (!isSelected(name)) selected = [...selected, name];
		query = '';
		active = -1;
	}

	function remove(name: string) {
		selected = selected.filter((s) => s !== name);
	}

	// The options are not Tab stops: arrows move the active one and Enter takes
	// it. Without an active option Enter takes the first suggestion, or creates
	// the typed tag when nothing matches, so a tag is added without leaving the
	// keyboard.
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			open = true;
			if (count === 0) return;
			active = e.key === 'ArrowDown' ? (active + 1) % count : active <= 0 ? count - 1 : active - 1;
			tick().then(() =>
				document.getElementById(`tag-option-${active}`)?.scrollIntoView?.({ block: 'nearest' })
			);
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			if (active >= 0) pick(active < suggestions.length ? suggestions[active].name : query.trim());
			else if (suggestions.length > 0 && query.trim() !== '') pick(suggestions[0].name);
			else if (canCreate) pick(query.trim());
		}
		// Escape closes the list but leaves the caret where it was.
		if (e.key === 'Escape') {
			open = false;
			active = -1;
		}
	}

	// The list opens below the box, which near the fold (or on a phone) is
	// below the visible page; bring it in when it opens, as the arrows do.
	function reveal(menu: HTMLElement) {
		tick().then(() => menu.scrollIntoView?.({ block: 'nearest' }));
	}

	function handleBlur() {
		// Delay so a click on an option lands before the list closes
		setTimeout(() => {
			if (!rootEl.contains(document.activeElement)) {
				open = false;
				active = -1;
			}
		}, 150);
	}
</script>

<div class="flex flex-col gap-2" bind:this={rootEl}>
	<!-- Hidden inputs consumed by the form action -->
	{#each selected as tag (tag)}
		<input type="hidden" name="tags" value={tag} />
	{/each}

	<!-- Selected pills -->
	{#if selected.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each selected as tag (tag)}
				<span class="tag inline-flex items-center gap-1">
					{tag}
					<button
						type="button"
						onclick={() => remove(tag)}
						class="tag-remove"
						aria-label="Remove {tag}">
						×
					</button>
				</span>
			{/each}
		</div>
	{/if}

	<!-- Combobox input; open, the list flows out of it as one object. -->
	<div class="tag-combo relative" class:tag-combo--open={showDropdown}>
		<input
			id="tag-combobox"
			type="text"
			placeholder="Search or create a tag…"
			bind:value={query}
			onfocus={() => (open = true)}
			onblur={handleBlur}
			oninput={() => {
				open = true;
				active = -1;
			}}
			onkeydown={handleKeydown}
			autocomplete="off"
			role="combobox"
			aria-label="Search or create a tag"
			aria-expanded={showDropdown}
			aria-haspopup="listbox"
			aria-autocomplete="list"
			aria-controls="tag-listbox"
			aria-activedescendant={active >= 0 ? `tag-option-${active}` : undefined} />

		{#if showDropdown}
			<!-- tabindex -1: a scrollable box with nothing focusable inside would be a Tab stop. -->
			<ul class="tag-menu" role="listbox" id="tag-listbox" tabindex="-1" {@attach reveal}>
				{#each suggestions as tag, i (tag.id)}
					<!-- The keyboard is on the input (arrows, Enter), as a combobox has it. -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<li
						id="tag-option-{i}"
						class="tag-option border-border border-b [&:last-child]:border-b-0"
						role="option"
						tabindex="-1"
						aria-selected={active === i}
						onmousedown={(e) => e.preventDefault()}
						onclick={() => pick(tag.name)}>
						<svg
							class="text-text-3 size-4 shrink-0"
							viewBox="0 0 16 16"
							fill="none"
							aria-hidden="true">
							<path
								d="M2 2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0L2.293 8.293A1 1 0 0 1 2 7.586V2Z"
								stroke="currentColor"
								stroke-width="1.25"
								stroke-linejoin="round" />
							<circle cx="5.5" cy="5.5" r="1" fill="currentColor" />
						</svg>
						{tag.name}
					</li>
				{/each}

				{#if canCreate}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<li
						id="tag-option-{suggestions.length}"
						class="tag-option tag-option--create"
						role="option"
						tabindex="-1"
						aria-selected={active === suggestions.length}
						onmousedown={(e) => e.preventDefault()}
						onclick={() => pick(query.trim())}>
						<svg
							class="text-accent size-4 shrink-0"
							viewBox="0 0 16 16"
							fill="none"
							aria-hidden="true">
							<path
								d="M8 3v10M3 8h10"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round" />
						</svg>
						<span>
							Create <strong>“{query.trim()}”</strong>
						</span>
					</li>
				{/if}
			</ul>
		{/if}
	</div>
</div>

<style>
	.tag-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* A 24px hit around a 16px glyph box, grown outward so the pill keeps
		   its size and the glyph stays where it is. */
		width: 24px;
		height: 24px;
		margin: -4px;
		padding: 0;
		border: none;
		background: transparent;
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		color: var(--color-text-3);
		transition: color 0.15s ease;
	}

	.tag-remove:hover {
		color: var(--color-text);
	}

	/* A 44px hit on a phone or any touch screen, grown the same way. */
	@media (max-width: 699px), (pointer: coarse) {
		.tag-remove {
			width: 44px;
			height: 44px;
			margin: -14px;
		}
	}

	/* Open, the box and the list are one object: square where they meet, the
	   box's bottom border their one shared edge, the first option against it. */
	.tag-combo--open input {
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
		/* Its ring stops at the join, where the list's takes over. */
		clip-path: inset(-100vmax -100vmax 0);
	}

	.tag-menu {
		position: absolute;
		top: 100%;
		right: 0;
		left: 0;
		z-index: 50;
		margin: 0;
		padding: 0 0 0.25rem;
		max-height: 240px;
		overflow-y: auto;
		list-style: none;
		border: 1px solid var(--color-input-border);
		border-top: 0;
		border-radius: 0 0 var(--radius-lg) var(--radius-lg);
		background: var(--color-surface);
		box-shadow: var(--shadow-raised);
		/* Nothing drawn above its top edge: no shadow over the box, and no ring
		   segment across the join. */
		clip-path: inset(0 -100vmax -100vmax);
	}

	/* The box's ring carries on around the list; each is clipped at the join,
	   so one ring encloses both. */
	.tag-combo:has(input:focus-visible) .tag-menu {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.tag-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		cursor: pointer;
		color: var(--color-text);
	}

	.tag-option:hover,
	.tag-option[aria-selected='true'] {
		background: var(--color-surface-2);
	}

	/* "Create <name>" — an action rather than an existing tag, so it takes the
	   accent while the plain options stay quiet. */
	.tag-option--create {
		color: var(--color-accent);
	}
</style>
