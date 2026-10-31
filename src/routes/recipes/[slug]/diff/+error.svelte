<script lang="ts">
	import { page } from '$app/state';
	import { MISSING_RECIPE_LEDE, SERVER_ERROR_LEDE } from '#lib/errors/copy.js';

	// A bad range is a 400 and the recipe still exists, so the way back is to
	// it. A 404 means there is no recipe to go back to, so this page answers as
	// the root error page does for a missing recipe: home, or a search.
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
		<p class="lede text-text-2">
			{#if oneVersion}
				Save a change to the recipe, then compare it with the original.
			{:else if page.error?.versionCount}
				This recipe has v1 to v{page.error.versionCount}.
			{:else if recipeUrl}
				Pick two of the recipe's versions to compare.
			{:else if page.status === 404}
				<!-- The root error page's ledes, word for word. -->
				{MISSING_RECIPE_LEDE}
			{:else if page.status >= 500}
				{SERVER_ERROR_LEDE}
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
			<div class="actions">
				<a href="/" class="btn-primary">Go home</a>
				{#if page.status === 404}
					<a href="/search" class="btn-ghost">Search recipes</a>
				{/if}
			</div>
		{/if}
	</div>
</div>
