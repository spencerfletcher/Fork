<script lang="ts">
	import ClockSvg from '$lib/components/ClockSvg.svelte';
	import PersonSvg from '$lib/components/PersonSvg.svelte';
	import { enhance } from '$app/forms';

	// This receives the { recipe } object from your +page.server.ts load function
	let { data } = $props();
	let recipe = $state(data.recipe);

	// Since we stored ingredients and instructions as single strings in the database,
	// we need to split them back into arrays to loop over them.
	const ingredientsList = recipe.ingredients.split('\n').filter((s) => s.trim());
	const instructionsList = recipe.instructions.split('\n').filter((s) => s.trim());
	const tags = recipe.recipesToTags.map((item) => item.tag);
</script>

<article class="min-h-screen bg-white">
	<!-- Hero Section -->
	<div class="bg-gradient-to-b from-amber-50 to-white border-b border-amber-100 py-12">
		<div class="container mx-auto max-w-4xl px-4">
			<div class="mb-8">
				{#if tags.length > 0}
					<div class="flex flex-wrap gap-2 mb-6">
						{#each tags as tag}
							<a
								href={`/tags/${tag.slug}`}
								class="rounded-full bg-amber-100 hover:bg-amber-200 px-3 py-1 text-sm font-medium text-amber-900 transition-colors"
							>
								{tag.name}
							</a>
						{/each}
					</div>
				{/if}

				<h1 class="font-serif text-5xl sm:text-6xl font-bold text-gray-900 mb-4">{recipe.title}</h1>
				{#if recipe.description}
					<p class="text-lg text-gray-600 max-w-3xl">{recipe.description}</p>
				{/if}
			</div>

			<!-- Meta Information -->
			<div class="flex flex-wrap items-center gap-6 text-sm text-gray-600 border-t border-amber-100 pt-6">
				{#if recipe.prepTimeMinutes}
					<div class="flex items-center gap-2">
						<ClockSvg />
						<span>Prep: <span class="font-semibold text-gray-900">{recipe.prepTimeMinutes} min</span></span>
					</div>
				{/if}
				{#if recipe.cookTimeMinutes}
					<div class="flex items-center gap-2">
						<ClockSvg />
						<span>Cook: <span class="font-semibold text-gray-900">{recipe.cookTimeMinutes} min</span></span>
					</div>
				{/if}
				{#if recipe.servings}
					<div class="flex items-center gap-2">
						<PersonSvg />
						<span>Serves: <span class="font-semibold text-gray-900">{recipe.servings}</span></span>
					</div>
				{/if}
				{#if recipe.rating}
					<div class="flex items-center gap-2">
						<span>Rating: <span class="font-semibold text-amber-700">{recipe.rating}</span>/5</span>
					</div>
				{:else}
					<div class="flex items-center gap-2">
						<span>Rating: <span class="font-semibold text-gray-500">Not rated</span></span>
					</div>
				{/if}
				{#if data.user && data.user.id === recipe.userId}
					<div class="flex items-center gap-2 ml-auto">
						<span class={`font-semibold ${recipe.public ? 'text-green-700' : 'text-gray-700'}`}>
							{recipe.public ? 'Public' : 'Private'}
						</span>
						<form
							method="POST"
							action="?/togglePublic"
							class="inline"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success' && result.data) {
										recipe.public = (result.data as { public: boolean }).public;
									}
								};
							}}
						>
							<button
								type="submit"
								class="ml-2 px-3 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-900 font-medium transition-colors text-xs"
							>
								Make {recipe.public ? 'Private' : 'Public'}
							</button>
						</form>
					</div>
				{:else if !data.user}
					<div class="flex items-center gap-2 ml-auto">
						<span class={`font-semibold ${recipe.public ? 'text-green-700' : 'text-gray-700'}`}>
							{recipe.public ? 'Public' : 'Private'}
						</span>
					</div>
				{:else}
					<div class="flex items-center gap-2 ml-auto">
						<span class={`font-semibold ${recipe.public ? 'text-green-700' : 'text-gray-700'}`}>
							{recipe.public ? 'Public' : 'Private'}
						</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Image Section -->
	{#if recipe.imageUrl}
		<div class="border-b border-amber-100">
			<div class="container mx-auto max-w-4xl px-4 py-12">
				<div class="overflow-hidden rounded-lg shadow-lg">
					<img
						src={recipe.imageUrl}
						alt={recipe.title}
						class="w-full h-96 object-cover"
					/>
				</div>
			</div>
		</div>
	{/if}

	<!-- Content Section -->
	<div class="container mx-auto max-w-4xl px-4 py-12">
		<div class="grid grid-cols-1 gap-12 lg:grid-cols-3">
			<!-- Ingredients Sidebar -->
			<div class="lg:col-span-1">
				<div class="sticky top-24 bg-amber-50 rounded-lg border border-amber-100 p-6">
					<h2 class="font-serif text-2xl font-bold text-gray-900 mb-6">Ingredients</h2>
					<ul class="space-y-3">
						{#each ingredientsList as ingredient}
							<li class="text-gray-700 pb-3 border-b border-amber-100 last:border-b-0">
								{ingredient}
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- Instructions Main Content -->
			<div class="lg:col-span-2">
				<h2 class="font-serif text-2xl font-bold text-gray-900 mb-8">Instructions</h2>
				<ol class="space-y-6">
					{#each instructionsList as instruction, index}
						<li class="flex gap-4">
							<span class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-semibold">
								{index + 1}
							</span>
							<span class="text-gray-700 pt-1">{instruction}</span>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</div>
</article>
