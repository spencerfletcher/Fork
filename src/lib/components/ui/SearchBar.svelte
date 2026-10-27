<script lang="ts">
	let {
		value = $bindable(''),
		placeholder = 'Search...',
		onSubmit
	}: {
		value?: string;
		placeholder?: string;
		onSubmit: () => void;
	} = $props();
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		onSubmit();
	}}
	class="relative">
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
				class="text-muted-foreground h-4 w-4">
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.35-4.35" />
			</svg>
		</div>

		<input
			type="search"
			bind:value
			{placeholder}
			class="border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 w-full rounded-md border bg-white py-2 pr-3 pl-10 text-sm transition-colors focus:ring-2 focus:outline-none" />
	</div>
</form>
