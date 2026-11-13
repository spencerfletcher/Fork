<script lang="ts">
	import EntryForm from '../EntryForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="page">
	<div class="page-inner page-inner--narrow">
		<a class="back-link" href="/journal">← Journal</a>
		<h1>Add to Journal</h1>
		<!-- Reached from a recipe (Finish cooking, Add to Journal), the facts come
		     filled in, so the note for next time leads. -->
		<EntryForm
			values={form?.values ?? data.values}
			choices={data.choices}
			error={form?.error ?? null}
			submitLabel="Add to Journal"
			useLocalToday={!form}
			noteFirst={!!data.values.recipe} />
	</div>
</div>

<style>
	h1 {
		margin: 0 0 var(--space-5);
	}
</style>
