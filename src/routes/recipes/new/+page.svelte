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
	<div class="mx-auto max-w-[720px]">
		<div class="page-header">
			<h1>New Recipe</h1>
		</div>

		<RecipeForm baseline={EMPTY} {form} allTags={data.allTags} submitLabel="Create recipe" />
	</div>
</div>
