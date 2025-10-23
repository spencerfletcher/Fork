<script lang="ts">
	import type { Recipe } from '$lib/server/db/schema';

	let { recipe }: { recipe: Recipe } = $props();
	let isClicked = $state(false);
</script>

<a
	href={`/recipes/${recipe.slug}`}
	class="group block"
	onmouseenter={() => (isClicked = true)}
	onmouseleave={() => (isClicked = false)}
>
	<!-- Image Section with a subtle zoom-on-hover effect -->
	<div class="aspect-[4/3] overflow-hidden">
		<img
			src={recipe.imageUrl ? recipe.imageUrl : '/None.png'}
			alt={recipe.title}
			class="group-hover: h-full w-full object-cover transition-transform duration-300"
			class:mouse-over={isClicked}
		/>
	</div>

	<!-- Text Content Section -->
	<div class="pt-4">
		<h3 class="text-brand-gray-dark group-hover:text-brand-blue text-lg font-semibold">
			{recipe.title}
		</h3>
		<p class="text-brand-gray-medium mt-1 text-sm">{recipe.description}</p>
	</div>
</a>

<style>
	.mouse-over {
		outline-style: solid;
		outline-color: rgb(0, 238, 255);
		outline-width: 2px;
	}
</style>
