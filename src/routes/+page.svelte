<script lang="ts">
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
	<!-- Hero Section -->
	<section class="mb-6">
		<h2 class="mb-3 text-5xl">What to Cook This Week</h2>
		<p class="max-w-3xl text-xl text-gray-600">
			Discover our curated collection of recipes, from quick weeknight dinners to impressive weekend
			projects. Each recipe has been tested and perfected by our team of culinary experts.
		</p>
	</section>

	<!-- Recipe Grid -->
	<RecipeGrid recipes={data.recipes} />
</div>
