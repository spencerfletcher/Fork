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

<div class="tag-input-root" bind:this={rootEl}>
	<!-- Hidden inputs consumed by the form action -->
	{#each selected as tag (tag)}
		<input type="hidden" name="tags" value={tag} />
	{/each}

	<!-- Selected pills -->
	{#if selected.length > 0}
		<div class="pills">
			{#each selected as tag (tag)}
				<span class="pill">
					{tag}
					<button type="button" onclick={() => remove(tag)} aria-label="Remove {tag}">×</button>
				</span>
			{/each}
		</div>
	{/if}

	<!-- Combobox input -->
	<div class="input-wrapper">
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
			<ul class="dropdown" role="listbox" id="tag-listbox">
				{#each suggestions as tag (tag.id)}
					<li role="option" aria-selected="false">
						<button
							type="button"
							class="option"
							onmousedown={(e) => {
								e.preventDefault();
								pick(tag.name);
							}}
						>
							<!-- Price-tag icon -->
							<svg class="tag-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
					<li role="option" aria-selected="false" class="create-row">
						<button
							type="button"
							class="option create"
							onmousedown={(e) => {
								e.preventDefault();
								pick(query.trim());
							}}
						>
							<svg class="tag-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
	.tag-input-root {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.pill {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		background: var(--color-accent-pale);
		color: var(--color-accent);
		border-radius: var(--radius-full);
		padding: 2px var(--space-3) 2px var(--space-3);
		font-size: 0.8rem;
		font-weight: 500;
	}

	.pill button {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: 0;
		width: auto;
		opacity: 0.7;
	}

	.pill button:hover {
		opacity: 1;
	}

	.input-wrapper {
		position: relative;
	}

	.input-wrapper input {
		width: 100%;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-raised);
		list-style: none;
		padding: var(--space-1) 0;
		margin: 0;
		z-index: 50;
		max-height: 240px;
		overflow-y: auto;
	}

	.dropdown li {
		border-bottom: 1px solid var(--color-border);
	}

	.dropdown li:last-child {
		border-bottom: none;
	}

	.option {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-3) var(--space-4);
		background: none;
		border: none;
		text-align: left;
		font-size: 0.9rem;
		color: var(--color-text);
		cursor: pointer;
		border-radius: 0;
		width: 100%;
	}

	.option:hover {
		background: var(--color-surface-2);
	}

	.tag-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		color: var(--color-text-3);
	}

	.create-row {
		border-top: 1px solid var(--color-border);
	}

	.option.create {
		color: var(--color-accent);
	}

	.option.create .tag-icon {
		color: var(--color-accent);
	}
</style>
