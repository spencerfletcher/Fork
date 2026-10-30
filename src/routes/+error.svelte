<script lang="ts">
	import { page } from '$app/state';

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
			? "Something went wrong on Fork's side, not yours. Try again in a moment."
			: recipeMissing
				? 'It may be an old link, or a recipe its author keeps private.'
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
			<p class="lede text-text-2 m-0">{lede}</p>
		{/if}
		<div class="actions">
			<a href="/" class="btn-primary">Go home</a>
			{#if recipeMissing}
				<a href="/search" class="btn-ghost">Search recipes</a>
			{/if}
		</div>
	</div>
</div>

<style>
	.error-page {
		max-width: 65ch;
		/* Optically centred: the bar above is 56px of espresso, so the block
		   sits a little above the exact middle of the paper. */
		padding-bottom: var(--space-7);
	}

	h1 {
		text-wrap: balance;
	}

	.lede {
		margin-top: 8px;
		font-size: 1.0625rem;
		line-height: 1.5;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px;
		margin-top: 24px;
	}
</style>
