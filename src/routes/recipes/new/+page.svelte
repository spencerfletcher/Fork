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
		<div class="editor-header">
			<div class="editor-title">
				<h1>New recipe</h1>
			</div>
		</div>

		<RecipeForm
			baseline={EMPTY}
			{form}
			allTags={data.allTags}
			submitLabel="Create recipe"
			cancelHref="/recipes" />
	</div>
</div>
