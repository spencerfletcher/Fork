<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { RecipeDraft } from '#lib/recipes/validation.js';
	import RecipeForm from '#lib/components/recipes/RecipeForm.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const EMPTY: RecipeDraft = {
		title: '',
		description: '',
		servings: '',
		prepTimeMinutes: '',
		cookTimeMinutes: '',
		ingredients: '',
		steps: '',
		commitMessage: '',
		editRevision: '',
		isPublic: true,
		tags: [],
		hadPhoto: false,
		removeImage: false
	};
</script>

<div class="page">
	<div class="editor">
		<RecipeForm
			baseline={EMPTY}
			{form}
			allTags={data.allTags}
			submitLabel="Create recipe"
			cancelHref="/recipes">
			{#snippet header(outcome, invalid)}
				<div class="editor-header">
					<div class="editor-title">
						<h1>New Recipe</h1>
						<!-- Always in the DOM, so the outcome is announced when it changes.
						     No promise while a field shows an error, as Edit makes none. -->
						<span class="editing" aria-live="polite">
							{#each (outcome || (invalid ? '' : 'saves as v1')).split(/(v\d+)/) as part, i (i)}
								{#if i % 2}<span class="mono-id">{part}</span>{:else}{part}{/if}
							{/each}
						</span>
					</div>
				</div>
			{/snippet}
		</RecipeForm>
	</div>
</div>
