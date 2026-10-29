<script lang="ts">
	import { page } from '$app/state';

	// A bad range is a 400 and the recipe still exists, so the way back is to
	// it. A 404 means there is no recipe to go back to; home is the only way.
	const recipeUrl = $derived(page.status === 400 ? `/recipes/${page.params.slug}` : null);

	// The helper line agrees with the loader's message: a recipe with one
	// version cannot be asked to pick two.
	const oneVersion = $derived(page.error?.message.startsWith('Need at least two versions'));
</script>

<!-- The root error page's format: the code and the message in the h1 at the
     site size, centred on the screen, nothing boxed. -->
<div class="auth-page">
	<div class="error-page text-center">
		<h1 class="m-0">Error {page.status} – {page.error?.message || 'An error occurred'}</h1>
		<p class="lede text-text-2 m-0">
			{#if oneVersion}
				Save a change to the recipe, then compare it with the original.
			{:else if recipeUrl}
				Pick two of the recipe's versions to compare.
			{:else}
				The page you're looking for doesn't exist or something went wrong.
			{/if}
		</p>
		{#if recipeUrl && !oneVersion}
			<!-- The heading asks for two versions, so the main action is a pair: the
			     bare compare URL, which the loader reads as first to latest. -->
			<div class="actions">
				<a href="{recipeUrl}/diff" class="btn-primary">Compare first and latest</a>
				<a href={recipeUrl} class="btn-ghost">Back to the recipe</a>
			</div>
		{:else if recipeUrl}
			<div class="actions"><a href={recipeUrl} class="btn-primary">Back to the recipe</a></div>
		{:else}
			<div class="actions"><a href="/" class="btn-primary">Go home</a></div>
		{/if}
	</div>
</div>

<style>
	/* The root error page's measure, lede and spacing. */
	.error-page {
		max-width: 65ch;
		padding-bottom: var(--space-7);
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
