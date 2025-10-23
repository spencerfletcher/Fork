<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="bg-white p-4 sm:p-6 lg:p-8">
	<div class="container mx-auto">
		<div class="mb-12 text-center">
			<h1 class="text-brand-gray-dark text-4xl font-bold tracking-tight">Cookbook</h1>
		</div>

		<!-- A more spacious grid with a larger gap -->
		<div class="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.recipes as recipe (recipe.id)}
				<RecipeCard {recipe} />
			{/each}
		</div>
	</div>
</div>
