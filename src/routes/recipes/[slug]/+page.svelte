<script lang="ts">
	import ClockSvg from '$lib/components/ClockSvg.svelte';
	import PersonSvg from '$lib/components/PersonSvg.svelte';
	import { enhance } from '$app/forms';

	// This receives the { recipe } object from your +page.server.ts load function
	let { data } = $props();
	let recipe = $state(data.recipe);
	let isFavorited = $state(data.isFavorited);
	let showDeleteConfirm = $state(false);

	// Since we stored ingredients and instructions as single strings in the database,
	// we need to split them back into arrays to loop over them.
	const ingredientsList = recipe.ingredients.split('\n').filter((s) => s.trim());
	const instructionsList = recipe.instructions.split('\n').filter((s) => s.trim());
	const tags = recipe.recipesToTags.map((item) => item.tag);
	const isOwner = data.user && data.user.id === recipe.userId;
</script>

<article class="min-h-screen bg-white">
	<!-- Hero Section -->
	<div class="border-b border-amber-100 bg-gradient-to-b from-amber-50 to-white py-12">
		<div class="container mx-auto max-w-4xl px-4">
			<div class="mb-8">
				{#if tags.length > 0}
					<div class="mb-6 flex flex-wrap gap-2">
						{#each tags as tag}
							<a
								href={`/tags/${tag.slug}`}
								class="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-200"
							>
								{tag.name}
							</a>
						{/each}
					</div>
				{/if}

				<h1 class="mb-4 font-serif text-5xl font-bold text-gray-900 sm:text-6xl">{recipe.title}</h1>
				{#if recipe.description}
					<p class="max-w-3xl text-lg text-gray-600">{recipe.description}</p>
				{/if}
			</div>

			<!-- Meta Information -->
			<div
				class="flex flex-wrap items-center gap-6 border-t border-amber-100 pt-6 text-sm text-gray-600"
			>
				{#if recipe.prepTimeMinutes}
					<div class="flex items-center gap-2">
						<ClockSvg />
						<span
							>Prep: <span class="font-semibold text-gray-900">{recipe.prepTimeMinutes} min</span
							></span
						>
					</div>
				{/if}
				{#if recipe.cookTimeMinutes}
					<div class="flex items-center gap-2">
						<ClockSvg />
						<span
							>Cook: <span class="font-semibold text-gray-900">{recipe.cookTimeMinutes} min</span
							></span
						>
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
				{#if data.user}
					<div class="ml-auto flex items-center gap-2">
						<form
							method="POST"
							action="?/toggleFavorite"
							class="inline"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success' && result.data) {
										isFavorited = (result.data as { isFavorited: boolean }).isFavorited;
									}
								};
							}}
						>
							<button
								type="submit"
								class="p-1 transition-colors"
								title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
							>
								{#if isFavorited}
									<svg class="h-5 w-5 fill-current text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
										<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
									</svg>
								{:else}
									<svg class="h-5 w-5 stroke-2 stroke-current text-gray-400 hover:fill-yellow-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
									</svg>
								{/if}
							</button>
						</form>
						{#if isOwner}
							<a
								href="/recipes/{recipe.slug}/edit"
								class="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900 transition-colors hover:bg-blue-200"
							>
								Edit
							</a>
							<button
								type="button"
								onclick={() => (showDeleteConfirm = true)}
								class="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-900 transition-colors hover:bg-red-200"
							>
								Delete
							</button>
						{/if}
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
					<img src={recipe.imageUrl} alt={recipe.title} class="h-96 w-full object-cover" />
				</div>
			</div>
		</div>
	{/if}

	<!-- Content Section -->
	<div class="container mx-auto max-w-4xl px-4 py-12">
		<div class="grid grid-cols-1 gap-12 lg:grid-cols-3">
			<!-- Ingredients Sidebar -->
			<div class="lg:col-span-1">
				<div class="sticky top-24 rounded-lg border border-amber-100 bg-amber-50 p-6">
					<h2 class="mb-6 font-serif text-2xl font-bold text-gray-900">Ingredients</h2>
					<ul class="space-y-3">
						{#each ingredientsList as ingredient}
							<li class="border-b border-amber-100 pb-3 text-gray-700 last:border-b-0">
								{ingredient}
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- Instructions Main Content -->
			<div class="lg:col-span-2">
				<h2 class="mb-8 font-serif text-2xl font-bold text-gray-900">Instructions</h2>
				<ol class="space-y-6">
					{#each instructionsList as instruction, index}
						<li class="flex gap-4">
							<span
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-900"
							>
								{index + 1}
							</span>
							<span class="pt-1 text-gray-700">{instruction}</span>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</div>
</article>

{#if showDeleteConfirm && isOwner}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center"
		style="background-color: rgba(107, 114, 128, 0.3);"
	>
		<div class="mx-4 max-w-sm rounded-lg bg-white p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-bold text-gray-900">Delete Recipe?</h2>
			<p class="mb-6 text-gray-600">
				Are you sure you want to delete <span class="font-semibold">{recipe.title}</span>? This
				action cannot be undone.
			</p>
			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={() => (showDeleteConfirm = false)}
					class="rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Cancel
				</button>
				<form method="POST" action="?/delete" class="inline">
					<button
						type="submit"
						class="rounded bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
					>
						Delete Recipe
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
