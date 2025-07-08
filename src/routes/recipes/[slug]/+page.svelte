<script lang="ts">
	import ClockSvg from '$lib/components/ClockSvg.svelte';

	// This receives the { recipe } object from your +page.server.ts load function
	let { data } = $props();
	let recipe = data.recipe;

	// Since we stored ingredients and instructions as single strings in the database,
	// we need to split them back into arrays to loop over them.
	const ingredientsList = recipe.ingredients.split(', ');
	const instructionsList = recipe.instructions.split('|');
</script>

<article class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8 text-center">
		<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">{recipe.title}</h1>
		{#if recipe.description}
			<p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{recipe.description}</p>
		{/if}
	</div>

	<div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
		{#if recipe.prepTimeMinutes}
			<div class="flex items-center gap-1.5">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M4 12V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8"></path><path d="M2 12h20"></path><path
						d="M17.5 12a4.5 4.5 0 0 1-4.5 4.5v0a4.5 4.5 0 0 1-4.5-4.5"
					></path><path d="M8.5 16.5v6"></path></svg
				>
				<span>Prep: {recipe.prepTimeMinutes} min</span>
			</div>
		{/if}
		{#if recipe.cookTimeMinutes}
			<div class="flex items-center gap-1.5">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"
					></polyline></svg
				>
				<span>Cook: {recipe.cookTimeMinutes} min</span>
			</div>
		{/if}
		{#if recipe.servings}
			<div class="flex items-center gap-1.5">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"
					></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"
					></path></svg
				>
				<span>Serves {recipe.servings}</span>
			</div>
		{/if}
	</div>

	{#if recipe.imageUrl}
		<div class="my-8 overflow-hidden rounded-lg shadow-xl">
			<img
				src={recipe.imageUrl}
				alt={recipe.title}
				class="h-full w-full object-cover object-center"
			/>
		</div>
	{/if}

	<div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
		<div class="lg:col-span-1">
			<h2 class="text-2xl font-bold text-gray-800">Ingredients</h2>
			<ul class="mt-4 list-disc space-y-2 pl-5 text-gray-700">
				{#each ingredientsList as ingredient}
					<li>{ingredient}</li>
				{/each}
			</ul>
		</div>

		<div class="prose max-w-none lg:col-span-2">
			<h2>Instructions</h2>
			<ol>
				{#each instructionsList as instruction}
					<li>{instruction}</li>
				{/each}
			</ol>
		</div>
	</div>
</article>
