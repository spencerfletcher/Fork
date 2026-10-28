<script lang="ts">
	import { goto } from '$app/navigation';
	import VersionDiff from '#lib/components/recipes/VersionDiff.svelte';
	import { formatTime } from '#lib/helpers.js';
	import Username from '#lib/components/ui/Username.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { recipe, metaDiff, ingredientDiff, stepDiff, allVersions } = $derived(data);

	// Writable derived: the pickers can change them, and they reset to the loaded
	// range whenever the page data changes, including on back/forward.
	let fromSelect = $derived(data.fromVersion.versionNumber);
	let toSelect = $derived(data.toVersion.versionNumber);

	const fromVersion = $derived(data.fromVersion);
	const toVersion = $derived(data.toVersion);

	type CardVersion = typeof data.fromVersion;

	function navigate() {
		goto(`?from=${fromSelect}&to=${toSelect}`);
	}

	// The viewer's own day. The server renders in its zone and the browser may
	// correct the text on hydration; a day that matches the reader's calendar
	// is worth that.
	const when = (d: Date | null) =>
		d?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
</script>

{#snippet picker(id: string, label: string, value: number, set: (v: number) => void)}
	<label class="eyebrow-label max-[699px]:sr-only" for={id}>{label}</label>
	<select
		{id}
		{value}
		onchange={(e) => {
			set(Number(e.currentTarget.value));
			navigate();
		}}>
		{#each allVersions as v (v.versionNumber)}
			<option value={v.versionNumber}>v{v.versionNumber}: {v.commitMessage}</option>
		{/each}
	</select>
{/snippet}

{#snippet card(v: CardVersion, isTo: boolean)}
	{@const date = when(v.createdAt)}
	<article class="version-card" class:version-card--to={isTo}>
		<div class="version-card__head">
			<span class="version-card__number">v{v.versionNumber}</span>
			{#if v.creator || date}
				<span>
					{#if v.creator}<Username username={v.creator.username} />{/if}
					{#if v.creator && date}·{/if}
					{date ?? ''}
				</span>
			{/if}
		</div>
		<p class="version-card__message">{v.commitMessage}</p>
		<dl>
			<div>
				<dt>Title</dt>
				&#32;
				<dd>{v.title}</dd>
			</div>
		</dl>
		<dl>
			{#if v.servings}<div>
					<dt>Serves</dt>
					&#32;
					<dd>{v.servings}</dd>
				</div>{/if}
			{#if v.prepTimeMinutes}<div>
					<dt>Prep</dt>
					&#32;
					<dd>{formatTime(v.prepTimeMinutes)}</dd>
				</div>{/if}
			{#if v.cookTimeMinutes}<div>
					<dt>Cook</dt>
					&#32;
					<dd>{formatTime(v.cookTimeMinutes)}</dd>
				</div>{/if}
			<div>
				<dt>Ingredients</dt>
				&#32;
				<dd>{v.ingredients.length}</dd>
			</div>
		</dl>
	</article>
{/snippet}

<div class="page">
	<div class="compare">
		<a href="/recipes/{recipe.slug}" class="back-link">← {recipe.title}</a>
		<h1>Compare versions</h1>

		<div class="version-picker">
			{@render picker('from-select', 'From', fromSelect, (v) => (fromSelect = v))}
			<span class="version-picker__arrow">→</span>
			{@render picker('to-select', 'To', toSelect, (v) => (toSelect = v))}
		</div>

		<div class="version-cards">
			{@render card(fromVersion, false)}
			{@render card(toVersion, true)}
		</div>

		<VersionDiff {metaDiff} {ingredientDiff} {stepDiff} headingLevel={2} />
	</div>
</div>

<style>
	/* Wide enough for the diff's container query to put ingredients beside
	   steps, which is how the board shows it. */
	.compare {
		max-width: 784px;
		margin: 0 auto;
	}

	h1 {
		margin: 0 0 12px;
		font-size: 2.125rem;
		line-height: 1.1;
	}

	.version-picker {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 22px;
	}

	.version-picker select {
		width: auto;
		min-width: 0;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		padding: 6px 10px;
	}

	.version-picker__arrow {
		color: var(--color-text-3);
	}

	.version-cards {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 24px;
		margin-bottom: 26px;
	}

	.version-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		/* A long unbroken title, name or message breaks rather than widening
		   the card; inherited by every text inside. */
		overflow-wrap: anywhere;
	}

	.version-card__head {
		display: flex;
		align-items: baseline;
		gap: 10px;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--color-text-3);
	}

	.version-card__number {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.version-card--to .version-card__number {
		padding: 0 6px;
		border-radius: 3px;
		background: var(--color-marigold);
		color: var(--color-text);
	}

	.version-card__message {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-text);
	}

	dl {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 18px;
		margin: 0;
		font-size: 0.875rem;
	}

	dl:first-of-type {
		margin-top: 4px;
	}

	dt,
	dd {
		display: inline;
		margin: 0;
	}

	dt {
		color: var(--color-text-3);
	}

	@media (max-width: 699px) {
		h1 {
			font-size: 1.625rem;
		}

		.version-picker {
			gap: 8px;
		}

		.version-picker select {
			flex: 1;
			/* 16px, or iOS zooms the picker on focus. */
			font-size: 1rem;
			padding: 10px;
		}

		.version-cards {
			grid-template-columns: minmax(0, 1fr);
			gap: 8px;
		}

		.version-card {
			padding: 12px;
		}
	}
</style>
