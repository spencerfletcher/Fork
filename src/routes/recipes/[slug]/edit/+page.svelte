<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { RecipeDraft } from '#lib/recipes/validation.js';
	import { ingredientsToText } from '#lib/recipes/ingredients.js';
	import { stepsToText } from '#lib/recipes/steps.js';
	import RecipeForm from '#lib/components/recipes/RecipeForm.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import DeleteRecipe from './DeleteRecipe.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const { recipe, latestVersion } = $derived(data);

	// What was loaded, as the form's strings. Only the initial value is wanted:
	// a successful save redirects, a failed one keeps the page and its baseline.
	// svelte-ignore state_referenced_locally
	const baseline: RecipeDraft = {
		title: latestVersion.title,
		description: latestVersion.description ?? '',
		servings: latestVersion.servings?.toString() ?? '',
		makes: latestVersion.makes ?? '',
		prepTimeMinutes: latestVersion.prepTimeMinutes?.toString() ?? '',
		cookTimeMinutes: latestVersion.cookTimeMinutes?.toString() ?? '',
		ingredients: ingredientsToText(latestVersion.ingredients),
		steps: stepsToText(latestVersion.steps),
		commitMessage: '',
		editRevision: String(recipe.editRevision),
		visibility: recipe.visibility,
		tags: recipe.recipesToTags.map((r) => r.tag.name),
		hadPhoto: false,
		removeImage: false
	};

	const current = $derived(latestVersion.versionNumber);

	// One ActionData for two forms: a failed save hands back its draft, a
	// refused delete does not, so each failure goes to its own form.
	const deletion = pendingEnhance({ keepOnError: true });
	const saveForm = $derived(form?.draft ? form : null);
	const deleteError = $derived(deletion.error ?? (form && !form.draft ? form.error : null));
</script>

<div class="page">
	<div class="editor">
		<RecipeForm
			{baseline}
			form={saveForm}
			leaving={deletion.pending}
			allTags={data.allTags}
			action="?/save"
			submitLabel="Save"
			cancelHref="/recipes/{recipe.slug}"
			imageUrl={latestVersion.imageUrl}
			nextVersion={current + 1}>
			{#snippet header(outcome)}
				<div class="editor-header">
					<a href="/recipes/{recipe.slug}" class="back-link">← {recipe.title}</a>
					<div class="editor-title">
						<h1>Edit Recipe</h1>
						<!-- Always in the DOM, so the outcome is announced when it changes. -->
						<span class="editing" aria-live="polite">
							{#each `Editing v${current}${outcome ? ` · ${outcome}` : ''}`.split(/(v\d+)/) as part, i (i)}
								{#if i % 2}<span class="mono-id">{part}</span>{:else}{part}{/if}
							{/each}
						</span>
					</div>
				</div>
			{/snippet}
		</RecipeForm>
		<DeleteRecipe title={latestVersion.title} {deletion} error={deleteError} />
	</div>
</div>
