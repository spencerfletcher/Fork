<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-gradient-to-b from-amber-50 to-white">
	{#if data.user}
		<!-- Header Section -->
		<section class="border-b border-amber-100 py-16 sm:py-24">
			<div class="container mx-auto px-4 text-center">
				<h1 class="mb-4 font-serif text-5xl font-bold text-amber-900 sm:text-6xl">My Cookbook</h1>
				<p class="mx-auto max-w-2xl text-lg text-gray-600">
					Your personal collection of recipes. <a
						href="/recipes/new"
						class="font-semibold text-amber-700 transition-colors hover:text-amber-800"
						>Create new recipe</a
					>
				</p>
			</div>
		</section>

		<!-- Recipes Grid -->
		<section class="py-16 sm:py-20">
			<div class="container mx-auto px-4">
				{#if data.recipes && data.recipes.length > 0}
					<div class="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
						{#each data.recipes as recipe (recipe.id)}
							<RecipeCard {recipe} />
						{/each}
					</div>
				{:else}
					<div class="py-16 text-center">
						<h2 class="mb-4 font-serif text-2xl text-gray-800">No recipes yet</h2>
						<p class="mb-8 text-gray-600">
							Start building your personal cookbook by creating your first recipe.
						</p>
						<a
							href="/recipes/new"
							class="inline-block rounded-md bg-amber-800 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-900"
						>
							Create Your First Recipe
						</a>
					</div>
				{/if}
			</div>
		</section>
	{:else}
		<div class="flex min-h-screen items-center justify-center">
			<div class="max-w-md text-center">
				<h1 class="mb-4 font-serif text-4xl font-bold text-gray-900">Welcome</h1>
				<p class="mb-8 text-gray-600">
					Sign in to your account to view and manage your personal recipe collection.
				</p>
				<div class="flex gap-4">
					<a
						href="/login"
						class="flex-1 rounded-lg bg-amber-800 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-900"
					>
						Sign In
					</a>
					<a
						href="/signup"
						class="flex-1 rounded-lg border border-amber-800 px-6 py-3 font-medium text-amber-800 transition-colors hover:bg-amber-50"
					>
						Sign Up
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>
