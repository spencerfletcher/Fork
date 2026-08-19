<script lang="ts">
	let {
		allTags
	}: {
		allTags: Array<{ id: number; name: string; slug: string }>;
	} = $props();

	let selected = $state<string[]>([]);
	let query = $state('');
	let open = $state(false);
	let inputEl: HTMLInputElement;
	let rootEl: HTMLDivElement;

	const suggestions = $derived(
		allTags.filter(
			(t) =>
				!selected.includes(t.name) &&
				(query.trim() === '' || t.name.toLowerCase().includes(query.toLowerCase().trim()))
		)
	);

	const canCreate = $derived(
		query.trim().length > 0 &&
			!allTags.some((t) => t.name.toLowerCase() === query.trim().toLowerCase()) &&
			!selected.includes(query.trim())
	);

	const showDropdown = $derived(open && (suggestions.length > 0 || canCreate));

	function pick(name: string) {
		if (!selected.includes(name)) {
			selected = [...selected, name];
		}
		query = '';
	}

	function remove(name: string) {
		selected = selected.filter((s) => s !== name);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && canCreate) {
			e.preventDefault();
			pick(query.trim());
		}
		if (e.key === 'Escape') {
			open = false;
			inputEl.blur();
		}
	}

	function handleBlur() {
		// Delay so onmousedown on an option fires before we close
		setTimeout(() => {
			if (!rootEl.contains(document.activeElement)) {
				open = false;
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
						aria-label="Remove {tag}"
					>
						×
					</button>
				</span>
			{/each}
		</div>
	{/if}

	<!-- Combobox input -->
	<div class="relative">
		<input
			bind:this={inputEl}
			type="text"
			placeholder="Search or create a tag…"
			bind:value={query}
			onfocus={() => (open = true)}
			onblur={handleBlur}
			oninput={() => (open = true)}
			onkeydown={handleKeydown}
			autocomplete="off"
			role="combobox"
			aria-expanded={showDropdown}
			aria-haspopup="listbox"
			aria-autocomplete="list"
			aria-controls="tag-listbox"
		/>

		{#if showDropdown}
			<ul class="tag-menu" role="listbox" id="tag-listbox">
				{#each suggestions as tag (tag.id)}
					<li
						class="border-border border-b [&:last-child]:border-b-0"
						role="option"
						aria-selected="false"
					>
						<button
							type="button"
							class="tag-option"
							onmousedown={(e) => {
								e.preventDefault();
								pick(tag.name);
							}}
						>
							<svg
								class="text-text-3 size-4 shrink-0"
								viewBox="0 0 16 16"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M2 2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0L2.293 8.293A1 1 0 0 1 2 7.586V2Z"
									stroke="currentColor"
									stroke-width="1.25"
									stroke-linejoin="round"
								/>
								<circle cx="5.5" cy="5.5" r="1" fill="currentColor" />
							</svg>
							{tag.name}
						</button>
					</li>
				{/each}

				{#if canCreate}
					<li class="border-border border-t" role="option" aria-selected="false">
						<button
							type="button"
							class="tag-option tag-option--create"
							onmousedown={(e) => {
								e.preventDefault();
								pick(query.trim());
							}}
						>
							<svg
								class="text-accent size-4 shrink-0"
								viewBox="0 0 16 16"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M8 3v10M3 8h10"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
								/>
							</svg>
							Create "<strong>{query.trim()}</strong>"
						</button>
					</li>
				{/if}
			</ul>
		{/if}
	</div>
</div>

<style>
	.tag-remove {
		width: auto;
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

	.tag-menu {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		left: 0;
		z-index: 50;
		margin: 0;
		padding: 0.25rem 0;
		max-height: 240px;
		overflow-y: auto;
		list-style: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		box-shadow: var(--shadow-raised);
	}

	.tag-option {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 0;
		background: transparent;
		font-size: 0.9rem;
		text-align: left;
		cursor: pointer;
		color: var(--color-text);
	}

	.tag-option:hover {
		background: var(--color-surface-2);
	}

	/* "Create <name>" — an action rather than an existing tag, so it takes the
	   accent while the plain options stay quiet. */
	.tag-option--create {
		color: var(--color-accent);
	}
</style>
