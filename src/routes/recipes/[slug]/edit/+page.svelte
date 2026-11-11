<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { contentDraft } from '#lib/recipes/validation.js';
	import RecipeForm from '#lib/components/recipes/RecipeForm.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import DeleteRecipe from './DeleteRecipe.svelte';
	import { draftKey } from '#lib/drafts.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const { recipe, latestVersion } = $derived(data);

	// What was loaded, as the form's strings. Only the initial value is wanted:
	// a successful save redirects, a failed one keeps the page and its baseline.
	// svelte-ignore state_referenced_locally
	const baseline = contentDraft(latestVersion, {
		editRevision: String(recipe.editRevision),
		visibility: recipe.visibility,
		tags: recipe.recipesToTags.map((r) => r.tag.name)
	});

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
			nextVersion={current + 1}
			hasForks={data.forkCount > 0}
			draftKey={data.user ? draftKey(data.user.id, String(recipe.id)) : undefined}
			draftRecipe={{ slug: recipe.slug, title: recipe.title }}>
			{#snippet header(outcome, draftNote)}
				<div class="editor-header">
					<a href="/recipes/{recipe.slug}" class="back-link">← {recipe.title}</a>
					<div class="editor-title">
						<h1>Edit Recipe</h1>
						<!-- Always in the DOM, so the outcome is announced when it changes. -->
						<span class="editing" aria-live="polite">
							{#each `Editing v${current}${outcome ? ` · ${outcome}` : ''}${draftNote ? ' · ' : ''}`.split(/(v\d+)/) as part, i (i)}
								{#if i % 2}<span class="mono-id">{part}</span>{:else}{part}{/if}
							{/each}{@render draftNote?.()}
						</span>
					</div>
				</div>
			{/snippet}
			{#snippet danger()}
				<DeleteRecipe title={latestVersion.title} {deletion} error={deleteError} />
			{/snippet}
		</RecipeForm>
	</div>
</div>
