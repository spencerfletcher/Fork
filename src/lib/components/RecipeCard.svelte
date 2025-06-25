<script lang="ts">
	// We import your specific Recipe type
	import type { Recipe } from '$lib/types';

	let { recipe }: { recipe: Recipe } = $props();
</script>

<a
	href={`/recipes/${recipe.id}`}
	class="group flex h-full flex-col overflow-hidden transition-shadow"
>
	<div class="aspect-video overflow-hidden border-b border-gray-200">
		{#if recipe.imageUrl}
			<img
				src={recipe.imageUrl}
				alt={recipe.title}
				class="h-full w-full object-cover transition-transform duration-300"
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center bg-gray-100">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-gray-300"
				>
					<rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
					<circle cx="9" cy="9" r="2"></circle>
					<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
				</svg>
			</div>
		{/if}
	</div>

	<div class="group flex flex-grow flex-col p-4">
		<h3 class="text-lg font-semibold text-gray-900 group-hover:text-gray-500">{recipe.title}</h3>

		<p class="mt-2 line-clamp-3 flex-grow text-sm text-gray-600 group-hover:text-gray-500">
			{recipe.description}
		</p>

		<div class="flex items-center space-x-4 pt-3 text-sm text-gray-500 group-hover:text-gray-500">
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
						class="text-gray-400"
						><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"
						></polyline></svg
					>
					<span>{recipe.cookTimeMinutes} min</span>
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
						class="text-gray-400"
						><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"
						></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path
							d="M16 3.13a4 4 0 0 1 0 7.75"
						></path></svg
					>
					<span>Serves {recipe.servings}</span>
				</div>
			{/if}
		</div>
	</div>
</a>
