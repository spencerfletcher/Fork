<script lang="ts">
	import type { Recipe } from '$lib/types';

	let { recipe }: { recipe: Recipe } = $props();
</script>

<a
	href={`/recipes/${recipe.id}`}
	class="group flex h-full flex-col overflow-hidden transition-shadow"
>
	<!-- This is the RecipeCard component that displays a recipe with an image, title, and description -->
	<div class="aspect-video overflow-hidden border-b border-gray-200">
		<img
			src={recipe.imageUrl ? recipe.imageUrl : '/None.png'}
			alt={recipe.title}
			class="h-full w-full object-cover transition-transform duration-300"
		/>
	</div>

	<div class="group flex flex-grow flex-col p-4">
		<h3 class="text-lg font-semibold text-gray-900 group-hover:text-gray-500">{recipe.title}</h3>

		<p class="mt-2 line-clamp-3 flex-grow text-sm text-gray-600 group-hover:text-gray-500">
			{recipe.description}
		</p>
	</div>
</a>
