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

	const current = $derived(latestVersion?.versionNumber ?? 0);
</script>

<div class="page">
	<div class="editor">
		<RecipeForm
			{baseline}
			{form}
			allTags={data.allTags}
			action="?/save"
			submitLabel="Save"
			cancelHref="/recipes/{recipe.slug}"
			imageUrl={latestVersion?.imageUrl ?? null}
			nextVersion={current + 1}>
			{#snippet header(outcome)}
				<div class="editor-header">
					<a href="/recipes/{recipe.slug}" class="back-link">← {recipe.title}</a>
					<div class="editor-title">
						<h1>Edit Recipe</h1>
						<!-- Always in the DOM, so the outcome is announced when it changes. -->
						<span class="editing" aria-live="polite">
							Editing v{current}{outcome ? ` · ${outcome}` : ''}
						</span>
					</div>
				</div>
			{/snippet}
		</RecipeForm>
	</div>
</div>
