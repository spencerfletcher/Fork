<script lang="ts">
	import EntryForm from '../EntryForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="page">
	<div class="page-inner page-inner--narrow">
		<a class="back-link" href="/journal">← Journal</a>
		<h1>Add to Journal</h1>
		<EntryForm
			values={form?.values ?? data.values}
			choices={data.choices}
			error={form?.error ?? null}
			submitLabel="Add to Journal"
			useLocalToday={!form} />
	</div>
</div>

<style>
	h1 {
		margin: 0 0 var(--space-5);
	}
</style>
