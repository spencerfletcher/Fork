<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	// This prop will contain any data returned from the form action, like errors
	let { data, form } = $props<{ data: PageData; form: any }>();
</script>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-900">Create a New Recipe</h1>

	<form method="POST" use:enhance class="mt-8 space-y-6">
		<div>
			<label for="title" class="block text-sm font-medium text-gray-700">Title</label>
			<input
				type="text"
				name="title"
				id="title"
				required
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
			/>
		</div>

		<div>
			<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
			<textarea
				name="description"
				id="description"
				rows="3"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
			></textarea>
		</div>

		<div>
			<label for="tags" class="block text-sm font-medium text-gray-700">Tags</label>
			<p class="text-xs text-gray-500">
				Enter tags separated by commas (e.g., Dinner, Italian, Quick & Easy)
			</p>
			<input
				type="text"
				name="tags"
				id="tags"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
			/>
			{#if data.allTags.length > 0}
				<div class="mt-2 flex flex-wrap gap-2">
					<span class="text-xs font-semibold text-gray-500">Available:</span>
					{#each data.allTags as tag}
						<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
							{tag.name}
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<div>
			<label for="rating" class="block text-sm font-medium text-gray-700">Rating (out of 5)</label>
			<input
				type="number"
				name="rating"
				id="rating"
				min="1"
				max="5"
				step="0.1"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
			/>
		</div>

		<div>
			<label for="imageUrl" class="block text-sm font-medium text-gray-700">Image URL</label>
			<input
				type="url"
				name="imageUrl"
				id="imageUrl"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
			/>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
			<div>
				<label for="prepTimeMinutes" class="block text-sm font-medium text-gray-700">
					Prep Time (min)
				</label>
				<input
					type="number"
					name="prepTimeMinutes"
					id="prepTimeMinutes"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
				/>
			</div>
			<div>
				<label for="cookTimeMinutes" class="block text-sm font-medium text-gray-700">
					Cook Time (min)
				</label>
				<input
					type="number"
					name="cookTimeMinutes"
					id="cookTimeMinutes"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
				/>
			</div>
			<div>
				<label for="servings" class="block text-sm font-medium text-gray-700">Servings</label>
				<input
					type="number"
					name="servings"
					id="servings"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
				/>
			</div>
		</div>

		<div>
			<label for="ingredients" class="block text-sm font-medium text-gray-700">Ingredients</label>
			<p class="text-xs text-gray-500">Enter each ingredient on a new line.</p>
			<textarea
				name="ingredients"
				id="ingredients"
				rows="6"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
			></textarea>
		</div>

		<div>
			<label for="instructions" class="block text-sm font-medium text-gray-700">Instructions</label>
			<p class="text-xs text-gray-500">Enter each step on a new line.</p>
			<textarea
				name="instructions"
				id="instructions"
				rows="8"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
			></textarea>
		</div>

		<div>
			<button
				type="submit"
				class="flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
			>
				Create Recipe
			</button>
		</div>
	</form>
</div>
