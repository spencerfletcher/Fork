<script lang="ts">
	let {
		value = $bindable(''),
		placeholder = 'Search...',
		onSearch,
		onSubmit
	}: {
		value?: string;
		placeholder?: string;
		onSearch: (query: string) => void;
		onSubmit?: () => void;
	} = $props();

	let searchValue = $state(value);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Update local state when prop changes
	$effect(() => {
		searchValue = value;
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchValue = target.value;

		// Clear existing timer
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		// Debounce for 300ms
		debounceTimer = setTimeout(() => {
			onSearch(searchValue);
		}, 300);
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		onSearch(searchValue);
		if (onSubmit) {
			onSubmit();
		}
	}
</script>

<form onsubmit={handleSubmit} class="relative">
	<div class="relative">
		<!-- Search Icon -->
		<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-muted-foreground h-4 w-4"
			>
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.35-4.35" />
			</svg>
		</div>

		<!-- Input -->
		<input
			type="search"
			value={searchValue}
			oninput={handleInput}
			{placeholder}
			class="border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 w-full rounded-md border bg-white py-2 pr-3 pl-10 text-sm transition-colors focus:ring-2 focus:outline-none"
		/>
	</div>
</form>
