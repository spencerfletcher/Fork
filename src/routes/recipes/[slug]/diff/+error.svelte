<script lang="ts">
	import { page } from '$app/state';

	// A bad range is a 400 and the recipe still exists, so the way back is to
	// it. A 404 means there is no recipe to go back to; home is the only way.
	const recipeUrl = $derived(page.status === 400 ? `/recipes/${page.params.slug}` : null);

	// The helper line agrees with the loader's message: a recipe with one
	// version cannot be asked to pick two.
	const oneVersion = $derived(page.error?.message.startsWith('Need at least two versions'));
</script>

<div class="page">
	<div class="page-inner">
		<div class="py-8 text-center">
			<p class="text-accent mb-3 font-mono text-[4rem] leading-none font-bold">
				{page.status}
			</p>
			<h1 class="m-0 mb-3 text-[1.5rem]">{page.error?.message || 'An error occurred'}</h1>
			<p class="text-text-3 m-0 mb-6">
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
				<div class="flex flex-wrap justify-center gap-3">
					<a href="{recipeUrl}/diff" class="btn-primary">Compare first and latest</a>
					<a href={recipeUrl} class="btn-ghost">Back to the recipe</a>
				</div>
			{:else if recipeUrl}
				<a href={recipeUrl} class="btn-primary">Back to the recipe</a>
			{:else}
				<a href="/" class="btn-primary">Go Home</a>
			{/if}
		</div>
	</div>
</div>
