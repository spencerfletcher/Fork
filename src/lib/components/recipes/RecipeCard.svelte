<script lang="ts" module>
	import type { Recipe } from '#lib/server/db/schema.js';
	import { plural } from '#lib/helpers.js';
	import { timeSpans } from '#lib/recipes/times.js';
	import type { Visibility } from '#lib/recipes/validation.js';
	import { AUDIENCE_LABEL } from '#lib/audience.js';
	import { audienceIcon } from '#lib/components/Icons.svelte';
	import { dayLabel } from '#lib/journal.js';
	import Username from '#lib/components/ui/Username.svelte';
	import type { SearchMatch } from '#lib/highlight.js';

	// What the card and the Cookbook's list row (RecipeRow) share, so the two
	// views of one recipe never drift: its data, its meta line and its ⋯.
	export { metaItem };

	// Only what the card renders, so a column added to the table does not ripple
	// into every card fixture.
	export interface CardRecipe extends Pick<
		Recipe,
		| 'slug'
		| 'title'
		| 'description'
		| 'imageUrl'
		| 'parentId'
		| 'prepTimeMinutes'
		| 'cookTimeMinutes'
	> {
		visibility?: Recipe['visibility'];
		author?: { id: string; username: string } | null;
		versionCount?: number;
		forkCount?: number;
		/** The viewer's own, on their Cookbook only (cardList's `cooked`). */
		timesCooked?: number;
		lastCookedOn?: string;
		/** The Cookbook only: the first three tags by name, for the list row. */
		tags?: string[];
		/** Search only: the title with the matched words marked, and where it matched. */
		match?: SearchMatch;
	}

	/**
	 * One item of the meta line, as data rather than nested markup. The dots
	 * between items are drawn by CSS, so the list carries only the items.
	 * `cooked` marks the viewer's own fact; `prefix` is words before a handle.
	 */
	export type MetaPart = {
		text: string;
		username?: string;
		prefix?: string;
		accent?: boolean;
		icon?: Visibility;
		cooked?: boolean;
	};

	/** The cook's own fact: "Cooked on Sun 8 Nov", "Cooked 4 times, last on Tue 3 Nov". */
	export function cookedFact({ timesCooked: times, lastCookedOn: last }: CardRecipe) {
		if (!times || !last) return null;
		const day = dayLabel(last);
		return times > 1 ? `Cooked ${plural(times, 'time')}, last on ${day}` : `Cooked on ${day}`;
	}

	/** The meta line's items; `browse` (every list but the Cookbook) adds the author and forks. */
	export function metaPartsOf(recipe: CardRecipe, browse: boolean): MetaPart[] {
		const parts: MetaPart[] = [];

		if (recipe.visibility && recipe.visibility !== 'public') {
			// Non-public recipes say who can see them; public is the default and says nothing.
			parts.push({ text: AUDIENCE_LABEL[recipe.visibility], icon: recipe.visibility });
		}

		if (recipe.author && browse) {
			parts.push({ text: `@${recipe.author.username}`, username: recipe.author.username });
		}

		// Each time its own part: they can overlap, so no total.
		for (const { value, word } of timeSpans(recipe)) parts.push({ text: `${value} ${word}` });

		// From v2 only: v1 is every unedited recipe and says nothing.
		if ((recipe.versionCount ?? 0) > 1) {
			parts.push({ text: `v${recipe.versionCount}`, accent: true });
		}

		if (recipe.forkCount && browse) {
			parts.push({ text: plural(recipe.forkCount, 'fork') });
		}

		// A personal fact, last: the recipe page's personal line, shortened.
		const cooked = cookedFact(recipe);
		if (cooked) parts.push({ text: cooked, cooked: true });

		return parts;
	}

	/** Whose a saved recipe is, or that its author withdrew it: the words before the handle. */
	export const sourceWords = (kept: boolean) => (kept ? 'No longer shared by' : 'Saved from');

	/** The words in place of a handle whose account is gone (author_id set null). */
	export const nobody = (kept: boolean) => (kept ? 'its author' : 'another cook');

	/** The Cookbook's select mode, on a card or a list row: whether it is chosen, and the press. */
	export type CardSelect = { checked: boolean; onchange: (checked: boolean) => void };

	/** The Cookbook's ⋯ for one recipe: the rows a card or a list row offers. */
	export function cardMenu(recipe: CardRecipe, saved: boolean, kept: boolean) {
		return {
			slug: recipe.slug,
			title: recipe.title,
			collections: 'on-open' as const,
			label: `More actions for ${recipe.title}`,
			journal: true,
			edit: !saved,
			exports: !saved,
			trash: !saved,
			fork: saved && !kept,
			removeCopy: kept
		};
	}
