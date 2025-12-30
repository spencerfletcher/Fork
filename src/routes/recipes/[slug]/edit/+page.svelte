<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data, form } = $props<{ data: PageData; form: any }>();

	// Parse recipe data for form pre-population
	const recipe = data.recipe;
	const currentTags = recipe.recipesToTags.map((item: any) => item.tag.name).join(', ');
</script>

<div class="min-h-screen bg-white py-12">
	<div class="container mx-auto max-w-3xl px-6">
		<!-- Header -->
		<div class="mb-12 border-b border-border pb-8">
			<h1 class="mb-2 font-serif text-4xl font-bold text-foreground">Edit Recipe</h1>
			<p class="text-muted-foreground">Update your recipe details</p>
		</div>

		{#if form?.message}
			<div class="mb-6 rounded-lg border border-border bg-secondary p-4">
				<p class="font-medium text-foreground">{form.message}</p>
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-8">
			<!-- Basic Information Section -->
			<section>
				<h2 class="mb-6 font-serif text-xl font-bold text-foreground">Basic Information</h2>

				<div class="space-y-6">
					<div>
						<label for="title" class="mb-2 block font-medium text-foreground">Recipe Title *</label>
						<input
							type="text"
							name="title"
							id="title"
							required
							placeholder="e.g., Classic Chocolate Chip Cookies"
							value={recipe.title}
						/>
					</div>

					<div>
						<label for="description" class="mb-2 block font-medium text-foreground">Description</label
						>
						<textarea
							name="description"
							id="description"
							rows="3"
							placeholder="Tell the story behind this recipe..."
						>{recipe.description || ''}</textarea
						>
					</div>

					<div>
						<label for="imageUrl" class="mb-2 block font-medium text-foreground">Image URL</label>
						<input
							type="url"
							name="imageUrl"
							id="imageUrl"
							placeholder="https://example.com/image.jpg"
							value={recipe.imageUrl || ''}
						/>
					</div>

					<div>
						<label for="rating" class="mb-2 block font-medium text-foreground">Your Rating</label>
						<input
							type="number"
							name="rating"
							id="rating"
							min="0"
							max="5"
							step="0.1"
							placeholder="4.5"
							value={recipe.rating || ''}
						/>
					</div>

					<div>
						<label for="tags" class="mb-2 block font-medium text-foreground">Tags</label>
						<input
							type="text"
							name="tags"
							id="tags"
							placeholder="e.g., Dinner, Italian, Quick & Easy"
							value={currentTags}
						/>
						<p class="mt-2 text-xs text-muted-foreground">Separate tags with commas</p>
						{#if data.allTags.length > 0}
							<div class="mt-4">
								<p class="mb-2 text-xs font-semibold text-muted-foreground">Popular tags:</p>
								<div class="flex flex-wrap gap-2">
									{#each data.allTags as tag}
										<span
											class="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-foreground"
										>
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
				<h2 class="mb-6 border-t border-border pt-8 font-serif text-xl font-bold text-foreground">
					Cooking Details
				</h2>

				<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
					<div>
						<label for="prepTimeMinutes" class="mb-2 block font-medium text-foreground">
							Prep Time (minutes)
						</label>
						<input
							type="number"
							name="prepTimeMinutes"
							id="prepTimeMinutes"
							placeholder="15"
							value={recipe.prepTimeMinutes || ''}
						/>
					</div>
					<div>
						<label for="cookTimeMinutes" class="mb-2 block font-medium text-foreground">
							Cook Time (minutes)
						</label>
						<input
							type="number"
							name="cookTimeMinutes"
							id="cookTimeMinutes"
							placeholder="30"
							value={recipe.cookTimeMinutes || ''}
						/>
					</div>
					<div>
						<label for="servings" class="mb-2 block font-medium text-foreground">Servings</label>
						<input
							type="number"
							name="servings"
							id="servings"
							placeholder="4"
							value={recipe.servings || ''}
						/>
					</div>
				</div>
			</section>

			<!-- Privacy Section -->
			<section>
				<h2 class="mb-6 border-t border-border pt-8 font-serif text-xl font-bold text-foreground">
					Privacy
				</h2>

				<div class="flex items-center gap-3">
					<input
						type="checkbox"
						name="public"
						id="public"
						checked={recipe.public}
						class="h-4 w-4"
					/>
					<label for="public" class="font-medium text-foreground">Make this recipe public</label>
				</div>
				<p class="mt-2 text-xs text-muted-foreground">
					Public recipes can be viewed by anyone on the home page
				</p>
			</section>

			<!-- Recipe Content Section -->
			<section>
				<h2 class="mb-6 border-t border-border pt-8 font-serif text-xl font-bold text-foreground">
					Recipe
				</h2>

				<div class="space-y-6">
					<div>
						<label for="ingredients" class="mb-2 block font-medium text-foreground"
							>Ingredients *</label
						>
						<textarea
							name="ingredients"
							id="ingredients"
							rows="8"
							placeholder="1 cup flour&#10;2 eggs&#10;1/2 cup sugar&#10;..."
						>{recipe.ingredients}</textarea
						>
						<p class="mt-2 text-xs text-muted-foreground">Enter each ingredient on a new line</p>
					</div>

					<div>
						<label for="instructions" class="mb-2 block font-medium text-foreground"
							>Instructions *</label
						>
						<textarea
							name="instructions"
							id="instructions"
							rows="10"
							placeholder="1. Preheat oven to 350°F&#10;2. Mix dry ingredients&#10;3. Add wet ingredients&#10;..."
						>{recipe.instructions}</textarea
						>
						<p class="mt-2 text-xs text-muted-foreground">Enter each step on a new line</p>
					</div>
				</div>
			</section>

			<!-- Submit Button -->
			<div class="flex gap-4 border-t border-border pt-8">
				<button type="submit" class="flex-1">Save Changes</button>
				<a
					href="/recipes/{recipe.slug}"
					class="flex-1 rounded-lg border border-border px-6 py-3 text-center font-medium text-muted-foreground transition-colors hover:bg-secondary"
				>
					Cancel
				</a>
			</div>
		</form>
	</div>
</div>
