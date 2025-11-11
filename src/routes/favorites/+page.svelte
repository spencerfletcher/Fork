<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<div class="min-h-screen bg-white py-12">
	<div class="container mx-auto max-w-5xl px-4">
		<!-- Header -->
		<div class="mb-12 border-b border-amber-100 pb-8">
			<h1 class="font-serif text-4xl font-bold text-gray-900 mb-2">My Favorites</h1>
			<p class="text-gray-600">
				{data.favoriteRecipes.length}
				{data.favoriteRecipes.length === 1 ? 'recipe' : 'recipes'} saved
			</p>
		</div>

		{#if data.favoriteRecipes.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-600 mb-6">You haven't favorited any recipes yet.</p>
				<a
					href="/"
					class="inline-block rounded bg-amber-800 text-white px-6 py-3 font-medium hover:bg-amber-900 transition-colors"
				>
					Explore Recipes
				</a>
			</div>
		{:else}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.favoriteRecipes as recipe}
					<a
						href="/recipes/{recipe.slug}"
						class="group overflow-hidden rounded-lg border border-amber-100 bg-white shadow-sm transition-all hover:shadow-lg"
					>
						{#if recipe.imageUrl}
							<div class="overflow-hidden bg-gray-100 h-48">
								<img
									src={recipe.imageUrl}
									alt={recipe.title}
									class="h-full w-full object-cover transition-transform group-hover:scale-105"
								/>
							</div>
						{:else}
							<div class="h-48 w-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
								<span class="text-gray-400">No image</span>
							</div>
						{/if}

						<div class="p-4">
							<h2 class="font-serif text-lg font-bold text-gray-900 mb-2 line-clamp-2">
								{recipe.title}
							</h2>

							{#if recipe.description}
								<p class="text-sm text-gray-600 mb-3 line-clamp-2">
									{recipe.description}
								</p>
							{/if}

							{#if recipe.recipesToTags.length > 0}
								<div class="flex flex-wrap gap-2 mb-3">
									{#each recipe.recipesToTags.slice(0, 2) as relation}
										<span class="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900">
											{relation.tag.name}
										</span>
									{/each}
									{#if recipe.recipesToTags.length > 2}
										<span class="inline-block rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
											+{recipe.recipesToTags.length - 2} more
										</span>
									{/if}
								</div>
							{/if}

							<div class="text-sm text-gray-500">
								{#if recipe.cookTimeMinutes}
									<span>{recipe.cookTimeMinutes} min cook</span>
								{/if}
								{#if recipe.servings}
									<span class="ml-2">Serves {recipe.servings}</span>
								{/if}
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