</script>

<script lang="ts">
	import CookLink from '#lib/components/ui/CookLink.svelte';
	import { segments } from '#lib/highlight.js';
	import MoreActions from './MoreActions.svelte';

	// Position in the grid, when the page knows it: the first row's photos are
	// fetched eagerly and the very first ahead of everything else. Without it
	// the photo is lazy (decided 29 October 2026). alwaysShowAuthor keeps the
	// author on a phone, for a list whose point is who made each one (forks).
	// showDescription off leaves the line under the meta row to the page (the
	// forks list puts each fork's commit note there).
	// variant: 'list' is every browse list. 'cookbook' is your shelf: no owner
	// line, no fork count, no description, and `saved` names whose a saved one
	// is. 'discover' names the cook above the photo instead of in the meta row.
	let {
		recipe,
		index,
		alwaysShowAuthor = false,
		showDescription = true,
		variant = 'list',
		saved = false,
		kept = false,
		onremoved,
		oncollected,
		select
	}: {
		recipe: CardRecipe;
		index?: number;
		alwaysShowAuthor?: boolean;
		showDescription?: boolean;
		variant?: 'list' | 'cookbook' | 'discover';
		saved?: boolean;
		/** A saved recipe its author withdrew, kept as the saver's copy. */
		kept?: boolean;
		/** Cookbook: the ⋯ moved it to the Trash or removed the copy; the page takes it away. */
		onremoved?: (how: 'trash' | 'copy') => void;
		/** Cookbook: the ⋯ changed one of its collections; the page reloads. */
		oncollected?: () => void;
		/** Cookbook select mode: the card is a checkbox, not a link, and has no ⋯. */
		select?: CardSelect;
	} = $props();

	const hasMenu = $derived(variant === 'cookbook' && !select);

	const isList = $derived(variant === 'list');

	const description = $derived(showDescription && isList ? recipe.description?.trim() : '');

	const eager = $derived(index !== undefined && index < 4);

	const href = $derived(`/recipes/${recipe.slug}`);

	const metaParts = $derived(metaPartsOf(recipe, isList));
</script>

