<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { contentDraft } from '#lib/recipes/validation.js';
	import RecipeForm from '#lib/components/recipes/RecipeForm.svelte';
	import { draftKey } from '#lib/drafts.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// The audience starts at the cook's default from Settings; forks keep their own rule.
	// svelte-ignore state_referenced_locally
	const EMPTY = contentDraft(null, {
		editRevision: '',
		visibility: data.profile?.defaultVisibility ?? 'private',
		tags: []
	});
</script>

<div class="page">
	<div class="editor">
		<RecipeForm
			baseline={EMPTY}
			{form}
			allTags={data.allTags}
			submitLabel="Create recipe"
			cancelHref="/cookbook"
			draftKey={data.user ? draftKey(data.user.id, 'new') : undefined}>
			{#snippet header(outcome, draftNote)}
				<div class="editor-header">
					<div class="editor-title">
						<h1>New Recipe</h1>
						<!-- Always in the DOM, so the outcome is announced when it changes.
						     Empty at rest: a new recipe is v1, said by nothing but its save. -->
						<span class="editing" aria-live="polite">
							{#each `${outcome}${draftNote && outcome ? ' · ' : ''}`.split(/(v\d+)/) as part, i (i)}
								{#if i % 2}<span class="mono-id">{part}</span>{:else}{part}{/if}
							{/each}{@render draftNote?.()}
						</span>
					</div>
				</div>
			{/snippet}
		</RecipeForm>
	</div>
</div>
