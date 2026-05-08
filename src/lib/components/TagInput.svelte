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
				<span
					class="inline-flex items-center gap-1 rounded-full bg-accent-pale px-3 py-[2px] text-[0.8rem] font-medium text-accent"
				>
					{tag}
					<button
						type="button"
						onclick={() => remove(tag)}
						class="w-auto cursor-pointer border-none bg-transparent p-0 text-base leading-none text-inherit opacity-70 hover:opacity-100"
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
			<ul
				class="absolute left-0 right-0 top-[calc(100%+4px)] z-50 m-0 max-h-[240px] list-none overflow-y-auto rounded-lg border border-border bg-surface p-0 py-1 shadow-raised"
				role="listbox"
				id="tag-listbox"
			>
				{#each suggestions as tag (tag.id)}
					<li class="border-b border-border [&:last-child]:border-b-0" role="option" aria-selected="false">
						<button
							type="button"
							class="flex w-full cursor-pointer items-center gap-3 rounded-none border-none bg-transparent px-4 py-3 text-left text-[0.9rem] text-text hover:bg-surface-2"
							onmousedown={(e) => {
								e.preventDefault();
								pick(tag.name);
							}}
						>
							<svg class="size-4 shrink-0 text-text-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
					<li class="border-t border-border" role="option" aria-selected="false">
						<button
							type="button"
							class="flex w-full cursor-pointer items-center gap-3 rounded-none border-none bg-transparent px-4 py-3 text-left text-[0.9rem] text-accent hover:bg-surface-2"
							onmousedown={(e) => {
								e.preventDefault();
								pick(query.trim());
							}}
						>
							<svg class="size-4 shrink-0 text-accent" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
