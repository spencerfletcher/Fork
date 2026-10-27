<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { RecipeDraft } from '#lib/recipes/validation.js';
	import { ingredientsToText } from '#lib/recipes/ingredients.js';
	import { stepsToText } from '#lib/recipes/steps.js';
	import RecipeForm from '#lib/components/recipes/RecipeForm.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const { recipe, latestVersion } = $derived(data);

	// What was loaded, as the form's strings. Only the initial value is wanted:
	// a successful save redirects, a failed one keeps the page and its baseline.
	// svelte-ignore state_referenced_locally
	const baseline: RecipeDraft = {
		title: latestVersion?.title ?? recipe.title,
		description: latestVersion?.description ?? '',
		servings: latestVersion?.servings?.toString() ?? '',
		prepTimeMinutes: latestVersion?.prepTimeMinutes?.toString() ?? '',
		cookTimeMinutes: latestVersion?.cookTimeMinutes?.toString() ?? '',
		ingredients: ingredientsToText(latestVersion?.ingredients ?? []),
		steps: stepsToText(latestVersion?.steps ?? []),
		commitMessage: '',
		editRevision: String(recipe.editRevision),
		isPublic: recipe.isPublic,
		tags: recipe.recipesToTags?.map((r) => r.tag.name) ?? [],
		hadPhoto: false,
		removeImage: false
	};
</script>

<div class="page">
	<div class="mx-auto max-w-[720px]">
		<div class="page-header">
			<a href="/recipes/{recipe.slug}" class="back-link">← Back to recipe</a>
			<h1>Edit Recipe</h1>
		</div>

		<RecipeForm
			{baseline}
			{form}
			allTags={data.allTags}
			action="?/save"
			submitLabel="Save changes"
			imageUrl={latestVersion?.imageUrl ?? null}
			withCommitMessage />
	</div>
</div>
