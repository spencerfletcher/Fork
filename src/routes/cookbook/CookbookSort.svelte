<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { oneOf } from '#lib/helpers.js';
	import { CARD_SORTS, hrefWith, withoutPlace, type CardSort } from '#lib/listPage.js';
	import { SORT_LABELS as LABELS } from './filters.js';

	// The Cookbook's Sort (roadmap L04, C1): a native select that goes at once
	// with JavaScript, keeping focus and scroll as a tag press does, and a GET
	// form with a Sort button before it. A new order starts the list over.
	// While a search ranks the results it reads Best match and is disabled;
	// the chosen sort stays in the URL for when the search is cleared.
	let { sort, searching }: { sort: CardSort; searching: boolean } = $props();

	// Every param of the page's but the sort and the loaded place.
	const otherParams = $derived(
		[...withoutPlace(page.url.searchParams)].filter(([key]) => key !== 'sort')
	);

	function choose(value: string) {
		const chosen = oneOf(CARD_SORTS, value) ?? 'newest';
		return goto(hrefWith(page.url, { sort: chosen === 'newest' ? null : chosen }), {
			reset: false
		});
	}
</script>

<form method="GET" class="cookbook-sort">
	{#each otherParams as [name, value], i (i)}
		<input type="hidden" {name} {value} />
	{/each}
	<label for="cookbook-sort">Sort</label>
	<select
		id="cookbook-sort"
		name="sort"
		value={searching ? 'rank' : sort}
		disabled={searching}
		onchange={(e) => choose(e.currentTarget.value)}>
		{#if searching}<option value="rank">Best match</option>{/if}
		{#each CARD_SORTS as s (s)}
			<option value={s}>{LABELS[s]}</option>
		{/each}
	</select>
	<noscript><button type="submit" class="btn-ghost btn-sm">Sort</button></noscript>
</form>

<style>
	/* The label beside the box, on its line, as the mockup sets it. */
	.cookbook-sort {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	label {
		font-size: 0.9375rem;
		color: var(--color-text-2);
		white-space: nowrap;
	}

	/* The input's look (app.css), sized to the longest order, not the row. */
	select {
		width: auto;
		min-width: 13rem;
	}

	/* A phone shares the row with Grid | List. */
	@media (max-width: 767px) {
		select {
			min-width: 10.5rem;
		}
	}

	select:disabled {
		color: var(--color-text-3);
	}
</style>
