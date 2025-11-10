<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	// This prop will contain any data returned from the form action, like errors
	let { data, form } = $props<{ data: PageData; form: any }>();
</script>

<div class="min-h-screen bg-white py-12">
	<div class="container mx-auto max-w-3xl px-4">
		<!-- Header -->
		<div class="mb-12 border-b border-amber-100 pb-8">
			<h1 class="font-serif text-4xl font-bold text-gray-900 mb-2">Create a New Recipe</h1>
			<p class="text-gray-600">Share your culinary creation with the world</p>
		</div>

		{#if form?.message}
			<div class="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
				<p class="text-amber-900 font-medium">{form.message}</p>
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-8">
			<!-- Basic Information Section -->
			<section>
				<h2 class="font-serif text-xl font-bold text-gray-900 mb-6">Basic Information</h2>

				<div class="space-y-6">
					<div>
						<label for="title" class="block font-medium text-gray-900 mb-2">Recipe Title *</label>
						<input
							type="text"
							name="title"
							id="title"
							required
							placeholder="e.g., Classic Chocolate Chip Cookies"
							class="w-full"
						/>
					</div>

					<div>
						<label for="description" class="block font-medium text-gray-900 mb-2">Description</label>
						<textarea
							name="description"
							id="description"
							rows="3"
							placeholder="Tell the story behind this recipe..."
							class="w-full"
						></textarea>
					</div>

					<div>
						<label for="imageUrl" class="block font-medium text-gray-900 mb-2">Image URL</label>
						<input
							type="url"
							name="imageUrl"
							id="imageUrl"
							placeholder="https://example.com/image.jpg"
							class="w-full"
						/>
					</div>

					<div>
						<label for="rating" class="block font-medium text-gray-900 mb-2">Your Rating</label>
						<input
							type="number"
							name="rating"
							id="rating"
							min="1"
							max="5"
							step="0.1"
							class="w-full"
							placeholder="4.5"
						/>
					</div>

					<div>
						<label for="tags" class="block font-medium text-gray-900 mb-2">Tags</label>
						<input
							type="text"
							name="tags"
							id="tags"
							placeholder="e.g., Dinner, Italian, Quick & Easy"
							class="w-full"
						/>
						<p class="text-xs text-gray-500 mt-2">Separate tags with commas</p>
						{#if data.allTags.length > 0}
							<div class="mt-4">
								<p class="text-xs font-semibold text-gray-600 mb-2">Popular tags:</p>
								<div class="flex flex-wrap gap-2">
									{#each data.allTags as tag}
										<span class="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-900">
											{tag.name}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</section>

			<!-- Cooking Details Section -->
			<section>
				<h2 class="font-serif text-xl font-bold text-gray-900 mb-6 border-t border-amber-100 pt-8">Cooking Details</h2>

				<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
					<div>
						<label for="prepTimeMinutes" class="block font-medium text-gray-900 mb-2">
							Prep Time (minutes)
						</label>
						<input
							type="number"
							name="prepTimeMinutes"
							id="prepTimeMinutes"
							placeholder="15"
							class="w-full"
						/>
					</div>
					<div>
						<label for="cookTimeMinutes" class="block font-medium text-gray-900 mb-2">
							Cook Time (minutes)
						</label>
						<input
							type="number"
							name="cookTimeMinutes"
							id="cookTimeMinutes"
							placeholder="30"
							class="w-full"
						/>
					</div>
					<div>
						<label for="servings" class="block font-medium text-gray-900 mb-2">Servings</label>
						<input
							type="number"
							name="servings"
							id="servings"
							placeholder="4"
							class="w-full"
						/>
					</div>
				</div>
			</section>

			<!-- Recipe Content Section -->
			<section>
				<h2 class="font-serif text-xl font-bold text-gray-900 mb-6 border-t border-amber-100 pt-8">Recipe</h2>

				<div class="space-y-6">
					<div>
						<label for="ingredients" class="block font-medium text-gray-900 mb-2">Ingredients *</label>
						<textarea
							name="ingredients"
							id="ingredients"
							rows="8"
							placeholder="1 cup flour&#10;2 eggs&#10;1/2 cup sugar&#10;..."
							class="w-full"
						></textarea>
						<p class="text-xs text-gray-500 mt-2">Enter each ingredient on a new line</p>
					</div>

					<div>
						<label for="instructions" class="block font-medium text-gray-900 mb-2">Instructions *</label>
						<textarea
							name="instructions"
							id="instructions"
							rows="10"
							placeholder="1. Preheat oven to 350°F&#10;2. Mix dry ingredients&#10;3. Add wet ingredients&#10;..."
							class="w-full"
						></textarea>
						<p class="text-xs text-gray-500 mt-2">Enter each step on a new line</p>
					</div>
				</div>
			</section>

			<!-- Submit Button -->
			<div class="border-t border-amber-100 pt-8 flex gap-4">
				<button
					type="submit"
					class="flex-1 bg-amber-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-900 transition-colors shadow-sm"
				>
					Publish Recipe
				</button>
				<a
					href="/recipes"
					class="flex-1 text-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
				>
					Cancel
				</a>
			</div>
		</form>
	</div>
</div>
