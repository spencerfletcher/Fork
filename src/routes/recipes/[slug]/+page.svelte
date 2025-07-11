<script lang="ts">
	import ClockSvg from '$lib/components/ClockSvg.svelte';
	import PersonSvg from '$lib/components/PersonSvg.svelte';

	// This receives the { recipe } object from your +page.server.ts load function
	let { data } = $props();
	let recipe = data.recipe;

	// Since we stored ingredients and instructions as single strings in the database,
	// we need to split them back into arrays to loop over them.
	const ingredientsList = recipe.ingredients.split('\n');
	const instructionsList = recipe.instructions.split('\n');
	const tags = recipe.recipesToTags.map((item) => item.tag);
</script>

<article class="container mx-auto max-w-4xl px-4 py-8">
	<div class="text-center">
		<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">{recipe.title}</h1>
		{#if recipe.description}
			<p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{recipe.description}</p>
		{/if}
	</div>

	{#if tags.length > 0}
		<div class="my-4 flex flex-wrap items-center justify-center gap-2">
			<!-- Corrected loop variable and property access -->
			{#each tags as tag}
				<a
					href={`/tags/${tag.id}`}
					class="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
				>
					{tag.name}
				</a>
			{/each}
		</div>
	{/if}

	<div
		class="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500"
	>
		{#if recipe.prepTimeMinutes}
			<div class="flex items-center gap-1.5">
				<ClockSvg />
				<span>Prep: {recipe.prepTimeMinutes} min</span>
			</div>
		{/if}
		{#if recipe.cookTimeMinutes}
			<div class="flex items-center gap-1.5">
				<ClockSvg />
				<span>Cook: {recipe.cookTimeMinutes} min</span>
			</div>
		{/if}
		{#if recipe.servings}
			<div class="flex items-center gap-1.5">
				<PersonSvg />
				<span>Serves {recipe.servings}</span>
			</div>
		{/if}
	</div>

	{#if recipe.imageUrl}
		<div class="mb-4 overflow-hidden rounded-lg shadow-xl">
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
