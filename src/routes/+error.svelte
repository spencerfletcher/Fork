<script lang="ts">
	import { page } from '$app/state';
	import { MISSING_RECIPE_LEDE, SERVER_ERROR_LEDE } from '#lib/errors/copy.js';

	// The title carries the code and the message, "Error 404 – Recipe not
	// found" (Spencer, 29 October 2026). A 500 keeps SvelteKit's message and
	// says in the lede that the fault is Fork's; a 404 names what a missing
	// page can mean.
	// SvelteKit's own message for an unmatched route is the title-case "Not
	// Found"; it reads as Fork's sentence case instead.
	const message = $derived(
		(page.error?.message === 'Not Found' ? null : page.error?.message) ||
			(page.status === 404 ? 'Page not found' : 'Something went wrong')
	);
	// A missing recipe may be one its author made private; a search is the way
	// on from a shared link to it. Any other missing page is only missing.
	const recipeMissing = $derived(page.status === 404 && page.url.pathname.startsWith('/recipes/'));
	const lede = $derived(
		page.status >= 500
			? SERVER_ERROR_LEDE
			: recipeMissing
				? MISSING_RECIPE_LEDE
				: page.status === 404
					? 'There is nothing at this address.'
					: null
	);
</script>

<!-- Centred on the screen like the login page, nothing boxed (Spencer, 29
     October 2026). -->
<div class="auth-page">
	<div class="error-page text-center">
		<h1 class="m-0">Error {page.status} – {message}</h1>
		{#if lede}
			<p class="lede text-text-2">{lede}</p>
		{/if}
		<div class="actions">
			<a href="/" class="btn-primary">Go home</a>
			{#if recipeMissing}
				<a href="/search" class="btn-ghost">Search recipes</a>
			{/if}
		</div>
	</div>
</div>
