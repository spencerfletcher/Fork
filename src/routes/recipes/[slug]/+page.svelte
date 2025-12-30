<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
	let recipe = $state(data.recipe);
	let isFavorited = $state(data.isFavorited);
	let isHovered = $state(false);
	let showDeleteConfirm = $state(false);

	const ingredientsList = recipe.ingredients.split('\n').filter((s) => s.trim());
	const instructionsList = recipe.instructions.split('\n').filter((s) => s.trim());
	const isOwner = data.user && data.user.id === recipe.userId;
	const rating = recipe.rating ? parseFloat(recipe.rating) : null;
</script>

<div>
	<!-- Hero Section with Image -->
	<div class="relative h-[60vh] bg-gray-900">
		<img
			src={recipe.imageUrl || '/None.png'}
			alt={recipe.title}
			class="h-full w-full object-cover opacity-90"
		/>
	</div>

	<!-- Content -->
	<div class="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:px-10">
		<!-- Header -->
		<div class="mb-8">
			<div class="mb-4 flex items-start justify-between">
				<h1 class="flex-1 text-4xl">{recipe.title}</h1>
				<div class="flex flex-shrink-0 items-center gap-2">
					{#if data.user}
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
								aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
								type="submit"
								class="rounded-full p-2 transition-colors hover:bg-gray-100"
								onmouseenter={() => (isHovered = true)}
								onmouseleave={() => (isHovered = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill={isFavorited || isHovered ? 'currentColor' : 'none'}
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="h-6 w-6 {isFavorited || isHovered ? 'text-yellow-500' : ''}"
								>
									<polygon
										points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
									/>
								</svg>
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
					{/if}
				</div>
			</div>

			{#if recipe.description}
				<p class="mb-6 text-xl text-gray-600">{recipe.description}</p>
			{/if}

			<div class="flex items-center gap-6 border-b pb-6 text-sm text-gray-600">
				{#if recipe.prepTimeMinutes}
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-4 w-4"
						>
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
						<span>Prep: {recipe.prepTimeMinutes} min</span>
					</div>
				{/if}

				{#if recipe.cookTimeMinutes}
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-4 w-4"
						>
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
						<span>Cook: {recipe.cookTimeMinutes} min</span>
					</div>
				{/if}

				{#if recipe.servings}
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-4 w-4"
						>
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
						<span>{recipe.servings} servings</span>
					</div>
				{/if}

				{#if rating}
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							class="h-4 w-4 text-yellow-500"
						>
							<polygon
								points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
							/>
						</svg>
						<span>{rating.toFixed(1)}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Two Column Layout -->
		<div class="grid gap-12 md:grid-cols-[1fr_2fr]">
			<!-- Ingredients -->
			<div>
				<div class="sticky top-24">
					<h2 class="mb-6 text-2xl">Ingredients</h2>

					<ul class="space-y-3">
						{#each ingredientsList as ingredient, index}
							<li class="flex items-start gap-3">
								<input
									type="checkbox"
									id="ingredient-{index}"
									class="mt-1 h-4 w-4 rounded border-gray-300"
								/>
								<label for="ingredient-{index}" class="flex-1 cursor-pointer text-gray-900">
									{ingredient}
								</label>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- Instructions -->
			<div>
				<h2 class="mb-6 text-2xl">Preparation</h2>

				<ol class="space-y-6">
					{#each instructionsList as instruction, index}
						<li class="flex gap-4">
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm text-white"
							>
								{index + 1}
							</div>
							<p class="flex-1 pt-1 text-gray-700">{instruction}</p>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</div>
</div>

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
