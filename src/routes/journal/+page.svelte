<script lang="ts">
	import { page } from '$app/state';
	import { dayLabel, groupByMonth, monthLabel } from '#lib/journal.js';
	import JournalEntry from './JournalEntry.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const groups = $derived(groupByMonth(data.entries));
	const count = $derived(data.entries.length);
	const oldest = $derived(data.entries.at(-1));
	const summary = $derived(
		oldest
			? `${count === 1 ? '1 entry' : `${count} entries`} since ${monthLabel(oldest.cookedOn).split(' ')[0]}`
			: ''
	);

	// The form lands here with ?logged=<id>, the delete with ?deleted=1.
	const logged = $derived(
		data.entries.find((e) => String(e.id) === page.url.searchParams.get('logged'))
	);
	const deleted = $derived(page.url.searchParams.has('deleted'));
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-head j-head">
			<div>
				<h1>Journal</h1>
				{#if summary}<p class="page-sub">{summary}</p>{/if}
				<p class="status" role="status">
					{#if logged}<strong>Logged</strong>
						· {dayLabel(logged.cookedOn)}{:else if deleted}Entry deleted.{/if}
				</p>
			</div>
			{#if count > 0}
				<a class="btn-primary no-underline" href="/journal/new">Add to Journal</a>
			{/if}
		</div>

		{#if count === 0}
			<section class="j-empty">
				<h2>Nothing logged yet</h2>
				<p>
					Log what you cook: a recipe, a link or something improvised. Only you see it unless you
					share it.
				</p>
				<a class="btn-primary no-underline" href="/journal/new">Add to Journal</a>
			</section>
		{:else}
			{#each groups as group (group.month)}
				<section class="month-group">
					<h2 class="month">{group.month}</h2>
					{#each group.entries as entry (entry.id)}
						<JournalEntry {entry} />
					{/each}
				</section>
			{/each}
		{/if}
	</div>
</div>

<style>
	.j-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
	}

	.status {
		margin: 4px 0 0;
		color: var(--color-text-2);
	}

	.status:empty {
		display: none;
	}

	.month {
		margin: 0;
		padding-bottom: 8px;
		font-size: 1.375rem;
		border-bottom: 1px solid var(--color-border-2);
	}

	/* The month's rule is the first entry's top edge. */
	.month + :global(.jentry) {
		border-top: 0;
	}

	.month-group + .month-group {
		margin-top: var(--space-6);
	}

	.j-empty {
		max-width: 560px;
		padding: var(--space-6) 0;
		border-top: 1px solid var(--color-border);
	}

	.j-empty h2 {
		margin: 0;
		font-size: 1.375rem;
	}

	.j-empty p {
		margin: 8px 0 0;
		color: var(--color-text-2);
	}

	.j-empty .btn-primary {
		margin-top: 20px;
	}

	@media (max-width: 699px) {
		.j-head .btn-primary {
			width: 100%;
		}
	}
</style>
