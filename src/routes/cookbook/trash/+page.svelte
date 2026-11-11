<script lang="ts">
	import EmptyPanel from '#lib/components/ui/EmptyPanel.svelte';
	import { TRASH_DAYS } from '#lib/trash.js';
	import TrashRow from './TrashRow.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const deleted = $derived(form && 'deleted' in form ? form.deleted : null);
</script>

<div class="page">
	<div class="page-inner">
		<a href="/cookbook" class="back-link">
			<span aria-hidden="true">←</span>
			Cookbook
		</a>
		<div class="page-head">
			<h1>Trash</h1>
			{#if data.recipes.length > 0}
				<p class="page-sub">
					Recipes you delete stay here for {TRASH_DAYS} days, then go for good.
				</p>
			{/if}
		</div>

		<!-- A deleted row takes its buttons with it, so the outcome is said here. -->
		<p class="sr-only" role="status" aria-live="polite">
			{#if deleted}{deleted} deleted forever.{/if}
		</p>

		{#if data.recipes.length === 0}
			<EmptyPanel title="Your Trash is empty">
				Recipes you delete stay here for {TRASH_DAYS} days, then go for good.
			</EmptyPanel>
		{:else}
			<ul class="trash-list">
				{#each data.recipes as recipe (recipe.slug)}
					<TrashRow {recipe} />
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.trash-list {
		max-width: 760px;
		border-bottom: 1px solid var(--color-border);
	}
</style>
