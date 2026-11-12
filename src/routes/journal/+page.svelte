<script lang="ts">
	import { page } from '$app/state';
	import { dayLabel, groupByMonth } from '#lib/journal.js';
	import EmptyPanel from '#lib/components/ui/EmptyPanel.svelte';
	import ShowMore from '#lib/components/ui/ShowMore.svelte';
	import { pagedList } from '#lib/pagedList.svelte.js';
	import JournalEntry from './JournalEntry.svelte';
	import JournalTwelveMonths from './JournalTwelveMonths.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const list = pagedList(
		() => data,
		(d) => ({ items: d.entries, next: d.next })
	);
	let entries = $state<HTMLElement>();

	// A page appended to the last month's entries joins its group.
	const groups = $derived(groupByMonth(list.items));
	// The whole Journal's, not the entries shown.
	const count = $derived(data.total);

	// The form lands here with ?logged=<id>, the delete with ?deleted=1.
	const logged = $derived(data.logged);
	const deleted = $derived(page.url.searchParams.has('deleted'));
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-head j-head">
			<div>
				<h1>Journal</h1>
				<p class="status dot-list dot-clip" role="status">
					{#if logged}<strong>Logged</strong>
						<span>{dayLabel(logged.cookedOn)}</span>{:else if deleted}Entry deleted.{/if}
				</p>
			</div>
			{#if count > 0}
				<a class="btn-primary" href="/journal/new">Add to Journal</a>
			{/if}
		</div>

		{#if count === 0}
			<EmptyPanel title="Nothing logged yet">
				Log what you cook: a recipe, a link or something improvised. Only you see it unless you
				share it.
				{#snippet action()}
					<a class="btn-primary" href="/journal/new">Add to Journal</a>
				{/snippet}
			</EmptyPanel>
		{:else}
			{#if data.twelveMonths}<JournalTwelveMonths summary={data.twelveMonths} />{/if}
			<div bind:this={entries}>
				{#each groups as group (group.month)}
					<section class="month-group">
						<h2 class="month">{group.month}</h2>
						{#each group.entries as entry (entry.id)}
							<JournalEntry {entry} />
						{/each}
					</section>
				{/each}
			</div>
			<ShowMore {list} container={entries} items="article" noun="entry" nouns="entries" />
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

	/* A flex row, so its drawn dot is dropped, never leading a wrapped line. */
	.status {
		display: flex;
		flex-wrap: wrap;
		margin: 4px 0 0;
		color: var(--color-text-2);
	}

	.status:empty {
		display: none;
	}

	.month {
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

	@media (max-width: 699px) {
		.j-head .btn-primary {
			width: 100%;
		}
	}
</style>
