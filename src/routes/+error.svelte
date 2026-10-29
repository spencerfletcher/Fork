<script lang="ts">
	import { page } from '$app/state';

	// The title carries the code and the message, "Error 404 – Recipe not
	// found" (Spencer, 29 October 2026). A 500 keeps SvelteKit's message and
	// says in the lede that the fault is Fork's; a 404 names what a missing
	// page can mean.
	const message = $derived(
		page.error?.message || (page.status === 404 ? 'Page not found' : 'Something went wrong')
	);
	const lede = $derived(
		page.status >= 500
			? "Something went wrong on Fork's side, not yours. Try again in a moment."
			: page.status === 404
				? 'It may be an old link, or a recipe its author keeps private.'
				: null
	);
</script>

<div class="page">
	<div class="page-inner">
		<div class="error-page">
			<h1 class="m-0">Error {page.status} – {message}</h1>
			{#if lede}
				<p class="lede text-text-2 m-0">{lede}</p>
			{/if}
			<a href="/" class="btn-primary">Go home</a>
		</div>
	</div>
</div>

<style>
	.error-page {
		padding-block: var(--space-6) var(--space-8);
	}

	.lede {
		max-width: 65ch;
		margin-top: 8px;
		font-size: 1.0625rem;
		line-height: 1.5;
	}

	.error-page :global(.btn-primary) {
		margin-top: 24px;
	}
</style>
