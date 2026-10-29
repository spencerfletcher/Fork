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

	const sameVersion = $derived(fromVersion.versionNumber === toVersion.versionNumber);
	// The latest version is the plain recipe URL; an older one is named.
	const readHref = $derived(
		toVersion.versionNumber === allVersions[allVersions.length - 1].versionNumber
			? `/recipes/${recipe.slug}`
			: `/recipes/${recipe.slug}?version=${toVersion.versionNumber}`
	);

	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

	// "3 details · 3 ingredients · 2 steps changed", from the rows already loaded.
	const summary = $derived.by(() => {
		const changed = (rows: { status: string }[]) =>
			rows.filter((row) => row.status !== 'unchanged').length;
		const groups: [number, string][] = [
			[metaDiff.length, 'detail'],
			[changed(ingredientDiff), 'ingredient'],
			[changed(stepDiff), 'step']
		];
		const parts = groups.filter(([n]) => n > 0).map(([n, word]) => plural(n, word));
		return parts.length > 0 ? `${parts.join(' · ')} changed` : 'No changes';
	});

	// The card's measure in the recipe page's words: value then label.
	const measure = (v: CardVersion): [string, string][] => {
		const pairs: [string, string | null][] = [
			['prep', v.prepTimeMinutes ? formatTime(v.prepTimeMinutes) : null],
			['cook', v.cookTimeMinutes ? formatTime(v.cookTimeMinutes) : null],
			[v.servings === 1 ? 'serving' : 'servings', v.servings ? String(v.servings) : null],
			[v.ingredients.length === 1 ? 'ingredient' : 'ingredients', String(v.ingredients.length)]
		];
		return pairs.filter((pair): pair is [string, string] => pair[1] !== null);
	};

	async function navigate(id: string) {
		await goto(`?from=${fromSelect}&to=${toSelect}`);
		// Navigation lands focus on the body; the picker that was changed keeps it.
		document.getElementById(id)?.focus();
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
			navigate(id);
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
		<p class="version-card__measure">
			{#each measure(v) as [label, value], i (label)}
				{#if i > 0}<span class="dot" aria-hidden="true">·</span>{/if}
				<span class="whitespace-nowrap">
					<span class="value">{value}</span>
					{label}
				</span>
			{/each}
		</p>
	</article>
{/snippet}

<div class="page">
	<div class="compare">
		<a href="/recipes/{recipe.slug}" class="back-link">← {recipe.title}</a>
		<h1>Compare versions</h1>
		{#if sameVersion}
			<p class="same-version">
				v{toVersion.versionNumber} is on both sides; pick another version.
			</p>
		{:else}
			<p class="summary">{summary}</p>
		{/if}

		<div class="version-picker">
			{@render picker('from-select', 'From', fromSelect, (v) => (fromSelect = v))}
			<span class="version-picker__arrow">→</span>
			{@render picker('to-select', 'To', toSelect, (v) => (toSelect = v))}
		</div>

		<div class="version-cards">
			{@render card(fromVersion, false)}
			{@render card(toVersion, true)}
		</div>

		{#if !sameVersion}
			<VersionDiff {metaDiff} {ingredientDiff} {stepDiff} headingLevel={2} />
			<a href={readHref} class="read-link">Read v{toVersion.versionNumber}</a>
		{/if}
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
		margin: 0 0 8px;
		font-size: clamp(1.75rem, 1.2rem + 1.8vw, 2.5rem);
		line-height: 1.1;
	}

	.summary,
	.same-version {
		margin: 0 0 16px;
		color: var(--color-text-2);
	}

	.read-link {
		display: inline-block;
		font-weight: 600;
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

	.version-card__head :global(.username) {
		font-size: inherit;
	}

	/* The system's chip, at the card number's size. */
	.version-card--to .version-card__number {
		padding: 0 6px;
		border-radius: var(--radius-sm);
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

	.version-card__measure {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-2);
	}

	.version-card__measure .value {
		font-weight: 600;
		color: var(--color-text);
	}

	.version-card__measure .dot {
		margin: 0 4px;
		color: var(--color-text-3);
	}

	@media (max-width: 699px) {
		.read-link {
			display: inline-flex;
			align-items: center;
			min-height: 44px;
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