<div
	class="recipe-card"
	class:author-always={alwaysShowAuthor}
	class:recipe-card--roomy={variant === 'discover'}>
	<!-- The cook is one link from avatar to handle, before the stretched recipe
	     link so Tab reaches the profile first; a sibling, never nested. -->
	{#if variant === 'discover' && recipe.author}
		<CookLink username={recipe.author.username} class="card-cook" />
	{/if}

	{#if select}
		<!-- The whole card is the label; its tick sits on a paper disc at the
		     photo's corner, the strike rows' tick (.tick). -->
		<label class="card-stretched-link card-select">
			<input
				type="checkbox"
				class="sr-only"
				aria-label={recipe.title}
				checked={select.checked}
				onchange={(e) => select.onchange(e.currentTarget.checked)} />
			<span class="select-disc" aria-hidden="true"><span class="tick"></span></span>
		</label>
	{:else}
		<a {href} class="card-stretched-link" aria-label={recipe.title}></a>
	{/if}

	{#if recipe.imageUrl}
		<div class="card-img-wrap">
			<!-- alt is empty: the heading names the recipe and the stretched link
			     carries it as its label, so a third announcement would be noise. -->
			<img
				src={recipe.imageUrl}
				alt=""
				loading={eager ? 'eager' : 'lazy'}
				fetchpriority={index === 0 ? 'high' : undefined}
				class="card-img" />
		</div>
	{:else}
		<!-- No photo: the title stands in for it, inside the same 4:3 block, so a
		     mixed grid keeps its rhythm and the title is not printed twice. -->
		<div class="card-panel">
			<h3 class="card-panel-title">{@render title()}</h3>
		</div>
	{/if}

	<!-- Title, meta and any extra line: one block, spaced by its gap alone.
	     Inert in select mode, so its handle is no link and a press is the card's. -->
	<div class="card-text" inert={!!select}>
		<!-- The ⋯ ends the first line under the photo: the title's, or on a
		     panel the meta row's. -->
		{#if recipe.imageUrl}
			<div class="card-line">
				<h3 class="card-title">{@render title()}</h3>
				{#if hasMenu}{@render more()}{/if}
			</div>
		{/if}

		<div class="card-line">
			<div class="meta-row dot-list">
				{#each metaParts as part (part.text)}{@render metaItem(part)}{/each}
			</div>
			{#if hasMenu && !recipe.imageUrl}{@render more()}{/if}
		</div>

		{#if saved && variant === 'cookbook'}
			<p class="card-source">
				{sourceWords(kept)}
				{#if recipe.author}
					<Username username={recipe.author.username} />
				{:else}
					{nobody(kept)}
				{/if}
			</p>
		{/if}

		<!-- At most one extra paragraph: no description, no line (Spencer, 31 October 2026).
		     A search result that matched outside its title says where instead. -->
		{#if recipe.match?.label}
			<p class="card-description card-match">
				{recipe.match.label}: {@render marked(recipe.match.text ?? '')}
			</p>
		{:else if description}
			<p class="card-description">{description}</p>
		{/if}
	</div>
</div>

<!-- Marked words as <mark>, every run as escaped text: the words are a
     recipe's own, so never {@html}. -->
{#snippet marked(text: string)}
	{#each segments(text) as run, i (i)}{#if run.mark}<mark>
				{run.text}
			</mark>{:else}{run.text}{/if}{/each}
{/snippet}

<!-- The recipe page's ⋯, the rows a card offers: a sibling above the stretched
     link and after it in Tab order, as the author link is. -->
{#snippet more()}
	<div class="card-more">
		<MoreActions {...cardMenu(recipe, saved, kept)} {onremoved} {oncollected} />
	</div>
{/snippet}

<!-- One meta item. The list row renders it too, so it carries these styles;
     `extra` is the row's class for an item it folds in on a phone only. -->
{#snippet metaItem(part: MetaPart, extra: string = '')}
	{#if part.username && part.prefix}
		<span class="meta-item meta-source {extra}">
			{part.prefix}
			<Username username={part.username} />
		</span>
	{:else if part.username}
		<span class="meta-item meta-author {extra}"><Username username={part.username} /></span>
	{:else if part.icon}
		<span class="meta-item meta-audience {extra}">
			{@render audienceIcon(part.icon)}
			{part.text}
		</span>
	{:else}
		<span class="meta-item {extra}" class:vid={part.accent}>{part.text}</span>
	{/if}
{/snippet}

{#snippet title()}
	{#if recipe.match}{@render marked(recipe.match.title)}{:else}{recipe.title}{/if}
{/snippet}

<style>
	/* The card is content on the page's paper, not a tile: no surface, border or
	   shadow. The photo or panel is the only shape, so the whole grid reads as
	   one page rather than a wall of boxes. */
	.recipe-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.card-stretched-link {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.card-img-wrap,
	.card-panel {
		aspect-ratio: 4 / 3;
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	/* Select mode: the disc at the photo's (or panel's) top left corner, and a
	   ring inside a chosen one's edge; the label is the card, so a press
	   anywhere on it ticks. */
	.card-select:has(:focus-visible) {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: var(--radius-md);
	}

	.select-disc {
		position: absolute;
		top: 8px;
		left: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: 1px solid var(--color-text-2);
		border-radius: 50%;
		background: var(--color-bg);
	}

	.card-img-wrap,
	.card-panel {
		position: relative;
	}

	.recipe-card:has(.card-select :checked) :is(.card-img-wrap, .card-panel)::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		box-shadow: inset 0 0 0 3px var(--color-marigold);
	}

	/* Forced colours drop shadows: the ring is an outline there. */
	@media (forced-colors: active) {
		.recipe-card:has(.card-select :checked) :is(.card-img-wrap, .card-panel)::after {
			outline: 3px solid Highlight;
			outline-offset: -3px;
		}
	}

	.card-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.recipe-card:has(.card-stretched-link:hover) .card-img {
		transform: scale(1.03);
	}

	/* The panel title grows the way a photo does, from its own corner so
	   nothing reflows. */
	.card-panel-title {
		transform-origin: left bottom;
		transition: transform 0.3s ease;
	}

	.recipe-card:has(.card-stretched-link:hover) .card-panel-title {
		transform: scale(1.03);
	}

	.card-title,
	.card-panel-title {
		font-family: var(--font-serif);
		font-weight: 500;
		font-size: 1.0625rem;
		line-height: 1.25;
	}

	.card-title {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		line-clamp: 3;
		overflow: hidden;
		color: var(--color-text);
		/* Plain wrapping, never balance (decided 9 November 2026); pretty only
		   spares a one-word last line ("Cookies"). */
		text-wrap: pretty;
	}

	/* :has() targeting ancestor — no Tailwind equivalent */
	.recipe-card:has(.card-stretched-link:hover) .card-title {
		color: var(--color-accent);
	}

	.card-panel {
		display: flex;
		align-items: flex-end;
		/* 16px inside the border, which shows only under forced colours, where
		   the tint goes and the border keeps the panel a box. */
		padding: 15px;
		border: 1px solid transparent;
		background: var(--color-tint);
	}

	/* line-clamp requires the -webkit-box multi-property combo */
	.card-panel-title {
		display: -webkit-box;
		-webkit-line-clamp: 4;
		-webkit-box-orient: vertical;
		line-clamp: 4;
		overflow: hidden;
		color: var(--color-accent);
		text-wrap: pretty;
	}

	.meta-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 5px;
		--dot-space: 0 5px 0 0;
	}

	.card-text {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	/* The title or meta row, and the ⋯ at its end on a Cookbook card. */
	.card-line {
		display: flex;
		align-items: flex-start;
		gap: 4px;
	}

	.card-line > .card-title,
	.card-line > .meta-row {
		flex: 1;
		min-width: 0;
	}

	/* Above the stretched link, so hovering or pressing it is not the recipe.
	   The 44px square overhangs its line evenly, so the line keeps its height
	   and the ⋯ (centred in the square by flex) sits on the line's middle; its
	   right edge on the column's. Open, it rises over the next card's ⋯. */
	.card-more {
		position: relative;
		z-index: 2;
		flex: none;
		margin: -11px 0;
	}

	.card-more:has(:global([aria-expanded='true'])) {
		z-index: 3;
	}

	/* Two lines at most, Ink 3 sans at the meta size. */
	.card-description {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		overflow: hidden;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--color-text-3);
	}

	/* Not the version chip: an unlayered component rule would beat app.css's .vid. */
	.meta-item:not(.vid) {
		font-family: var(--font-sans);
		font-size: 0.8125rem;
		color: var(--color-text-3);
	}

	/* Below 1024 the row wraps more often, so the dots go and the items sit
	   10px apart instead; no wrapped line ever starts with a dot (the version
	   bar does the same on a phone). */
	@media (max-width: 1023px) {
		.meta-row {
			column-gap: 10px;
		}

		.meta-item + .meta-item::before {
			display: none;
		}
	}

	.meta-audience {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	/* :global, because the icon comes from Icons.svelte. */
	.meta-audience :global(svg) {
		width: 12px;
		height: 12px;
	}

	/* "Saved from @handle": the meta row's size and ink, under it. */
	.card-source {
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--color-text-3);
		overflow-wrap: anywhere;
	}

	/* The author is Username at the meta size; above the card's stretched
	   link, so it stays clickable. */
	.meta-author,
	.card-source :global(.username),
	.meta-source :global(.username) {
		position: relative;
		z-index: 2;
	}

	/* A 24px hit at desktop without moving the text (decided 29 October 2026);
	   a block, as the flex item it was, so the padding counts. */
	.meta-author :global(.username) {
		display: block;
		padding-block: 3px;
		margin-block: -3px;
	}

	/* Phone: two columns leave no room for the author; the recipe page has it.
	   A page whose list is about who made each recipe keeps it. */
	@media (max-width: 699px) {
		.card-title,
		.card-panel-title {
			font-size: 0.9375rem;
		}

		.recipe-card:not(.author-always) .meta-author {
			display: none;
		}

		/* Discover is one column here: the photo is full width, so the title
		   steps up with it. The Cookbook is two across, at the size above. */
		.recipe-card--roomy .card-title,
		.recipe-card--roomy .card-panel-title {
			font-size: 1.1875rem;
		}
	}
</style>
