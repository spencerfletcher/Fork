<script lang="ts">
	import type { Recipe } from '$lib/server/db/schema';

	let { recipe }: { recipe: Recipe } = $props();
	let isClicked = $state(false);
</script>

<a
	href={`/recipes/${recipe.slug}`}
	class="group block rounded-lg overflow-hidden"
	onmouseenter={() => (isClicked = true)}
	onmouseleave={() => (isClicked = false)}
>
	<!-- Image Section with a subtle zoom-on-hover effect -->
	<div class="aspect-[4/3] overflow-hidden bg-gray-100">
		<img
			src={recipe.imageUrl ? recipe.imageUrl : '/None.png'}
			alt={recipe.title}
			class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
		/>
	</div>

	<!-- Text Content Section -->
	<div class="pt-4">
		<h3 class="mb-2 font-serif text-xl font-medium text-gray-900 transition-colors duration-200">
			{recipe.title}
		</h3>
		<p class="text-base text-gray-600 line-clamp-2">{recipe.description || 'A delicious recipe'}</p>
	</div>
</a>
