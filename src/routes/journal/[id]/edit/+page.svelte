<script lang="ts">
	import EntryForm from '../../EntryForm.svelte';
	import DeleteEntry from './DeleteEntry.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="page">
	<div class="page-inner log">
		<a class="back-link" href="/journal">← Journal</a>
		<h1>Edit entry</h1>
		<EntryForm
			values={form?.values ?? data.values}
			choices={data.choices}
			keepLabel={data.keepLabel}
			photoUrl={data.photoUrl}
			error={form?.error ?? null}
			action="?/save"
			submitLabel="Save changes" />
		<DeleteEntry dish={data.values.dish} />
	</div>
</div>

<style>
	.log {
		max-width: 680px;
	}

	h1 {
		margin: 0 0 var(--space-5);
	}
</style>
