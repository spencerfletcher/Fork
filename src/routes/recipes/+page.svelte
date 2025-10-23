<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="bg-white p-4 sm:p-6 lg:p-8">
	<div class="container mx-auto">
		{#if data.session?.user}
			<div class="mb-12 text-center">
				<h1 class="text-brand-gray-dark text-4xl font-bold tracking-tight">My Cookbook</h1>
				<p class="text-brand-gray-medium mx-auto mt-4 max-w-2xl text-lg">
					Your personal collection of recipes.
				</p>
			</div>

			<div class="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
				{#if data.recipes && data.recipes.length > 0}
					{#each data.recipes as recipe (recipe.id)}
						<RecipeCard {recipe} />
					{/each}
				{:else}
					<p class="text-brand-gray-medium col-span-full text-center">
						You have no recipes yet. Start by
						<a href="/recipes/new" class="text-brand-blue hover:text-brand-blue-dark font-semibold"
							>adding one!</a
						>
					</p>
				{/if}
			</div>
		{:else}
			<div class="text-center">
				<h1 class="text-brand-gray-dark text-4xl font-bold tracking-tight">
					Welcome to the Cookbook
				</h1>
				<p class="text-brand-gray-medium mt-4 text-lg">
					Please <a href="/login" class="text-brand-blue hover:text-brand-blue-dark font-semibold"
						>log in</a
					> to see your recipes.
				</p>
			</div>
		{/if}
	</div>
</div>
